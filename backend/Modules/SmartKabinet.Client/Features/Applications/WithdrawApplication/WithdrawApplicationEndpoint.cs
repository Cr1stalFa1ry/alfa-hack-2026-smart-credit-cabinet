using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SmartKabinet.Application.Commands;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Auth.Infrastructure.Security;

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

            try
            {
                var cmd = new WithdrawCommand(id, userContext.UserId.Value);
                await service.WithdrawAsync(cmd, ct);

                return Results.Ok(new { message = "Заявка успешно отозвана и закрыта", applicationId = id, status = "closed" });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .RequireAuthorization()
        .WithName("WithdrawApplication")
        .WithSummary("T17: Отзыв заявки клиентом (переход в closed)");

        return group;
    }
}
