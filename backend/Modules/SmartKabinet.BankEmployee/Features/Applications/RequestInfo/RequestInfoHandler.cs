using Microsoft.EntityFrameworkCore;
using SmartKabinet.Application.Domain;
using SmartKabinet.Application.Infrastructure.Persistence;
using SmartKabinet.BankEmployee.Features.Applications.Common;
using SmartKabinet.Shared;

namespace SmartKabinet.BankEmployee.Features.Applications.RequestInfo;

public class RequestInfoHandler(
    ApplicationDbContext appDb,
    IBankApplicationDossierBuilder dossierBuilder)
{
    public async Task<Result<BankApplicationDossierDto>> Handle(
        RequestInfoCommand command,
        CancellationToken ct = default)
    {
        var app = await appDb.Applications
            .Include(a => a.CurrentOffer)
            .FirstOrDefaultAsync(a => a.Id == command.ApplicationId, ct);

        if (app is null)
        {
            return Error.NotFound("Application.NotFound", "Заявка не найдена.");
        }

        if (app.Status != ApplicationStatus.Review)
        {
            return Error.Validation("Application.InvalidStatus", "Запрос сведений доступен только из статуса review.");
        }

        app.Status = ApplicationStatus.NeedInfo;
        app.Decision = CreditDecision.ReviewRequired;
        app.ReasonCodes = new List<string> { command.ReasonCode ?? "NEED_INFO" };
        app.UpdatedAt = DateTimeOffset.UtcNow;

        appDb.TransitionHistory.Add(new TransitionRecord
        {
            ApplicationId = app.Id,
            FromStatus = ApplicationStatus.Review,
            ToStatus = ApplicationStatus.NeedInfo,
            Actor = "analyst",
            ReasonCode = command.ReasonCode,
            Comment = command.Comment ?? "Запрос сведений у заёмщика (T11)"
        });

        await appDb.SaveChangesAsync(ct);

        var dossier = await dossierBuilder.BuildAsync(app, ct);
        return Result.Success(dossier);
    }
}
