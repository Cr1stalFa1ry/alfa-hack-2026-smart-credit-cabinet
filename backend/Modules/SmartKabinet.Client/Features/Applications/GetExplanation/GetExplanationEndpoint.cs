using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using SmartKabinet.Application.Infrastructure.Persistence;
using SmartKabinet.Auth.Infrastructure.Security;
using SmartKabinet.Intergrations.Ml.Services;

namespace SmartKabinet.Client.Features.Applications.GetExplanation;

public static class GetExplanationEndpoint
{
    public static RouteGroupBuilder MapGetExplanationEndpoint(this RouteGroupBuilder group)
    {
        // GET /api/client/applications/{id}/explanation (Человекочитаемое объяснение решения через ML)
        group.MapGet("/{id:guid}/explanation", async (
            Guid id,
            IUserContext userContext,
            ApplicationDbContext appDb,
            IMlServiceClient mlClient,
            CancellationToken ct) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsClient) return Results.Forbid();

            var app = await appDb.Applications.FirstOrDefaultAsync(
                a => a.Id == id && a.ClientId == userContext.UserId.Value, ct);

            if (app is null) return Results.NotFound(new { error = "Заявка не найдена." });

            var primaryReason = app.ReasonCodes.FirstOrDefault();
            if (string.IsNullOrWhiteSpace(primaryReason))
            {
                return Results.Ok(new
                {
                    applicationId = app.Id,
                    status = app.Status.ToString().ToLowerInvariant(),
                    explanation = "Заявка находится в обработке.",
                    source = "default"
                });
            }

            var details = new Dictionary<string, object>
            {
                ["requested_amount"] = app.RequestedAmount,
                ["stage"] = app.Stage.ToString(),
                ["status"] = app.Status.ToString()
            };

            var mlExplanation = await mlClient.ExplainDecisionAsync(primaryReason, details, "client", ct);

            return Results.Ok(new
            {
                applicationId = app.Id,
                status = app.Status.ToString().ToLowerInvariant(),
                reasonCode = primaryReason,
                explanation = mlExplanation.Text,
                source = mlExplanation.Source
            });
        })
        .RequireAuthorization(AuthPolicies.ClientOnly)
        .WithName("GetApplicationExplanation")
        .WithSummary("Получение человекочитаемого объяснения решения (ML Qwen / Fallback)");

        return group;
    }
}
