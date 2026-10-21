namespace SmartKabinet.Auth.Domain;

public class User
{
    public Guid UserId { get; set; } = Guid.NewGuid();
    
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    
    /// <summary>
    /// ИНН индивидуального предпринимателя (12 цифр для ИП).
    /// Заполняется только для пользователей с ролью Client. Для сотрудников банка равен null.
    /// </summary>
    public string? Inn { get; set; }
    
    public UserRole Role { get; set; } = UserRole.Client;
    public bool IsActive { get; set; } = true;
    
    public DateTimeOffset? LastLoginAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }

    public List<RefreshToken> RefreshTokens { get; set; } = new();
    
    public void UpdateLastLogin()
    {
        LastLoginAt = DateTimeOffset.UtcNow;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}

public enum UserRole
{
    Admin = 1,
    Client = 2,
    Analyst = 3,
}
