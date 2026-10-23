using Microsoft.EntityFrameworkCore;
using SmartKabinet.Auth.Contracts;
using SmartKabinet.Auth.Domain;
using SmartKabinet.Auth.Features.DTOs;
using SmartKabinet.Auth.Infrastructure.Persistence;
using SmartKabinet.Auth.Infrastructure.Security;
using SmartKabinet.Shared;
using Wolverine;

namespace SmartKabinet.Auth.Features.Commands.Register;

public class RegisterHandler
{
    private readonly AuthDbContext _dbContext;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtProvider _jwtProvider;
    private readonly IRefreshTokenProvider _refreshTokenProvider;
    private readonly IMessageBus _messageBus;

    public RegisterHandler(
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

    public async Task<Result<AuthResponse>> HandleAsync(
        RegisterClientRequest request, 
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return Error.Validation("Auth.MissingFields", "Username and password are required.");
        }

        var exists = await _dbContext.Users.AnyAsync(
            u => u.Username.ToLower() == request.Username.ToLower(), 
            cancellationToken);

        if (exists)
        {
            return Error.Conflict("Auth.UserExists", "Пользователь с таким именем уже зарегистрирован.");
        }

        var user = new User
        {
            UserId = Guid.NewGuid(),
            Username = request.Username,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            MiddleName = request.MiddleName,
            Inn = request.Inn,
            Role = UserRole.Client,
            IsActive = true
        };

        var accessToken = _jwtProvider.GenerateToken(user);
        var refreshToken = _refreshTokenProvider.GenerateRefreshToken(user.UserId);

        _dbContext.Users.Add(user);
        _dbContext.RefreshTokens.Add(refreshToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Публикация события в шину Wolverine для других модулей (SmartKabinet.Client)
        await _messageBus.PublishAsync(new ClientRegistered(
            user.UserId,
            user.Username,
            user.Inn ?? string.Empty,
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

        return Result.Success(new AuthResponse(accessToken, refreshToken.Token, 3600, profile));
    }
}
