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

    /// <summary>
    /// Сидирование тестовых учетных записей согласно спецификации хакатона
    /// </summary>
    public static void SeedDefaultUsers(AuthDbContext context, Security.IPasswordHasher passwordHasher)
    {
        var defaultPasswordHash = passwordHasher.HashPassword("password123");
        var analystPasswordHash = passwordHasher.HashPassword("analyst123");
        var adminPasswordHash = passwordHasher.HashPassword("admin123");

        var users = new List<User>
        {
            new()
            {
                UserId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Username = "client1",
                PasswordHash = defaultPasswordHash,
                FirstName = "Иван",
                LastName = "Иванов",
                Inn = "500100000011",
                Role = UserRole.Client
            },
            new()
            {
                UserId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Username = "client2",
                PasswordHash = defaultPasswordHash,
                FirstName = "Анна",
                LastName = "Сидорова",
                Inn = "500100000022",
                Role = UserRole.Client
            },
            new()
            {
                UserId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                Username = "client3",
                PasswordHash = defaultPasswordHash,
                FirstName = "Алексей",
                LastName = "Кузнецов",
                Inn = "500100000033",
                Role = UserRole.Client
            },
            new()
            {
                UserId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                Username = "client4",
                PasswordHash = defaultPasswordHash,
                FirstName = "Елена",
                LastName = "Новикова",
                Inn = "500100000044",
                Role = UserRole.Client
            },
            new()
            {
                UserId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
                Username = "client5",
                PasswordHash = defaultPasswordHash,
                FirstName = "Михаил",
                LastName = "Петров",
                Inn = "500100000077",
                Role = UserRole.Client
            },
            new()
            {
                UserId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                Username = "analyst",
                PasswordHash = analystPasswordHash,
                FirstName = "Сергей",
                LastName = "Андеррайтер",
                Inn = null, // У сотрудника банка нет ИНН ИП
                Role = UserRole.Analyst
            },
            new()
            {
                UserId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                Username = "admin",
                PasswordHash = adminPasswordHash,
                FirstName = "Системный",
                LastName = "Администратор",
                Inn = null,
                Role = UserRole.Admin
            }
        };

        foreach (var u in users)
        {
            if (!context.Users.Any(existing => existing.Username.ToLower() == u.Username.ToLower()))
            {
                context.Users.Add(u);
            }
        }
        context.SaveChanges();
    }
}
