namespace SmartKabinet.Application.Commands;

public record SaveDraftCommand(
    Guid ApplicationId,
    Guid ClientId,
    decimal RequestedAmount,
    decimal OwnContribution,
    int? RequestedTermMonths,
    bool BkiConsent,
    bool PersonalDataConsent,
    string? StatementFilePath = null,
    decimal? FinancialReserve = null,
    string? ProductCode = null
);
