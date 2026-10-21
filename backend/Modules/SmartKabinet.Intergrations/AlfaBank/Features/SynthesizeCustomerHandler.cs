using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SmartKabinet.Intergrations.AlfaBank.Models;
using SmartKabinet.Intergrations.AlfaBank.Persistence;
using SmartKabinet.Intergrations.AlfaBank.Persistence.Entities;

namespace SmartKabinet.Intergrations.AlfaBank.Features;

public record SynthesizeCustomerRequest(
    string Inn,
    string OrganizationName,
    bool IsAlfaClient = true,
    decimal AverageMonthlyTurnover = 500_000m,
    decimal NetCashFlow = 250_000m,
    decimal ExistingLoans = 0m,
    decimal MonthlyLoanPayments = 0m,
    decimal CoefficientOfVariation = 0.25m,
    int ActiveMonths = 24,
    bool GenerateSampleTransactions = true
);

public class SynthesizeCustomerHandler
{
    private readonly SyntheticDbContext _dbContext;
    private readonly ILogger<SynthesizeCustomerHandler> _logger;

    public SynthesizeCustomerHandler(
        SyntheticDbContext dbContext,
        ILogger<SynthesizeCustomerHandler> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<AlfaCustomerProfileResult> HandleAsync(
        SynthesizeCustomerRequest request, 
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Inn) || request.Inn.Length != 12 || !request.Inn.All(char.IsDigit))
        {
            return AlfaCustomerProfileResult.Error("INVALID_INN", "ИНН должен состоять из 12 цифр.");
        }

        var existing = await _dbContext.Customers
            .Include(c => c.Accounts)
            .Include(c => c.Transactions)
            .FirstOrDefaultAsync(c => c.Inn == request.Inn, cancellationToken);

        if (existing != null)
        {
            // Обновляем существующего синтетического клиента
            existing.OrganizationName = request.OrganizationName;
            existing.IsAlfaClient = request.IsAlfaClient;
            existing.AverageMonthlyTurnover = request.AverageMonthlyTurnover;
            existing.AverageMonthlyExpenses = request.AverageMonthlyTurnover - request.NetCashFlow;
            existing.NetCashFlow = request.NetCashFlow;
            existing.AnnualRevenue = request.AverageMonthlyTurnover * 12;
            existing.CoefficientOfVariation = request.CoefficientOfVariation;
            existing.ExistingLoansTotalBalance = request.ExistingLoans;
            existing.MonthlyLoanPaymentsInAlfa = request.MonthlyLoanPayments;
            existing.ActiveOperatingMonths = request.ActiveMonths;
            existing.UpdatedAt = DateTimeOffset.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Обновлен синтетический клиент в PostgreSQL с ИНН {Inn}", request.Inn);
        }
        else
        {
            // Создаем нового синтетического клиента
            var customer = new SyntheticAlfaCustomerEntity
            {
                Id = Guid.NewGuid(),
                Inn = request.Inn,
                OrganizationName = request.OrganizationName,
                IsAlfaClient = request.IsAlfaClient,
                ClientSince = DateTime.UtcNow.AddMonths(-request.ActiveMonths),
                RelationshipMonths = request.ActiveMonths,
                AverageMonthlyTurnover = request.AverageMonthlyTurnover,
                AverageMonthlyExpenses = request.AverageMonthlyTurnover - request.NetCashFlow,
                NetCashFlow = request.NetCashFlow,
                AnnualRevenue = request.AverageMonthlyTurnover * 12,
                CoefficientOfVariation = request.CoefficientOfVariation,
                ExistingLoansTotalBalance = request.ExistingLoans,
                MonthlyLoanPaymentsInAlfa = request.MonthlyLoanPayments,
                ActiveOperatingMonths = request.ActiveMonths,
                Accounts = new List<SyntheticAlfaAccountEntity>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        AccountNumber = "40802810" + request.Inn.Substring(0, 10),
                        CurrentBalance = request.NetCashFlow * 2.5m,
                        OpenDate = DateTime.UtcNow.AddMonths(-request.ActiveMonths),
                        IsBlocked = false
                    }
                }
            };

            if (request.GenerateSampleTransactions)
            {
                customer.Transactions = GenerateTransactions(customer.Id, request.AverageMonthlyTurnover, customer.AverageMonthlyExpenses);
            }

            await _dbContext.Customers.AddAsync(customer, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Создан новый синтетический клиент в PostgreSQL с ИНН {Inn}", request.Inn);
        }

        var queryHandler = new GetCustomerByInnHandler(_dbContext, LoggerFactory.Create(_ => {}).CreateLogger<GetCustomerByInnHandler>());
        return await queryHandler.HandleAsync(request.Inn, cancellationToken);
    }

    private static List<SyntheticAlfaTransactionEntity> GenerateTransactions(
        Guid customerId, 
        decimal monthlyIncome, 
        decimal monthlyExpense)
    {
        var list = new List<SyntheticAlfaTransactionEntity>();
        var now = DateTime.UtcNow;

        for (int i = 0; i < 6; i++)
        {
            var date = now.AddMonths(-i);
            list.Add(new SyntheticAlfaTransactionEntity
            {
                Id = Guid.NewGuid(),
                CustomerId = customerId,
                Date = date.AddDays(-3),
                Amount = monthlyIncome * 0.70m,
                OperationType = "Income",
                CounterpartyName = "ООО ТОРГОВЫЙ ДОМ",
                PaymentPurpose = "Оплата по договору поставки",
                Category = "Revenue",
                ExcludedFromRevenue = false
            });
            list.Add(new SyntheticAlfaTransactionEntity
            {
                Id = Guid.NewGuid(),
                CustomerId = customerId,
                Date = date.AddDays(-15),
                Amount = monthlyExpense * 0.80m,
                OperationType = "Expense",
                CounterpartyName = "ООО СНАБЖЕНИЕ",
                PaymentPurpose = "Оплата аренды и сырья",
                Category = "Supplies",
                ExcludedFromRevenue = false
            });
        }

        return list;
    }
}
