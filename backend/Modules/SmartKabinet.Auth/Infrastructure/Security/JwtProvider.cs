using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SmartKabinet.Auth.Domain;

namespace SmartKabinet.Auth.Infrastructure.Security;

public interface IJwtProvider
{
    string GenerateToken(User user);
}

public class JwtProvider : IJwtProvider
{
    private readonly JwtOptions _options;
    private readonly IRsaKeyProvider _keyProvider;

    public JwtProvider(IOptions<JwtOptions> options, IRsaKeyProvider keyProvider)
    {
        _options = options.Value;
        _keyProvider = keyProvider;
    }

    public string GenerateToken(User user)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
            new(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new("userId", user.UserId.ToString()),
            new(ClaimTypes.Name, user.Username),
            new("username", user.Username),
            new(ClaimTypes.Role, user.Role.ToString()),
            new(ClaimTypes.Role, user.Role.ToString().ToLowerInvariant()),
            new("role", user.Role.ToString()),
            new("role", user.Role.ToString().ToLowerInvariant())
        };

        if (user.Role is UserRole.Analyst or UserRole.Admin)
        {
            claims.Add(new(ClaimTypes.Role, "BankEmployee"));
            claims.Add(new(ClaimTypes.Role, "bankemployee"));
            claims.Add(new("role", "BankEmployee"));
            claims.Add(new("role", "bankemployee"));
        }

        // ИНН привязывается к токену только для роли Client (индивидуального предпринимателя)
        if (user.Role == UserRole.Client && !string.IsNullOrWhiteSpace(user.Inn))
        {
            claims.Add(new Claim("inn", user.Inn));
        }

        var privateKey = _keyProvider.GetPrivateKey();
        var credentials = new SigningCredentials(privateKey, SecurityAlgorithms.RsaSha256);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(_options.ExpireMinutes),
            SigningCredentials = credentials,
            Issuer = string.IsNullOrWhiteSpace(_options.Issuer) ? null : _options.Issuer,
            Audience = string.IsNullOrWhiteSpace(_options.Audience) ? null : _options.Audience
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }
}
