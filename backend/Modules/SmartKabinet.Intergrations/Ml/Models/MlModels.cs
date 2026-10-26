namespace SmartKabinet.Intergrations.Ml.Models;

public record StatementMetrics(
    decimal AvgMonthlyRevenueRub,
    decimal AvgMonthlyExpensesRub,
    decimal AvgMonthlyNetRub,
    decimal AvgMonthlyLoanPaymentsRub,
    decimal RevenueCv,
    int MonthsCount,
    decimal AnnualRevenueRub
);

public record StatementAnalysisResult(
    string Status, // "ok", "manual_input_required", "error"
    string? Reason, // "EMPTY_FILE", "UNREADABLE", "SHORT_HISTORY", "TOO_MANY_UNCLEAR", "SERVICE_UNAVAILABLE"
    StatementMetrics? Metrics,
    string? Message = null
);

public record ExplainDecisionRequest(
    string ReasonCode,
    Dictionary<string, object>? Details = null,
    string? Actor = null
);

public record ExplainDecisionResponse(
    bool Success,
    string Text,
    string? Source = null // "ml" or "fallback"
);

public record InvoiceLineItemDto(
    string? Description,
    decimal? Quantity,
    string? Unit,
    decimal? UnitPriceRub,
    decimal? AmountRub,
    int? Page = null,
    string? Quote = null
);

public record DocumentIssueDto(
    string Code,
    string Message,
    int? Page = null,
    string? Field = null
);

public record DocumentReadResult(
    string DocumentType, // "INVOICE", "COMMERCIAL_OFFER", "BANK_STATEMENT", "UNKNOWN"
    string Status, // "EXTRACTED", "PARTIAL", "NEEDS_REVIEW", "FAILED"
    bool NeedsReview,
    string? SupplierInn = null,
    string? SupplierName = null,
    string? BuyerInn = null,
    string? BuyerName = null,
    decimal? TotalAmountRub = null,
    string? DocumentNumber = null,
    string? DocumentDate = null,
    IReadOnlyList<InvoiceLineItemDto>? LineItems = null,
    IReadOnlyList<DocumentIssueDto>? Issues = null,
    string? Sha256 = null,
    string? ErrorMessage = null
);

public record InvoiceVerificationResult(
    bool IsMatched,
    bool NeedsReview,
    decimal? ExpectedEquipmentPrice,
    decimal? InvoiceTotalAmount,
    string? ExpectedBuyerInn,
    string? InvoiceBuyerInn,
    string? ExpectedSupplierInn,
    string? InvoiceSupplierInn,
    IReadOnlyList<string> Discrepancies,
    DocumentReadResult DocumentRead
);
