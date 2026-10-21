using Microsoft.EntityFrameworkCore;
using SmartKabinet.Auth.Features.DTOs;
using SmartKabinet.Auth.Infrastructure.Persistence;
using SmartKabinet.Auth.Infrastructure.Security;

namespace SmartKabinet.Auth.Features.Queries;

public class GetCurrentUserQueryHandler
{
    private readonly AuthDbContext _dbContext;
    private readonly IUserContext _userContext;

    public GetCurrentUserQueryHandler(AuthDbContext dbContext, IUserContext userContext)
    {
        _dbContext = dbContext;
        _userContext = userContext;
    }

    public async Task<UserProfileDto?> HandleAsync(CancellationToken cancellationToken = default)
    {
        if (!_userContext.IsAuthenticated || _userContext.UserId is null)
        {
            return null;
        }

        var user = await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == _userContext.UserId && u.IsActive, cancellationToken);

        if (user is null)
        {
            return null;
        }

        return new UserProfileDto(
            user.UserId,
            user.Username,
            user.FirstName,
            user.LastName,
            user.MiddleName,
            user.Inn,
            user.Role.ToString().ToLowerInvariant()
        );
    }
}
