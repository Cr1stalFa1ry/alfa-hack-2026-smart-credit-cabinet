using System.Security.Cryptography;
using Microsoft.Extensions.Options;
using SmartKabinet.Auth.Domain;

namespace SmartKabinet.Auth.Infrastructure.Security;

public interface IRefreshTokenProvider
{
    RefreshToken GenerateRefreshToken(Guid userId);
}

public class RefreshTokenProvider : IRefreshTokenProvider
{
    private readonly JwtOptions _options;

    public RefreshTokenProvider(IOptions<JwtOptions> options)
    {
        _options = options.Value;
    }

    public RefreshToken GenerateRefreshToken(Guid userId)
    {
        var randomBytes = RandomNumberGenerator.GetBytes(32);
        var tokenString = Convert.ToBase64String(randomBytes);

        return new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Token = tokenString,
            CreatedAt = DateTimeOffset.UtcNow,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(_options.RefreshTokenExpireDays)
        };
    }
}
