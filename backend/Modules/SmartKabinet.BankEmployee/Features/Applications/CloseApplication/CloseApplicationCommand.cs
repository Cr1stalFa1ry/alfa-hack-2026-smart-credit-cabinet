namespace SmartKabinet.BankEmployee.Features.Applications.CloseApplication;

public record CloseApplicationCommand(
    Guid ApplicationId,
    string? ReasonCode = null,
    string? Comment = null
);
