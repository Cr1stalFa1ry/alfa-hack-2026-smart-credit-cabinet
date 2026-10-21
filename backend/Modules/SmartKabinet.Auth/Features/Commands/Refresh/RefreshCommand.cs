using Microsoft.EntityFrameworkCore;
using SmartKabinet.Auth.Features.DTOs;
using SmartKabinet.Auth.Infrastructure.Persistence;
using SmartKabinet.Auth.Infrastructure.Security;

namespace SmartKabinet.Auth.Features.Commands.Refresh;

public record RefreshTokenRequest(string? RefreshToken);

public class RefreshHandler
{
    private readonly AuthDbContext _dbContext;
    private readonly IJwtProvider _jwtProvider;
    private readonly IRefreshTokenProvider _refreshTokenProvider;

    public RefreshHandler(
        AuthDbContext dbContext,
        IJwtProvider jwtProvider,
        IRefreshTokenProvider refreshTokenProvider)
    {
        _dbContext = dbContext;
        _jwtProvider = jwtProvider;
        _refreshTokenProvider = refreshTokenProvider;
    }

    public async Task<AuthResponse?> HandleAsync(string? tokenString, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(tokenString))
        {
            return null;
        }

        var token = await _dbContext.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == tokenString, cancellationToken);

        if (token is null || !token.IsActive || token.User is null || !token.User.IsActive)
        {
            return null;
        }

        // Token rotation: revoke old token and generate new pair
        var newRefreshToken = _refreshTokenProvider.GenerateRefreshToken(token.UserId);
        token.Revoke(newRefreshToken.Token);

        var newAccessToken = _jwtProvider.GenerateToken(token.User);

        _dbContext.RefreshTokens.Add(newRefreshToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var profile = new UserProfileDto(
            token.User.UserId,
            token.User.Username,
            token.User.FirstName,
            token.User.LastName,
            token.User.MiddleName,
            token.User.Inn,
            token.User.Role.ToString().ToLowerInvariant()
        );

        return new AuthResponse(newAccessToken, newRefreshToken.Token, 3600, profile);
    }
}
