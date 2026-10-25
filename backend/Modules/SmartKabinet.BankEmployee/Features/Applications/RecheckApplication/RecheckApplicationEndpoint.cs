using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SmartKabinet.Auth.Infrastructure.Security;
using SmartKabinet.Shared;

namespace SmartKabinet.BankEmployee.Features.Applications.RecheckApplication;

public static class RecheckApplicationEndpoint
{
    public static RouteGroupBuilder MapRecheckApplicationEndpoint(this RouteGroupBuilder group)
    {
        // POST /api/employee/applications/{id}/recheck (T14)
        group.MapPost("/{id:guid}/recheck", async (
            Guid id,
            IUserContext userContext,
            RecheckApplicationHandler handler,
            CancellationToken ct) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsBankEmployee) return Results.Forbid();

            var command = new RecheckApplicationCommand(id);
            var result = await handler.Handle(command, ct);
            return result.ToHttpResult();
        })
        .RequireAuthorization(AuthPolicies.EmployeeOnly)
        .WithName("AnalystRecheckApplication")
        .WithSummary("T14: Уточнены факты аналитиком, возврат на автопроверку (переход в checking)");

        return group;
    }
}
