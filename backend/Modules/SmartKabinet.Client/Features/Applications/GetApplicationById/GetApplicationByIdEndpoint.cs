using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Auth.Infrastructure.Security;

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

            var appDto = await service.GetAsync(id, userContext.UserId.Value, ct);
            return appDto is not null
                ? Results.Ok(appDto)
                : Results.NotFound(new { error = "Заявка не найдена." });
        })
        .RequireAuthorization()
        .WithName("GetClientApplicationById")
        .WithSummary("Просмотр заявки клиентом (без отображения внутренних баллов/DSCR)");

        return group;
    }
}
