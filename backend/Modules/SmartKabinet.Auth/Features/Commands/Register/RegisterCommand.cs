using Microsoft.EntityFrameworkCore;
using SmartKabinet.Auth.Domain;
using SmartKabinet.Auth.Features.DTOs;
using SmartKabinet.Auth.Infrastructure.Persistence;
using SmartKabinet.Auth.Infrastructure.Security;

namespace SmartKabinet.Auth.Features.Commands.Register;

public record RegisterClientRequest(
    string Username,
    string Password,
    string Inn,
    string FirstName,
    string LastName,
    string? MiddleName = null
);

public class RegisterHandler
{
    private readonly AuthDbContext _dbContext;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtProvider _jwtProvider;
    private readonly IRefreshTokenProvider _refreshTokenProvider;

    public RegisterHandler(
        AuthDbContext dbContext,
        IPasswordHasher passwordHasher,
        IJwtProvider jwtProvider,
        IRefreshTokenProvider refreshTokenProvider)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _jwtProvider = jwtProvider;
        _refreshTokenProvider = refreshTokenProvider;
    }

    public async Task<(AuthResponse? Response, string? Error)> HandleAsync(
        RegisterClientRequest request, 
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return (null, "Username and password are required.");
        }

        if (string.IsNullOrWhiteSpace(request.Inn) || request.Inn.Length != 12 || !request.Inn.All(char.IsDigit))
        {
            return (null, "ИНН индивидуального предпринимателя должен состоять из 12 цифр.");
        }

        var exists = await _dbContext.Users.AnyAsync(
            u => u.Username.ToLower() == request.Username.ToLower() || u.Inn == request.Inn, 
            cancellationToken);

        if (exists)
        {
            return (null, "Пользователь с таким именем или ИНН уже зарегистрирован.");
        }

        var user = new User
        {
            UserId = Guid.NewGuid(),
            Username = request.Username,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            Inn = request.Inn,
            FirstName = request.FirstName,
            LastName = request.LastName,
            MiddleName = request.MiddleName,
            Role = UserRole.Client,
            IsActive = true
        };

        var accessToken = _jwtProvider.GenerateToken(user);
        var refreshToken = _refreshTokenProvider.GenerateRefreshToken(user.UserId);

        _dbContext.Users.Add(user);
        _dbContext.RefreshTokens.Add(refreshToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

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
