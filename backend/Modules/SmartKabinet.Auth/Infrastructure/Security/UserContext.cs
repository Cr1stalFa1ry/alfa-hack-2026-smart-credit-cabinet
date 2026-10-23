using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using SmartKabinet.Auth.Domain;

namespace SmartKabinet.Auth.Infrastructure.Security;

public interface IUserContext
{
    Guid? UserId { get; }
    string? Username { get; }
    string? Inn { get; }
    UserRole? Role { get; }
    bool IsAuthenticated { get; }
    bool IsClient { get; }
    bool IsBankEmployee { get; }
}

public class UserContext : IUserContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public UserContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

    public Guid? UserId
    {
        get
        {
            var value = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                        ?? User?.FindFirst("userId")?.Value 
                        ?? User?.FindFirst("sub")?.Value;

            return Guid.TryParse(value, out var id) ? id : null;
        }
    }

    public string? Username =>
        User?.FindFirst(ClaimTypes.Name)?.Value 
        ?? User?.FindFirst("username")?.Value;

    public string? Inn =>
        User?.FindFirst("inn")?.Value;

    public UserRole? Role
    {
        get
        {
            var value = User?.FindFirst(ClaimTypes.Role)?.Value 
                        ?? User?.FindFirst("role")?.Value;

            if (string.Equals(value, "bankemployee", StringComparison.OrdinalIgnoreCase))
            {
                return UserRole.Analyst;
            }

            return Enum.TryParse<UserRole>(value, true, out var role) ? role : null;
        }
    }

    public bool IsClient => Role == UserRole.Client;

    public bool IsBankEmployee => Role is UserRole.Analyst or UserRole.Admin;
}
