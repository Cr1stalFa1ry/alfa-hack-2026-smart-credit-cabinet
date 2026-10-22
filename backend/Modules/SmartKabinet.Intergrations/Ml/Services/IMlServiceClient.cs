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

    Task<bool> HealthCheckAsync(CancellationToken ct = default);
}
