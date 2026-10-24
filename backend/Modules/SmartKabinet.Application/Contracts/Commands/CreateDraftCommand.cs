namespace SmartKabinet.Application.Commands;

public record CreateDraftCommand(
    Guid ClientId,
    string Inn,
    int Stage, // 1 = Operating, 2 = Prelaunch
    int Purpose, // 1 = Equipment, 2 = WorkingCapital
    decimal RequestedAmount,
    decimal OwnContribution = 0,
    int? RequestedTermMonths = 12,
    bool BkiConsent = true,
    bool PersonalDataConsent = true,
    string? EquipmentSupplier = null,
    decimal? EquipmentPrice = null,
    string? ProductCode = null
)
{
    public CreateDraftCommand(
        string inn,
        int stage,
        int purpose,
        decimal requestedAmount,
        decimal ownContribution = 0,
        int? requestedTermMonths = 12,
        bool bkiConsent = true,
        bool personalDataConsent = true,
        string? equipmentSupplier = null,
        decimal? equipmentPrice = null,
        string? productCode = null)
        : this(Guid.Empty, inn, stage, purpose, requestedAmount, ownContribution, requestedTermMonths, bkiConsent, personalDataConsent, equipmentSupplier, equipmentPrice, productCode)
    {
    }
}
