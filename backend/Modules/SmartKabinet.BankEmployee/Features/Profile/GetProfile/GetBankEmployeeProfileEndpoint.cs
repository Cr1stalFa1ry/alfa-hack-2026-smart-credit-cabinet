using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SmartKabinet.Auth.Infrastructure.Security;
using SmartKabinet.Shared;

namespace SmartKabinet.BankEmployee.Features.Profile.GetProfile;

public static class GetBankEmployeeProfileEndpoint
{
    public static RouteGroupBuilder MapGetBankEmployeeProfileEndpoint(this RouteGroupBuilder group)
    {
        // GET /api/employee/profile
        group.MapGet("/profile", async (
            IUserContext userContext,
            GetBankEmployeeProfileHandler handler,
            CancellationToken ct) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsBankEmployee) return Results.Forbid();

            var query = new GetBankEmployeeProfileQuery(userContext.UserId);
            var result = await handler.Handle(query, ct);
            return result.ToHttpResult();
        })
        .RequireAuthorization(AuthPolicies.EmployeeOnly)
        .WithName("GetBankEmployeeProfile")
        .WithSummary("Получение профиля сотрудника банка");

        return group;
    }
}
