using SmartKabinet.Application.Contracts;
using SmartKabinet.Application.Domain;

namespace SmartKabinet.Application.Features.Products;

public class CreditProductCatalog : IGetCreditProducts
{
    private static readonly List<CreditProductDto> Products = new()
    {
        new CreditProductDto(
            Code: CreditProductCodes.WorkingCapital,
            Name: "Оборотный кредит",
            Description: "Пополнение оборотных средств, закупка товаров и сырья, закрытие кассовых разрывов для действующего бизнеса.",
            AllowedStages: ["Operating"],
            Purpose: "WorkingCapital",
            MinAmount: 100_000m,
            MaxAmount: 3_000_000m,
            MinTermMonths: 3,
            MaxTermMonths: 24,
            MinInterestRate: 18.0m,
            MaxInterestRate: 24.0m,
            RequiresOwnContribution: false,
            MinOwnContributionPercent: 0m,
            DecisionMaker: "system",
            Conditions: "решает система"
        ),
        new CreditProductDto(
            Code: CreditProductCodes.Equipment,
            Name: "Кредит на оборудование",
            Description: "Приобретение, замена или расширение производственного, торгового и офисного оборудования. Сумма кредита = цена оборудования минус собственный взнос.",
            AllowedStages: ["Operating", "Prelaunch"],
            Purpose: "Equipment",
            MinAmount: 300_000m,
            MaxAmount: 5_000_000m,
            MinTermMonths: 6,
            MaxTermMonths: 48,
            MinInterestRate: 18.0m,
            MaxInterestRate: 24.0m,
            RequiresOwnContribution: true,
            MinOwnContributionPercent: 10.0m,
            DecisionMaker: "hybrid",
            Conditions: "operating: взнос от 10%, решает система; prelaunch: взнос от 20%, решает сотрудник"
        ),
        new CreditProductDto(
            Code: CreditProductCodes.Start,
            Name: "Старт (оборотные)",
            Description: "Стартовые оборотные средства для индивидуальных предпринимателей на этапе запуска бизнеса до получения первой выручки.",
            AllowedStages: ["Prelaunch"],
            Purpose: "WorkingCapital",
            MinAmount: 100_000m,
            MaxAmount: 500_000m,
            MinTermMonths: 6,
            MaxTermMonths: 18,
            MinInterestRate: 18.0m,
            MaxInterestRate: 24.0m,
            RequiresOwnContribution: false,
            MinOwnContributionPercent: 0m,
            DecisionMaker: "analyst",
            Conditions: "решает сотрудник"
        )
    };

    public IReadOnlyList<CreditProductDto> GetAll() => Products;

    public CreditProductDto? GetByCode(string code)
    {
        if (string.IsNullOrWhiteSpace(code)) return null;
        var normalized = code.Trim().ToUpperInvariant();
        return Products.FirstOrDefault(p => p.Code.Equals(normalized, StringComparison.OrdinalIgnoreCase));
    }
}
