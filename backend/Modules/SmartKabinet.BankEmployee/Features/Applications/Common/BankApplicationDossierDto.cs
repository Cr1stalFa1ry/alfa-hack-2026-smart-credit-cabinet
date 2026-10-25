using SmartKabinet.Application.Contracts;

namespace SmartKabinet.BankEmployee.Features.Applications.Common;

public record TransitionHistoryDto(
    string Id,
    string TransitionCode,
    string FromStatus,
    string ToStatus,
    string Actor,
    string ActorName,
    string? ReasonCode,
    string? Comment,
    string Timestamp
);

public record CurrentOfferDetailsDto(
    decimal ApprovedAmount,
    int TermMonths,
    decimal AnnualRatePercent,
    decimal MonthlyPayment,
    bool IsCounterOffer,
    string? ReasonCode
);

public record StopFactorDto(
    string Id,
    string Code,
    string Title,
    string Description,
    bool IsTriggered,
    string Severity
);

public record EgripDetailsDto(
    string Inn,
    string Ogrnip,
    string FullName,
    string Status,
    string RegistrationDate,
    string Okved,
    string OkvedMainName,
    string Region
);

public record FnsDetailsDto(
    decimal TaxDebtAmount,
    bool HasSuspendedAccounts,
    bool IsDisqualifiedPerson,
    bool LastReportingSubmitted
);

public record BkiDetailsDto(
    int Rating,
    int ActiveLoansCount,
    decimal TotalDebt,
    int MaxOverdueDays,
    decimal CurrentOverdueAmount,
    bool HasCriticalDelays
);

public record ScoringComponentDto(
    string Key,
    string Label,
    int Points,
    int Max,
    string Value,
    string Rule
);

public record ScoringDetailsDto(
    int Score,
    string RiskLevel,
    double Dscr,
    decimal NetCashFlow,
    decimal RecommendedMaxPayment,
    string CalculatedAt,
    IReadOnlyList<StopFactorDto> StopFactors,
    EgripDetailsDto Egrip,
    FnsDetailsDto Fns,
    BkiDetailsDto Bki,
    IReadOnlyList<ScoringComponentDto>? Components = null,
    IReadOnlyList<string>? Issues = null
);

public record BankApplicationDossierDto(
    Guid Id,
    Guid ApplicationId,
    Guid ClientId,
    string Inn,
    string CompanyName,
    int Stage,
    int Purpose,
    string ProductCode,
    decimal RequestedAmount,
    decimal OwnContribution,
    int RequestedTermMonths,
    DateTime? NeededByDate,
    bool AsSoonAsPossible,
    bool BkiConsent,
    bool PersonalDataConsent,
    string PurposeText,
    decimal MonthlyRevenue,
    decimal MonthlyExpenses,
    decimal? EquipmentPrice,
    string? EquipmentSupplier,
    string? EquipmentList,
    string Status,
    string Decision,
    IReadOnlyList<string>? ReasonCodes,
    string CreatedAt,
    string UpdatedAt,
    IReadOnlyList<TransitionHistoryDto> History,
    CurrentOfferDetailsDto? CurrentOffer,
    ScoringDetailsDto? Scoring,
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
    IReadOnlyList<ApplicationDocumentDto>? Documents = null,
    string? MlExplanation = null,
    string? MlExplanationSource = null
);
