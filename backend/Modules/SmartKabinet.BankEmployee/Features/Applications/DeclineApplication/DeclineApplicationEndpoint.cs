using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SmartKabinet.Auth.Infrastructure.Security;
using SmartKabinet.BankEmployee.Features.Applications.Common;
using SmartKabinet.Shared;

namespace SmartKabinet.BankEmployee.Features.Applications.DeclineApplication;

public static class DeclineApplicationEndpoint
{
    public static RouteGroupBuilder MapDeclineApplicationEndpoint(this RouteGroupBuilder group)
    {
        // POST /api/employee/applications/{id}/decline (T13)
        group.MapPost("/{id:guid}/decline", async (
            Guid id,
            AnalystDecisionRequest request,
            IUserContext userContext,
            DeclineApplicationHandler handler,
            CancellationToken ct) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsBankEmployee) return Results.Forbid();

            var command = new DeclineApplicationCommand(
                id,
                request.ReasonCode,
                request.Comment);

            var result = await handler.Handle(command, ct);
            return result.ToHttpResult();
        })
        .RequireAuthorization(AuthPolicies.EmployeeOnly)
        .WithName("AnalystDeclineApplication")
        .WithSummary("T13: Отказ аналитика (переход в declined)");

        return group;
    }
}
