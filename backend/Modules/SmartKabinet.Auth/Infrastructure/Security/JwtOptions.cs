namespace SmartKabinet.Auth.Infrastructure.Security;

public class JwtOptions
{
    public const string SectionName = "JwtOptions";

    public string Issuer { get; set; } = "SmartKabinet";
    public string Audience { get; set; } = "SmartKabinetApp";
    public int ExpireMinutes { get; set; } = 60;
    public int RefreshTokenExpireDays { get; set; } = 7;

    public string KeyId { get; set; } = "smart-kabinet-rsa-key-1";
    public string? PrivateKeyPem { get; set; }
    public string? PublicKeyPem { get; set; }
    public string? PrivateKeyPath { get; set; }
    public string? PublicKeyPath { get; set; }
}
