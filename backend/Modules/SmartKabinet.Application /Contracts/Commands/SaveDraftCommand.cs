namespace SmartKabinet.Application.Commands;

public record SaveDraftCommand(
    Guid ApplicationId,
    Guid ClientId,
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
