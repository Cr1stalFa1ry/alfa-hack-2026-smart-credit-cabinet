using SmartKabinet.Shared;

namespace SmartKabinet.Intergrations.Synthetic.Services;

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
    bool IsBankrupt
);

public interface ICompanyLookupService
{
    Task<Result<CompanyLookupDto>> LookupByInnAsync(string inn, CancellationToken ct = default);
}
