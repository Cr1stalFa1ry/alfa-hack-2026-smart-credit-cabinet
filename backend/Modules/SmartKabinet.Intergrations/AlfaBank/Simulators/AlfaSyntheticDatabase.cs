using System.Collections.Concurrent;
using SmartKabinet.Intergrations.AlfaBank.Models;

namespace SmartKabinet.Intergrations.AlfaBank.Simulators;

/// <summary>
/// Синтетическая база данных клиентов Альфа-Банка для демонстраций, тестов и жюри
/// </summary>
public class AlfaSyntheticDatabase
{
    private readonly ConcurrentDictionary<string, AlfaCustomerProfile> _customers = new();

    public AlfaSyntheticDatabase()
    {
        SeedDefaultSyntheticData();
    }

    public bool TryGetCustomer(string inn, out AlfaCustomerProfile? profile)
    {
        return _customers.TryGetValue(inn, out profile);
    }

    public void UpsertCustomer(AlfaCustomerProfile profile)
    {
        _customers[profile.Inn] = profile;
    }

    private void SeedDefaultSyntheticData()
    {
        // 1. ИНН 500100000011: Иванов, торговля, 5 лет (Эталонный клиент Альфа-Банка, S1)
        UpsertCustomer(new AlfaCustomerProfile
        {
            Inn = "500100000011",
            OrganizationName = "ИП Иванов Иван Иванович",
            IsAlfaClient = true,
            ClientSince = DateTime.UtcNow.AddYears(-5),
            RelationshipMonths = 60,
            Segment = "Малый бизнес (Торговля)",
            Accounts = new List<AlfaAccountInfo>
            {
                new()
                {
                    AccountNumber = "40802810900000000011",
                    CurrentBalance = 1_850_000m,
                    OpenDate = DateTime.UtcNow.AddYears(-5),
                    IsBlocked = false
                }
            },
            FinancialAggregates = new AlfaFinancialAggregates
            {
                AverageMonthlyTurnover = 700_000m,
                AverageMonthlyExpenses = 300_000m,
                NetCashFlow = 400_000m,
                AnnualRevenue = 8_400_000m,
                CoefficientOfVariation = 0.20m,
                MonthlyLoanPaymentsInAlfa = 30_000m,
                ExistingLoansTotalBalance = 240_000m,
                ActiveOperatingMonths = 60,
                RecentTransactions = GenerateSampleTransactions(700_000m, 300_000m)
            },
            RiskFlags = new AlfaCustomerRiskFlags
            {
                Has115FzBlocks = false,
                HasBankruptcySigns = false,
                HasSuspensionByFns = false,
                HasCourtBailiffEnforcements = false,
                DaysWithoutOperations = 1
            }
        });

        // 2. ИНН 500100000022: Сидорова, услуги, 3 года (Клиент Альфа-Банка, S2 / встречное предложение)
        UpsertCustomer(new AlfaCustomerProfile
        {
            Inn = "500100000022",
            OrganizationName = "ИП Сидорова Анна Сергеевна",
            IsAlfaClient = true,
            ClientSince = DateTime.UtcNow.AddYears(-3),
            RelationshipMonths = 36,
            Segment = "Услуги для бизнеса",
            Accounts = new List<AlfaAccountInfo>
            {
                new()
                {
                    AccountNumber = "40802810900000000022",
                    CurrentBalance = 620_000m,
                    OpenDate = DateTime.UtcNow.AddYears(-3),
                    IsBlocked = false
                }
            },
            FinancialAggregates = new AlfaFinancialAggregates
            {
                AverageMonthlyTurnover = 400_000m,
                AverageMonthlyExpenses = 150_000m,
                NetCashFlow = 250_000m,
                AnnualRevenue = 4_800_000m,
                CoefficientOfVariation = 0.45m,
                MonthlyLoanPaymentsInAlfa = 60_000m,
                ExistingLoansTotalBalance = 540_000m,
                ActiveOperatingMonths = 36,
                RecentTransactions = GenerateSampleTransactions(400_000m, 150_000m)
            },
            RiskFlags = new AlfaCustomerRiskFlags
            {
                Has115FzBlocks = false,
                HasBankruptcySigns = false,
                HasSuspensionByFns = false,
                HasCourtBailiffEnforcements = false,
                DaysWithoutOperations = 3
            }
        });

        // 3. ИНН 500100000033: Кузнецов, 6 лет (Клиент Альфа-Банка с просрочкой 45 дней в КИ)
        UpsertCustomer(new AlfaCustomerProfile
        {
            Inn = "500100000033",
            OrganizationName = "ИП Кузнецов Алексей Петрович",
            IsAlfaClient = true,
            ClientSince = DateTime.UtcNow.AddYears(-6),
            RelationshipMonths = 72,
            Segment = "Производство",
            Accounts = new List<AlfaAccountInfo>
            {
                new()
                {
                    AccountNumber = "40802810900000000033",
                    CurrentBalance = 85_000m,
                    OpenDate = DateTime.UtcNow.AddYears(-6),
                    IsBlocked = false
                }
            },
            FinancialAggregates = new AlfaFinancialAggregates
            {
                AverageMonthlyTurnover = 500_000m,
                AverageMonthlyExpenses = 420_000m,
                NetCashFlow = 80_000m,
                AnnualRevenue = 6_000_000m,
                CoefficientOfVariation = 0.65m,
                MonthlyLoanPaymentsInAlfa = 90_000m,
                ExistingLoansTotalBalance = 1_100_000m,
                ActiveOperatingMonths = 72
            },
            RiskFlags = new AlfaCustomerRiskFlags
            {
                Has115FzBlocks = false,
                HasBankruptcySigns = false,
                HasSuspensionByFns = false,
                HasCourtBailiffEnforcements = false,
                DaysWithoutOperations = 8
            }
        });

        // 4. ИНН 500100000077: Петров (Клиент Альфа-Банка)
        UpsertCustomer(new AlfaCustomerProfile
        {
            Inn = "500100000077",
            OrganizationName = "ИП Петров Михаил Дмитриевич",
            IsAlfaClient = true,
            ClientSince = DateTime.UtcNow.AddYears(-1),
            RelationshipMonths = 12,
            Segment = "Розничная торговля",
            Accounts = new List<AlfaAccountInfo>
            {
                new()
                {
                    AccountNumber = "40802810900000000077",
                    CurrentBalance = 310_000m,
                    OpenDate = DateTime.UtcNow.AddYears(-1),
                    IsBlocked = false
                }
            },
            FinancialAggregates = new AlfaFinancialAggregates
            {
                AverageMonthlyTurnover = 350_000m,
                AverageMonthlyExpenses = 180_000m,
                NetCashFlow = 170_000m,
                AnnualRevenue = 4_200_000m,
                CoefficientOfVariation = 0.28m,
                MonthlyLoanPaymentsInAlfa = 0m,
                ExistingLoansTotalBalance = 0m,
                ActiveOperatingMonths = 12
            }
        });
    }

