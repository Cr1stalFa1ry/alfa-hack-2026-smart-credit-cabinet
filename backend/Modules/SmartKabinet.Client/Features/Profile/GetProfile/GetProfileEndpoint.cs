using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using SmartKabinet.Auth.Infrastructure.Security;
using SmartKabinet.Client.Infrastructure.Persistence;

namespace SmartKabinet.Client.Features.Profile.GetProfile;

public static class GetProfileEndpoint
{
    public static RouteGroupBuilder MapGetProfileEndpoint(this RouteGroupBuilder group)
    {
        // GET /api/client/profile
        group.MapGet("/profile", async (
            IUserContext userContext,
            ClientDbContext dbContext) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsClient) return Results.Forbid();

            var profile = await dbContext.Clients.FirstOrDefaultAsync(c => c.UserId == userContext.UserId.Value);
            return profile is not null 
                ? Results.Ok(profile) 
                : Results.NotFound(new { error = "Профиль клиента не найден." });
        })
        .RequireAuthorization(AuthPolicies.ClientOnly)
        .WithName("GetClientProfile")
        .WithSummary("Получение профиля текущего клиента ИП");

        return group;
    }
}
