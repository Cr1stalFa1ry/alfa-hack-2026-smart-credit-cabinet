using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SmartKabinet.Application.Commands;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Auth.Infrastructure.Security;
using SmartKabinet.Shared;

namespace SmartKabinet.Client.Features.Applications.CreateDraft;

public record CreateDraftRequest(
    string Inn,
    int Stage, // 1 = Operating, 2 = Prelaunch
    int Purpose, // 1 = Equipment, 2 = WorkingCapital
    decimal RequestedAmount,
    decimal OwnContribution = 0,
    int? RequestedTermMonths = 12,
    bool BkiConsent = true,
    bool PersonalDataConsent = true,
    string? EquipmentSupplier = null,
    decimal? EquipmentPrice = null,
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

public static class CreateDraftEndpoint
{
    public static RouteGroupBuilder MapCreateDraftEndpoint(this RouteGroupBuilder group)
    {
        // POST /api/client/applications/draft (T01)
        group.MapPost("/draft", async (
            CreateDraftRequest request,
            IUserContext userContext,
            ICreateDraft service,
            CancellationToken ct) => 
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsClient) return Results.Forbid();

            var cmd = new CreateDraftCommand(
                userContext.UserId.Value,
                request.Inn,
                request.Stage,
                request.Purpose,
                request.RequestedAmount,
                request.OwnContribution,
                request.RequestedTermMonths,
                request.BkiConsent,
                request.PersonalDataConsent,
                request.EquipmentSupplier,
                request.EquipmentPrice,
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

            var result = await service.CreateDraftAsync(cmd, ct);
            return result.ToHttpResult(appId => 
                Results.Created($"/api/client/applications/{appId.Value}", new { applicationId = appId.Value, status = "draft" }));
        })
        .RequireAuthorization(AuthPolicies.ClientOnly)
        .WithName("CreateApplicationDraft")
        .WithSummary("T01: Создание черновика заявки на кредит");
        
        return group;
    }
}
