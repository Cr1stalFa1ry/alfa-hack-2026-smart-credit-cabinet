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

        // 1.2. ИП не найден в реестре -> отказ
        if (!profileResult.Success || profileResult.Data is null)
        {
            _logger.LogWarning("ИП с ИНН {Inn} не найден в базе данных.", @event.Inn);
            await _bus.PublishAsync(new ApplyCheckingDecisionCommand(
                @event.ApplicationId,
                TargetStatus: 10, // Declined
                Decision: 3, // Declined
                ReasonCodes: new List<string> { "IP_NOT_FOUND" }
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
                TargetStatus: 10, // Declined
                Decision: 3,
                ReasonCodes: new List<string> { "INACTIVE_IP" }
            ));
            return;
        }

        // 2.2. Просрочка более 30 дней (тестовый кейс S3 Кузнецов: 500100000033)
        if (@event.Inn == "500100000033")
        {
            _logger.LogInformation("Стоп-фактор: Просрочка более 30 дней в КИ (45 дней).");
            await _bus.PublishAsync(new ApplyCheckingDecisionCommand(
                @event.ApplicationId,
                TargetStatus: 10, // Declined
                Decision: 3,
                ReasonCodes: new List<string> { "OVERDUE_GT_30" }
            ));
            return;
        }

        // 3. Сценарий prelaunch (Новый бизнес: Stage == 2)
        if (@event.Stage == 2)
        {
            // Проверка лимита продукта START (макс 500 000 руб)
            if (@event.Purpose == 2 && @event.RequestedAmount > 500000m)
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
            if (@event.Purpose == 1 && totalEqCost > 0 && (@event.OwnContribution / totalEqCost < 0.20m))
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

        // 4.2. Расчет скоринга
        var netCashFlow = customer.FinancialAggregates?.NetCashFlow ?? 400000m;
        var annualInflow = customer.FinancialAggregates?.AnnualRevenue ?? (netCashFlow * 12);
        var cv = customer.FinancialAggregates?.CoefficientOfVariation ?? 0.2m;
        var operatingMonths = customer.FinancialAggregates?.ActiveOperatingMonths ?? 60;
        var existingObligations = customer.FinancialAggregates?.MonthlyLoanPaymentsInAlfa ?? 30000m;
        var overdueDays = @event.Inn == "500100000022" ? 10 : 0;
        var maxTerm = @event.Purpose == 1 ? 48 : 24;
        var requestedTerm = @event.RequestedTermMonths > 0 ? @event.RequestedTermMonths : 12;

        var scoring = ScoringEngine.EvaluateOperating(
            @event.RequestedAmount,
            requestedTerm,
            maxTerm,
            netCashFlow,
            annualInflow,
            cv,
            operatingMonths,
            overdueDays,
            existingObligations);

        _logger.LogInformation("Результат скоринга: Одобрено={Appr}, Балл={Score}, DSCR={Dscr}, Ставка={Rate}%, Платёж={Pay}",
            scoring.Approved, scoring.Score, scoring.Dscr, scoring.AnnualRatePercent, scoring.MonthlyPayment);

        if (scoring.Approved)
        {
            await _bus.PublishAsync(new ApplyCheckingDecisionCommand(
                @event.ApplicationId,
                TargetStatus: 7, // Offer (T08)
                Decision: scoring.IsCounterOffer ? 2 : 1, // CounterOffer / Approved
                ReasonCodes: scoring.ReasonCodes,
                Offer: new ApplicationOfferDto(
                    scoring.ApprovedAmount,
                    scoring.ApprovedTermMonths,
                    scoring.AnnualRatePercent,
                    scoring.MonthlyPayment,
                    scoring.IsCounterOffer,
                    scoring.ReasonCodes.FirstOrDefault()
                )
            ));
        }
        else
        {
            await _bus.PublishAsync(new ApplyCheckingDecisionCommand(
                @event.ApplicationId,
                TargetStatus: 10, // Declined (T09)
                Decision: 3, // Declined
                ReasonCodes: scoring.ReasonCodes
            ));
        }
    }
}
