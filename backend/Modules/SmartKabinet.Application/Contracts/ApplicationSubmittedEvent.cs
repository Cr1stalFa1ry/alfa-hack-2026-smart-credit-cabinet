namespace SmartKabinet.Application.Contracts;

public record ApplicationSubmittedEvent(
    Guid ApplicationId,
    Guid ClientId,
    string Inn,
    int Stage, // 1 = Operating, 2 = Prelaunch
    int Purpose, // 1 = Equipment, 2 = WorkingCapital
    decimal RequestedAmount,
    decimal OwnContribution,
    int RequestedTermMonths,
    decimal? ProjectedMonthlyRevenue = null,
    decimal? FinancialReserve = null,
    decimal? PersonalIncome = null,
    string ProductCode = "",
    decimal? MonthlyRevenue = null,
    decimal? MonthlyExpenses = null,
    decimal? HouseholdExpenses = null,
    decimal? ExistingMonthlyObligations = null,
    string? DebtsVerificationStatus = null,
    string? ExpensesCoverageStatus = null,
    bool? HasAdditionalIncome = null,
    decimal? AdditionalIncomeAmount = null
);
