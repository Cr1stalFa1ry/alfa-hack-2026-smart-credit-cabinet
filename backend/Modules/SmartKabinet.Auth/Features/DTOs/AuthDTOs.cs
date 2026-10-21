namespace SmartKabinet.Auth.Features.DTOs;

public record UserProfileDto(
    Guid UserId,
    string Username,
    string FirstName,
    string LastName,
    string? MiddleName,
    string? Inn,
    string Role
);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    int ExpiresInSeconds,
    UserProfileDto User
);
