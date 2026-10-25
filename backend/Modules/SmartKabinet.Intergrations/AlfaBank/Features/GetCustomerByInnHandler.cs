using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SmartKabinet.Intergrations.AlfaBank.Models;
using SmartKabinet.Intergrations.AlfaBank.Persistence;

namespace SmartKabinet.Intergrations.AlfaBank.Features;

public class GetCustomerByInnHandler
{
    private readonly SyntheticDbContext _dbContext;
    private readonly ILogger<GetCustomerByInnHandler> _logger;

    public GetCustomerByInnHandler(
        SyntheticDbContext dbContext,
        ILogger<GetCustomerByInnHandler> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<AlfaCustomerProfileResult> HandleAsync(
        string inn, 
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Поиск синтетических данных клиента Альфа-Банка в PostgreSQL по ИНН {Inn}", inn);

        if (string.IsNullOrWhiteSpace(inn) || inn.Length != 12 || !inn.All(char.IsDigit))
        {
            return AlfaCustomerProfileResult.Error("INVALID_INN", "ИНН должен состоять из 12 цифр.");
        }
        
        var customer = await _dbContext.Customers
            .AsNoTracking()
            .Include(c => c.Accounts)
            .Include(c => c.Transactions.OrderByDescending(t => t.Date).Take(24))
            .FirstOrDefaultAsync(c => c.Inn == inn, cancellationToken);

        if (customer is null)
        {
            var egrip = await _dbContext.EgripRecords
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Inn == inn, cancellationToken);

            if (egrip is null)
            {
                return AlfaCustomerProfileResult.NotFound(inn);
            }

            var hasFnsBlock = await _dbContext.FnsBlocks
                .AsNoTracking()
                .AnyAsync(b => b.Inn == inn, cancellationToken);

            var hasBankruptcy = await _dbContext.Bankruptcies
                .AsNoTracking()
                .AnyAsync(b => b.Inn == inn, cancellationToken);

            var zsk = await _dbContext.ZskRisks
                .AsNoTracking()
                .FirstOrDefaultAsync(z => z.Inn == inn, cancellationToken);

            var regDate = egrip.RegistrationDate ?? DateTime.UtcNow.AddMonths(-12);
            var operatingMonths = (int)Math.Max(1, (DateTime.UtcNow - regDate).TotalDays / 30.4);

            return AlfaCustomerProfileResult.Found(new AlfaCustomerProfile
            {
                Inn = egrip.Inn,
                OrganizationName = egrip.FullName ?? "ИП",
                IsAlfaClient = false,
                ClientSince = regDate,
                RelationshipMonths = operatingMonths,
                Segment = "SmallBusiness",
                BranchOffice = egrip.RegionName ?? "Москва",
                Accounts = new List<AlfaAccountInfo>(),
                FinancialAggregates = new AlfaFinancialAggregates
                {
                    AverageMonthlyTurnover = 500000m,
                    AverageMonthlyExpenses = 300000m,
                    NetCashFlow = 200000m,
                    AnnualRevenue = 6000000m,
                    CoefficientOfVariation = 0.15m,
                    MonthlyLoanPaymentsInAlfa = 0m,
                    ExistingLoansTotalBalance = 0m,
                    ActiveOperatingMonths = operatingMonths
                },
                RiskFlags = new AlfaCustomerRiskFlags
                {
                    Has115FzBlocks = hasFnsBlock || (zsk?.RiskLevel == "HIGH"),
                    HasBankruptcySigns = hasBankruptcy,
                    HasSuspensionByFns = hasFnsBlock,
                    HasCourtBailiffEnforcements = false,
                    DaysWithoutOperations = 0
                }
            });
        }

        var profile = new AlfaCustomerProfile
        {
            Inn = customer.Inn,
            OrganizationName = customer.OrganizationName,
            IsAlfaClient = customer.IsAlfaClient,
            ClientSince = customer.ClientSince,
            RelationshipMonths = customer.RelationshipMonths,
            Segment = customer.Segment,
            BranchOffice = customer.BranchOffice,
            Accounts = customer.Accounts.Select(a => new AlfaAccountInfo
            {
                AccountNumber = a.AccountNumber,
                Currency = a.Currency,
                CurrentBalance = a.CurrentBalance,
                OpenDate = a.OpenDate,
                IsBlocked = a.IsBlocked,
                AccountType = a.AccountType
            }).ToList(),
            FinancialAggregates = new AlfaFinancialAggregates
            {
                AverageMonthlyTurnover = customer.AverageMonthlyTurnover,
                AverageMonthlyExpenses = customer.AverageMonthlyExpenses,
                NetCashFlow = customer.NetCashFlow,
                AnnualRevenue = customer.AnnualRevenue,
                CoefficientOfVariation = customer.CoefficientOfVariation,
                MonthlyLoanPaymentsInAlfa = customer.MonthlyLoanPaymentsInAlfa,
                ExistingLoansTotalBalance = customer.ExistingLoansTotalBalance,
                ActiveOperatingMonths = customer.ActiveOperatingMonths,
                RecentTransactions = customer.Transactions.Select(t => new AlfaStatementTransaction
                {
                    Date = t.Date,
                    Amount = t.Amount,
                    OperationType = t.OperationType,
                    CounterpartyName = t.CounterpartyName,
                    PaymentPurpose = t.PaymentPurpose,
                    Category = t.Category,
                    ExcludedFromRevenue = t.ExcludedFromRevenue
                }).ToList()
            },
            RiskFlags = new AlfaCustomerRiskFlags
            {
                Has115FzBlocks = customer.Has115FzBlocks,
                HasBankruptcySigns = customer.HasBankruptcySigns,
                HasSuspensionByFns = customer.HasSuspensionByFns,
                HasCourtBailiffEnforcements = customer.HasCourtBailiffEnforcements,
                DaysWithoutOperations = customer.DaysWithoutOperations
            }
        };

        return AlfaCustomerProfileResult.Found(profile);
    }
}
