using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SmartKabinet.Application.Commands;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Auth.Infrastructure.Security;
using SmartKabinet.Shared;

namespace SmartKabinet.Client.Features.Applications.RetryApplicationCheck;

public static class RetryApplicationCheckEndpoint
{
    public static RouteGroupBuilder MapRetryApplicationCheckEndpoint(this RouteGroupBuilder group)
    {
        // POST /api/client/applications/{id}/retry-check (T06)
        group.MapPost("/{id:guid}/retry-check", async (
            Guid id,
            IUserContext userContext,
            IRetryCheck service,
            CancellationToken ct) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();

            var cmd = new RetryCheckCommand(id, userContext.UserId.Value);
            var result = await service.RetryCheckAsync(cmd, ct);

            return result.ToHttpResult(() =>
                Results.Ok(new { message = "Повторная проверка запущена", applicationId = id, status = "checking" }));
        })
        .RequireAuthorization()
        .WithName("RetryApplicationCheck")
        .WithSummary("T06: Повторный запуск проверки клиентом (из waiting_check в checking)");

        return group;
    }
}
