using Microsoft.EntityFrameworkCore;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Application.Domain;
using SmartKabinet.Application.Infrastructure.Persistence;
using SmartKabinet.Shared;

namespace SmartKabinet.Application.Features.Commands;

public class ApplicationQueriesHandler(ApplicationDbContext dbContext) : IGetApplication, IApplicationModule
{
    public async Task<Result<ApplicationDto>> GetAsync(Guid id, Guid clientId, CancellationToken ct = default)
    {
        var app = await dbContext.Applications
            .Include(a => a.CurrentOffer)
            .FirstOrDefaultAsync(a => a.Id == id && a.ClientId == clientId, ct);

        if (app is null)
        {
            return Error.NotFound("Application.NotFound", "Заявка не найдена.");
        }

        var clientTexts = ClientReasonHelper.GetClientTexts(app.ReasonCodes);
        var isOfferActiveForClient = app.CurrentOffer is not null && app.Status is 
            ApplicationStatus.Offer or 
            ApplicationStatus.Accepted or 
            ApplicationStatus.PreConditions or 
            ApplicationStatus.SignedSim or 
            ApplicationStatus.ReadyTodisburse or 
            ApplicationStatus.DisbursedSim;

        var offerDto = isOfferActiveForClient
            ? new ApplicationOfferDto(
                app.CurrentOffer!.ApprovedAmount,
                app.CurrentOffer.TermMonths,
                app.CurrentOffer.AnnualRatePercent,
                app.CurrentOffer.MonthlyPayment,
                app.CurrentOffer.IsCounterOffer,
                app.CurrentOffer.ReasonCode)
            : null;

        var productCode = !string.IsNullOrWhiteSpace(app.ProductCode)
            ? app.ProductCode
            : CreditProductCodes.ResolveProductCode(app.Stage, app.Purpose);

        var documents = await dbContext.ApplicationDocuments
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

        var rawTransitions = await dbContext.TransitionHistory
            .Where(h => h.ApplicationId == id)
            .OrderBy(h => h.Timestamp)
            .ToListAsync(ct);

        var history = rawTransitions
            .Where(h => !(h.FromStatus == ApplicationStatus.Draft && h.ToStatus == ApplicationStatus.Draft && (h.ReasonCode == "T02" || (h.Comment != null && h.Comment.Contains("T02")))))
            .Select(h => new ApplicationTransitionHistoryDto(
                h.Id,
                h.ReasonCode ?? (h.Comment != null && h.Comment.Contains("T03") ? "T03" : h.Comment != null && h.Comment.Contains("T01") ? "T01" : "T00"),
                h.FromStatus.ToString().ToLowerInvariant(),
                h.ToStatus.ToString().ToLowerInvariant(),
                h.Actor,
                h.Comment,
                h.Timestamp
            ))
            .ToList();

        var lastNeedInfo = rawTransitions
            .Where(t => t.ToStatus == ApplicationStatus.NeedInfo)
            .LastOrDefault();

        var lastClientResponse = rawTransitions
            .Where(t => (t.FromStatus == ApplicationStatus.NeedInfo || t.ToStatus == ApplicationStatus.InfoReceived) && (t.Actor.ToLower() == "client" || t.Actor.ToLower() == "клиент"))
            .LastOrDefault();

        string? needInfoPrompt = lastNeedInfo?.Comment;
        string? needInfoResponse = lastClientResponse?.Comment;
        DateTimeOffset? needInfoRequestedAt = lastNeedInfo?.Timestamp;
        string? needInfoActorName = lastNeedInfo?.Actor?.ToLowerInvariant() switch
        {
            "analyst" => "Кредитный аналитик банка",
            "system" => "Система скоринга",
            _ => lastNeedInfo?.Actor
        };

        return new ApplicationDto(
            app.Id,
            app.ClientId,
            app.Inn,
            app.Status.ToString().ToLowerInvariant(),
            app.Decision.ToString(),
            productCode,
            app.RequestedAmount,
            app.OwnContribution,
            app.RequestedTermMonths,
            app.ReasonCodes,
            clientTexts,
            offerDto,
            app.CreatedAt,
            app.UpdatedAt,
            documents,
            history,
            app.NeededByDate,
            app.ExpensePeriod,
            app.HasExpenseContract,
            app.IsTaxRegimeActual,
            app.DeclaredTaxRegime,
            app.ReceiptCoverage,
            app.ExpensesCoverageStatus,
            app.HasAdditionalIncome,
            app.AdditionalIncomeAmount,
            app.DebtsVerificationStatus,
            app.RepaymentSourceDescription,
            app.MonthlyRevenue,
            app.MonthlyExpenses,
            app.HouseholdExpenses,
            app.ExistingMonthlyObligations,
            needInfoPrompt,
            needInfoResponse,
            needInfoRequestedAt,
            needInfoActorName
        );
    }

    public async Task<IReadOnlyList<ApplicationListItemDto>> ListForClientAsync(Guid clientId, CancellationToken ct = default)
    {
        var apps = await dbContext.Applications
            .Include(a => a.CurrentOffer)
            .Where(a => a.ClientId == clientId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(ct);

        var appIds = apps.Select(a => a.Id).ToList();
        var needInfoTransitions = await dbContext.TransitionHistory
            .Where(t => appIds.Contains(t.ApplicationId) && t.ToStatus == ApplicationStatus.NeedInfo)
            .OrderBy(t => t.Timestamp)
            .ToListAsync(ct);

        var needInfoByAppId = needInfoTransitions
            .GroupBy(t => t.ApplicationId)
            .ToDictionary(g => g.Key, g => g.Last().Comment);

        return apps.Select(app => new ApplicationListItemDto(
            app.Id,
            app.Inn,
            app.Status.ToString().ToLowerInvariant(),
            app.Decision.ToString(),
            !string.IsNullOrWhiteSpace(app.ProductCode)
                ? app.ProductCode
                : CreditProductCodes.ResolveProductCode(app.Stage, app.Purpose),
            app.RequestedAmount,
            app.RequestedTermMonths,
            ClientReasonHelper.GetClientTexts(app.ReasonCodes),
            app.CurrentOffer is not null && app.Status is ApplicationStatus.Offer or ApplicationStatus.Accepted or ApplicationStatus.PreConditions or ApplicationStatus.SignedSim or ApplicationStatus.ReadyTodisburse or ApplicationStatus.DisbursedSim,
            app.CreatedAt,
            needInfoByAppId.GetValueOrDefault(app.Id)
        )).ToList();
    }
}
