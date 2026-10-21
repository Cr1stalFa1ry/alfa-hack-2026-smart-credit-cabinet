using Microsoft.IdentityModel.Tokens;

namespace SmartKabinet.Auth.Infrastructure.Security;

public interface IRsaKeyProvider
{
    RsaSecurityKey GetPrivateKey();
    RsaSecurityKey GetPublicKey();
    JsonWebKeySet GetJsonWebKeySet();
}
