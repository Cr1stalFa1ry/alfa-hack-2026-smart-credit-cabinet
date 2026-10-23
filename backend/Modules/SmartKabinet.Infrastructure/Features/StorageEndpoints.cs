using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using SmartKabinet.Infrastructure.Contracts;
using SmartKabinet.Shared;

namespace SmartKabinet.Infrastructure.Features;

public static class StorageEndpoints
{
    public static RouteGroupBuilder MapStorageEndpoints(this RouteGroupBuilder group)
    {
        // POST /api/infrastructure/storage/upload
        group.MapPost("/upload", async (
            IFormFile file,
            [FromForm] string? folder,
            IS3StorageService storageService,
            CancellationToken ct) =>
        {
            if (file == null || file.Length == 0)
            {
                return Results.BadRequest(new { error = "Файл не передан или пуст." });
            }

            using var stream = file.OpenReadStream();
            var result = await storageService.UploadAsync(
                stream: stream,
                fileName: file.FileName,
                contentType: file.ContentType,
                folder: folder,
                ct: ct
            );

            return result.ToHttpResult();
        })
        .DisableAntiforgery()
        .WithName("UploadFileToStorage")
        .WithSummary("Загрузка файла (PDF, DOCX, сканы, сметы расходов и др.) в S3 хранилище");

        // GET /api/infrastructure/storage/presigned-url?fileKey=...&expiryMinutes=...
        group.MapGet("/presigned-url", async (
            [FromQuery] string fileKey,
            [FromQuery] int? expiryMinutes,
            IS3StorageService storageService,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(fileKey))
            {
                return Results.BadRequest(new { error = "Параметр fileKey обязателен." });
            }

            var expiry = expiryMinutes.HasValue ? TimeSpan.FromMinutes(expiryMinutes.Value) : TimeSpan.FromHours(1);
            var result = await storageService.GetPresignedUrlAsync(fileKey, expiry, ct);
            return result.ToHttpResult(url => Results.Ok(new { fileKey, url, expiresAt = DateTimeOffset.UtcNow.Add(expiry) }));
        })
        .WithName("GetFilePresignedUrl")
        .WithSummary("Генерация временной прямой presigned-ссылки для скачивания/просмотра файла");

        // GET /api/infrastructure/storage/{**fileKey} (скачивание или потоковый просмотр)
        group.MapGet("/{**fileKey}", async (
            string fileKey,
            IS3StorageService storageService,
            CancellationToken ct) =>
        {
            var result = await storageService.DownloadAsync(fileKey, ct);
            if (!result.IsSuccess)
            {
                return result.ToHttpResult();
            }

            var fileStream = result.Value;
            return Results.Stream(
                stream: fileStream.Stream,
                contentType: fileStream.ContentType,
                fileDownloadName: fileStream.FileName,
                enableRangeProcessing: true
            );
        })
        .WithName("DownloadFileFromStorage")
        .WithSummary("Чтение и скачивание файла из S3 хранилища по ключу");

        // DELETE /api/infrastructure/storage/{**fileKey}
        group.MapDelete("/{**fileKey}", async (
            string fileKey,
            IS3StorageService storageService,
            CancellationToken ct) =>
        {
            var result = await storageService.DeleteAsync(fileKey, ct);
            return result.ToHttpResult();
        })
        .WithName("DeleteFileFromStorage")
        .WithSummary("Удаление файла из S3 хранилища по ключу");

        return group;
    }
}
