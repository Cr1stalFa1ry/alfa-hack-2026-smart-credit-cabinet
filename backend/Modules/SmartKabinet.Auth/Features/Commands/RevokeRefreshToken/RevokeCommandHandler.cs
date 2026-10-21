using Microsoft.EntityFrameworkCore;
using SmartKabinet.Auth.Infrastructure.Persistence;

namespace SmartKabinet.Auth.Features.Commands.RevokeRefreshToken;

public class RevokeCommandHandler
{
    private readonly AuthDbContext _dbContext;

    public RevokeCommandHandler(AuthDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> RevokeTokenAsync(string tokenString, CancellationToken cancellationToken = default)
    {
        var token = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(t => t.Token == tokenString, cancellationToken);

        if (token is null || !token.IsActive)
        {
            return false;
        }

        token.Revoke();
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task RevokeAllUserTokensAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var activeTokens = await _dbContext.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAt == null && t.ExpiresAt > DateTimeOffset.UtcNow)
            .ToListAsync(cancellationToken);

        foreach (var token in activeTokens)
        {
            token.Revoke();
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
