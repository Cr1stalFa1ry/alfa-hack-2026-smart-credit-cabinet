using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SmartKabinet.Auth.Infrastructure.Security;
using SmartKabinet.BankEmployee.Features.Applications.Common;
using SmartKabinet.Shared;

namespace SmartKabinet.BankEmployee.Features.Applications.ApproveApplication;

public static class ApproveApplicationEndpoint
{
    public static RouteGroupBuilder MapApproveApplicationEndpoint(this RouteGroupBuilder group)
    {
        // POST /api/employee/applications/{id}/approve (T12)
        group.MapPost("/{id:guid}/approve", async (
            Guid id,
            AnalystDecisionRequest request,
            IUserContext userContext,
            ApproveApplicationHandler handler,
            CancellationToken ct) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsBankEmployee) return Results.Forbid();

            var command = new ApproveApplicationCommand(
                id,
                request.ApprovedAmount,
                request.TermMonths,
                request.AnnualRatePercent,
                request.ReasonCode,
                request.Comment);

            var result = await handler.Handle(command, ct);
            return result.ToHttpResult();
        })
        .RequireAuthorization(AuthPolicies.EmployeeOnly)
        .WithName("AnalystApproveApplication")
        .WithSummary("T12: Одобрение заявки аналитиком (переход в offer)");

        return group;
    }
}
