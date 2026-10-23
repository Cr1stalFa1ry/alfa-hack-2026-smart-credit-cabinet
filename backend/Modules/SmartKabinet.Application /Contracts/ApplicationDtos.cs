namespace SmartKabinet.Application.Contracts;

public readonly record struct ApplicationId(Guid Value)
{
    public static implicit operator Guid(ApplicationId id) => id.Value;
    public static implicit operator ApplicationId(Guid value) => new(value);
    public override string ToString() => Value.ToString();
}

public record ApplicationListItemDto(
    Guid Id,
    string Inn,
    string Status,
    string Decision,
    string ProductCode,
    decimal RequestedAmount,
    int? RequestedTermMonths,
    IReadOnlyList<string> ClientReasonTexts,
    bool HasOffer,
    DateTimeOffset CreatedAt
);

public record ApplicationDto(
    Guid Id,
    Guid ClientId,
    string Inn,
    string Status,
    string Decision,
    string ProductCode,
    decimal RequestedAmount,
    decimal OwnContribution,
    int? RequestedTermMonths,
    IReadOnlyList<string> ReasonCodes,
    IReadOnlyList<string> ClientReasonTexts,
    ApplicationOfferDto? Offer,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt
);
