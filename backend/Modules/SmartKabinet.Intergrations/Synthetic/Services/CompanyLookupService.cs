using Microsoft.EntityFrameworkCore;
using SmartKabinet.Intergrations.AlfaBank.Persistence;
using SmartKabinet.Shared;

namespace SmartKabinet.Intergrations.Synthetic.Services;

public class CompanyLookupService(SyntheticDbContext dbSynthetic) : ICompanyLookupService
{
    public async Task<Result<CompanyLookupDto>> LookupByInnAsync(string inn, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(inn))
        {
            return Error.Validation("Lookup.EmptyInn", "ИНН не может быть пустым.");
        }

        var normalizedInn = inn.Trim();

        // 1. Поиск в синтетическом ЕГРИП
        var egrip = await dbSynthetic.EgripRecords
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Inn == normalizedInn, ct);

        // 2. Поиск в базе клиентов Альфа-Банка
        var alfaCustomer = await dbSynthetic.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Inn == normalizedInn, ct);

        // 3. Поиск в синтетических профилях досье
        var customerProfile = await dbSynthetic.CustomerProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Inn == normalizedInn, ct);

        // 4. Поиск паспорта
        var passportProfile = await dbSynthetic.PassportProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.ApplicantInn == normalizedInn, ct);

        // 5. Проверки внешних стоп-факторов
        var hasFnsBlock = await dbSynthetic.FnsBlocks
            .AsNoTracking()
            .AnyAsync(b => b.Inn == normalizedInn, ct);

        var zsk = await dbSynthetic.ZskRisks
            .AsNoTracking()
            .FirstOrDefaultAsync(z => z.Inn == normalizedInn, ct);

        var isBankrupt = await dbSynthetic.Bankruptcies
            .AsNoTracking()
            .AnyAsync(b => b.Inn == normalizedInn, ct);

        if (egrip is null && alfaCustomer is null && customerProfile is null)
        {
            return Error.NotFound("Lookup.NotFound", $"Организация с ИНН {normalizedInn} не найдена в реестре ЕГРИП и базе банка.");
        }

        var regDate = egrip?.RegistrationDate ?? customerProfile?.RegistrationDate ?? (alfaCustomer != null ? DateTime.UtcNow.AddMonths(-alfaCustomer.ActiveOperatingMonths) : null);
        var isPrelaunch = regDate.HasValue && regDate.Value > DateTime.UtcNow.AddMonths(-6);

        var appId = customerProfile?.ApplicationId;
        List<CompanyFactItemDto>? facts = null;
        List<CompanyDebtItemDto>? debts = null;

        if (!string.IsNullOrEmpty(appId))
        {
            var rawFacts = await dbSynthetic.MonthlyFacts
                .AsNoTracking()
                .Where(f => f.ApplicationId == appId)
                .OrderBy(f => f.Month)
                .ToListAsync(ct);

            if (rawFacts.Count > 0)
            {
                facts = rawFacts.Select(f => new CompanyFactItemDto(f.Month, f.CleanReceiptsRub, f.OperatingOutflowRub)).ToList();
            }

            var rawDebts = await dbSynthetic.Obligations
                .AsNoTracking()
                .Where(d => d.ApplicationId == appId)
                .ToListAsync(ct);

            if (rawDebts.Count > 0)
            {
                debts = rawDebts.Select(d => new CompanyDebtItemDto(d.ObligationRef, d.MonthlyMaxPaymentRub ?? 0m)).ToList();
            }
        }

        if (debts == null && alfaCustomer != null && alfaCustomer.MonthlyLoanPaymentsInAlfa > 0)
        {
            debts = new List<CompanyDebtItemDto>
            {
                new("Кредитные обязательства в Альфа-Банке", alfaCustomer.MonthlyLoanPaymentsInAlfa)
            };
        }

        var fullName = egrip?.FullName ?? customerProfile?.FullName ?? alfaCustomer?.OrganizationName;
        var ogrnip = egrip?.Ogrnip ?? customerProfile?.Ogrnip;
        var okvedMain = egrip?.OkvedMain ?? customerProfile?.OkvedMain;
        var taxRegime = egrip?.TaxRegime ?? customerProfile?.TaxRegime ?? "УСН (доходы)";
        var phone = customerProfile?.Phone;
        var email = customerProfile?.Email;

        var dto = new CompanyLookupDto(
            Inn: normalizedInn,
            Ogrnip: ogrnip,
            FullName: fullName,
            FirstName: egrip?.FirstName,
            LastName: egrip?.LastName,
            Patronymic: egrip?.Patronymic,
            RegistrationDate: regDate,
            EgripStatus: egrip?.EgripStatus ?? customerProfile?.RegistryStatus ?? "ACTIVE",
            RegionCode: egrip?.RegionCode,
            RegionName: egrip?.RegionName ?? customerProfile?.RegionName,
            OkvedMain: okvedMain,
            OkvedMainName: egrip?.OkvedMainName,
            TaxRegime: taxRegime,
            MspCategory: egrip?.MspCategory ?? "Микропредприятие",
            SuggestedStage: customerProfile?.Stage ?? (isPrelaunch ? "prelaunch" : "operating"),
            IsAlfaClient: alfaCustomer is not null || customerProfile?.OwnBankClient == "да",
            AnnualRevenue: alfaCustomer?.AnnualRevenue,
            NetCashFlow: alfaCustomer?.NetCashFlow,
            AverageMonthlyExpenses: alfaCustomer?.AverageMonthlyExpenses,
            OperatingMonths: alfaCustomer?.ActiveOperatingMonths,
            HasFnsBlock: hasFnsBlock,
            ZskRiskLevel: zsk?.RiskLevel ?? "LOW",
            IsBankrupt: isBankrupt,
            Phone: phone,
            Email: email,
            PassportSeries: passportProfile?.Series,
            PassportNumber: passportProfile?.Number,
            PassportBirthDate: passportProfile?.BirthDate?.ToString("yyyy-MM-dd"),
            PassportIssueDate: passportProfile?.IssueDate?.ToString("yyyy-MM-dd"),
            PassportIssuer: passportProfile?.Issuer,
            PassportDepartmentCode: passportProfile?.DepartmentCode,
            Facts: facts,
            Debts: debts
        );

        return Result.Success(dto);
    }
}
