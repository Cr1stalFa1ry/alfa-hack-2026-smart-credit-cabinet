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
    string ProductCode = ""
);
