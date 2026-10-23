using Microsoft.EntityFrameworkCore;
using SmartKabinet.Intergrations.AlfaBank.Persistence;
using SmartKabinet.Shared;

namespace SmartKabinet.Intergrations.Synthetic.Services;

public class CompanyLookupService : ICompanyLookupService
{
    private readonly SyntheticDbContext _db;

    public CompanyLookupService(SyntheticDbContext db)
    {
        _db = db;
    }

    public async Task<Result<CompanyLookupDto>> LookupByInnAsync(string inn, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(inn))
        {
            return Error.Validation("Lookup.EmptyInn", "ИНН не может быть пустым.");
        }

        var normalizedInn = inn.Trim();

        // 1. Поиск в синтетическом ЕГРИП
        var egrip = await _db.EgripRecords
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Inn == normalizedInn, ct);

        // 2. Поиск в базе клиентов Альфа-Банка
        var alfaCustomer = await _db.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Inn == normalizedInn, ct);

        // 3. Проверки внешних стоп-факторов
        var hasFnsBlock = await _db.FnsBlocks
            .AsNoTracking()
            .AnyAsync(b => b.Inn == normalizedInn, ct);

        var zsk = await _db.ZskRisks
            .AsNoTracking()
            .FirstOrDefaultAsync(z => z.Inn == normalizedInn, ct);

        var isBankrupt = await _db.Bankruptcies
            .AsNoTracking()
            .AnyAsync(b => b.Inn == normalizedInn, ct);

        if (egrip is null && alfaCustomer is null)
        {
            return Error.NotFound("Lookup.NotFound", $"Организация с ИНН {normalizedInn} не найдена в реестре ЕГРИП.");
        }

        var regDate = egrip?.RegistrationDate ?? (alfaCustomer != null ? DateTime.UtcNow.AddMonths(-alfaCustomer.ActiveOperatingMonths) : null);
        var isPrelaunch = regDate.HasValue && regDate.Value > DateTime.UtcNow.AddMonths(-6);

        var dto = new CompanyLookupDto(
            Inn: normalizedInn,
            Ogrnip: egrip?.Ogrnip,
            FullName: egrip?.FullName ?? alfaCustomer?.OrganizationName,
            FirstName: egrip?.FirstName,
            LastName: egrip?.LastName,
            Patronymic: egrip?.Patronymic,
            RegistrationDate: regDate,
            EgripStatus: egrip?.EgripStatus ?? "ACTIVE",
            RegionCode: egrip?.RegionCode,
            RegionName: egrip?.RegionName,
            OkvedMain: egrip?.OkvedMain,
            OkvedMainName: egrip?.OkvedMainName,
            TaxRegime: egrip?.TaxRegime ?? "УСН (доходы)",
            MspCategory: egrip?.MspCategory ?? "Микропредприятие",
            SuggestedStage: isPrelaunch ? "prelaunch" : "operating",
            IsAlfaClient: alfaCustomer is not null,
            AnnualRevenue: alfaCustomer?.AnnualRevenue,
            NetCashFlow: alfaCustomer?.NetCashFlow,
            AverageMonthlyExpenses: alfaCustomer?.AverageMonthlyExpenses,
            OperatingMonths: alfaCustomer?.ActiveOperatingMonths,
            HasFnsBlock: hasFnsBlock,
            ZskRiskLevel: zsk?.RiskLevel ?? "LOW",
            IsBankrupt: isBankrupt
        );

        return Result.Success(dto);
    }
}
