namespace SmartKabinet.Client.Features.Applications;

public record CreateDraftRequest(
    string Inn,
    int Stage, // 1 = Operating, 2 = Prelaunch
    int Purpose, // 1 = Equipment, 2 = WorkingCapital
    decimal RequestedAmount,
    decimal OwnContribution = 0,
    int? RequestedTermMonths = 12,
    bool BkiConsent = true,
    bool PersonalDataConsent = true,
    string? EquipmentSupplier = null,
    decimal? EquipmentPrice = null
);

public record UpdateDraftRequest(
    decimal RequestedAmount,
    decimal OwnContribution,
    int? RequestedTermMonths,
    bool BkiConsent,
    bool PersonalDataConsent,
    string? StatementFilePath = null,
    decimal? FinancialReserve = null
);

public record RespondInfoRequest(
    string? StatementFilePath = null,
    decimal? FinancialReserve = null,
    string? Comment = null
);
