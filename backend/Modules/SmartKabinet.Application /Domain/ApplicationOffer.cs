namespace SmartKabinet.Application.Domain;

public class ApplicationOffer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public decimal ApprovedAmount { get; set; }
    public int TermMonths { get; set; }
    public decimal AnnualRatePercent { get; set; }
    public decimal MonthlyPayment { get; set; }
    public bool IsCounterOffer { get; set; }
    public string? ReasonCode { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
