using SmartKabinet.Shared;

namespace SmartKabinet.Intergrations.Synthetic.Services;

public record CompanyFactItemDto(
    string Month,
    decimal CleanReceiptsRub,
    decimal OperatingOutflowRub
);

public record CompanyDebtItemDto(
    string? ObligationRef,
    decimal MonthlyMaxPaymentRub
);

public record CompanyLookupDto(
    string Inn,
    string? Ogrnip,
    string? FullName,
    string? FirstName,
    string? LastName,
    string? Patronymic,
    DateTime? RegistrationDate,
    string? EgripStatus,
    string? RegionCode,
    string? RegionName,
    string? OkvedMain,
    string? OkvedMainName,
    string? TaxRegime,
    string? MspCategory,
    string SuggestedStage, // operating or prelaunch
    bool IsAlfaClient,
    decimal? AnnualRevenue,
    decimal? NetCashFlow,
    decimal? AverageMonthlyExpenses,
    int? OperatingMonths,
    bool HasFnsBlock,
    string ZskRiskLevel, // LOW, MEDIUM, HIGH
    bool IsBankrupt,
    string? Phone = null,
    string? Email = null,
    string? PassportSeries = null,
    string? PassportNumber = null,
    string? PassportBirthDate = null,
    string? PassportIssueDate = null,
    string? PassportIssuer = null,
    string? PassportDepartmentCode = null,
    List<CompanyFactItemDto>? Facts = null,
    List<CompanyDebtItemDto>? Debts = null
);

public interface ICompanyLookupService
{
    Task<Result<CompanyLookupDto>> LookupByInnAsync(string inn, CancellationToken ct = default);
}
