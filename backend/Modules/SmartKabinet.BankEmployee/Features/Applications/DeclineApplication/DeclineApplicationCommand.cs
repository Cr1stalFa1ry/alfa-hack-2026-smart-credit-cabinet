namespace SmartKabinet.BankEmployee.Features.Applications.DeclineApplication;

public record DeclineApplicationCommand(
    Guid ApplicationId,
    string? ReasonCode = null,
    string? Comment = null
);
