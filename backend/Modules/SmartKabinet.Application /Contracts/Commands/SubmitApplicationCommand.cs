namespace SmartKabinet.Application.Commands;

public record SubmitApplicationCommand(
    Guid ApplicationId,
    Guid ClientId
);
