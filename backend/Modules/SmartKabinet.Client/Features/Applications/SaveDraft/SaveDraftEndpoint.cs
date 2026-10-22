using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SmartKabinet.Application.Commands;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Auth.Infrastructure.Security;

namespace SmartKabinet.Client.Features.Applications.SaveDraft;

public record UpdateDraftRequest(
    decimal RequestedAmount,
    decimal OwnContribution,
    int? RequestedTermMonths,
    bool BkiConsent,
    bool PersonalDataConsent,
    string? StatementFilePath = null,
    decimal? FinancialReserve = null
);

public static class SaveDraftEndpoint
{
    public static RouteGroupBuilder MapSaveDraftEndpoint(this RouteGroupBuilder group)
    {
        // PUT /api/client/applications/{id}/draft (T02)
        group.MapPut("/{id:guid}/draft", async (
            Guid id,
            UpdateDraftRequest request,
            IUserContext userContext,
            ISaveDraft service,
            CancellationToken ct) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();

            try
            {
                var cmd = new SaveDraftCommand(
                    id,
                    userContext.UserId.Value,
                    request.RequestedAmount,
                    request.OwnContribution,
                    request.RequestedTermMonths,
                    request.BkiConsent,
                    request.PersonalDataConsent,
                    request.StatementFilePath,
                    request.FinancialReserve);

                await service.SaveDraftAsync(cmd, ct);

                return Results.Ok(new { message = "Черновик успешно сохранён", applicationId = id, status = "draft" });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .RequireAuthorization()
        .WithName("UpdateApplicationDraft")
        .WithSummary("T02: Сохранение изменений в черновике заявки");

        return group;
    }
}
