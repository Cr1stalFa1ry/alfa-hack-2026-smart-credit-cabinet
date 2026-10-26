using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using SmartKabinet.Application.Infrastructure.Persistence;
using SmartKabinet.Auth.Infrastructure.Security;
using SmartKabinet.Infrastructure.Contracts;

namespace SmartKabinet.BankEmployee.Features.Applications.DeleteApplication;

public static class DeleteApplicationEndpoint
{
    public static RouteGroupBuilder MapDeleteApplicationEndpoint(this RouteGroupBuilder group)
    {
        // DELETE /api/employee/applications/{id}
        group.MapDelete("/{id:guid}", async (
            Guid id,
            IUserContext userContext,
            ApplicationDbContext appDb,
            IS3StorageService storageService,
            CancellationToken ct) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsBankEmployee) return Results.Forbid();

            var app = await appDb.Applications
                .Include(a => a.CurrentOffer)
                .FirstOrDefaultAsync(a => a.Id == id, ct);
            if (app is null)
            {
                return Results.NotFound(new { error = "Заявка не найдена." });
            }

            // 1. Физическое удаление файлов анкеты из S3 хранилища
            var docs = await appDb.ApplicationDocuments.Where(d => d.ApplicationId == id).ToListAsync(ct);
            foreach (var doc in docs)
            {
                if (!string.IsNullOrWhiteSpace(doc.FileKey))
                {
                    try
                    {
                        await storageService.DeleteAsync(doc.FileKey, ct);
                    }
                    catch
                    {
                        // Не блокируем общее удаление при сбое одного файла в S3
                    }
                }
            }

            // Удаляем папку applications/{id} со всеми загруженными выписками, чеками и доп. файлами
            try
            {
                await storageService.DeleteFolderAsync($"applications/{id}", ct);
            }
            catch
            {
                // Игнорируем
            }

            // Если были указаны пути к файлам в полях сущности Application
            string?[] extraPaths = [app.StatementFilePath, app.SupplierBillFilePath, app.BusinessPlanFilePath];
            foreach (var path in extraPaths)
            {
                if (!string.IsNullOrWhiteSpace(path))
                {
                    try
                    {
                        await storageService.DeleteAsync(path, ct);
                    }
                    catch
                    {
                        // Игнорируем
                    }
                }
            }

            // 2. Каскадное удаление связанных записей в базе данных
            var transitions = await appDb.TransitionHistory.Where(t => t.ApplicationId == id).ToListAsync(ct);
            if (transitions.Count > 0)
            {
                appDb.TransitionHistory.RemoveRange(transitions);
            }

            if (docs.Count > 0)
            {
                appDb.ApplicationDocuments.RemoveRange(docs);
            }

            if (app.CurrentOffer != null)
            {
                appDb.Offers.Remove(app.CurrentOffer);
            }

            appDb.Applications.Remove(app);
            await appDb.SaveChangesAsync(ct);

            return Results.Ok(new { message = "Заявка и прикрепленные файлы успешно удалены", applicationId = id });
        })
        .RequireAuthorization(AuthPolicies.EmployeeOnly)
        .WithName("DeleteApplication")
        .WithSummary("Удаление анкеты/заявки и прикрепленных файлов сотрудником банка");

        return group;
    }
}
