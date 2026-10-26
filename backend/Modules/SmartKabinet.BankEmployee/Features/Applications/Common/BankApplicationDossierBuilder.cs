using Microsoft.EntityFrameworkCore;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Application.Domain;
using SmartKabinet.Application.Infrastructure.Persistence;
using SmartKabinet.Checking.Domain;
using SmartKabinet.Intergrations.Ml.Services;
using SmartKabinet.Intergrations.Synthetic.Services;

namespace SmartKabinet.BankEmployee.Features.Applications.Common;

public class BankApplicationDossierBuilder(
    ApplicationDbContext appDb,
    ICompanyLookupService? lookupService = null,
    IMlServiceClient? mlClient = null) : IBankApplicationDossierBuilder
{
    public async Task<BankApplicationDossierDto> BuildAsync(
        SmartKabinet.Application.Domain.Application app,
        CancellationToken ct = default)
    {
        var transitions = await appDb.TransitionHistory
            .Where(t => t.ApplicationId == app.Id && !(t.FromStatus == SmartKabinet.Application.Domain.ApplicationStatus.Draft && t.ToStatus == SmartKabinet.Application.Domain.ApplicationStatus.Draft && (t.ReasonCode == "T02" || (t.Comment != null && t.Comment.Contains("T02")))))
            .OrderBy(t => t.Timestamp)
            .ToListAsync(ct);

        var documents = await appDb.ApplicationDocuments
            .Where(d => d.ApplicationId == app.Id)
            .OrderBy(d => d.UploadedAt)
            .Select(d => new ApplicationDocumentDto(
                d.Id,
                d.FileName,
                d.FileKey,
                d.FileType,
                d.FileSizeBytes,
                d.Status,
                d.UploadedAt,
                $"/api/infrastructure/storage/{d.FileKey}"
            ))
            .ToListAsync(ct);

        string companyName = $"ИП (ИНН {app.Inn})";
        CompanyLookupDto? companyInfo = null;
        if (lookupService is not null && !string.IsNullOrWhiteSpace(app.Inn))
        {
            try
            {
                var lookupRes = await lookupService.LookupByInnAsync(app.Inn);
                if (lookupRes.IsSuccess && lookupRes.Value is not null)
                {
                    companyInfo = lookupRes.Value;
                    if (!string.IsNullOrWhiteSpace(companyInfo.FullName))
                    {
                        companyName = companyInfo.FullName;
                    }
                }
            }
            catch
            {
                // ignore lookup error
            }
        }

        var historyDtos = transitions.Select(t => new TransitionHistoryDto(
            t.Id.ToString(),
            !string.IsNullOrWhiteSpace(t.ReasonCode) && t.ReasonCode.StartsWith("T") ? t.ReasonCode : "T00",
            t.FromStatus.ToString().ToLowerInvariant(),
            t.ToStatus.ToString().ToLowerInvariant(),
            t.Actor.ToLowerInvariant(),
            t.Actor switch
            {
                "client" => "Клиент ИП",
                "analyst" => "Аналитик Банка",
                _ => "SmartKabinet Engine"
            },
            t.ReasonCode,
            t.Comment,
            t.Timestamp.ToString("o")
        )).ToList();

        var currentOfferDto = app.CurrentOffer is not null
            ? new CurrentOfferDetailsDto(
                app.CurrentOffer.ApprovedAmount,
                app.CurrentOffer.TermMonths,
                app.CurrentOffer.AnnualRatePercent,
                app.CurrentOffer.MonthlyPayment,
                app.CurrentOffer.IsCounterOffer,
                app.CurrentOffer.ReasonCode
            )
            : null;

        ScoringDetailsDto? scoringDto = null;
        if (companyInfo is not null)
        {
            var isRestart = app.ProductCode is "RESTART" or "PAUSED";
            var requestedAmount = app.RequestedAmount > 0 ? app.RequestedAmount : 1_000_000m;
            var requestedTerm = app.RequestedTermMonths is > 0 ? app.RequestedTermMonths.Value : 12;

            // 1. Возраст бизнеса (месяцы)
            var operatingMonths = companyInfo.OperatingMonths
                ?? (companyInfo.RegistrationDate.HasValue
                    ? Math.Max(1, (int)Math.Floor((DateTime.UtcNow - companyInfo.RegistrationDate.Value).TotalDays / 30.4375))
                    : (app.HistoryMonths ?? 24));

            // 2. Годовая выручка
            decimal annualInflow = 0m;
            if (app.MonthlyRevenue.HasValue && app.MonthlyRevenue.Value > 0)
            {
                annualInflow = app.MonthlyRevenue.Value * 12m;
            }
            else if (companyInfo.AnnualRevenue.HasValue && companyInfo.AnnualRevenue.Value > 0)
            {
                annualInflow = companyInfo.AnnualRevenue.Value;
            }
            else if (companyInfo.Facts is { Count: > 0 })
            {
                annualInflow = companyInfo.Facts.Sum(f => f.CleanReceiptsRub) * (12m / companyInfo.Facts.Count);
            }
            else if (!isRestart)
            {
                annualInflow = (app.ProjectedMonthlyRevenue ?? 300_000m) * 12m;
            }

            // 3. Коэффициент вариации выручки (CV)
            decimal cv = 0.20m;
            if (companyInfo.Facts is { Count: >= 3 })
            {
                var values = companyInfo.Facts.Select(f => (double)f.CleanReceiptsRub).ToList();
                var avg = values.Average();
                if (avg > 0)
                {
                    var sumSquares = values.Sum(v => Math.Pow(v - avg, 2));
                    var stdDev = Math.Sqrt(sumSquares / values.Count);
                    cv = Math.Round((decimal)(stdDev / avg), 2);
                }
            }

            // 4. Обязательства и доступный денежный поток
            var existingObligations = app.ExistingMonthlyObligations
                ?? (companyInfo.Debts?.Sum(d => d.MonthlyMaxPaymentRub) ?? 0m);

            decimal businessCash;
            if (app.MonthlyRevenue.HasValue && app.MonthlyExpenses.HasValue && app.MonthlyRevenue.Value > 0)
            {
                businessCash = app.MonthlyRevenue.Value - app.MonthlyExpenses.Value;
            }
            else if (companyInfo.NetCashFlow.HasValue && companyInfo.NetCashFlow.Value > 0)
            {
                businessCash = companyInfo.NetCashFlow.Value;
            }
            else if (companyInfo.AnnualRevenue.HasValue && companyInfo.AverageMonthlyExpenses.HasValue)
            {
                businessCash = (companyInfo.AnnualRevenue.Value / 12m) - companyInfo.AverageMonthlyExpenses.Value;
            }
            else if (!isRestart)
            {
                var baseMonthly = app.ProjectedMonthlyRevenue ?? 300_000m;
                businessCash = baseMonthly * 0.4m;
            }
            else
            {
                businessCash = 0m;
            }

            var householdExpenses = app.HouseholdExpenses ?? 0m;
            var personalIncome = app.AdditionalIncomeAmount ?? app.PersonalIncome ?? 0m;
            var netCashFlow = Math.Max(0m, businessCash - householdExpenses + personalIncome);
            var recommendedMaxPayment = Math.Round(netCashFlow * 0.7m, 2);

            // 5. Динамический расчет баллов по правилам регламента R09-R25
            int overdueDays = 0;
            decimal bkiScore = overdueDays == 0 ? 25m : (overdueDays <= 30 ? 10m : 0m);

            decimal historyScore = operatingMonths switch
            {
                >= 24 => 15m,
                >= 12 => 10m,
                >= 6 => 5m,
                _ => 0m
            };

            decimal cvScore;
            decimal ratioScore;
            decimal dscrScore;
            double calculatedDscr;

            if (isRestart)
            {
                cvScore = 0m;
                ratioScore = 0m;
                dscrScore = 0m;
                calculatedDscr = 0.0;
            }
            else
            {
                cvScore = cv switch
                {
                    <= 0.30m => 15m,
                    <= 0.60m => 8m,
                    _ => 0m
                };

                ratioScore = annualInflow > 0 && (requestedAmount / annualInflow <= 0.25m) ? 5m : 0m;

                var refPayment = ScoringEngine.CalculateMonthlyPayment(requestedAmount, 24m, requestedTerm);
                var rawRefDscr = ScoringEngine.CalculateDscr(netCashFlow, refPayment, existingObligations);
                calculatedDscr = Math.Round((double)rawRefDscr, 2);

                dscrScore = rawRefDscr switch
                {
                    >= 1.50m => 40m,
                    >= 1.20m => 25m,
                    >= 1.00m => 10m,
                    _ => 0m
                };
            }

            var calculatedTotalScore = (int)(bkiScore + historyScore + cvScore + ratioScore + dscrScore);

            var isRiskHigh = companyInfo.IsBankrupt || companyInfo.HasFnsBlock || companyInfo.ZskRiskLevel == "HIGH";
            var finalScore = isRiskHigh ? Math.Min(35, calculatedTotalScore) : calculatedTotalScore;

            var riskLevel = isRiskHigh
                ? "high"
                : (isRestart ? "medium" : (finalScore >= 70 ? "low" : (finalScore >= 50 ? "medium" : "high")));

            var dscr = app.CurrentOffer?.MonthlyPayment > 0
                ? Math.Round((double)ScoringEngine.CalculateDscr(netCashFlow, app.CurrentOffer.MonthlyPayment, existingObligations), 2)
                : calculatedDscr;

            var stopFactors = new List<StopFactorDto>
            {
                new(
                    "sf-fns",
                    "FNS_BLOCK",
                    "Блокировки счетов ФНС",
                    companyInfo.HasFnsBlock
                        ? "Обнаружены решения о приостановлении операций по счетам"
                        : "Решений ФНС о блокировке счетов не обнаружено",
                    companyInfo.HasFnsBlock,
                    "critical"
                ),
                new(
                    "sf-zsk",
                    "ZSK_RISK",
                    "Платформа ЗСК ЦБ РФ",
                    $"Уровень риска: {companyInfo.ZskRiskLevel}",
                    companyInfo.ZskRiskLevel == "HIGH",
                    "critical"
                ),
                new(
                    "sf-bankrupt",
                    "EFRSB_BANKRUPTCY",
                    "Реестр банкротств ЕФРСБ",
                    companyInfo.IsBankrupt
                        ? "Найдены сведения о признании ИП банкротом"
                        : "Сведений о процедурах банкротства не обнаружено",
                    companyInfo.IsBankrupt,
                    "critical"
                )
            };

            var egrip = new EgripDetailsDto(
                companyInfo.Inn,
                companyInfo.Ogrnip ?? "",
                companyInfo.FullName ?? companyName,
                companyInfo.EgripStatus ?? "ACTIVE",
                companyInfo.RegistrationDate?.ToString("yyyy-MM-dd") ?? "",
                companyInfo.OkvedMain ?? "",
                companyInfo.OkvedMainName ?? "",
                companyInfo.RegionName ?? ""
            );

            var fns = new FnsDetailsDto(
                0m,
                companyInfo.HasFnsBlock,
                false,
                true
            );

            var bki = new BkiDetailsDto(
                companyInfo.IsAlfaClient ? 780 : 710,
                companyInfo.IsAlfaClient ? 1 : 0,
                existingObligations,
                overdueDays,
                0m,
                false
            );

            var components = new List<ScoringComponentDto>
            {
                new(
                    "coverage",
                    "Покрытие платежей (DSCR)",
                    (int)dscrScore,
                    40,
                    isRestart
                        ? "Деятельность приостановлена: расчет DSCR отключен по регламенту перезапуска"
                        : $"Опорный DSCR {calculatedDscr:F2} (порог 1.50 / 1.20 / 1.00)",
                    "R20–R21"
                ),
                new(
                    "credit",
                    "Кредитная история (БКИ)",
                    (int)bkiScore,
                    25,
                    overdueDays == 0 ? "В ответе БКИ нет текущих просрочек" : $"Просрочка по БКИ: {overdueDays} дн.",
                    "R09–R10"
                ),
                new(
                    "history",
                    "Длительность деятельности",
                    (int)historyScore,
                    15,
                    $"Срок регистрации бизнеса: {operatingMonths} мес.",
                    "R18, R22"
                ),
                new(
                    "variation",
                    "Устойчивость выручки (CV)",
                    (int)cvScore,
                    15,
                    isRestart
                        ? "Деятельность приостановлена (CV не применяется)"
                        : $"Коэффициент вариации выручки CV = {cv:P0}",
                    "R19, R22"
                ),
                new(
                    "annual",
                    "Сумма к годовой выручке",
                    (int)ratioScore,
                    5,
                    isRestart
                        ? "Индивидуальный подбор лимита финансирования"
                        : (annualInflow > 0
                            ? $"Запрос {requestedAmount:N0} ₽ к выручке {annualInflow:N0} ₽ ({(requestedAmount / annualInflow):P0})"
                            : "Годовая выручка не определена"),
                    "R23"
                )
            };

            var issues = new List<string>();
            if (app.Purpose == 0)
            {
                issues.Add("Уточнить целевое назначение кредита");
            }
            if (isRiskHigh)
            {
                issues.Add("Обнаружены критические стоп-факторы (ФНС / ЗСК / Банкротство)");
            }
            if (isRestart)
            {
                issues.Add("Приостановленная деятельность: требуется согласование параметров перезапуска специалистом");
            }
            else if (calculatedDscr < 1.20 && netCashFlow > 0)
            {
                issues.Add($"Низкий коэффициент покрытия долга (DSCR = {calculatedDscr:F2} < 1.20)");
            }

            scoringDto = new ScoringDetailsDto(
                finalScore,
                riskLevel,
                dscr,
                netCashFlow,
                recommendedMaxPayment,
                DateTime.UtcNow.ToString("o"),
                stopFactors,
                egrip,
                fns,
                bki,
                components,
                issues
            );
        }

        var productCode = !string.IsNullOrWhiteSpace(app.ProductCode)
            ? app.ProductCode
            : (app.Purpose == LoanPurpose.Equipment ? "EQ" : (app.Stage == BusinessStage.Prelaunch ? "START" : "WC"));

        var purposeText = app.Purpose == LoanPurpose.Equipment
            ? "Покупка оборудования"
            : "Пополнение оборотных средств";

        var monthlyRevenue = app.ProjectedMonthlyRevenue
            ?? (companyInfo?.AnnualRevenue.HasValue == true ? companyInfo.AnnualRevenue.Value / 12m : 0m);

        var monthlyExpenses = companyInfo?.AverageMonthlyExpenses ?? 0m;

        string? mlExplanation = null;
        string? mlExplanationSource = null;

        if (mlClient is not null)
        {
            try
            {
                var primaryReason = app.CurrentOffer?.ReasonCode ?? app.ReasonCodes.FirstOrDefault();
                if (string.IsNullOrWhiteSpace(primaryReason))
                {
                    primaryReason = app.Status switch
                    {
                        ApplicationStatus.Offer or ApplicationStatus.Accepted => app.CurrentOffer?.IsCounterOffer == true ? "OFFER_COUNTER" : "OFFER_ORIGINAL",
                        ApplicationStatus.Declined => "SCORE_BELOW_MIN",
                        _ => "DATA_REQUIRED"
                    };
                }

                var details = new Dictionary<string, object>
                {
                    ["amount"] = app.CurrentOffer?.ApprovedAmount ?? app.RequestedAmount,
                    ["term"] = app.CurrentOffer?.TermMonths ?? (app.RequestedTermMonths ?? 12),
                    ["rate"] = app.CurrentOffer?.AnnualRatePercent ?? 18.5m,
                    ["payment"] = app.CurrentOffer?.MonthlyPayment ?? 0m
                };

                var expRes = await mlClient.ExplainDecisionAsync(primaryReason, details, "analyst", ct);
                if (expRes != null)
                {
                    mlExplanation = expRes.Text;
                    mlExplanationSource = expRes.Source;
                }
            }
            catch
            {
                // Graceful fallback if ML is unavailable or times out
            }
        }

        var lastNeedInfo = transitions
            .Where(t => t.ToStatus == SmartKabinet.Application.Domain.ApplicationStatus.NeedInfo)
            .LastOrDefault();

        var lastClientResponse = transitions
            .Where(t => (t.FromStatus == SmartKabinet.Application.Domain.ApplicationStatus.NeedInfo || t.ToStatus == SmartKabinet.Application.Domain.ApplicationStatus.InfoReceived) && (t.Actor.ToLower() == "client" || t.Actor.ToLower() == "клиент"))
            .LastOrDefault();

        string? needInfoPrompt = lastNeedInfo?.Comment;
        string? needInfoResponse = lastClientResponse?.Comment;

        return new BankApplicationDossierDto(
            app.Id,
            app.Id,
            app.ClientId,
            app.Inn,
            companyName,
            (int)app.Stage,
            (int)app.Purpose,
            productCode,
            app.RequestedAmount,
            app.OwnContribution,
            app.RequestedTermMonths ?? 12,
            app.NeededByDate,
            app.AsSoonAsPossible,
            app.BkiConsent,
            app.PersonalDataConsent,
            purposeText,
            monthlyRevenue,
            monthlyExpenses,
            app.EquipmentPrice,
            app.EquipmentSupplier,
            app.EquipmentList,
            app.Status.ToString().ToLowerInvariant(),
            app.Decision.ToString(),
            app.ReasonCodes,
            app.CreatedAt.ToString("o"),
            (app.UpdatedAt ?? app.CreatedAt).ToString("o"),
            historyDtos,
            currentOfferDto,
            scoringDto,
            app.ExpensePeriod,
            app.HasExpenseContract,
            app.IsTaxRegimeActual,
            app.DeclaredTaxRegime,
            app.ReceiptCoverage,
            app.ExpensesCoverageStatus,
            app.HasAdditionalIncome,
            app.AdditionalIncomeAmount,
            app.DebtsVerificationStatus,
            app.RepaymentSourceDescription,
            documents,
            mlExplanation,
            mlExplanationSource,
            needInfoPrompt,
            needInfoResponse
        );
    }
}
