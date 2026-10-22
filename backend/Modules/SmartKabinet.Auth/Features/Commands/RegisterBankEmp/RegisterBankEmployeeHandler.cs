using Microsoft.EntityFrameworkCore;
using SmartKabinet.Auth.Contracts;
using SmartKabinet.Auth.Domain;
using SmartKabinet.Auth.Features.DTOs;
using SmartKabinet.Auth.Infrastructure.Persistence;
using SmartKabinet.Auth.Infrastructure.Security;
using Wolverine;

namespace SmartKabinet.Auth.Features.Commands.RegisterBankEmp;

public class RegisterBankEmployeeHandler
{
    private readonly AuthDbContext _dbContext;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtProvider _jwtProvider;
    private readonly IRefreshTokenProvider _refreshTokenProvider;
    private readonly IMessageBus _messageBus;

    public RegisterBankEmployeeHandler(
        AuthDbContext dbContext,
        IPasswordHasher passwordHasher,
        IJwtProvider jwtProvider,
        IRefreshTokenProvider refreshTokenProvider,
        IMessageBus messageBus)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _jwtProvider = jwtProvider;
        _refreshTokenProvider = refreshTokenProvider;
        _messageBus = messageBus;
    }

    public async Task<(AuthResponse? Response, string? Error)> HandleAsync(
        RegisterBankEmployeeRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return (null, "Username and password are required.");
        }

        var exists = await _dbContext.Users.AnyAsync(
            u => u.Username.ToLower() == request.Username.ToLower(),
            cancellationToken);

        if (exists)
        {
            return (null, "Пользователь с таким логином уже существует.");
        }

        var user = new User
        {
            UserId = Guid.NewGuid(),
            Username = request.Username,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            MiddleName = request.MiddleName,
            Inn = null, // У сотрудника банка нет ИНН предпринимателя
            Role = UserRole.Analyst,
            IsActive = true
        };

        var accessToken = _jwtProvider.GenerateToken(user);
        var refreshToken = _refreshTokenProvider.GenerateRefreshToken(user.UserId);

        _dbContext.Users.Add(user);
        _dbContext.RefreshTokens.Add(refreshToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Публикуем событие регистрации сотрудника банка через Wolverine
        await _messageBus.PublishAsync(new BankEmployeeRegistered(
            user.UserId,
            user.Username,
            user.FirstName,
            user.LastName,
            DateTimeOffset.UtcNow
        ));

        var profile = new UserProfileDto(
            user.UserId,
            user.Username,
            user.FirstName,
            user.LastName,
            user.MiddleName,
            user.Inn,
            user.Role.ToString().ToLowerInvariant()
        );

        return (new AuthResponse(accessToken, refreshToken.Token, 3600, profile), null);
    }
}
