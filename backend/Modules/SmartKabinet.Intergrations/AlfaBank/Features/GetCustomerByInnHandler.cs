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

        // Тест-кейс TC18: эмуляция сетевого сбоя 503
        if (inn == "500100000066")
        {
            return AlfaCustomerProfileResult.Error(
                "SOURCE_UNAVAILABLE", 
                "Сервис АБС Альфа-Банка временно недоступен (503). Повторите проверку.");
        }

        var customer = await _dbContext.Customers
            .AsNoTracking()
            .Include(c => c.Accounts)
            .Include(c => c.Transactions.OrderByDescending(t => t.Date).Take(24))
            .FirstOrDefaultAsync(c => c.Inn == inn, cancellationToken);

        if (customer is null)
        {
            return AlfaCustomerProfileResult.NotFound(inn);
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
