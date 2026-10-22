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
