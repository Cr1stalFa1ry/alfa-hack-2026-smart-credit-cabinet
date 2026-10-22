namespace SmartKabinet.BankEmployee.Domain;

public class BankEmployeeProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Role { get; set; } = "Analyst";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
