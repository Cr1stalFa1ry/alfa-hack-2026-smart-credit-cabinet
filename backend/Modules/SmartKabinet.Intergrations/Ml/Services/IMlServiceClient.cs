using SmartKabinet.Intergrations.Ml.Models;

namespace SmartKabinet.Intergrations.Ml.Services;

public interface IMlServiceClient
{
    Task<StatementAnalysisResult> AnalyzeStatementAsync(
        Stream fileStream,
        string fileName,
        string? asOf = null,
        string? ownerName = null,
        CancellationToken ct = default);

    Task<ExplainDecisionResponse> ExplainDecisionAsync(
        string reasonCode,
        Dictionary<string, object>? details = null,
        string? actor = null,
        CancellationToken ct = default);

    Task<DocumentReadResult> ReadDocumentAsync(
        Stream fileStream,
        string fileName,
        string? documentId = null,
        string? documentVersion = null,
        string? expectedSha256 = null,
        string? asOf = null,
        string? ownerName = null,
        bool useLlm = true,
        CancellationToken ct = default);

    InvoiceVerificationResult VerifyInvoiceAgainstApplication(
        DocumentReadResult doc,
        decimal? expectedEquipmentPrice,
        string expectedBuyerInn,
        string? expectedSupplierInn = null);

    Task<bool> HealthCheckAsync(CancellationToken ct = default);
}
