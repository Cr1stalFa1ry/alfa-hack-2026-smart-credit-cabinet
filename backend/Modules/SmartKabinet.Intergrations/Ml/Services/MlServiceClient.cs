using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SmartKabinet.Intergrations.Ml.Models;

namespace SmartKabinet.Intergrations.Ml.Services;

public class MlServiceClient : IMlServiceClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<MlServiceClient> _logger;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private static readonly Dictionary<string, string> FallbackExplanations = new(StringComparer.OrdinalIgnoreCase)
    {
        ["OVERDUE_GT_30"] = "В вашей кредитной истории зафиксирована просроченная задолженность свыше 30 дней. Повторная подача заявки станет доступна после её полного погашения.",
        ["DSCR_LOW"] = "Размер ежемесячного платежа превышает безопасный уровень относительно чистого дохода бизнеса. Рекомендуем увеличить срок кредитования или уменьшить сумму.",
        ["NEED_STATEMENT"] = "Для продолжения рассмотрения заявки требуется выписка по расчетному счету минимум за 3 месяца или ручной ввод показателей.",
        ["PRODUCT_NA_AMOUNT"] = "Для вашего этапа бизнеса лимит по данной программе кредитования составляет до 500 000 ₽. Скорректируйте запрашиваемую сумму.",
        ["CONTRIBUTION_LOW"] = "Минимальный первоначальный взнос за оборудование составляет 20%. Увеличьте долю собственных средств.",
        ["SOURCE_UNAVAILABLE"] = "Внешний государственный источник временно не ответил на запрос. Это не является отказом — повторите проверку через несколько минут.",
        ["IP_NOT_FOUND"] = "Сведения об индивидуальном предпринимателе с указанным ИНН не найдены в государственных реестрах.",
        ["TAX_DEBT"] = "Обнаружена задолженность по налогам и сборам, превышающая допустимый лимит.",
        ["INACTIVE_IP"] = "По данным ЕГРИП статус индивидуального предпринимателя не является действующим.",
        ["LOW_SCORE"] = "Кредитный рейтинг по совокупности факторов бизнеса недостаточен для одобрения на текущих условиях."
    };

    public MlServiceClient(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<MlServiceClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;

        var baseUrl = configuration["MlService:BaseUrl"] ?? "http://localhost:8000";
        if (!baseUrl.EndsWith('/')) baseUrl += "/";
        _httpClient.BaseAddress = new Uri(baseUrl);

        var timeoutSec = configuration.GetValue<int?>("MlService:TimeoutSeconds") ?? 30;
        _httpClient.Timeout = TimeSpan.FromSeconds(timeoutSec);
    }

    public async Task<StatementAnalysisResult> AnalyzeStatementAsync(
        Stream fileStream,
        string fileName,
        string? asOf = null,
        string? ownerName = null,
        CancellationToken ct = default)
    {
        try
        {
            using var content = new MultipartFormDataContent();
            var fileContent = new StreamContent(fileStream);
            fileContent.Headers.ContentType = new MediaTypeHeaderValue(
                fileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase)
                    ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    : "text/csv");

            content.Add(fileContent, "file", fileName);

            if (!string.IsNullOrWhiteSpace(asOf))
            {
                content.Add(new StringContent(asOf), "as_of");
            }

            if (!string.IsNullOrWhiteSpace(ownerName))
            {
                content.Add(new StringContent(ownerName), "owner_name");
            }

            _logger.LogInformation("Отправка выписки {FileName} в ML сервис ({BaseAddress}v1/statement/analyze)", 
                fileName, _httpClient.BaseAddress);

            var response = await _httpClient.PostAsync("v1/statement/analyze", content, ct);
            var responseJson = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("ML сервис вернул код {StatusCode}: {Response}", response.StatusCode, responseJson);
                return new StatementAnalysisResult(
                    Status: "manual_input_required",
                    Reason: "ML_ERROR",
                    Metrics: null,
                    Message: "Ошибка сервиса анализа выписок. Введите показатели вручную.");
            }

            using var doc = JsonDocument.Parse(responseJson);
            var root = doc.RootElement;

            var status = root.TryGetProperty("status", out var s) ? s.GetString() ?? "ok" : "ok";
            var reason = root.TryGetProperty("reason", out var r) ? r.GetString() : null;
            var message = root.TryGetProperty("message", out var m) ? m.GetString() : null;

            if (status.Equals("manual_input_required", StringComparison.OrdinalIgnoreCase))
            {
                return new StatementAnalysisResult(status, reason, null, message ?? "Требуется ручной ввод показателей");
            }

            // Извлекаем метрики либо из root, либо из свойства "data"
            var targetEl = root.TryGetProperty("data", out var d) && d.ValueKind == JsonValueKind.Object ? d : root;

            var metrics = new StatementMetrics(
                AvgMonthlyRevenueRub: GetDecimal(targetEl, "avgMonthlyRevenueRub", "avg_monthly_revenue_rub"),
                AvgMonthlyExpensesRub: GetDecimal(targetEl, "avgMonthlyExpensesRub", "avg_monthly_expenses_rub"),
                AvgMonthlyNetRub: GetDecimal(targetEl, "avgMonthlyNetRub", "avg_monthly_net_rub"),
                AvgMonthlyLoanPaymentsRub: GetDecimal(targetEl, "avgMonthlyLoanPaymentsRub", "avg_monthly_loan_payments_rub"),
                RevenueCv: GetDecimal(targetEl, "revenueCV", "revenue_cv", "revenueCv"),
                MonthsCount: GetInt(targetEl, "monthsCount", "months_count"),
                AnnualRevenueRub: GetDecimal(targetEl, "annualRevenueRub", "annual_revenue_rub")
            );

            return new StatementAnalysisResult("ok", null, metrics, message ?? "Выписка успешно обработана");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "ML сервис недоступен при анализе выписки: {Message}", ex.Message);
            return new StatementAnalysisResult(
                Status: "manual_input_required",
                Reason: "SERVICE_UNAVAILABLE",
                Metrics: null,
                Message: "ML сервис временно недоступен. Пожалуйста, введите финансовые показатели вручную.");
        }
    }

    public async Task<ExplainDecisionResponse> ExplainDecisionAsync(
        string reasonCode,
        Dictionary<string, object>? details = null,
        string? actor = null,
        CancellationToken ct = default)
    {
        var fallbackText = FallbackExplanations.TryGetValue(reasonCode, out var fb)
            ? fb
            : $"Решение принято по бизнес-правилу: {reasonCode}";

        try
        {
            var payload = new
            {
                reason_code = reasonCode,
                reasonCode = reasonCode,
                details = details ?? new Dictionary<string, object>(),
                actor = actor ?? "client"
            };

            var response = await _httpClient.PostAsJsonAsync("v1/explain", payload, ct);
            if (response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(ct);
                using var doc = JsonDocument.Parse(body);
                var root = doc.RootElement;

                string? text = null;
                if (root.TryGetProperty("text", out var tEl)) text = tEl.GetString();
                else if (root.TryGetProperty("explanation", out var eEl)) text = eEl.GetString();

                if (!string.IsNullOrWhiteSpace(text))
                {
                    return new ExplainDecisionResponse(true, text, "ml");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Не удалось получить объяснение от ML ({Message}), используется локальный фоллбэк.", ex.Message);
        }

        return new ExplainDecisionResponse(true, fallbackText, "fallback");
    }

    public async Task<bool> HealthCheckAsync(CancellationToken ct = default)
    {
        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromSeconds(3));
            var response = await _httpClient.GetAsync("health", cts.Token);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    private static decimal GetDecimal(JsonElement el, params string[] names)
    {
        foreach (var name in names)
        {
            if (el.TryGetProperty(name, out var val))
            {
                if (val.ValueKind == JsonValueKind.Number && val.TryGetDecimal(out var d)) return d;
                if (val.ValueKind == JsonValueKind.String && decimal.TryParse(val.GetString(), out var parsed)) return parsed;
            }
        }
        return 0m;
    }

    private static int GetInt(JsonElement el, params string[] names)
    {
        foreach (var name in names)
        {
            if (el.TryGetProperty(name, out var val))
            {
                if (val.ValueKind == JsonValueKind.Number && val.TryGetInt32(out var i)) return i;
                if (val.ValueKind == JsonValueKind.String && int.TryParse(val.GetString(), out var parsed)) return parsed;
            }
        }
        return 0;
    }
}
