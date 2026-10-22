using Microsoft.EntityFrameworkCore;
using SmartKabinet.Auth.Features.DTOs;
using SmartKabinet.Auth.Infrastructure.Persistence;
using SmartKabinet.Auth.Infrastructure.Security;

namespace SmartKabinet.Auth.Features.Commands.Login;

public class LoginHandler
{
    private readonly AuthDbContext _dbContext;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtProvider _jwtProvider;
    private readonly IRefreshTokenProvider _refreshTokenProvider;

    public LoginHandler(
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

    public async Task<AuthResponse?> HandleAsync(LoginClientRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Username.ToLower() == request.Username.ToLower() && u.IsActive, cancellationToken);

        if (user is null)
        {
            return null;
        }

        if (!_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            return null;
        }

        user.UpdateLastLogin();

        var accessToken = _jwtProvider.GenerateToken(user);
        var refreshToken = _refreshTokenProvider.GenerateRefreshToken(user.UserId);

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

        return new AuthResponse(
            accessToken,
            refreshToken.Token,
            3600,
            profile
        );
    }
}
