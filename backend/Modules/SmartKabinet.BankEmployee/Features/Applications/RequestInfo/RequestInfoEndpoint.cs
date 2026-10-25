using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SmartKabinet.Auth.Infrastructure.Security;
using SmartKabinet.BankEmployee.Features.Applications.Common;
using SmartKabinet.Shared;

namespace SmartKabinet.BankEmployee.Features.Applications.RequestInfo;

public static class RequestInfoEndpoint
{
    public static RouteGroupBuilder MapRequestInfoEndpoint(this RouteGroupBuilder group)
    {
        // POST /api/employee/applications/{id}/request-info (T11)
        group.MapPost("/{id:guid}/request-info", async (
            Guid id,
            AnalystDecisionRequest request,
            IUserContext userContext,
            RequestInfoHandler handler,
            CancellationToken ct) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsBankEmployee) return Results.Forbid();

            var command = new RequestInfoCommand(
                id,
                request.ReasonCode,
                request.Comment);

            var result = await handler.Handle(command, ct);
            return result.ToHttpResult();
        })
        .RequireAuthorization(AuthPolicies.EmployeeOnly)
        .WithName("AnalystRequestInfo")
        .WithSummary("T11: Запрос сведений у клиента аналитиком (переход в need_info)");

        return group;
    }
}
