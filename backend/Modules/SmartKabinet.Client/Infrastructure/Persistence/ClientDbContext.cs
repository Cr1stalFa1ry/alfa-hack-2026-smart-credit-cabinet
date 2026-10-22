using Microsoft.EntityFrameworkCore;
using SmartKabinet.Client.Domain;

namespace SmartKabinet.Client.Infrastructure.Persistence;

public class ClientDbContext : DbContext
{
    public ClientDbContext(DbContextOptions<ClientDbContext> options) : base(options) { }

    public DbSet<ClientProfile> Clients => Set<ClientProfile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.HasDefaultSchema("client");

        modelBuilder.Entity<ClientProfile>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.HasIndex(c => c.UserId).IsUnique();
            entity.HasIndex(c => c.Inn);
        });
    }
}
