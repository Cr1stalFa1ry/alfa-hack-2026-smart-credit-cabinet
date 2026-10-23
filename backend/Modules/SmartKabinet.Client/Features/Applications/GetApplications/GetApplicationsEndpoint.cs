using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Auth.Infrastructure.Security;

namespace SmartKabinet.Client.Features.Applications.GetApplications;

public static class GetApplicationsEndpoint
{
    public static RouteGroupBuilder MapGetApplicationsEndpoint(this RouteGroupBuilder group)
    {
        // GET /api/client/applications
        group.MapGet("/", async (
            IUserContext userContext,
            IApplicationModule service,
            CancellationToken ct) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsClient) return Results.Forbid();

            var list = await service.ListForClientAsync(userContext.UserId.Value, ct);
            return Results.Ok(list);
        })
        .RequireAuthorization(AuthPolicies.ClientOnly)
        .WithName("GetClientApplications")
        .WithSummary("Список всех заявок текущего клиента ИП");

        return group;
    }
}
