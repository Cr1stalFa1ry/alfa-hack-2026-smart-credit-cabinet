namespace SmartKabinet.Application.Contracts;

public readonly record struct ApplicationId(Guid Value)
{
    public static implicit operator Guid(ApplicationId id) => id.Value;
    public static implicit operator ApplicationId(Guid value) => new(value);
    public override string ToString() => Value.ToString();
}

public record ApplicationListItemDto(
    Guid Id,
    string Inn,
    string Status,
    string Decision,
    string ProductCode,
    decimal RequestedAmount,
    int? RequestedTermMonths,
    IReadOnlyList<string> ClientReasonTexts,
    bool HasOffer,
    DateTimeOffset CreatedAt
);

public record ApplicationDocumentDto(
    Guid Id,
    string FileName,
    string FileKey,
    string FileType,
    long FileSizeBytes,
    string Status,
    DateTimeOffset UploadedAt,
    string? DownloadUrl = null
);

public record ApplicationTransitionHistoryDto(
    Guid Id,
    string TransitionCode,
    string FromStatus,
    string ToStatus,
    string Actor,
    string? Comment,
    DateTimeOffset Timestamp
);

public record ApplicationDto(
    Guid Id,
    Guid ClientId,
    string Inn,
    string Status,
    string Decision,
    string ProductCode,
    decimal RequestedAmount,
    decimal OwnContribution,
    int? RequestedTermMonths,
    IReadOnlyList<string> ReasonCodes,
    IReadOnlyList<string> ClientReasonTexts,
    ApplicationOfferDto? Offer,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    IReadOnlyList<ApplicationDocumentDto>? Documents = null,
    IReadOnlyList<ApplicationTransitionHistoryDto>? History = null,
    DateTime? NeededByDate = null,
    string? ExpensePeriod = null,
    bool? HasExpenseContract = null,
    bool? IsTaxRegimeActual = null,
    string? DeclaredTaxRegime = null,
    IReadOnlyList<string>? ReceiptCoverage = null,
    string? ExpensesCoverageStatus = null,
    bool? HasAdditionalIncome = null,
    decimal? AdditionalIncomeAmount = null,
    string? DebtsVerificationStatus = null,
    string? RepaymentSourceDescription = null,
    decimal? MonthlyRevenue = null,
    decimal? MonthlyExpenses = null,
    decimal? HouseholdExpenses = null,
    decimal? ExistingMonthlyObligations = null
);
