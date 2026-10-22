namespace SmartKabinet.Auth.Features.Commands.RegisterBankEmp;

public record RegisterBankEmployeeRequest(
    string Username,
    string Password,
    string FirstName,
    string LastName,
    string? MiddleName = null
);
