namespace SmartKabinet.Application.Commands;

public record RetryCheckCommand(
    Guid ApplicationId,
    Guid ClientId
);

public record CheckCommand(
    Guid ApplicationId,
    Guid ClientId
);
