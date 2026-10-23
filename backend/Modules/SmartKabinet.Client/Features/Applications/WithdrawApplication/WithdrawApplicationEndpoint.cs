using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SmartKabinet.Application.Commands;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Auth.Infrastructure.Security;
using SmartKabinet.Shared;

namespace SmartKabinet.Client.Features.Applications.WithdrawApplication;

public static class WithdrawApplicationEndpoint
{
    public static RouteGroupBuilder MapWithdrawApplicationEndpoint(this RouteGroupBuilder group)
    {
        // POST /api/client/applications/{id}/withdraw (T17)
        group.MapPost("/{id:guid}/withdraw", async (
            Guid id,
            IUserContext userContext,
            IWithdrawApplication service,
            CancellationToken ct) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();

            var cmd = new WithdrawCommand(id, userContext.UserId.Value);
            var result = await service.WithdrawAsync(cmd, ct);

            return result.ToHttpResult(() =>
                Results.Ok(new { message = "Заявка успешно отозвана и закрыта", applicationId = id, status = "closed" }));
        })
        .RequireAuthorization()
        .WithName("WithdrawApplication")
        .WithSummary("T17: Отзыв заявки клиентом (переход в closed)");

        return group;
    }
}
