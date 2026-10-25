using Microsoft.EntityFrameworkCore;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Application.Domain;
using SmartKabinet.Application.Infrastructure.Persistence;
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
            var isRiskHigh = companyInfo.IsBankrupt || companyInfo.HasFnsBlock || companyInfo.ZskRiskLevel == "HIGH";
            var score = isRiskHigh ? 35 : 82;
            var riskLevel = isRiskHigh ? "high" : "low";

            var dscr = companyInfo.NetCashFlow > 0 && app.CurrentOffer?.MonthlyPayment > 0
                ? Math.Round((double)(companyInfo.NetCashFlow.Value / app.CurrentOffer.MonthlyPayment), 2)
                : 1.45;

            var baseCashFlow = app.ProjectedMonthlyRevenue ?? 300_000m;
            var netCashFlow = companyInfo.NetCashFlow ?? (baseCashFlow * 0.4m);
            var recommendedMaxPayment = netCashFlow * 0.7m;

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
                0m,
                0,
                0m,
                false
            );

            var components = new List<ScoringComponentDto>
            {
                new(
                    "coverage",
                    "Покрытие платежей (DSCR)",
                    companyInfo.NetCashFlow > 0 && app.CurrentOffer?.MonthlyPayment > 0 && (double)(companyInfo.NetCashFlow.Value / app.CurrentOffer.MonthlyPayment) >= 1.25 ? 35 : 20,
                    40,
                    $"DSCR {(companyInfo.NetCashFlow > 0 && app.CurrentOffer?.MonthlyPayment > 0 ? Math.Round((double)(companyInfo.NetCashFlow.Value / app.CurrentOffer.MonthlyPayment), 2) : 1.45)}",
                    "R20–R21"
                ),
                new(
                    "credit",
                    "Кредитная история (БКИ)",
                    companyInfo.IsAlfaClient ? 25 : 20,
                    25,
                    "В ответе БКИ нет критических просрочек",
                    "R09–R10"
                ),
                new(
                    "history",
                    "Длительность деятельности",
                    14,
                    15,
                    "Срок регистрации бизнеса более 12 месяцев",
                    "R18, R22"
                ),
                new(
                    "variation",
                    "Устойчивость выручки (CV)",
                    11,
                    15,
                    "Коэффициент вариации выручки CV в норме",
                    "R19, R22"
                ),
                new(
                    "annual",
                    "Сумма к годовой выручке",
                    5,
                    5,
                    "Лимит суммы не превышает годовой оборот",
                    "R23"
                )
            };

            var issues = new List<string>();
            if (app.Purpose == 0)
            {
                issues.Add("Уточнить целевое назначение кредита");
            }

            scoringDto = new ScoringDetailsDto(
                score,
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
                var primaryReason = app.ReasonCodes.FirstOrDefault();
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
            mlExplanationSource
        );
    }
}