    private static List<AlfaStatementTransaction> GenerateSampleTransactions(decimal monthlyIncome, decimal monthlyExpense)
    {
        var list = new List<AlfaStatementTransaction>();
        var now = DateTime.UtcNow;

        for (int i = 0; i < 6; i++)
        {
            var monthDate = now.AddMonths(-i);
            list.Add(new AlfaStatementTransaction
            {
                Date = monthDate.AddDays(-5),
                Amount = monthlyIncome * 0.65m,
                OperationType = "Income",
                CounterpartyName = "ООО ТОРГОВЫЙ ПАРТНЕР",
                PaymentPurpose = "Оплата по счету №" + (100 + i) + " за поставленные товары",
                Category = "Revenue",
                ExcludedFromRevenue = false
            });

            list.Add(new AlfaStatementTransaction
            {
                Date = monthDate.AddDays(-12),
                Amount = monthlyIncome * 0.35m,
                OperationType = "Income",
                CounterpartyName = "Эквайринг Альфа-Банк",
                PaymentPurpose = "Возмещение по операциям торгового эквайринга",
                Category = "Revenue",
                ExcludedFromRevenue = false
            });

            list.Add(new AlfaStatementTransaction
            {
                Date = monthDate.AddDays(-18),
                Amount = monthlyExpense * 0.70m,
                OperationType = "Expense",
                CounterpartyName = "ООО СНАБЖЕНИЕ СЕРВИС",
                PaymentPurpose = "Оплата сырья и расходных материалов",
                Category = "Supplies",
                ExcludedFromRevenue = false
            });

            list.Add(new AlfaStatementTransaction
            {
                Date = monthDate.AddDays(-22),
                Amount = monthlyExpense * 0.30m,
                OperationType = "Expense",
                CounterpartyName = "ИФНС РОССИИ",
                PaymentPurpose = "Уплата страховых взносов и налогов ИП",
                Category = "Taxes",
                ExcludedFromRevenue = false
            });
        }

        return list;
    }
}
