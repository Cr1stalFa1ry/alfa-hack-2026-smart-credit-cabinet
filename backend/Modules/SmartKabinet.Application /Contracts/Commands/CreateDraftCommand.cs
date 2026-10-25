namespace SmartKabinet.Application.Commands;

public record CreateDraftCommand(
    Guid ClientId,
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
)
{
    public CreateDraftCommand(
        string inn,
        int stage,
        int purpose,
        decimal requestedAmount,
        decimal ownContribution = 0,
        int? requestedTermMonths = 12,
        bool bkiConsent = true,
        bool personalDataConsent = true,
        string? equipmentSupplier = null,
        decimal? equipmentPrice = null,
        string? productCode = null,
        DateTime? neededByDate = null,
        string? expensePeriod = null,
        bool? hasExpenseContract = null,
        bool? isTaxRegimeActual = null,
        string? declaredTaxRegime = null,
        List<string>? receiptCoverage = null,
        string? expensesCoverageStatus = null,
        bool? hasAdditionalIncome = null,
        decimal? additionalIncomeAmount = null,
        string? debtsVerificationStatus = null,
        string? repaymentSourceDescription = null,
        decimal? monthlyRevenue = null,
        decimal? monthlyExpenses = null,
        decimal? householdExpenses = null,
        decimal? existingMonthlyObligations = null)
        : this(Guid.Empty, inn, stage, purpose, requestedAmount, ownContribution, requestedTermMonths, bkiConsent, personalDataConsent, equipmentSupplier, equipmentPrice, productCode, neededByDate, expensePeriod, hasExpenseContract, isTaxRegimeActual, declaredTaxRegime, receiptCoverage, expensesCoverageStatus, hasAdditionalIncome, additionalIncomeAmount, debtsVerificationStatus, repaymentSourceDescription, monthlyRevenue, monthlyExpenses, householdExpenses, existingMonthlyObligations)
    {
    }
}
