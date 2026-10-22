using Microsoft.EntityFrameworkCore;
using SmartKabinet.Auth.Features.DTOs;
using SmartKabinet.Auth.Infrastructure.Persistence;
using SmartKabinet.Auth.Infrastructure.Security;

namespace SmartKabinet.Auth.Features.Commands.LoginBankEmp;

public class LoginBankEmpHandler
{
    public static async Task<AuthResponse?> Handle(
        LoginBankEmpCommand request,
        AuthDbContext dbContext,
        IPasswordHasher passwordHasher,
        IJwtProvider jwtProvider,
        IRefreshTokenProvider refreshTokenProvider,
        CancellationToken ct)
    {
        var user = await dbContext.Users
            .FirstOrDefaultAsync(u => u.Username.ToLower() == request.Username.ToLower() && u.IsActive, ct);

        if (user is null)
        {
            return null;
        }

        if (!passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            return null;
        }

        user.UpdateLastLogin();

        var accessToken = jwtProvider.GenerateToken(user);
        var refreshToken = refreshTokenProvider.GenerateRefreshToken(user.UserId);

        dbContext.RefreshTokens.Add(refreshToken);
        await dbContext.SaveChangesAsync(ct);

        var profile = new UserProfileDto(
            user.UserId,
            user.Username,
            user.FirstName,
            user.LastName,
            user.MiddleName,
            user.Inn,
            user.Role.ToString().ToLowerInvariant()
        );

        return new AuthResponse(
            accessToken,
            refreshToken.Token,
            3600,
            profile
        );
    }
}