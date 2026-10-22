namespace SmartKabinet.Auth.Features.Commands.Register;

public record RegisterClientRequest(
    string Username,
    string Password,
    string FirstName,
    string LastName,
    string? MiddleName = null,
    string? Inn = null
);