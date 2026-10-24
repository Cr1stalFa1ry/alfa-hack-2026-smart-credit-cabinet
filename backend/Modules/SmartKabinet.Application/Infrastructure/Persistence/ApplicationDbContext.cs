using Microsoft.EntityFrameworkCore;
using SmartKabinet.Application.Domain;

namespace SmartKabinet.Application.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Domain.Application> Applications => Set<Domain.Application>();
    public DbSet<TransitionRecord> TransitionHistory => Set<TransitionRecord>();
    public DbSet<ApplicationOffer> Offers => Set<ApplicationOffer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.HasDefaultSchema("credit_app");

        modelBuilder.Entity<Domain.Application>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.HasIndex(a => a.ClientId);
            entity.HasIndex(a => a.Inn);
            entity.HasIndex(a => a.Status);
            entity.Property(a => a.Inn).HasMaxLength(12);

            entity.HasOne(a => a.CurrentOffer)
                .WithOne()
                .HasForeignKey<ApplicationOffer>(o => o.Id)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TransitionRecord>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.HasIndex(t => t.ApplicationId);
            entity.HasIndex(t => t.Timestamp);
        });
    }
}
