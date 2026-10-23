using Microsoft.EntityFrameworkCore;
using SmartKabinet.Auth.Features.DTOs;
using SmartKabinet.Auth.Infrastructure.Persistence;
using SmartKabinet.Auth.Infrastructure.Security;
using SmartKabinet.Shared;

namespace SmartKabinet.Auth.Features.Commands.LoginBankEmp;

public class LoginBankEmpHandler
{
    public static async Task<Result<AuthResponse>> Handle(
        LoginBankEmpCommand request,
        AuthDbContext dbContext,
        IPasswordHasher passwordHasher,
        IJwtProvider jwtProvider,
        IRefreshTokenProvider refreshTokenProvider,
        CancellationToken ct)
    {
        var user = await dbContext.Users
            .FirstOrDefaultAsync(u => u.Username.ToLower() == request.Username.ToLower() && u.IsActive, ct);

        if (user is null || !passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            return Error.Unauthorized("Auth.InvalidCredentials", "Неверный логин или пароль.");
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

        return Result.Success(new AuthResponse(
            accessToken,
            refreshToken.Token,
            3600,
            profile
        ));
    }
}