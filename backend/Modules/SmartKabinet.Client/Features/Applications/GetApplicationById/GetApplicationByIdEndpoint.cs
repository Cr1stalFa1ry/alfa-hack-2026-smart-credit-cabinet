using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Auth.Infrastructure.Security;
using SmartKabinet.Shared;

namespace SmartKabinet.Client.Features.Applications.GetApplicationById;

public static class GetApplicationByIdEndpoint
{
    public static RouteGroupBuilder MapGetApplicationByIdEndpoint(this RouteGroupBuilder group)
    {
        // GET /api/client/applications/{id}
        group.MapGet("/{id:guid}", async (
            Guid id,
            IUserContext userContext,
            IGetApplication service,
            CancellationToken ct) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsClient) return Results.Forbid();

            var result = await service.GetAsync(id, userContext.UserId.Value, ct);
            return result.ToHttpResult();
        })
        .RequireAuthorization(AuthPolicies.ClientOnly)
        .WithName("GetClientApplicationById")
        .WithSummary("Просмотр заявки клиентом (без отображения внутренних баллов/DSCR)");

        return group;
    }
}
