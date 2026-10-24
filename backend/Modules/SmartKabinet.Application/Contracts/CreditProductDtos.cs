namespace SmartKabinet.Application.Contracts;

public record CreditProductDto(
    string Code,
    string Name,
    string Description,
    IReadOnlyList<string> AllowedStages,
    string Purpose,
    decimal MinAmount,
    decimal MaxAmount,
    int MinTermMonths,
    int MaxTermMonths,
    decimal MinInterestRate,
    decimal MaxInterestRate,
    bool RequiresOwnContribution,
    decimal MinOwnContributionPercent,
    string DecisionMaker = "system",
    string Conditions = ""
);
