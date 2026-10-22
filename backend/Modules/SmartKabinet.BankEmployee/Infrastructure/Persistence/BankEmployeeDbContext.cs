using Microsoft.EntityFrameworkCore;
using SmartKabinet.BankEmployee.Domain;

namespace SmartKabinet.BankEmployee.Infrastructure.Persistence;

public class BankEmployeeDbContext : DbContext
{
    public BankEmployeeDbContext(DbContextOptions<BankEmployeeDbContext> options) : base(options) { }

    public DbSet<BankEmployeeProfile> Employees => Set<BankEmployeeProfile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.HasDefaultSchema("bank_employee");

        modelBuilder.Entity<BankEmployeeProfile>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId).IsUnique();
        });
    }
}
