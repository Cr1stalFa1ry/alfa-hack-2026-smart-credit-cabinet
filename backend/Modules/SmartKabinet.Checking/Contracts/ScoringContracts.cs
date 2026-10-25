namespace SmartKabinet.Checking.Contracts;

public record MonthlyFact(
    string Month, // YYYY-MM
    decimal Receipts,
    decimal Outflows
);

public record DebtInput(
    string Ref,
    decimal Payment,
    bool Conflict = false
);

public record ScoringInput(
    string AsOf = "2026-10-23",
    string Stage = "operating", // "operating" | "new" | "paused"
    string Purpose = "working_capital", // "equipment" | "working_capital"
    decimal? Amount = null,
    int? Term = null,
    decimal? EquipmentCost = null,
    decimal? OwnFunds = null,
    decimal? HouseholdExpenses = null,
    decimal? ExtraMonthlyExpenses = null,
    decimal? PersonalIncome = null,
    decimal? CommittedCosts = null,
    decimal? CashReserve = null,
    string? IncomeContinues = null,
    bool ForecastOnly = false,
    List<MonthlyFact>? Facts = null,
    List<DebtInput>? Debts = null,
    decimal? ResolvedDebtPayment = null,
    bool DebtsComplete = true,
    bool DebtReconciled = true,
    string FactsState = "AVAILABLE", // "AVAILABLE" | "NO_HISTORY" | "MISSING"
    string SourceStatus = "SUCCESS", // "SUCCESS" | "ERROR" | "INCOMPLETE"
    string CreditHistory = "FOUND", // "FOUND" | "NO_RECORD"
    decimal? CurrentOverdue = 0m,
    int? OverdueDays = 0,
    string? ActivityFirstMonth = null,
    string? RegistrationMonth = null,
    List<string>? Issues = null
);

public record ScoringComponent(
    string Key,
    string Label,
    int Points,
    int Max,
    object? Value,
    string Rule
);

public record CandidateOffer(
    decimal Amount,
    int Term,
    decimal Rate, // e.g. 0.18, 0.21, 0.24
    decimal Payment,
    decimal Coverage,
    string Type, // "ORIGINAL" | "COUNTER"
    bool Passes
);

public record ScoringMetrics(
    decimal? Receipts = null,
    decimal? Outflows = null,
    decimal? ExtraExpenses = null,
    decimal? BusinessCash = null,
    decimal? AvailableCash = null,
    decimal? DebtPayment = null,
    decimal? ReferenceRate = null,
    decimal? ReferencePayment = null,
    decimal? ReferenceCoverage = null,
    int? ActivityMonths = null,
    decimal? Cv = null,
    decimal? AnnualReceipts = null,
    int Months = 0,
    string? Period = null,
    decimal? Amount = null,
    int? Term = null,
    bool DefaultTermUsed = false,
    decimal? PersonalIncome = null,
    decimal? CommittedCosts = null,
    decimal? Reserve = null,
    List<DebtInput>? DebtRows = null
);

public record ScoringResult(
    string Engine,
    string RulesVersion,
    string AssessmentAsOf,
    string? Profile, // "FULL" | "LIMITED" | "CONSULTATION"
    string State, // "ready" | "provisional" | "insufficient" | "manual" | "waiting" | "stop" | "product_na" | "error"
    string Recommendation,
    int? Score,
    List<ScoringComponent> Components,
    ScoringMetrics Metrics,
    CandidateOffer? Candidate,
    List<CandidateOffer> Candidates,
    List<string> Issues,
    List<string> Risks,
    List<string> Codes,
    string? Product, // "WC" | "EQ"
    bool AutoDecision,
    string InputFingerprint,
    bool IsStale = false,
    string? ReferralSpecialist = null,
    DateTimeOffset CalculatedAt = default
);

public record DocumentVerificationRequest(
    Guid ApplicationId,
    string DocumentType, // "EQUIPMENT_INVOICE" | "BANK_STATEMENT"
    decimal? DeclaredAmount,
    string? DeclaredSupplierInn,
    List<MonthlyFact>? DeclaredFacts,
    // Extracted data from document reading
    decimal? ExtractedAmount,
    string? ExtractedSupplierInn,
    List<MonthlyFact>? ExtractedFacts,
    DateTime? DocumentDate
);

public record DocumentVerificationResult(
    bool IsMatched,
    List<string> Discrepancies,
    List<string> ClarificationNeeds,
    Dictionary<string, object?> VerifiedData
);

public interface IScoringService
{
    ScoringResult Evaluate(ScoringInput input, string? existingFingerprint = null);
    string ComputeFingerprint(ScoringInput input);
}

public interface IDocumentVerificationService
{
    DocumentVerificationResult Verify(DocumentVerificationRequest request);
}
