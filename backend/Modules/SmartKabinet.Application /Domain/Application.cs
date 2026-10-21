namespace SmartKabinet.Application.Domain;

public class Application
{
    public Guid Id { get; set; }
    public Guid ClientId { get; set; }
    public string Inn { get; set; } = string.Empty; // нужно сделать ограничение на 12 цифр
    
    // Жизненный цикл и статус
    public ApplicationStatus Status { get; set; } = ApplicationStatus.Draft;
    public CreditDecision Decision { get; set; }
    public List<string> ReasonCodes { get; set; } = new();  
    
    // Основные параметры для кредита
    public BusinessStage Stage { get; set; }
    public LoanPurpose Purpose { get; set; }
    public string ProductCode { get; set; } = string.Empty; // WC, EQ, START
    public decimal RequestedAmount { get; set; } // количество запрашиваемых денег 
    public decimal OwnContribution { get; set; } = 0;
    public int? RequestedTermMonths { get; set; } // количество запрашиваемых месяцев
    public DateTime? NeededByDate { get; set; } 
    public bool AsSoonAsPossible { get; set; } = true;
    
    // Согласия 
    public bool BkiConsent { get; set; }
    public bool PersonalDataConsent { get; set; }
    
    // Данные для Operating (Действующий бизнес)
    public DateTime? HistoryStartDate { get; set; }
    public int? HistoryMonths { get; set; }
    public string? StatementFilePath { get; set; }
    public decimal? ExistingMonthlyObligations { get; set; }
    public TaxRegime TaxRegime { get; set; } = TaxRegime.Undefined;

    // Данные для Equipment (Оборудование)
    public decimal? EquipmentPrice { get; set; }
    public string? EquipmentSupplier { get; set; }
    public string? EquipmentList { get; set; }
    public string? SupplierBillFilePath { get; set; }

    // Сценарий В: Operating + Equipment
    public EquipmentChangeType? ChangeType { get; set; }
    public int? DowntimeMonths { get; set; }
    public string? ExpectedEffect { get; set; }

    // Сценарий Г: Operating + Working Capital
    public WorkingCapitalUse? UseOfFunds { get; set; }
    public bool? IsRepeatRequirement { get; set; }
    public string? SeasonalityComment { get; set; }

    // Данные для Prelaunch (Новый бизнес)
    public DateTime? PlannedLaunchDate { get; set; }
    public string? BusinessPlanFilePath { get; set; }
    public decimal? ProjectedMonthlyRevenue { get; set; }
    public decimal? ConservativeProjectedRevenue { get; set; }
    public decimal? FinancialReserve { get; set; }
    public decimal? PersonalIncome { get; set; }
    
    // Аудит и связанные сущности
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }
    //public ApplicationOffer? CurrentOffer { get; set; }
}

public enum ApplicationStatus
{
    Draft,            // Черновик 
    Submitted,        // ПОСЛЕ ЭТОГО СОСТОЯНИЯ КЛИЕНТ НЕ МОЖЕТ РЕДАКТИРОВАТЬ ЗАЯВКУ
    Checking,         // Автопроверка / скоринг
    WaitingCheck,
    NeedInfo,         // Запрос сведений у клиента (выписка, справка и т.д.)
    InfoReceived,    //
    Review,           // Ручное рассмотрение риск-аналитиком 
    Offer,            // Одобрено
    OfferRejected,
    OfferExpired,
    PreConditions,
    SignedSim,
    ReadyTodisburse,
    DisbursedSim,    // 
    Declined,         // Отказ по стоп-фактору или баллам
    Accepted,         // 
    Closed            // Закрыто / отозвано клиентом / препятствие продукта
}

public enum CreditDecision
{
    Approved = 1,
    CounterOffer = 2,
    Declined = 3,
    ReviewRequired = 4
}

public enum BusinessStage { Operating = 1, Prelaunch = 2 }
public enum LoanPurpose { Equipment = 1, WorkingCapital = 2 }
public enum TaxRegime { Undefined = 0, UsnIncome = 1, UsnIncomeExpense = 2, Osno = 3, Patent = 4 }
public enum EquipmentChangeType { Replacement = 1, Expansion = 2, NewDirection = 3 }
public enum WorkingCapitalUse { Purchases = 1, MandatoryExpenses = 2, CashGap = 3, Other = 4 }