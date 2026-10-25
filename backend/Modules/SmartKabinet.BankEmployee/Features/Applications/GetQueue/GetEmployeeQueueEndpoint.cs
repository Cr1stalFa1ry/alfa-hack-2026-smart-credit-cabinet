using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SmartKabinet.Auth.Infrastructure.Security;
using SmartKabinet.Shared;

namespace SmartKabinet.BankEmployee.Features.Applications.GetQueue;

public static class GetEmployeeQueueEndpoint
{
    public static RouteGroupBuilder MapGetEmployeeQueueEndpoint(this RouteGroupBuilder group)
    {
        // GET /api/employee/applications/queue
        group.MapGet("/queue", async (
            string? status,
            IUserContext userContext,
            GetEmployeeQueueHandler handler,
            CancellationToken ct) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsBankEmployee) return Results.Forbid();

            var query = new GetEmployeeQueueQuery(status);
            var result = await handler.Handle(query, ct);
            return result.ToHttpResult();
        })
        .RequireAuthorization(AuthPolicies.EmployeeOnly)
        .WithName("GetEmployeeQueue")
        .WithSummary("Рабочая очередь заявок аналитика");

        return group;
    }
}
