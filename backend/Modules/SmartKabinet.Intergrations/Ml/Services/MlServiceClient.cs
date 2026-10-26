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
        ["LOW_SCORE"] = "Кредитный рейтинг по совокупности факторов бизнеса недостаточен для одобрения на текущих условиях.",
        ["NO_FEASIBLE_TERMS"] = "К сожалению, мы не смогли подобрать условия кредитования, удовлетворяющие нормативам долговой нагрузки."
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
            var reasonCode = root.TryGetProperty("reason", out var r) 
                ? (r.ValueKind == JsonValueKind.Object && r.TryGetProperty("code", out var rc) ? rc.GetString() : r.GetString())
                : null;
            var message = root.TryGetProperty("message", out var m) 
                ? m.GetString() 
                : (root.TryGetProperty("reason", out var rm) && rm.ValueKind == JsonValueKind.Object && rm.TryGetProperty("message", out var rmsg) ? rmsg.GetString() : null);

            if (status.Equals("manual_input_required", StringComparison.OrdinalIgnoreCase))
            {
                return new StatementAnalysisResult(status, reasonCode, null, message ?? "Требуется ручной ввод показателей");
            }

            // Извлекаем блок метрик: metrics -> data -> root
            var targetEl = root.TryGetProperty("metrics", out var met) && met.ValueKind == JsonValueKind.Object 
                ? met 
                : (root.TryGetProperty("data", out var d) && d.ValueKind == JsonValueKind.Object ? d : root);

            // Количество месяцев из периода или metrics
            var monthsCount = GetInt(targetEl, "monthsCount", "months_count");
            if (monthsCount == 0 && root.TryGetProperty("period", out var pEl) && pEl.TryGetProperty("months", out var pMonths))
            {
                monthsCount = pMonths.GetInt32();
            }

            var metrics = new StatementMetrics(
                AvgMonthlyRevenueRub: GetDecimal(targetEl, "avgMonthlyRevenueRub", "avg_monthly_revenue_rub"),
                AvgMonthlyExpensesRub: GetDecimal(targetEl, "avgMonthlyExpensesRub", "avg_monthly_expenses_rub"),
                AvgMonthlyNetRub: GetDecimal(targetEl, "avgMonthlyNetRub", "avg_monthly_net_rub"),
                AvgMonthlyLoanPaymentsRub: GetDecimal(targetEl, "avgMonthlyLoanPaymentsRub", "avg_monthly_loan_payments_rub"),
                RevenueCv: GetDecimal(targetEl, "revenueCV", "revenue_cv", "revenueCv"),
                MonthsCount: monthsCount,
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
                reason_codes = new[] { reasonCode },
                context = details ?? new Dictionary<string, object>(),
                use_llm = true
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

    public async Task<DocumentReadResult> ReadDocumentAsync(
        Stream fileStream,
        string fileName,
        string? documentId = null,
        string? documentVersion = null,
        string? expectedSha256 = null,
        string? asOf = null,
        string? ownerName = null,
        bool useLlm = true,
        CancellationToken ct = default)
    {
        try
        {
            using var content = new MultipartFormDataContent();
            var fileContent = new StreamContent(fileStream);
            var mimeType = fileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase)
                ? "application/pdf"
                : (fileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase)
                    ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    : (fileName.EndsWith(".png", StringComparison.OrdinalIgnoreCase)
                        ? "image/png"
                        : (fileName.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase) || fileName.EndsWith(".jpeg", StringComparison.OrdinalIgnoreCase)
                            ? "image/jpeg"
                            : "application/octet-stream")));
            fileContent.Headers.ContentType = new MediaTypeHeaderValue(mimeType);
            content.Add(fileContent, "file", fileName);

            if (!string.IsNullOrWhiteSpace(documentId)) content.Add(new StringContent(documentId), "document_id");
            if (!string.IsNullOrWhiteSpace(documentVersion)) content.Add(new StringContent(documentVersion), "document_version");
            if (!string.IsNullOrWhiteSpace(expectedSha256)) content.Add(new StringContent(expectedSha256), "expected_sha256");
            if (!string.IsNullOrWhiteSpace(asOf)) content.Add(new StringContent(asOf), "as_of");
            if (!string.IsNullOrWhiteSpace(ownerName)) content.Add(new StringContent(ownerName), "owner_name");
            content.Add(new StringContent(useLlm ? "true" : "false"), "use_llm");

            _logger.LogInformation("Отправка документа {FileName} в ML сервис ({BaseAddress}v1/documents/read)",
                fileName, _httpClient.BaseAddress);

            var response = await _httpClient.PostAsync("v1/documents/read", content, ct);
            var responseJson = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("ML сервис вернул код {StatusCode}: {Response}", response.StatusCode, responseJson);
                return new DocumentReadResult(
                    DocumentType: "UNKNOWN",
                    Status: "FAILED",
                    NeedsReview: true,
                    ErrorMessage: $"Ошибка ML сервиса: {response.StatusCode}"
                );
            }

            using var doc = JsonDocument.Parse(responseJson);
            var root = doc.RootElement;

            var documentType = root.TryGetProperty("document_type", out var dt) ? dt.GetString() ?? "UNKNOWN" : "UNKNOWN";
            var status = root.TryGetProperty("status", out var st) ? st.GetString() ?? "FAILED" : "FAILED";
            var needsReview = root.TryGetProperty("needs_review", out var nr) && nr.GetBoolean();

            string? sha256 = null;
            if (root.TryGetProperty("file", out var fileEl) && fileEl.TryGetProperty("sha256", out var shaEl))
            {
                sha256 = shaEl.GetString();
            }

            string? supplierInn = null;
            string? supplierName = null;
            string? buyerInn = null;
            string? buyerName = null;
            decimal? totalAmountRub = null;
            string? documentNumber = null;
            string? documentDate = null;

            if (root.TryGetProperty("fields", out var fieldsEl) && fieldsEl.ValueKind == JsonValueKind.Object)
            {
                supplierInn = GetFieldValueString(fieldsEl, "supplier_inn");
                supplierName = GetFieldValueString(fieldsEl, "supplier_name");
                buyerInn = GetFieldValueString(fieldsEl, "buyer_inn");
                buyerName = GetFieldValueString(fieldsEl, "buyer_name");
                documentNumber = GetFieldValueString(fieldsEl, "document_number");
                documentDate = GetFieldValueString(fieldsEl, "document_date");
                totalAmountRub = GetFieldValueDecimal(fieldsEl, "total_amount_rub");
            }

            var lineItems = new List<InvoiceLineItemDto>();
            if (root.TryGetProperty("line_items", out var linesEl) && linesEl.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in linesEl.EnumerateArray())
                {
                    lineItems.Add(new InvoiceLineItemDto(
                        Description: item.TryGetProperty("description", out var d) ? d.GetString() : null,
                        Quantity: item.TryGetProperty("quantity", out var q) && q.TryGetDecimal(out var qVal) ? qVal : null,
                        Unit: item.TryGetProperty("unit", out var u) ? u.GetString() : null,
                        UnitPriceRub: item.TryGetProperty("unit_price_rub", out var up) && up.TryGetDecimal(out var upVal) ? upVal : null,
                        AmountRub: item.TryGetProperty("amount_rub", out var a) && a.TryGetDecimal(out var aVal) ? aVal : null,
                        Page: item.TryGetProperty("page", out var pg) && pg.TryGetInt32(out var pgVal) ? pgVal : null,
                        Quote: item.TryGetProperty("quote", out var qu) ? qu.GetString() : null
                    ));
                }
            }

            var issues = new List<DocumentIssueDto>();
            if (root.TryGetProperty("issues", out var issuesEl) && issuesEl.ValueKind == JsonValueKind.Array)
            {
                foreach (var issue in issuesEl.EnumerateArray())
                {
                    var code = issue.TryGetProperty("code", out var c) ? c.GetString() ?? "UNKNOWN_ISSUE" : "UNKNOWN_ISSUE";
                    var msg = issue.TryGetProperty("message", out var m) ? m.GetString() ?? "" : "";
                    var page = issue.TryGetProperty("page", out var ipg) && ipg.TryGetInt32(out var pVal) ? pVal : (int?)null;
                    var field = issue.TryGetProperty("field", out var f) ? f.GetString() : null;
                    issues.Add(new DocumentIssueDto(code, msg, page, field));
                }
            }

            return new DocumentReadResult(
                DocumentType: documentType,
                Status: status,
                NeedsReview: needsReview || issues.Count > 0,
                SupplierInn: supplierInn,
                SupplierName: supplierName,
                BuyerInn: buyerInn,
                BuyerName: buyerName,
                TotalAmountRub: totalAmountRub,
                DocumentNumber: documentNumber,
                DocumentDate: documentDate,
                LineItems: lineItems,
                Issues: issues,
                Sha256: sha256
            );
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "ML сервис недоступен при чтении документа: {Message}", ex.Message);
            return new DocumentReadResult(
                DocumentType: "UNKNOWN",
                Status: "FAILED",
                NeedsReview: true,
                ErrorMessage: $"ML сервис временно недоступен: {ex.Message}"
            );
        }
    }

    public InvoiceVerificationResult VerifyInvoiceAgainstApplication(
        DocumentReadResult doc,
        decimal? expectedEquipmentPrice,
        string expectedBuyerInn,
        string? expectedSupplierInn = null)
    {
        var discrepancies = new List<string>();

        // 1. Сверка суммы счёта со СТОИМОСТЬЮ ОБОРУДОВАНИЯ (equipment_price), а не с суммой кредита!
        if (expectedEquipmentPrice.HasValue && expectedEquipmentPrice.Value > 0)
        {
            if (!doc.TotalAmountRub.HasValue)
            {
                discrepancies.Add("AMOUNT_MISSING: В счёте не удалось распознать общую сумму к оплате.");
            }
            else if (Math.Abs(doc.TotalAmountRub.Value - expectedEquipmentPrice.Value) > 1.00m)
            {
                discrepancies.Add($"AMOUNT_MISMATCH: Итоговая сумма по счёту ({doc.TotalAmountRub.Value:N2} ₽) не совпадает со стоимостью оборудования в заявке ({expectedEquipmentPrice.Value:N2} ₽).");
            }
        }

        // 2. Сверка покупателя по ИНН
        if (!string.IsNullOrWhiteSpace(expectedBuyerInn))
        {
            if (string.IsNullOrWhiteSpace(doc.BuyerInn))
            {
                discrepancies.Add("BUYER_MISSING: В счёте не найден или не распознан ИНН покупателя.");
            }
            else if (!doc.BuyerInn.Trim().Equals(expectedBuyerInn.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                discrepancies.Add($"BUYER_MISMATCH: ИНН покупателя в счёте ({doc.BuyerInn}) не совпадает с ИНН заявителя ({expectedBuyerInn}).");
            }
        }

        // 3. Сверка поставщика по ИНН (если указан в заявке)
        if (!string.IsNullOrWhiteSpace(expectedSupplierInn) && !string.IsNullOrWhiteSpace(doc.SupplierInn))
        {
            if (!doc.SupplierInn.Trim().Equals(expectedSupplierInn.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                discrepancies.Add($"SUPPLIER_MISMATCH: ИНН поставщика в счёте ({doc.SupplierInn}) отличается от указанного в заявке ({expectedSupplierInn}).");
            }
        }

        var needsReview = doc.NeedsReview 
            || doc.Status != "EXTRACTED" 
            || discrepancies.Count > 0 
            || (doc.Issues != null && doc.Issues.Count > 0);

        var isMatched = discrepancies.Count == 0 && doc.Status == "EXTRACTED" && !doc.NeedsReview;

        return new InvoiceVerificationResult(
            IsMatched: isMatched,
            NeedsReview: needsReview,
            ExpectedEquipmentPrice: expectedEquipmentPrice,
            InvoiceTotalAmount: doc.TotalAmountRub,
            ExpectedBuyerInn: expectedBuyerInn,
            InvoiceBuyerInn: doc.BuyerInn,
            ExpectedSupplierInn: expectedSupplierInn,
            InvoiceSupplierInn: doc.SupplierInn,
            Discrepancies: discrepancies,
            DocumentRead: doc
        );
    }

    private static string? GetFieldValueString(JsonElement fieldsEl, string fieldName)
    {
        if (fieldsEl.TryGetProperty(fieldName, out var fieldObj) && fieldObj.ValueKind == JsonValueKind.Object)
        {
            // По контракту ML: брать value только при status == "ok"
            if (fieldObj.TryGetProperty("status", out var st) && st.GetString() == "ok")
            {
                if (fieldObj.TryGetProperty("value", out var val) && val.ValueKind == JsonValueKind.String)
                {
                    return val.GetString();
                }
            }
        }
        return null;
    }

    private static decimal? GetFieldValueDecimal(JsonElement fieldsEl, string fieldName)
    {
        if (fieldsEl.TryGetProperty(fieldName, out var fieldObj) && fieldObj.ValueKind == JsonValueKind.Object)
        {
            // По контракту ML: брать value только при status == "ok"
            if (fieldObj.TryGetProperty("status", out var st) && st.GetString() == "ok")
            {
                if (fieldObj.TryGetProperty("value", out var val))
                {
                    if (val.ValueKind == JsonValueKind.Number && val.TryGetDecimal(out var d)) return d;
                    if (val.ValueKind == JsonValueKind.String && decimal.TryParse(val.GetString(), System.Globalization.CultureInfo.InvariantCulture, out var parsed)) return parsed;
                }
            }
        }
        return null;
    }

    private static decimal GetDecimal(JsonElement el, params string[] names)
    {
        foreach (var name in names)
        {
            if (el.TryGetProperty(name, out var val))
            {
                if (val.ValueKind == JsonValueKind.Object && val.TryGetProperty("value", out var inner))
                {
                    val = inner;
                }
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
                if (val.ValueKind == JsonValueKind.Object && val.TryGetProperty("value", out var inner))
                {
                    val = inner;
                }
                if (val.ValueKind == JsonValueKind.Number && val.TryGetInt32(out var i)) return i;
                if (val.ValueKind == JsonValueKind.String && int.TryParse(val.GetString(), out var parsed)) return parsed;
            }
        }
        return 0;
    }
}
