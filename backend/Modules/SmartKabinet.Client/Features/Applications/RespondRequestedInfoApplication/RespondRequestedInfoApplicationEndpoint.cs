using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SmartKabinet.Application.Commands;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Auth.Infrastructure.Security;

namespace SmartKabinet.Client.Features.Applications.RespondRequestedInfoApplication;

public record RespondInfoRequest(
    string? StatementFilePath = null,
    decimal? FinancialReserve = null,
    string? Comment = null
);

public static class RespondRequestedInfoApplicationEndpoint
{
    public static RouteGroupBuilder MapRespondRequestedInfoApplicationEndpoint(this RouteGroupBuilder group)
    {
        // POST /api/client/applications/{id}/respond-info (T10)
        group.MapPost("/{id:guid}/respond-info", async (
            Guid id,
            RespondInfoRequest request,
            IUserContext userContext,
            IRespondToInfoRequest service,
            CancellationToken ct) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();

            try
            {
                var cmd = new RespondInfoCommand(
                    id,
                    userContext.UserId.Value,
                    request.StatementFilePath,
                    request.FinancialReserve,
                    request.Comment);

                await service.RespondToInfoRequestAsync(cmd, ct);

                return Results.Ok(new { message = "Сведения переданы, заявка возвращена на проверку", applicationId = id, status = "checking" });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .RequireAuthorization()
        .WithName("RespondRequestedInfo")
        .WithSummary("T10: Ответ клиента на дозапрос банка (переход в checking)");

        return group;
    }
}
