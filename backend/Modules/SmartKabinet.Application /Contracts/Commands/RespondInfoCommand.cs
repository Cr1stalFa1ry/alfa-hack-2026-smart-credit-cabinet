namespace SmartKabinet.Application.Commands;

public record RespondInfoCommand(
    Guid ApplicationId,
    Guid ClientId,
    string? StatementFilePath = null,
    decimal? FinancialReserve = null,
    string? Comment = null
);
