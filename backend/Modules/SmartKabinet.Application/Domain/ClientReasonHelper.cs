namespace SmartKabinet.Application.Domain;

public static class ClientReasonHelper
{
    private static readonly Dictionary<string, string> ReasonTexts = new(StringComparer.OrdinalIgnoreCase)
    {
        ["OVERDUE_GT_30"] = "В кредитной истории есть просрочка более 30 дней. Подать заявку снова можно после её погашения.",
        ["DSCR_LOW"] = "Ежемесячный платёж высок относительно вашего денежного потока. Мы предложили другой срок.",
        ["NEED_STATEMENT"] = "Нужна выписка минимум за 3 месяца. Загрузите файл или введите показатели вручную.",
        ["PRODUCT_NA_AMOUNT"] = "Для вашего этапа бизнеса максимальная сумма по этому продукту 500 000 ₽. Измените сумму или цель.",
        ["CONTRIBUTION_LOW"] = "Нужен взнос от 20%. Недостаточно собственных средств.",
        ["SOURCE_UNAVAILABLE"] = "Не удалось получить данные из внешнего источника. Это не влияет на решение, повторите проверку.",
        ["IP_NOT_FOUND"] = "ИП с таким ИНН не найден. Проверьте номер.",
        ["TAX_DEBT"] = "Есть налоговая задолженность выше допустимой.",
        ["INACTIVE_IP"] = "Статус индивидуального предпринимателя прекращен или не действует.",
        ["LOW_SCORE"] = "Недостаточный скоринговый балл для одобрения кредита."
    };

    public static string GetClientText(string reasonCode)
    {
        return ReasonTexts.TryGetValue(reasonCode, out var text) 
            ? text 
            : $"Решение принято по правилу: {reasonCode}";
    }

    public static List<string> GetClientTexts(IEnumerable<string> reasonCodes)
    {
        return reasonCodes.Select(GetClientText).ToList();
    }
}
