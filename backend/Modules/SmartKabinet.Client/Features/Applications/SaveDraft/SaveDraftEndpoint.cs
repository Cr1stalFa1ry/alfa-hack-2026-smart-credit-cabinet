using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SmartKabinet.Application.Commands;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Auth.Infrastructure.Security;
using SmartKabinet.Shared;

namespace SmartKabinet.Client.Features.Applications.SaveDraft;

public record UpdateDraftRequest(
    decimal RequestedAmount,
    decimal OwnContribution,
    int? RequestedTermMonths,
    bool BkiConsent,
    bool PersonalDataConsent,
    string? StatementFilePath = null,
    decimal? FinancialReserve = null,
    string? ProductCode = null,
    DateTime? NeededByDate = null,
    string? ExpensePeriod = null,
    bool? HasExpenseContract = null,
    bool? IsTaxRegimeActual = null,
    string? DeclaredTaxRegime = null,
    List<string>? ReceiptCoverage = null,
    string? ExpensesCoverageStatus = null,
    bool? HasAdditionalIncome = null,
    decimal? AdditionalIncomeAmount = null,
    string? DebtsVerificationStatus = null,
    string? RepaymentSourceDescription = null,
    decimal? MonthlyRevenue = null,
    decimal? MonthlyExpenses = null,
    decimal? HouseholdExpenses = null,
    decimal? ExistingMonthlyObligations = null
);

public static class SaveDraftEndpoint
{
    public static RouteGroupBuilder MapSaveDraftEndpoint(this RouteGroupBuilder group)
    {
        // PUT /api/client/applications/{id}/draft (T02)
        group.MapPut("/{id:guid}/draft", async (
            Guid id,
            UpdateDraftRequest request,
            IUserContext userContext,
            ISaveDraft service,
            CancellationToken ct) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsClient) return Results.Forbid();

            var cmd = new SaveDraftCommand(
                id,
                userContext.UserId.Value,
                request.RequestedAmount,
                request.OwnContribution,
                request.RequestedTermMonths,
                request.BkiConsent,
                request.PersonalDataConsent,
                request.StatementFilePath,
                request.FinancialReserve,
                request.ProductCode,
                request.NeededByDate,
                request.ExpensePeriod,
                request.HasExpenseContract,
                request.IsTaxRegimeActual,
                request.DeclaredTaxRegime,
                request.ReceiptCoverage,
                request.ExpensesCoverageStatus,
                request.HasAdditionalIncome,
                request.AdditionalIncomeAmount,
                request.DebtsVerificationStatus,
                request.RepaymentSourceDescription,
                request.MonthlyRevenue,
                request.MonthlyExpenses,
                request.HouseholdExpenses,
                request.ExistingMonthlyObligations);

            var result = await service.SaveDraftAsync(cmd, ct);
            return result.ToHttpResult(() => Results.Ok(new { message = "Черновик успешно сохранён", applicationId = id, status = "draft" }));
        })
        .RequireAuthorization(AuthPolicies.ClientOnly)
        .WithName("UpdateApplicationDraft")
        .WithSummary("T02: Сохранение изменений в черновике заявки");

        return group;
    }
}
