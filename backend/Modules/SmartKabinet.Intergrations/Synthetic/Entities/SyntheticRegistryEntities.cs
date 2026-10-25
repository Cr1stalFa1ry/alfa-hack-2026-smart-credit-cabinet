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

public class SyntheticCustomerProfileEntity
{
    public string ApplicationId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Inn { get; set; } = string.Empty;
    public string? Ogrnip { get; set; }
    public DateTime? RegistrationDate { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? OwnBankClient { get; set; }
    public string? Stage { get; set; }
    public string? Purpose { get; set; }
    public string? ProductCode { get; set; }
    public decimal? AmountRub { get; set; }
    public int? RequestedTermMonths { get; set; }
    public decimal? EquipmentPriceRub { get; set; }
    public decimal? OwnContributionRub { get; set; }
    public decimal? AvailableOwnFundsRub { get; set; }
    public string? InvoiceConfirmed { get; set; }
    public decimal? StartupBudgetTotalRub { get; set; }
    public decimal? StartupOwnFundsRub { get; set; }
    public string? PdConsent { get; set; }
    public string? AutomatedDecisionConsent { get; set; }
    public string? RegistryStatus { get; set; }
    public string? ApplicantMatch { get; set; }
    public string? CheckStatus { get; set; }
    public string? FailedSource { get; set; }
    public string? BkiConsent { get; set; }
    public string? PersonHistory { get; set; }
    public string? BusinessHistory { get; set; }
    public int? MaxOverdueDays12m { get; set; }
    public decimal? CurrentOverdueRub { get; set; }
    public decimal? TaxDebtRub { get; set; }
    public string? KycRiskLevel { get; set; }
    public string? FnsAccountBlock { get; set; }
    public string? BankruptcyStatus { get; set; }
    public string? BusinessFactsState { get; set; }
    public string? ActivityFirstFullMonth { get; set; }
    public decimal? HouseholdExpensesMonthlyRub { get; set; }
    public string? OtherIncomeState { get; set; }
    public decimal? BusinessCommittedCostsMonthlyRub { get; set; }
    public string? ObligationsDeclarationComplete { get; set; }
    public string? VerificationStatus { get; set; }
    public string? ObligationsReconciled { get; set; }
    public string? RepaymentSourceConfirmed { get; set; }
    public string? IncomeContinuityConfirmed { get; set; }
    public string? FindingsComplete { get; set; }
    public string? SupplierInn { get; set; }
    public string? EquipmentCategory { get; set; }
    public DateTime? SupplierRegistrationDate { get; set; }
    public string? SupplierStatus { get; set; }
    public string? SupplierMassAddress { get; set; }
    public string? SupplierLinkedToApplicant { get; set; }
    public decimal? EquipmentReferencePriceRub { get; set; }
    public string? DuplicateContacts { get; set; }
    public string? StatementUnmatchedLoanPayments { get; set; }
    public string? StatementNeedsReview { get; set; }
    public string? OkvedMain { get; set; }
    public string? TaxRegime { get; set; }
    public string? RegionName { get; set; }
}

public class SyntheticPassportProfileEntity
{
    public string ApplicantInn { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public DateTime? BirthDate { get; set; }
    public string? Series { get; set; }
    public string? Number { get; set; }
    public DateTime? IssueDate { get; set; }
    public string? Issuer { get; set; }
    public string? DepartmentCode { get; set; }
    public string? DocumentStatus { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public bool? IsSynthetic { get; set; }
}

public class SyntheticMonthlyFactEntity
{
    public int Id { get; set; }
    public string ApplicationId { get; set; } = string.Empty;
    public string Month { get; set; } = string.Empty;
    public decimal CleanReceiptsRub { get; set; }
    public decimal OperatingOutflowRub { get; set; }
}

public class SyntheticObligationEntity
{
    public int Id { get; set; }
    public string ApplicationId { get; set; } = string.Empty;
    public string? Source { get; set; }
    public string? ObligationRef { get; set; }
    public string? Kind { get; set; }
    public decimal? MonthlyMaxPaymentRub { get; set; }
}

public class SyntheticOtherIncomeEntity
{
    public int Id { get; set; }
    public string ApplicationId { get; set; } = string.Empty;
    public string Month { get; set; } = string.Empty;
    public decimal NetIncomeRub { get; set; }
}

public class SyntheticPropertyEntity
{
    public string PropertyId { get; set; } = string.Empty;
    public string CadastralNumber { get; set; } = string.Empty;
    public string? PropertyType { get; set; }
    public string? Address { get; set; }
    public decimal? AreaSqm { get; set; }
    public string? OwnershipType { get; set; }
    public string? EncumbranceStatus { get; set; }
    public string? EncumbranceNote { get; set; }
    public string? RightsCoverage { get; set; }
    public string? SourceRecordStatus { get; set; }
    public DateTime? SourceAsOf { get; set; }
    public string? SourceType { get; set; }
    public bool? IsSynthetic { get; set; }
}

public class SyntheticPropertyRightEntity
{
    public string RightId { get; set; } = string.Empty;
    public string CadastralNumber { get; set; } = string.Empty;
    public string? OwnerId { get; set; }
    public string OwnerInn { get; set; } = string.Empty;
    public string? OwnerFullName { get; set; }
    public string? OwnerBankApplicationId { get; set; }
    public string? OwnershipType { get; set; }
    public int? ShareNumerator { get; set; }
    public int? ShareDenominator { get; set; }
    public string? RightStatus { get; set; }
    public DateTime? RegistrationDate { get; set; }
    public DateTime? TerminationDate { get; set; }
    public string? IdentityMatchMethod { get; set; }
    public DateTime? SourceAsOf { get; set; }
    public string? SourceType { get; set; }
    public bool? IsSynthetic { get; set; }
}
