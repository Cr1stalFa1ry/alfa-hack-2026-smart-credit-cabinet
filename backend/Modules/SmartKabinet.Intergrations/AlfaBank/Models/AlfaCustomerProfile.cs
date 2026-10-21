namespace SmartKabinet.Intergrations.AlfaBank.Models;

/// <summary>
/// Профиль индивидуального предпринимателя во внутренней банковской системе Альфа-Банка (АБС)
/// </summary>
public class AlfaCustomerProfile
{
    public string Inn { get; set; } = string.Empty;
    public string OrganizationName { get; set; } = string.Empty;
    public bool IsAlfaClient { get; set; }
    
    public DateTime? ClientSince { get; set; }
    public int? RelationshipMonths { get; set; }
    public string Segment { get; set; } = "Малый бизнес";
    public string BranchOffice { get; set; } = "Главный офис Альфа-Банк";

    /// <summary>
    /// Активные расчетные счета ИП в Альфа-Банке
    /// </summary>
    public List<AlfaAccountInfo> Accounts { get; set; } = new();

    /// <summary>
    /// Автоматически агрегированные финансовые показатели (за последние 12 месяцев)
    /// </summary>
    public AlfaFinancialAggregates? FinancialAggregates { get; set; }

    /// <summary>
    /// Внутренние стоп-факторы и комплаенс-метки банка
    /// </summary>
    public AlfaCustomerRiskFlags RiskFlags { get; set; } = new();
}

public class AlfaAccountInfo
{
    public string AccountNumber { get; set; } = string.Empty;
    public string Currency { get; set; } = "RUB";
    public decimal CurrentBalance { get; set; }
    public DateTime OpenDate { get; set; }
    public bool IsBlocked { get; set; }
    public string AccountType { get; set; } = "Расчетный счет ИП";
}

public class AlfaFinancialAggregates
{
    /// <summary>
    /// Среднемесячные чистые поступления выручки (без кредитов, собственных переводов и возвратов)
    /// </summary>
    public decimal AverageMonthlyTurnover { get; set; }

    /// <summary>
    /// Среднемесячные подтвержденные расходы по счету
    /// </summary>
    public decimal AverageMonthlyExpenses { get; set; }

    /// <summary>
    /// Чистый денежный поток (Free Cash Flow = поступления - расходы)
    /// </summary>
    public decimal NetCashFlow { get; set; }

    /// <summary>
    /// Годовые подтвержденные поступления по счетам
    /// </summary>
    public decimal AnnualRevenue { get; set; }

    /// <summary>
    /// Коэффициент вариации поступлений (CV): <=0.3 (стабильный), 0.3-0.6 (умеренный), >0.6 (высоковолатильный)
    /// </summary>
    public decimal CoefficientOfVariation { get; set; }

    /// <summary>
    /// Действующие ежемесячные платежи по внутренним кредитам Альфа-Банка
    /// </summary>
    public decimal MonthlyLoanPaymentsInAlfa { get; set; }

    /// <summary>
    /// Общий остаток задолженности по кредитам в Альфа-Банке
    /// </summary>
    public decimal ExistingLoansTotalBalance { get; set; }

    /// <summary>
    /// Количество месяцев с непрерывной историей операций
    /// </summary>
    public int ActiveOperatingMonths { get; set; }

    /// <summary>
    /// Последние транзакции по счету (готовая выписка из АБС, не требуется ручная загрузка файлов)
    /// </summary>
    public List<AlfaStatementTransaction> RecentTransactions { get; set; } = new();
}

public class AlfaStatementTransaction
{
    public DateTime Date { get; set; }
    public decimal Amount { get; set; }
    public string OperationType { get; set; } = "Income"; // Income, Expense
    public string CounterpartyName { get; set; } = string.Empty;
    public string PaymentPurpose { get; set; } = string.Empty;
    public string Category { get; set; } = "Revenue";
    public bool ExcludedFromRevenue { get; set; } // true для собственных средств, кредитов и возвратов
}

public class AlfaCustomerRiskFlags
{
    public bool Has115FzBlocks { get; set; }
    public bool HasBankruptcySigns { get; set; }
    public bool HasSuspensionByFns { get; set; }
    public bool HasCourtBailiffEnforcements { get; set; }
    public int DaysWithoutOperations { get; set; }
}
