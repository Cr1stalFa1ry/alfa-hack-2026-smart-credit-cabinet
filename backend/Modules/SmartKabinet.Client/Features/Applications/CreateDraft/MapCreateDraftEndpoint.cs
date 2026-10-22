using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SmartKabinet.Application.Commands;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Auth.Infrastructure.Security;

namespace SmartKabinet.Client.Features.Applications.CreateDraft;

public record CreateDraftRequest(
    string Inn,
    int Stage, // 1 = Operating, 2 = Prelaunch
    int Purpose, // 1 = Equipment, 2 = WorkingCapital
    decimal RequestedAmount,
    decimal OwnContribution = 0,
    int? RequestedTermMonths = 12,
    bool BkiConsent = true,
    bool PersonalDataConsent = true,
    string? EquipmentSupplier = null,
    decimal? EquipmentPrice = null
);

public static class CreateDraftEndpoint
{
    public static RouteGroupBuilder MapCreateDraftEndpoint(this RouteGroupBuilder group)
    {
        // POST /api/client/applications/draft (T01)
        group.MapPost("/draft", async (
            CreateDraftRequest request,
            IUserContext userContext,
            ICreateDraft service,
            CancellationToken ct) => 
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();

            var cmd = new CreateDraftCommand(
                userContext.UserId.Value,
                request.Inn,
                request.Stage,
                request.Purpose,
                request.RequestedAmount,
                request.OwnContribution,
                request.RequestedTermMonths,
                request.BkiConsent,
                request.PersonalDataConsent,
                request.EquipmentSupplier,
                request.EquipmentPrice);

            var appId = await service.CreateDraftAsync(cmd, ct);
            
            return Results.Created($"/api/client/applications/{appId.Value}", new { applicationId = appId.Value, status = "draft" });
        })
        .RequireAuthorization()
        .WithName("CreateApplicationDraft")
        .WithSummary("T01: Создание черновика заявки на кредит");
        
        return group;
    }
}
