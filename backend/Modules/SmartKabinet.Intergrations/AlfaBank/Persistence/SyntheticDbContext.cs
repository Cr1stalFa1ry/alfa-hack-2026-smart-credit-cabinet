using Microsoft.EntityFrameworkCore;
using SmartKabinet.Intergrations.AlfaBank.Persistence.Entities;

namespace SmartKabinet.Intergrations.AlfaBank.Persistence;

public class SyntheticDbContext : DbContext
{
    public SyntheticDbContext(DbContextOptions<SyntheticDbContext> options) : base(options)
    {
    }

    public DbSet<SyntheticAlfaCustomerEntity> Customers => Set<SyntheticAlfaCustomerEntity>();
    public DbSet<SyntheticAlfaAccountEntity> Accounts => Set<SyntheticAlfaAccountEntity>();
    public DbSet<SyntheticAlfaTransactionEntity> Transactions => Set<SyntheticAlfaTransactionEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<SyntheticAlfaCustomerEntity>(entity =>
        {
            entity.ToTable("synthetic_alfa_customers");
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Inn).IsRequired().HasMaxLength(12);
            entity.HasIndex(c => c.Inn).IsUnique();
            entity.Property(c => c.OrganizationName).IsRequired().HasMaxLength(250);

            entity.Property(c => c.AverageMonthlyTurnover).HasPrecision(18, 2);
            entity.Property(c => c.AverageMonthlyExpenses).HasPrecision(18, 2);
            entity.Property(c => c.NetCashFlow).HasPrecision(18, 2);
            entity.Property(c => c.AnnualRevenue).HasPrecision(18, 2);
            entity.Property(c => c.CoefficientOfVariation).HasPrecision(5, 4);
            entity.Property(c => c.MonthlyLoanPaymentsInAlfa).HasPrecision(18, 2);
            entity.Property(c => c.ExistingLoansTotalBalance).HasPrecision(18, 2);

            entity.HasMany(c => c.Accounts)
                .WithOne(a => a.Customer)
                .HasForeignKey(a => a.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(c => c.Transactions)
                .WithOne(t => t.Customer)
                .HasForeignKey(t => t.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SyntheticAlfaAccountEntity>(entity =>
        {
            entity.ToTable("synthetic_alfa_accounts");
            entity.HasKey(a => a.Id);
            entity.Property(a => a.AccountNumber).IsRequired().HasMaxLength(20);
            entity.HasIndex(a => a.AccountNumber);
            entity.Property(a => a.CurrentBalance).HasPrecision(18, 2);
            entity.Property(a => a.Currency).HasMaxLength(3);
        });

        modelBuilder.Entity<SyntheticAlfaTransactionEntity>(entity =>
        {
            entity.ToTable("synthetic_alfa_transactions");
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Amount).HasPrecision(18, 2);
            entity.Property(t => t.OperationType).HasMaxLength(20);
            entity.Property(t => t.CounterpartyName).HasMaxLength(250);
            entity.Property(t => t.Category).HasMaxLength(50);
            entity.HasIndex(t => t.Date);
        });
    }

    /// <summary>
    /// Сидирование синтетических клиентов Альфа-Банка в PostgreSQL (детерминированные тест-кейсы S1..S5)
    /// </summary>
    public static async Task SeedPostgresDefaultDataAsync(SyntheticDbContext db, CancellationToken ct = default)
    {
        if (await db.Customers.AnyAsync(ct))
        {
            return;
        }

        var customers = new List<SyntheticAlfaCustomerEntity>
        {
            // 1. ИНН 500100000011: Иванов, торговля, 5 лет (S1)
            new()
            {
                Id = Guid.Parse("11111111-aaaa-1111-aaaa-111111111111"),
                Inn = "500100000011",
                OrganizationName = "ИП Иванов Иван Иванович",
                IsAlfaClient = true,
                ClientSince = DateTime.UtcNow.AddYears(-5),
                RelationshipMonths = 60,
                Segment = "Малый бизнес (Торговля)",
                AverageMonthlyTurnover = 700_000m,
                AverageMonthlyExpenses = 300_000m,
                NetCashFlow = 400_000m,
                AnnualRevenue = 8_400_000m,
                CoefficientOfVariation = 0.20m,
                MonthlyLoanPaymentsInAlfa = 30_000m,
                ExistingLoansTotalBalance = 240_000m,
                ActiveOperatingMonths = 60,
                Accounts = new List<SyntheticAlfaAccountEntity>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        AccountNumber = "40802810900000000011",
                        CurrentBalance = 1_850_000m,
                        OpenDate = DateTime.UtcNow.AddYears(-5),
                        IsBlocked = false
                    }
                }
            },
            // 2. ИНН 500100000022: Сидорова, услуги, 3 года (S2)
            new()
            {
                Id = Guid.Parse("22222222-bbbb-2222-bbbb-222222222222"),
                Inn = "500100000022",
                OrganizationName = "ИП Сидорова Анна Сергеевна",
                IsAlfaClient = true,
                ClientSince = DateTime.UtcNow.AddYears(-3),
                RelationshipMonths = 36,
                Segment = "Услуги для бизнеса",
                AverageMonthlyTurnover = 400_000m,
                AverageMonthlyExpenses = 150_000m,
                NetCashFlow = 250_000m,
                AnnualRevenue = 4_800_000m,
                CoefficientOfVariation = 0.45m,
                MonthlyLoanPaymentsInAlfa = 60_000m,
                ExistingLoansTotalBalance = 540_000m,
                ActiveOperatingMonths = 36,
                Accounts = new List<SyntheticAlfaAccountEntity>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        AccountNumber = "40802810900000000022",
                        CurrentBalance = 620_000m,
                        OpenDate = DateTime.UtcNow.AddYears(-3),
                        IsBlocked = false
                    }
                }
            },
            // 3. ИНН 500100000033: Кузнецов, 6 лет (S3)
            new()
            {
                Id = Guid.Parse("33333333-cccc-3333-cccc-333333333333"),
                Inn = "500100000033",
                OrganizationName = "ИП Кузнецов Алексей Петрович",
                IsAlfaClient = true,
                ClientSince = DateTime.UtcNow.AddYears(-6),
                RelationshipMonths = 72,
                Segment = "Производство",
                AverageMonthlyTurnover = 500_000m,
                AverageMonthlyExpenses = 420_000m,
                NetCashFlow = 80_000m,
                AnnualRevenue = 6_000_000m,
                CoefficientOfVariation = 0.65m,
                MonthlyLoanPaymentsInAlfa = 90_000m,
                ExistingLoansTotalBalance = 1_100_000m,
                ActiveOperatingMonths = 72
            },
            // 4. ИНН 500100000077: Петров (S5)
            new()
            {
                Id = Guid.Parse("77777777-eeee-7777-eeee-777777777777"),
                Inn = "500100000077",
                OrganizationName = "ИП Петров Михаил Дмитриевич",
                IsAlfaClient = true,
                ClientSince = DateTime.UtcNow.AddYears(-1),
                RelationshipMonths = 12,
                Segment = "Розничная торговля",
                AverageMonthlyTurnover = 350_000m,
                AverageMonthlyExpenses = 180_000m,
                NetCashFlow = 170_000m,
                AnnualRevenue = 4_200_000m,
                CoefficientOfVariation = 0.28m,
                MonthlyLoanPaymentsInAlfa = 0m,
                ExistingLoansTotalBalance = 0m,
                ActiveOperatingMonths = 12
            }
        };

        await db.Customers.AddRangeAsync(customers, ct);
        await db.SaveChangesAsync(ct);
    }
}
