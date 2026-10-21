namespace SmartKabinet.Auth.Contracts;

public record BankEmployeeRegistered(
    Guid UserId,
    string Username,
    string FirstName,
    string LastName,
    DateTimeOffset RegisteredAt
);
