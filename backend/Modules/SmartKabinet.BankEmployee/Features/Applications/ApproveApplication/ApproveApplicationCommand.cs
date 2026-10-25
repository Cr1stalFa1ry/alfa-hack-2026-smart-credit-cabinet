namespace SmartKabinet.BankEmployee.Features.Applications.ApproveApplication;

public record ApproveApplicationCommand(
    Guid ApplicationId,
    decimal? ApprovedAmount = null,
    int? TermMonths = null,
    decimal? AnnualRatePercent = null,
    string? ReasonCode = null,
    string? Comment = null
);
