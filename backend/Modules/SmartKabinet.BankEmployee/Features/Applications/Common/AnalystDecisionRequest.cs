namespace SmartKabinet.BankEmployee.Features.Applications.Common;

public record AnalystDecisionRequest(
    decimal? ApprovedAmount = null,
    int? TermMonths = null,
    decimal? AnnualRatePercent = null,
    string? ReasonCode = null,
    string? Comment = null
);
