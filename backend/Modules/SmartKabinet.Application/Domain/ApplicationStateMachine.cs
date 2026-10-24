namespace SmartKabinet.Application.Domain;

public static class ApplicationStateMachine
{
    private static readonly HashSet<(ApplicationStatus From, ApplicationStatus To)> AllowedTransitions = new()
    {
        // T02: Сохранение черновика
        (ApplicationStatus.Draft, ApplicationStatus.Draft),
        // T03: Отправка заявки клиентом
        (ApplicationStatus.Draft, ApplicationStatus.Checking),
        // T04: Система запрашивает сведения
        (ApplicationStatus.Checking, ApplicationStatus.NeedInfo),
        // T05: Внешний источник недоступен
        (ApplicationStatus.Checking, ApplicationStatus.WaitingCheck),
        // T06: Повтор проверки клиентом
        (ApplicationStatus.WaitingCheck, ApplicationStatus.Checking),
        // T07: Передача на рассмотрение аналитику (prelaunch)
        (ApplicationStatus.Checking, ApplicationStatus.Review),
        // T08: Положительное решение системы
        (ApplicationStatus.Checking, ApplicationStatus.Offer),
        // T09: Отказ по правилу/стоп-факторам системы
        (ApplicationStatus.Checking, ApplicationStatus.Declined),
        // T10: Ответ клиента на запрос сведений
        (ApplicationStatus.NeedInfo, ApplicationStatus.Checking),
        // T11: Аналитик запрашивает сведения
        (ApplicationStatus.Review, ApplicationStatus.NeedInfo),
        // T12: Одобрение аналитика
        (ApplicationStatus.Review, ApplicationStatus.Offer),
        // T13: Отказ аналитика
        (ApplicationStatus.Review, ApplicationStatus.Declined),
        // T14: Уточнены факты аналитиком -> пересчет проверки
        (ApplicationStatus.Review, ApplicationStatus.Checking),
        // T16: Некредитное препятствие
        (ApplicationStatus.Checking, ApplicationStatus.Closed),
        (ApplicationStatus.Review, ApplicationStatus.Closed),
        // T17: Отзыв заявки клиентом
        (ApplicationStatus.Draft, ApplicationStatus.Closed),
        (ApplicationStatus.Checking, ApplicationStatus.Closed),
        (ApplicationStatus.NeedInfo, ApplicationStatus.Closed),
        (ApplicationStatus.WaitingCheck, ApplicationStatus.Closed),
        (ApplicationStatus.Review, ApplicationStatus.Closed),
        (ApplicationStatus.Offer, ApplicationStatus.Closed),
        (ApplicationStatus.Accepted, ApplicationStatus.Closed),

        // Посткредитная цепочка: принятие, подписание, выдача (T21–T28)
        // T21: Принятие оферты клиентом
        (ApplicationStatus.Offer, ApplicationStatus.Accepted),
        (ApplicationStatus.Offer, ApplicationStatus.OfferRejected),
        // T22: Проверка условий и подписание договора (симуляция ЭЦП / SMS-кода)
        (ApplicationStatus.Accepted, ApplicationStatus.PreConditions),
        (ApplicationStatus.Accepted, ApplicationStatus.SignedSim),
        (ApplicationStatus.PreConditions, ApplicationStatus.SignedSim),
        // T23: Подготовка и зачисление кредитных средств на расчётный счёт ИП
        (ApplicationStatus.SignedSim, ApplicationStatus.ReadyTodisburse),
        (ApplicationStatus.SignedSim, ApplicationStatus.DisbursedSim),
        (ApplicationStatus.ReadyTodisburse, ApplicationStatus.DisbursedSim)
    };

    public static bool CanTransition(ApplicationStatus from, ApplicationStatus to)
    {
        if (from == ApplicationStatus.Declined || from == ApplicationStatus.Closed || from == ApplicationStatus.DisbursedSim)
        {
            return false; // Из финальных статусов выходов нет
        }

        return AllowedTransitions.Contains((from, to));
    }
}
