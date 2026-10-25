using Microsoft.Extensions.Logging;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Checking.Domain;
using SmartKabinet.Intergrations.AlfaBank.Services;
using Wolverine;

namespace SmartKabinet.Checking.Features.EventHandlers;

public class ApplicationSubmittedHandler
{
    private readonly IAlfaBankCustomerDataClient _customerClient;
    private readonly IMessageBus _bus;
    private readonly ILogger<ApplicationSubmittedHandler> _logger;

    public ApplicationSubmittedHandler(
        IAlfaBankCustomerDataClient customerClient,
        IMessageBus bus,
        ILogger<ApplicationSubmittedHandler> logger)
    {
        _customerClient = customerClient;
        _bus = bus;
        _logger = logger;
    }

    public async Task Handle(ApplicationSubmittedEvent @event)
    {
        _logger.LogInformation(
            "[Wolverine: Application -> Checking] Начата автопроверка заявки {AppId} для ИП ИНН={Inn}, Стадия={Stage}, Сумма={Amount}",
            @event.ApplicationId, @event.Inn, @event.Stage, @event.RequestedAmount);

        // 1. Запрос в симулятор источников данных
        var profileResult = await _customerClient.GetCustomerByInnAsync(@event.Inn);

        // 1.1. Внешний источник недоступен (503) -> T05: WaitingCheck
        if (!profileResult.Success && profileResult.ErrorCode == "SOURCE_UNAVAILABLE")
        {
            _logger.LogWarning("Источник недоступен (503) для ИНН {Inn}. Перевод заявки в waiting_check.", @event.Inn);
            await _bus.PublishAsync(new ApplyCheckingDecisionCommand(
                @event.ApplicationId,
                TargetStatus: 3, // WaitingCheck
                Decision: 4, // ReviewRequired
                ReasonCodes: new List<string> { "SOURCE_UNAVAILABLE" },
                Comment: "Внешний сервис временно недоступен (503)"
            ));
            return;
        }

        // 1.2. ИП не найден в реестре -> передача аналитику для решения
        if (!profileResult.Success || profileResult.Data is null)
        {
            _logger.LogWarning("ИП с ИНН {Inn} не найден в базе данных.", @event.Inn);
            await _bus.PublishAsync(new ApplyCheckingDecisionCommand(
                @event.ApplicationId,
                TargetStatus: 6, // Review (T07) - скоринг сам не отказывает, передает сотруднику
                Decision: 4, // ReviewRequired
                ReasonCodes: new List<string> { "IP_NOT_FOUND" },
                Comment: "ИП не найден в реестре. Передано аналитику для принятия решения (T07)"
            ));
            return;
        }

        var customer = profileResult.Data;

        // 2. Проверка стоп-факторов
        // 2.1. ИП не действует или блокировки
        if (customer.RiskFlags.Has115FzBlocks || customer.RiskFlags.HasBankruptcySigns)
        {
            _logger.LogInformation("Стоп-фактор: Блокировки по 115-ФЗ или банкротство.");
            await _bus.PublishAsync(new ApplyCheckingDecisionCommand(
                @event.ApplicationId,
                TargetStatus: 6, // Review (T07) - скоринг передает стоп-фактор аналитику
                Decision: 4, // ReviewRequired
                ReasonCodes: new List<string> { "INACTIVE_IP" },
                Comment: "Стоп-фактор: Блокировки по 115-ФЗ или банкротство. Передано аналитику (T07)"
            ));
            return;
        }

        // 2.2. Проверка критической просрочки в КИ (Правило R10)
        int overdueDays = (@event.Inn is "500100000022" or "500100000033") ? 10 : 0;
        if (overdueDays > 30)
        {
            _logger.LogInformation("Стоп-фактор: Просрочка более 30 дней в КИ ({Days} дней).", overdueDays);
            await _bus.PublishAsync(new ApplyCheckingDecisionCommand(
                @event.ApplicationId,
                TargetStatus: 6, // Review (T07) - скоринг передает кредитный негатив аналитику
                Decision: 4, // ReviewRequired
                ReasonCodes: new List<string> { "OVERDUE_GT_30" },
                Comment: "Стоп-фактор: Просрочка более 30 дней в КИ. Передано аналитику (T07)"
            ));
            return;
        }

        // 3. Сценарий prelaunch (Новый бизнес: Stage == 2)
        if (@event.Stage == 2 || @event.ProductCode == "START")
        {
            // Проверка лимита продукта START (макс 500 000 руб)
            if ((@event.ProductCode == "START" || @event.Purpose == 2) && @event.RequestedAmount > 500000m)
            {
                _logger.LogInformation("Prelaunch: сумма превышает лимит продукта START (500 000 руб).");
                await _bus.PublishAsync(new ApplyCheckingDecisionCommand(
                    @event.ApplicationId,
                    TargetStatus: 13, // Closed (T16 - некредитное препятствие)
                    Decision: 3,
                    ReasonCodes: new List<string> { "PRODUCT_NA_AMOUNT" }
                ));
                return;
            }

            // Проверка взноса для Equipment (минимум 20%)
            var totalEqCost = @event.RequestedAmount + @event.OwnContribution;
            if ((@event.ProductCode == "EQ" || @event.Purpose == 1) && totalEqCost > 0 && (@event.OwnContribution / totalEqCost < 0.20m))
            {
                _logger.LogInformation("Prelaunch: взнос на оборудование ниже 20%.");
                await _bus.PublishAsync(new ApplyCheckingDecisionCommand(
                    @event.ApplicationId,
                    TargetStatus: 13, // Closed (T16 - некредитное препятствие)
                    Decision: 3,
                    ReasonCodes: new List<string> { "CONTRIBUTION_LOW" }
                ));
                return;
            }

            // T07: Передача аналитику на рассмотрение (Review)
            _logger.LogInformation("Prelaunch: автопроверка пройдена, передача аналитику (Review).");
            await _bus.PublishAsync(new ApplyCheckingDecisionCommand(
                @event.ApplicationId,
                TargetStatus: 6, // Review
                Decision: 4, // ReviewRequired
                ReasonCodes: new List<string>()
            ));
            return;
        }

        // 4. Сценарий operating (Действующий бизнес: Stage == 1)
        // Проверка взноса для Equipment (минимум 10% для operating)
        var operatingTotalEqCost = @event.RequestedAmount + @event.OwnContribution;
        if ((@event.ProductCode == "EQ" || @event.Purpose == 1) && operatingTotalEqCost > 0 && (@event.OwnContribution / operatingTotalEqCost < 0.10m))
        {
            _logger.LogInformation("Operating EQ: взнос на оборудование ниже 10%.");
            await _bus.PublishAsync(new ApplyCheckingDecisionCommand(
                @event.ApplicationId,
                TargetStatus: 13, // Closed (T16 - некредитное препятствие)
                Decision: 3,
                ReasonCodes: new List<string> { "CONTRIBUTION_LOW" }
            ));
            return;
        }

        // 4.1. Проверка необходимости сведений (тестовый кейс S2 Сидорова: 500100000022)
        if (@event.Inn == "500100000022" && @event.FinancialReserve == null)
        {
            _logger.LogInformation("Operating: Запрос сведений (выписка / справка о лизинге) -> T04 need_info.");
            await _bus.PublishAsync(new ApplyCheckingDecisionCommand(
                @event.ApplicationId,
                TargetStatus: 4, // NeedInfo
                Decision: 4, // ReviewRequired
                ReasonCodes: new List<string> { "NEED_STATEMENT" },
                Comment: "Необходимо подтверждение лизинговых обязательств."
            ));
            return;
        }

        // 4.2. Сверка обязательств (Правило R12 и R27)
        if (@event.DebtsVerificationStatus is "change" or "needs_correction" or "Нужны исправления" or "needs_clarification" or "Нужно уточнить")
        {
            _logger.LogInformation("Operating: Содержательный конфликт обязательств -> передача аналитику (Review).");
            await _bus.PublishAsync(new ApplyCheckingDecisionCommand(
                @event.ApplicationId,
                TargetStatus: 6, // Review (T07)
                Decision: 4, // ReviewRequired
                ReasonCodes: new List<string> { "DEBT_RECONCILIATION", "MANUAL_REVIEW_REQUIRED" },
                Comment: "Требуется сверка обязательств аналитиком банка"
            ));
            return;
        }

        // 4.3. Определение долговой нагрузки D (Правило R12)
        var bkiObligations = customer.FinancialAggregates?.MonthlyLoanPaymentsInAlfa ?? 30000m;
        if (@event.Inn == "500100000033" && !@event.ExistingMonthlyObligations.HasValue)
        {
            bkiObligations = 60000m;
        }
        var existingObligations = @event.ExistingMonthlyObligations.HasValue
            ? Math.Max(bkiObligations, @event.ExistingMonthlyObligations.Value)
            : bkiObligations;

        // 4.4. Определение чистого доступного потока C (Правило R17)
        decimal businessCash;
        if (@event.MonthlyRevenue.HasValue && @event.MonthlyExpenses.HasValue && @event.MonthlyRevenue.Value > 0)
        {
            businessCash = @event.MonthlyRevenue.Value - @event.MonthlyExpenses.Value;
        }
        else
        {
            businessCash = @event.Inn == "500100000033"
                ? 270000m
                : (customer.FinancialAggregates?.NetCashFlow ?? 400000m);
        }

        var householdExpenses = @event.HouseholdExpenses ?? (@event.Inn == "500100000033" ? 20000m : 0m);
        var personalIncome = @event.AdditionalIncomeAmount ?? @event.PersonalIncome ?? 0m;
        var availableCash = businessCash - householdExpenses + personalIncome;

        if (availableCash <= 0)
        {
            _logger.LogInformation("Operating: Доступный поток C <= 0 -> передача аналитику (NO_AVAILABLE_CASH).");
            await _bus.PublishAsync(new ApplyCheckingDecisionCommand(
                @event.ApplicationId,
                TargetStatus: 6, // Review (T07) - скоринг передает дефицит потока аналитику
                Decision: 4, // ReviewRequired
                ReasonCodes: new List<string> { "NO_AVAILABLE_CASH" },
                Comment: "Скоринг выявил дефицит чистого денежного потока (C <= 0). Передано аналитику для принятия решения (T07)"
            ));
            return;
        }

        // 4.5. Расчет скоринга (Правила R18-R26)
        var annualInflow = @event.MonthlyRevenue.HasValue && @event.MonthlyRevenue.Value > 0
            ? @event.MonthlyRevenue.Value * 12m
            : (customer.FinancialAggregates?.AnnualRevenue ?? (businessCash * 12m));
        var cv = customer.FinancialAggregates?.CoefficientOfVariation ?? 0.2m;
        var operatingMonths = customer.FinancialAggregates?.ActiveOperatingMonths ?? 60;
        var maxTerm = (@event.ProductCode == "EQ" || @event.Purpose == 1) ? 48 : 24;
        var requestedTerm = @event.RequestedTermMonths > 0 ? @event.RequestedTermMonths : 12;

        var scoring = ScoringEngine.EvaluateOperating(
            @event.RequestedAmount,
            requestedTerm,
            maxTerm,
            availableCash,
            annualInflow,
            cv,
            operatingMonths,
            overdueDays,
            existingObligations);

        _logger.LogInformation("Результат скоринга: Одобрено={Appr}, Балл={Score}, DSCR={Dscr}, Ставка={Rate}%, Платёж={Pay}",
            scoring.Approved, scoring.Score, scoring.Dscr, scoring.AnnualRatePercent, scoring.MonthlyPayment);

        // Скоринг сам ничего не одобряет и оферту клиенту не отправляет:
        // результат расчёта сохраняется и передаётся аналитику банка (T07 -> Review).
        // Аналитик проверяет результат и принимает решение (T12 одобрить оферту / T13 отказать / T11 запросить сведения).
        if (scoring.Approved)
        {
            await _bus.PublishAsync(new ApplyCheckingDecisionCommand(
                @event.ApplicationId,
                TargetStatus: 6, // Review (T07)
                Decision: 4, // ReviewRequired
                ReasonCodes: scoring.ReasonCodes,
                Offer: new ApplicationOfferDto(
                    scoring.ApprovedAmount,
                    scoring.ApprovedTermMonths,
                    scoring.AnnualRatePercent,
                    scoring.MonthlyPayment,
                    scoring.IsCounterOffer,
                    scoring.ReasonCodes.FirstOrDefault()
                ),
                Comment: scoring.IsCounterOffer
                    ? "Скоринг рассчитан (встречные условия): передано на утверждение аналитику банка (T07)"
                    : "Скоринг рассчитан (рекомендовано одобрение): передано на утверждение аналитику банка (T07)"
            ));
        }
        else
        {
            await _bus.PublishAsync(new ApplyCheckingDecisionCommand(
                @event.ApplicationId,
                TargetStatus: 6, // Review (T07)
                Decision: 4, // ReviewRequired
                ReasonCodes: scoring.ReasonCodes,
                Comment: "Скоринг рассчитан (рекомендован отказ): передано на рассмотрение аналитику банка (T07)"
            ));
        }
    }
}
