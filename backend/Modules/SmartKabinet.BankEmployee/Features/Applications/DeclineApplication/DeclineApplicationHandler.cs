using Microsoft.EntityFrameworkCore;
using SmartKabinet.Application.Domain;
using SmartKabinet.Application.Infrastructure.Persistence;
using SmartKabinet.BankEmployee.Features.Applications.Common;
using SmartKabinet.Shared;

namespace SmartKabinet.BankEmployee.Features.Applications.DeclineApplication;

public class DeclineApplicationHandler(
    ApplicationDbContext appDb,
    IBankApplicationDossierBuilder dossierBuilder)
{
    public async Task<Result<BankApplicationDossierDto>> Handle(
        DeclineApplicationCommand command,
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
            return Error.Validation("Application.InvalidStatus", "Отказ аналитика доступен только для заявок в статусе review.");
        }

        if (string.IsNullOrWhiteSpace(command.ReasonCode))
        {
            return Error.Validation("Application.ReasonCodeRequired", "Для отказа аналитика код причины обязателен.");
        }

        app.Status = ApplicationStatus.Declined;
        app.Decision = CreditDecision.Declined;
        app.ReasonCodes = new List<string> { command.ReasonCode };
        app.UpdatedAt = DateTimeOffset.UtcNow;

        appDb.TransitionHistory.Add(new TransitionRecord
        {
            ApplicationId = app.Id,
            FromStatus = ApplicationStatus.Review,
            ToStatus = ApplicationStatus.Declined,
            Actor = "analyst",
            ReasonCode = command.ReasonCode,
            Comment = command.Comment ?? "Отказ аналитика (T13)"
        });

        await appDb.SaveChangesAsync(ct);

        var dossier = await dossierBuilder.BuildAsync(app, ct);
        return Result.Success(dossier);
    }
}
