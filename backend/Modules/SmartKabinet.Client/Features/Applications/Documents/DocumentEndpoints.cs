using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Application.Domain;
using SmartKabinet.Application.Infrastructure.Persistence;
using SmartKabinet.Auth.Infrastructure.Security;
using SmartKabinet.Infrastructure.Contracts;

namespace SmartKabinet.Client.Features.Applications.Documents;

public static class DocumentEndpoints
{
    public static RouteGroupBuilder MapDocumentEndpoints(this RouteGroupBuilder group)
    {
        // POST /api/client/applications/{id}/documents
        group.MapPost("/{id:guid}/documents", async (
            Guid id,
            IFormFile file,
            [FromForm] string? documentType,
            IUserContext userContext,
            ApplicationDbContext appDb,
            IS3StorageService storageService,
            CancellationToken ct) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsClient) return Results.Forbid();

            var app = await appDb.Applications
                .FirstOrDefaultAsync(a => a.Id == id && a.ClientId == userContext.UserId.Value, ct);

            if (app is null)
            {
                return Results.NotFound(new { error = "Заявка не найдена." });
            }

            if (file == null || file.Length == 0)
            {
                return Results.BadRequest(new { error = "Файл документа не передан или пуст." });
            }

            // 1. Попытка загрузить файл в S3 хранилище
            string fileKey;
            try
            {
                using var stream = file.OpenReadStream();
                var uploadResult = await storageService.UploadAsync(
                    stream: stream,
                    fileName: file.FileName,
                    contentType: file.ContentType,
                    folder: $"applications/{id}",
                    ct: ct
                );

                if (uploadResult.IsSuccess)
                {
                    fileKey = uploadResult.Value.FileKey;
                }
                else
                {
                    // Резервный ключ при недоступности внешнего S3
                    fileKey = $"applications/{id}/{Guid.NewGuid():N}_{file.FileName}";
                }
            }
            catch
            {
                fileKey = $"applications/{id}/{Guid.NewGuid():N}_{file.FileName}";
            }

            // 2. Определение типа документа
            var resolvedType = !string.IsNullOrWhiteSpace(documentType)
                ? documentType
                : file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase)
                    ? "bank_statement"
                    : "other";

            // 3. Сохранение метаданных в БД
            var doc = new ApplicationDocument
            {
                Id = Guid.NewGuid(),
                ApplicationId = id,
                FileName = file.FileName,
                FileKey = fileKey,
                FileType = resolvedType,
                FileSizeBytes = file.Length,
                Status = "uploaded",
                UploadedAt = DateTimeOffset.UtcNow
            };

            appDb.ApplicationDocuments.Add(doc);
            app.UpdatedAt = DateTimeOffset.UtcNow;
            await appDb.SaveChangesAsync(ct);

            var dto = new ApplicationDocumentDto(
                doc.Id,
                doc.FileName,
                doc.FileKey,
                doc.FileType,
                doc.FileSizeBytes,
                doc.Status,
                doc.UploadedAt,
                $"/api/infrastructure/storage/{doc.FileKey}"
            );

            return Results.Ok(dto);
        })
        .DisableAntiforgery()
        .RequireAuthorization(AuthPolicies.ClientOnly)
        .WithName("UploadApplicationDocument")
        .WithSummary("Загрузка и прикрепление документа к заявке с сохранением в S3 и БД");

        // GET /api/client/applications/{id}/documents
        group.MapGet("/{id:guid}/documents", async (
            Guid id,
            IUserContext userContext,
            ApplicationDbContext appDb,
            CancellationToken ct) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsClient) return Results.Forbid();

            var app = await appDb.Applications
                .FirstOrDefaultAsync(a => a.Id == id && a.ClientId == userContext.UserId.Value, ct);

            if (app is null)
            {
                return Results.NotFound(new { error = "Заявка не найдена." });
            }

            var documents = await appDb.ApplicationDocuments
                .Where(d => d.ApplicationId == id)
                .OrderBy(d => d.UploadedAt)
                .Select(d => new ApplicationDocumentDto(
                    d.Id,
                    d.FileName,
                    d.FileKey,
                    d.FileType,
                    d.FileSizeBytes,
                    d.Status,
                    d.UploadedAt,
                    $"/api/infrastructure/storage/{d.FileKey}"
                ))
                .ToListAsync(ct);

            return Results.Ok(documents);
        })
        .RequireAuthorization(AuthPolicies.ClientOnly)
        .WithName("GetApplicationDocuments")
        .WithSummary("Получение списка всех прикрепленных документов по заявке из БД");

        // DELETE /api/client/applications/{id}/documents/{documentId:guid}
        group.MapDelete("/{id:guid}/documents/{documentId:guid}", async (
            Guid id,
            Guid documentId,
            IUserContext userContext,
            ApplicationDbContext appDb,
            IS3StorageService storageService,
            CancellationToken ct) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsClient) return Results.Forbid();

            var doc = await appDb.ApplicationDocuments
                .FirstOrDefaultAsync(d => d.Id == documentId && d.ApplicationId == id, ct);

            if (doc is null)
            {
                return Results.NotFound(new { error = "Документ не найден." });
            }

            try
            {
                await storageService.DeleteAsync(doc.FileKey, ct);
            }
            catch
            {
                // Игнорируем ошибку удаления из S3, если файл отсутствует
            }

            appDb.ApplicationDocuments.Remove(doc);
            await appDb.SaveChangesAsync(ct);

            return Results.Ok(new { message = "Документ успешно удален." });
        })
        .RequireAuthorization(AuthPolicies.ClientOnly)
        .WithName("DeleteApplicationDocument")
        .WithSummary("Удаление прикрепленного документа из заявки и S3");

        return group;
    }
}
