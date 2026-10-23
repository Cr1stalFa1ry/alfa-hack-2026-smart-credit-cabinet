using System.Text;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using SmartKabinet.Application.Infrastructure.Persistence;
using SmartKabinet.Auth.Infrastructure.Security;
using SmartKabinet.Client.Infrastructure.Persistence;
using SmartKabinet.Intergrations.Ml.Services;

namespace SmartKabinet.Client.Features.Applications.UploadAndAnalyzeStatement;

public static class UploadAndAnalyzeStatementEndpoint
{
    private const string SampleCsvContent = 
@"date,amount,counterparty,description
2025-10-02,-50000.00,ООО Арендодатель,Оплата аренды помещения за октябрь
2025-10-05,150000.00,АО Техносервис,""Оплата по счёту 100 за товар, без налога (НДС)""
2025-10-10,-40000.00,Сотрудники,Заработная плата за октябрь
2025-10-20,-30000.00,АО Альфа-Банк,Погашение кредита по договору КД-2024-118
2025-10-25,-18000.00,УФК по г. Москве,Уплата налога УСН (авансовый платёж)
2025-10-27,120000.00,АО Альфа-Банк,Зачисление средств по операциям эквайринга
2025-11-02,-50000.00,ООО Арендодатель,Оплата аренды помещения за ноябрь
2025-11-05,180000.00,ООО Ромашка,""Оплата по счёту 110 за товар, без налога (НДС)""
2025-11-10,-40000.00,Сотрудники,Заработная плата за ноябрь
2025-11-20,-30000.00,АО Альфа-Банк,Погашение кредита по договору КД-2024-118
2025-11-25,-28000.00,УФК по г. Москве,Страховые взносы ИП на пенсионное страхование
2025-11-27,120000.00,АО Альфа-Банк,Зачисление средств по операциям эквайринга
2025-12-02,-50000.00,ООО Арендодатель,Оплата аренды помещения за декабрь
2025-12-05,190000.00,ООО Вектор,""Оплата по счёту 120 за товар, без налога (НДС)""
2025-12-10,-40000.00,Сотрудники,Заработная плата за декабрь
2025-12-20,-30000.00,АО Альфа-Банк,Погашение кредита по договору КД-2024-118
2025-12-27,120000.00,АО Альфа-Банк,Зачисление средств по операциям эквайринга
";

    public static RouteGroupBuilder MapUploadAndAnalyzeStatementEndpoint(this RouteGroupBuilder group)
    {
        // GET /api/client/applications/statement/template (Скачивание CSV шаблона выписки)
        group.MapGet("/statement/template", () =>
        {
            var bytes = Encoding.UTF8.GetBytes(SampleCsvContent);
            return Results.File(bytes, "text/csv; charset=utf-8", "statement_template.csv");
        })
        .AllowAnonymous()
        .WithName("DownloadStatementTemplate")
        .WithSummary("Скачивание эталонного CSV-шаблона банковской выписки для ML");

        // POST /api/client/applications/{id}/statement (Анализ выписки через ML сервис)
        group.MapPost("/{id:guid}/statement", async (
            Guid id,
            IFormFile file,
            string? asOf,
            IUserContext userContext,
            ApplicationDbContext appDb,
            ClientDbContext clientDb,
            IMlServiceClient mlClient,
            CancellationToken ct) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsClient) return Results.Forbid();

            var app = await appDb.Applications.FirstOrDefaultAsync(
                a => a.Id == id && a.ClientId == userContext.UserId.Value, ct);

            if (app is null) return Results.NotFound(new { error = "Заявка не найдена." });

            if (file == null || file.Length == 0)
            {
                return Results.BadRequest(new { error = "Файл выписки не передан или пуст." });
            }

            var profile = await clientDb.Clients.FirstOrDefaultAsync(c => c.UserId == userContext.UserId.Value, ct);
            var ownerName = profile is not null ? $"{profile.LastName} {profile.FirstName}".Trim() : null;

            using var stream = file.OpenReadStream();
            var analysisResult = await mlClient.AnalyzeStatementAsync(stream, file.FileName, asOf, ownerName, ct);

            app.StatementFilePath = file.FileName;

            if (analysisResult.Status == "ok" && analysisResult.Metrics is not null)
            {
                app.HistoryMonths = analysisResult.Metrics.MonthsCount;
                app.ExistingMonthlyObligations = analysisResult.Metrics.AvgMonthlyLoanPaymentsRub;
                app.ProjectedMonthlyRevenue = analysisResult.Metrics.AvgMonthlyRevenueRub;
            }

            app.UpdatedAt = DateTimeOffset.UtcNow;
            await appDb.SaveChangesAsync(ct);

            return Results.Ok(new
            {
                applicationId = app.Id,
                status = analysisResult.Status,
                reason = analysisResult.Reason,
                metrics = analysisResult.Metrics,
                message = analysisResult.Message
            });
        })
        .DisableAntiforgery()
        .RequireAuthorization(AuthPolicies.ClientOnly)
        .WithName("UploadAndAnalyzeStatement")
        .WithSummary("Загрузка и ML-анализ банковской выписки (CSV/XLSX) для заявки");

        return group;
    }
}
