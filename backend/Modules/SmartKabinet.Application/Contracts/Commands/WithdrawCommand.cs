namespace SmartKabinet.Application.Commands;

public record WithdrawCommand(
    Guid ApplicationId,
    Guid ClientId
);
