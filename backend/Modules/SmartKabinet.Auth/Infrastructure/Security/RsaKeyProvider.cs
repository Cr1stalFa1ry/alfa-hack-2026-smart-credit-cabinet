using System.Security.Cryptography;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace SmartKabinet.Auth.Infrastructure.Security;

public class RsaKeyProvider : IRsaKeyProvider
{
    private readonly JwtOptions _options;
    private readonly RsaSecurityKey _privateKey;
    private readonly RsaSecurityKey _publicKey;
    private readonly JsonWebKeySet _jwks;

    public RsaKeyProvider(IOptions<JwtOptions> options)
    {
        _options = options.Value;

        var rsa = LoadOrGenerateRsa();

        _privateKey = new RsaSecurityKey(rsa)
        {
            KeyId = _options.KeyId
        };

        var publicRsa = RSA.Create();
        publicRsa.ImportParameters(rsa.ExportParameters(false));
        _publicKey = new RsaSecurityKey(publicRsa)
        {
            KeyId = _options.KeyId
        };

        var jwk = JsonWebKeyConverter.ConvertFromRSASecurityKey(_publicKey);
        jwk.Use = "sig";
        jwk.Alg = SecurityAlgorithms.RsaSha256;
        jwk.Kid = _options.KeyId;

        _jwks = new JsonWebKeySet();
        _jwks.Keys.Add(jwk);
    }

    public RsaSecurityKey GetPrivateKey() => _privateKey;
    public RsaSecurityKey GetPublicKey() => _publicKey;
    public JsonWebKeySet GetJsonWebKeySet() => _jwks;

    private RSA LoadOrGenerateRsa()
    {
        var rsa = RSA.Create();

        // 1. Из строки PEM в конфигурации
        if (!string.IsNullOrWhiteSpace(_options.PrivateKeyPem))
        {
            rsa.ImportFromPem(_options.PrivateKeyPem);
            return rsa;
        }

        // 2. Из файла по указанному пути
        if (!string.IsNullOrWhiteSpace(_options.PrivateKeyPath) && File.Exists(_options.PrivateKeyPath))
        {
            var pem = File.ReadAllText(_options.PrivateKeyPath);
            rsa.ImportFromPem(pem);
            return rsa;
        }

        // 3. Из стандартной папки keys/
        var keysDir = Path.Combine(AppContext.BaseDirectory, "keys");
        var privateKeyPath = Path.Combine(keysDir, "jwt_rsa_private.pem");
        var publicKeyPath = Path.Combine(keysDir, "jwt_rsa_public.pem");

        if (File.Exists(privateKeyPath))
        {
            var pem = File.ReadAllText(privateKeyPath);
            rsa.ImportFromPem(pem);
            return rsa;
        }

        // 4. Автоматическая генерация нового 2048-битного ключа
        rsa = RSA.Create(2048);
        try
        {
            Directory.CreateDirectory(keysDir);
            File.WriteAllText(privateKeyPath, rsa.ExportPkcs8PrivateKeyPem());
            File.WriteAllText(publicKeyPath, rsa.ExportSubjectPublicKeyInfoPem());
        }
        catch
        {
            // В случае ограничений файловой системы используем сгенерированный в памяти
        }

        return rsa;
    }
}
