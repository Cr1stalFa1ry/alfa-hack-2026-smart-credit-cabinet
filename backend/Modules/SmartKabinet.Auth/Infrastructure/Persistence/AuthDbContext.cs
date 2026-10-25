using Microsoft.EntityFrameworkCore;
using SmartKabinet.Auth.Domain;

namespace SmartKabinet.Auth.Infrastructure.Persistence;

public class AuthDbContext : DbContext
{
    public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.HasDefaultSchema("auth");

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.UserId);
            entity.Property(u => u.Username).IsRequired().HasMaxLength(100);
            entity.HasIndex(u => u.Username).IsUnique();
            entity.Property(u => u.PasswordHash).IsRequired();
            entity.Property(u => u.Inn).HasMaxLength(12);
            entity.HasIndex(u => u.Inn);
            entity.Property(u => u.Role).HasConversion<int>();

            entity.HasMany(u => u.RefreshTokens)
                .WithOne(t => t.User)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Token).IsRequired().HasMaxLength(256);
            entity.HasIndex(t => t.Token).IsUnique();
            entity.HasIndex(t => t.UserId);
        });
    }
}
