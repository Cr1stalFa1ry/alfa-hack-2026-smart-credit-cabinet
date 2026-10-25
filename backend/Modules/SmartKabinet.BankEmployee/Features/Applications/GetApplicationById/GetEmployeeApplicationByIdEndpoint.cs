using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SmartKabinet.Auth.Infrastructure.Security;
using SmartKabinet.Shared;

namespace SmartKabinet.BankEmployee.Features.Applications.GetApplicationById;

public static class GetEmployeeApplicationByIdEndpoint
{
    public static RouteGroupBuilder MapGetEmployeeApplicationByIdEndpoint(this RouteGroupBuilder group)
    {
        // GET /api/employee/applications/{id}
        group.MapGet("/{id:guid}", async (
            Guid id,
            IUserContext userContext,
            GetEmployeeApplicationByIdHandler handler,
            CancellationToken ct) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsBankEmployee) return Results.Forbid();

            var query = new GetEmployeeApplicationByIdQuery(id);
            var result = await handler.Handle(query, ct);
            return result.ToHttpResult();
        })
        .RequireAuthorization(AuthPolicies.EmployeeOnly)
        .WithName("GetEmployeeApplicationById")
        .WithSummary("Детальное досье заявки для аналитика банка со скорингом и аудитом");

        return group;
    }
}
