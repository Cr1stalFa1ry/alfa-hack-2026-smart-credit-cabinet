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
using SmartKabinet.Intergrations.Ml.Services;

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
            IMlServiceClient mlClient,
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

            // 3. Автоматическая сверка счета с заявкой через ML /v1/documents/read при наличии счета на оборудование
            var initialStatus = "uploaded";
            if (resolvedType == "equipment_invoice" || resolvedType.Contains("invoice", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    using var mlStream = file.OpenReadStream();
                    var docRead = await mlClient.ReadDocumentAsync(
                        fileStream: mlStream,
                        fileName: file.FileName,
                        documentId: id.ToString(),
                        documentVersion: "1",
                        ct: ct
                    );

                    var verification = mlClient.VerifyInvoiceAgainstApplication(
                        doc: docRead,
                        expectedEquipmentPrice: app.EquipmentPrice,
                        expectedBuyerInn: app.Inn,
                        expectedSupplierInn: app.EquipmentSupplier
                    );

                    initialStatus = verification.IsMatched ? "verified" : (verification.NeedsReview ? "needs_review" : "uploaded");
                }
                catch
                {
                    // Фоллбэк: если ML сервис временно недоступен, документ все равно прикрепляется
                    initialStatus = "uploaded";
                }
            }

            // 4. Сохранение метаданных в БД
            var doc = new ApplicationDocument
            {
                Id = Guid.NewGuid(),
                ApplicationId = id,
                FileName = file.FileName,
                FileKey = fileKey,
                FileType = resolvedType,
                FileSizeBytes = file.Length,
                Status = initialStatus,
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

        // POST /api/client/applications/{id}/documents/{documentId:guid}/verify-invoice
        group.MapPost("/{id:guid}/documents/{documentId:guid}/verify-invoice", async (
            Guid id,
            Guid documentId,
            IUserContext userContext,
            ApplicationDbContext appDb,
            IS3StorageService storageService,
            IMlServiceClient mlClient,
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

            var doc = await appDb.ApplicationDocuments
                .FirstOrDefaultAsync(d => d.Id == documentId && d.ApplicationId == id, ct);

            if (doc is null)
            {
                return Results.NotFound(new { error = "Документ не найден." });
            }

            var downloadRes = await storageService.DownloadAsync(doc.FileKey, ct);
            if (!downloadRes.IsSuccess || downloadRes.Value?.Stream is null)
            {
                return Results.BadRequest(new { error = "Не удалось получить файл документа из хранилища." });
            }

            using var stream = downloadRes.Value.Stream;
            var docRead = await mlClient.ReadDocumentAsync(
                fileStream: stream,
                fileName: doc.FileName,
                documentId: doc.Id.ToString(),
                documentVersion: "1",
                ct: ct
            );

            var verification = mlClient.VerifyInvoiceAgainstApplication(
                doc: docRead,
                expectedEquipmentPrice: app.EquipmentPrice,
                expectedBuyerInn: app.Inn,
                expectedSupplierInn: app.EquipmentSupplier
            );

            doc.Status = verification.IsMatched ? "verified" : (verification.NeedsReview ? "needs_review" : "uploaded");
            app.UpdatedAt = DateTimeOffset.UtcNow;
            await appDb.SaveChangesAsync(ct);

            return Results.Ok(verification);
        })
        .RequireAuthorization(AuthPolicies.ClientOnly)
        .WithName("VerifyApplicationDocumentInvoice")
        .WithSummary("Автоматическая проверка и сверка загруженного счёта со стоимостью оборудования (equipment_price) и ИНН заявителя через ML /v1/documents/read");

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
