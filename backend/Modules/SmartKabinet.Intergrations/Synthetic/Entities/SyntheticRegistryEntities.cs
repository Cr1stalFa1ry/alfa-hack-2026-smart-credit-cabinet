namespace SmartKabinet.Intergrations.Synthetic.Entities;

public class SyntheticEgripEntity
{
    public string Inn { get; set; } = string.Empty;
    public string? Ogrnip { get; set; }
    public string? LastName { get; set; }
    public string? FirstName { get; set; }
    public string? Patronymic { get; set; }
    public string? FullName { get; set; }
    public DateTime? RegistrationDate { get; set; }
    public string? EgripStatus { get; set; }
    public DateTime? TerminationDate { get; set; }
    public string? TerminationReason { get; set; }
    public string? RegionCode { get; set; }
    public string? RegionName { get; set; }
    public string? OkvedMain { get; set; }
    public string? OkvedMainName { get; set; }
    public string? OkvedAdditional { get; set; }
    public string? TaxRegime { get; set; }
    public string? MspCategory { get; set; }
    public DateTime? RecordAsOf { get; set; }
}

public class SyntheticFnsBlockEntity
{
    public int Id { get; set; }
    public string Inn { get; set; } = string.Empty;
    public string? DecisionNumber { get; set; }
    public DateTime? DecisionDate { get; set; }
    public string? TaxOfficeCode { get; set; }
    public string? BankBik { get; set; }
}

public class SyntheticZskRiskEntity
{
    public string Inn { get; set; } = string.Empty;
    public string RiskLevel { get; set; } = "LOW"; // LOW, MEDIUM, HIGH
    public DateTime? AsOf { get; set; }
}

public class SyntheticEfrsbBankruptcyEntity
{
    public int Id { get; set; }
    public string Inn { get; set; } = string.Empty;
    public string? MessageType { get; set; }
    public string? Procedure { get; set; }
    public string? CaseNumber { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? CompletedDate { get; set; }
}

public class SyntheticEquipmentEntity
{
    public string Category { get; set; } = string.Empty; // EQ-001...
    public string Name { get; set; } = string.Empty;
    public decimal ReferencePriceRub { get; set; }
}

public class SyntheticSupplierEntity
{
    public string Inn { get; set; } = string.Empty;
    public string? Ogrn { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime? RegistrationDate { get; set; }
    public string? Status { get; set; }
    public string? Address { get; set; }
    public bool? MassAddress { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? DirectorInn { get; set; }
}
