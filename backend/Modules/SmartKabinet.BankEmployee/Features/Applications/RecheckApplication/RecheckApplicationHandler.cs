using Microsoft.EntityFrameworkCore;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Application.Domain;
using SmartKabinet.Application.Infrastructure.Persistence;
using SmartKabinet.BankEmployee.Features.Applications.Common;
using SmartKabinet.Shared;
using Wolverine;

namespace SmartKabinet.BankEmployee.Features.Applications.RecheckApplication;

public class RecheckApplicationHandler(
    ApplicationDbContext appDb,
    IMessageBus bus,
    IBankApplicationDossierBuilder dossierBuilder)
{
    public async Task<Result<BankApplicationDossierDto>> Handle(
        RecheckApplicationCommand command,
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
            return Error.Validation("Application.InvalidStatus", "Возврат на проверку доступен только из статуса review.");
        }

        app.Status = ApplicationStatus.Checking;
        app.UpdatedAt = DateTimeOffset.UtcNow;

        appDb.TransitionHistory.Add(new TransitionRecord
        {
            ApplicationId = app.Id,
            FromStatus = ApplicationStatus.Review,
            ToStatus = ApplicationStatus.Checking,
            Actor = "analyst",
            Comment = "Уточнены факты аналитиком, возврат на проверку (T14)"
        });

        await appDb.SaveChangesAsync(ct);

        await bus.PublishAsync(new ApplicationSubmittedEvent(
            app.Id,
            app.ClientId,
            app.Inn,
            (int)app.Stage,
            (int)app.Purpose,
            app.RequestedAmount,
            app.OwnContribution,
            app.RequestedTermMonths ?? 12,
            app.ProjectedMonthlyRevenue,
            app.FinancialReserve,
            app.PersonalIncome
        ));

        var dossier = await dossierBuilder.BuildAsync(app, ct);
        return Result.Success(dossier);
    }
}
