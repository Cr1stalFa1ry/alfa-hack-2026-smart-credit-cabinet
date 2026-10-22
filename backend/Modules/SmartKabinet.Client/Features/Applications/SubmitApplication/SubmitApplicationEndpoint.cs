using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SmartKabinet.Application.Commands;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Auth.Infrastructure.Security;

namespace SmartKabinet.Client.Features.Applications.SubmitApplication;

public static class SubmitApplicationEndpoint
{
    public static RouteGroupBuilder MapSubmitApplicationEndpoint(this RouteGroupBuilder group)
    {
        // POST /api/client/applications/{id}/submit (T03)
        group.MapPost("/{id:guid}/submit", async (
            Guid id,
            IUserContext userContext,
            ISubmitApplication service,
            CancellationToken ct) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();

            try
            {
                var cmd = new SubmitApplicationCommand(id, userContext.UserId.Value);
                await service.SubmitAsync(cmd, ct);

                return Results.Ok(new { message = "Заявка успешно отправлена на проверку", applicationId = id, status = "checking" });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .RequireAuthorization()
        .WithName("SubmitApplication")
        .WithSummary("T03: Отправка заявки на проверку (переход в checking)");

        return group;
    }
}
