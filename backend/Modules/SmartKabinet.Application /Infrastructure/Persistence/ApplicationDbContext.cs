using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using SmartKabinet.Application.Domain;

namespace SmartKabinet.Application.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Domain.Application> Applications => Set<Domain.Application>();
    public DbSet<TransitionRecord> TransitionHistory => Set<TransitionRecord>();
    public DbSet<ApplicationOffer> Offers => Set<ApplicationOffer>();
    public DbSet<ApplicationDocument> ApplicationDocuments => Set<ApplicationDocument>();

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        base.ConfigureConventions(configurationBuilder);

        configurationBuilder.Properties<DateTime>()
            .HaveConversion<UtcDateTimeConverter>();

        configurationBuilder.Properties<DateTime?>()
            .HaveConversion<UtcNullableDateTimeConverter>();
    }

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

        modelBuilder.Entity<ApplicationDocument>(entity =>
        {
            entity.HasKey(d => d.Id);
            entity.HasIndex(d => d.ApplicationId);
            entity.HasIndex(d => d.UploadedAt);
            entity.Property(d => d.FileName).HasMaxLength(255);
            entity.Property(d => d.FileKey).HasMaxLength(500);
            entity.Property(d => d.FileType).HasMaxLength(100);
            entity.Property(d => d.Status).HasMaxLength(50);
        });
    }
}

public class UtcDateTimeConverter : ValueConverter<DateTime, DateTime>
{
    public UtcDateTimeConverter() : base(
        d => d.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(d, DateTimeKind.Utc) : d.ToUniversalTime(),
        d => DateTime.SpecifyKind(d, DateTimeKind.Utc))
    {
    }
}

public class UtcNullableDateTimeConverter : ValueConverter<DateTime?, DateTime?>
{
    public UtcNullableDateTimeConverter() : base(
        d => !d.HasValue ? d : (d.Value.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(d.Value, DateTimeKind.Utc) : d.Value.ToUniversalTime()),
        d => !d.HasValue ? d : DateTime.SpecifyKind(d.Value, DateTimeKind.Utc))
    {
    }
}
