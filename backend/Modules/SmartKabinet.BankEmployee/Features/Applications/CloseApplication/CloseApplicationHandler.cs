using Microsoft.EntityFrameworkCore;
using SmartKabinet.Application.Domain;
using SmartKabinet.Application.Infrastructure.Persistence;
using SmartKabinet.BankEmployee.Features.Applications.Common;
using SmartKabinet.Shared;

namespace SmartKabinet.BankEmployee.Features.Applications.CloseApplication;

public class CloseApplicationHandler(
    ApplicationDbContext appDb,
    IBankApplicationDossierBuilder dossierBuilder)
{
    public async Task<Result<BankApplicationDossierDto>> Handle(
        CloseApplicationCommand command,
        CancellationToken ct = default)
    {
        var app = await appDb.Applications
            .Include(a => a.CurrentOffer)
            .FirstOrDefaultAsync(a => a.Id == command.ApplicationId, ct);

        if (app is null)
        {
            return Error.NotFound("Application.NotFound", "Заявка не найдена.");
        }

        if (app.Status != ApplicationStatus.Review && app.Status != ApplicationStatus.Checking)
        {
            return Error.Validation("Application.InvalidStatus", "Закрытие по некредитной причине доступно только из статусов review или checking.");
        }

        var prevStatus = app.Status;
        app.Status = ApplicationStatus.Closed;
        app.Decision = CreditDecision.Declined;
        if (!string.IsNullOrWhiteSpace(command.ReasonCode))
        {
            app.ReasonCodes = new List<string> { command.ReasonCode };
        }
        app.UpdatedAt = DateTimeOffset.UtcNow;

        appDb.TransitionHistory.Add(new TransitionRecord
        {
            ApplicationId = app.Id,
            FromStatus = prevStatus,
            ToStatus = ApplicationStatus.Closed,
            Actor = "analyst",
            ReasonCode = command.ReasonCode,
            Comment = command.Comment ?? "Некредитное препятствие (T16)"
        });

        await appDb.SaveChangesAsync(ct);

        var dossier = await dossierBuilder.BuildAsync(app, ct);
        return Result.Success(dossier);
    }
}
