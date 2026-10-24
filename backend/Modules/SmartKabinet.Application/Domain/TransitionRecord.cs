namespace SmartKabinet.Application.Domain;

public class TransitionRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ApplicationId { get; set; }
    public ApplicationStatus FromStatus { get; set; }
    public ApplicationStatus ToStatus { get; set; }
    public string Actor { get; set; } = string.Empty; // "client", "system", "analyst"
    public string? ReasonCode { get; set; }
    public string? Comment { get; set; }
    public DateTimeOffset Timestamp { get; set; } = DateTimeOffset.UtcNow;
}
