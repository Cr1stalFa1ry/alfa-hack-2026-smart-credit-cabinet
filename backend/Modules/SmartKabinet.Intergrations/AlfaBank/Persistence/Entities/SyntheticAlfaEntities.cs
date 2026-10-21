namespace SmartKabinet.Intergrations.AlfaBank.Persistence.Entities;

public class SyntheticAlfaCustomerEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Inn { get; set; } = string.Empty;
    public string OrganizationName { get; set; } = string.Empty;
    public bool IsAlfaClient { get; set; } = true;

    public DateTime? ClientSince { get; set; }
    public int? RelationshipMonths { get; set; }
    public string Segment { get; set; } = "Малый бизнес";
    public string BranchOffice { get; set; } = "Главный офис Альфа-Банк";

    // Финансовые агрегаты
    public decimal AverageMonthlyTurnover { get; set; }
    public decimal AverageMonthlyExpenses { get; set; }
    public decimal NetCashFlow { get; set; }
    public decimal AnnualRevenue { get; set; }
    public decimal CoefficientOfVariation { get; set; }
    public decimal MonthlyLoanPaymentsInAlfa { get; set; }
    public decimal ExistingLoansTotalBalance { get; set; }
    public int ActiveOperatingMonths { get; set; }

    // Риск-факторы
    public bool Has115FzBlocks { get; set; }
    public bool HasBankruptcySigns { get; set; }
    public bool HasSuspensionByFns { get; set; }
    public bool HasCourtBailiffEnforcements { get; set; }
    public int DaysWithoutOperations { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }

    // Связанные сущности
    public List<SyntheticAlfaAccountEntity> Accounts { get; set; } = new();
    public List<SyntheticAlfaTransactionEntity> Transactions { get; set; } = new();
}

public class SyntheticAlfaAccountEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CustomerId { get; set; }
    public string AccountNumber { get; set; } = string.Empty;
    public string Currency { get; set; } = "RUB";
    public decimal CurrentBalance { get; set; }
    public DateTime OpenDate { get; set; }
    public bool IsBlocked { get; set; }
    public string AccountType { get; set; } = "Расчетный счет ИП";

    public SyntheticAlfaCustomerEntity? Customer { get; set; }
}

public class SyntheticAlfaTransactionEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CustomerId { get; set; }
    public DateTime Date { get; set; }
    public decimal Amount { get; set; }
    public string OperationType { get; set; } = "Income";
    public string CounterpartyName { get; set; } = string.Empty;
    public string PaymentPurpose { get; set; } = string.Empty;
    public string Category { get; set; } = "Revenue";
    public bool ExcludedFromRevenue { get; set; }

    public SyntheticAlfaCustomerEntity? Customer { get; set; }
}
