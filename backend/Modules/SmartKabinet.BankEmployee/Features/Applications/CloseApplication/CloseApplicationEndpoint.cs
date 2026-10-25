using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SmartKabinet.Auth.Infrastructure.Security;
using SmartKabinet.BankEmployee.Features.Applications.Common;
using SmartKabinet.Shared;

namespace SmartKabinet.BankEmployee.Features.Applications.CloseApplication;

public static class CloseApplicationEndpoint
{
    public static RouteGroupBuilder MapCloseApplicationEndpoint(this RouteGroupBuilder group)
    {
        // POST /api/employee/applications/{id}/close (T16: Некредитное препятствие)
        group.MapPost("/{id:guid}/close", async (
            Guid id,
            AnalystDecisionRequest request,
            IUserContext userContext,
            CloseApplicationHandler handler,
            CancellationToken ct) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsBankEmployee) return Results.Forbid();

            var command = new CloseApplicationCommand(
                id,
                request.ReasonCode,
                request.Comment);

            var result = await handler.Handle(command, ct);
            return result.ToHttpResult();
        })
        .RequireAuthorization(AuthPolicies.EmployeeOnly)
        .WithName("AnalystCloseApplication")
        .WithSummary("T16: Закрытие заявки аналитиком по некредитному препятствию (переход в closed)");

        return group;
    }
}
