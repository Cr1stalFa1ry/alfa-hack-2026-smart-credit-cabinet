namespace SmartKabinet.Application.Domain;

public class ApplicationDocument
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ApplicationId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FileKey { get; set; } = string.Empty;
    public string FileType { get; set; } = "other"; // bank_statement, tax_declaration, business_plan, equipment_invoice, passport, other
    public long FileSizeBytes { get; set; }
    public string Status { get; set; } = "uploaded"; // uploaded, verified, rejected
    public DateTimeOffset UploadedAt { get; set; } = DateTimeOffset.UtcNow;
}
