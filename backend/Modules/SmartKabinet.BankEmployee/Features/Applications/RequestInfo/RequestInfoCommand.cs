namespace SmartKabinet.BankEmployee.Features.Applications.RequestInfo;

public record RequestInfoCommand(
    Guid ApplicationId,
    string? ReasonCode = null,
    string? Comment = null
);
