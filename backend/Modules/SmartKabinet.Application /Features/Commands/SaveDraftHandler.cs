using Microsoft.EntityFrameworkCore;
using SmartKabinet.Application.Commands;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Application.Domain;
using SmartKabinet.Application.Infrastructure.Persistence;
using SmartKabinet.Shared;

namespace SmartKabinet.Application.Features.Commands;

public class SaveDraftHandler(ApplicationDbContext dbContext) : ISaveDraft
{
    public async Task<Result> SaveDraftAsync(SaveDraftCommand cmd, CancellationToken ct = default)
    {
        return await Handle(cmd, ct);
    }

    public async Task<Result> Handle(SaveDraftCommand cmd, CancellationToken ct = default)
    {
        var app = await dbContext.Applications.FirstOrDefaultAsync(
            a => a.Id == cmd.ApplicationId && a.ClientId == cmd.ClientId, ct);

        if (app is null)
        {
            return Error.NotFound("Application.NotFound", $"Заявка {cmd.ApplicationId} не найдена для данного клиента.");
        }

        if (app.Status != ApplicationStatus.Draft)
        {
            return Error.Conflict("Application.InvalidStatus", $"Заявка находится в статусе {app.Status} и не может быть изменена.");
        }

        app.RequestedAmount = cmd.RequestedAmount;
        app.OwnContribution = cmd.OwnContribution;
        app.RequestedTermMonths = cmd.RequestedTermMonths;
        app.BkiConsent = cmd.BkiConsent;
        app.PersonalDataConsent = cmd.PersonalDataConsent;

        if (!string.IsNullOrWhiteSpace(cmd.ProductCode) && CreditProductCodes.IsValid(cmd.ProductCode))
        {
            app.ProductCode = cmd.ProductCode.Trim().ToUpperInvariant();
        }
        else if (string.IsNullOrWhiteSpace(app.ProductCode))
        {
            app.ProductCode = CreditProductCodes.ResolveProductCode(app.Stage, app.Purpose);
        }

        if (cmd.StatementFilePath is not null) app.StatementFilePath = cmd.StatementFilePath;
        if (cmd.FinancialReserve.HasValue) app.FinancialReserve = cmd.FinancialReserve.Value;
        if (cmd.NeededByDate.HasValue) app.NeededByDate = cmd.NeededByDate.Value;
        if (cmd.ExpensePeriod is not null) app.ExpensePeriod = cmd.ExpensePeriod;
        if (cmd.HasExpenseContract.HasValue) app.HasExpenseContract = cmd.HasExpenseContract.Value;
        if (cmd.IsTaxRegimeActual.HasValue) app.IsTaxRegimeActual = cmd.IsTaxRegimeActual.Value;
        if (cmd.DeclaredTaxRegime is not null) app.DeclaredTaxRegime = cmd.DeclaredTaxRegime;
        if (cmd.ReceiptCoverage is not null) app.ReceiptCoverage = cmd.ReceiptCoverage;
        if (cmd.ExpensesCoverageStatus is not null) app.ExpensesCoverageStatus = cmd.ExpensesCoverageStatus;
        if (cmd.HasAdditionalIncome.HasValue) app.HasAdditionalIncome = cmd.HasAdditionalIncome.Value;
        if (cmd.AdditionalIncomeAmount.HasValue)
        {
            app.AdditionalIncomeAmount = cmd.AdditionalIncomeAmount.Value;
            app.PersonalIncome = cmd.AdditionalIncomeAmount.Value;
        }
        if (cmd.DebtsVerificationStatus is not null) app.DebtsVerificationStatus = cmd.DebtsVerificationStatus;
        if (cmd.RepaymentSourceDescription is not null) app.RepaymentSourceDescription = cmd.RepaymentSourceDescription;
        if (cmd.MonthlyRevenue.HasValue) app.MonthlyRevenue = cmd.MonthlyRevenue.Value;
        if (cmd.MonthlyExpenses.HasValue) app.MonthlyExpenses = cmd.MonthlyExpenses.Value;
        if (cmd.HouseholdExpenses.HasValue) app.HouseholdExpenses = cmd.HouseholdExpenses.Value;
        if (cmd.ExistingMonthlyObligations.HasValue) app.ExistingMonthlyObligations = cmd.ExistingMonthlyObligations.Value;

        app.UpdatedAt = DateTimeOffset.UtcNow;

        dbContext.TransitionHistory.Add(new TransitionRecord
        {
            ApplicationId = app.Id,
            FromStatus = ApplicationStatus.Draft,
            ToStatus = ApplicationStatus.Draft,
            Actor = "client",
            Comment = "Сохранены изменения в черновике (T02)"
        });

        await dbContext.SaveChangesAsync(ct);
        return Result.Success();
    }
}
