namespace SmartKabinet.Auth.Contracts;

public record ClientRegistered(
    Guid UserId,
    string Username,
    string Inn,
    string FirstName,
    string LastName,
    DateTimeOffset RegisteredAt
);
