namespace SmartKabinet.Application.Contracts;

public record ApplicationOfferDto(
    decimal ApprovedAmount,
    int TermMonths,
    decimal AnnualRatePercent,
    decimal MonthlyPayment,
    bool IsCounterOffer,
    string? ReasonCode
);

public record ApplyCheckingDecisionCommand(
    Guid ApplicationId,
    int TargetStatus, // ApplicationStatus
    int Decision, // CreditDecision
    List<string> ReasonCodes,
    ApplicationOfferDto? Offer = null,
    string? Comment = null
);
