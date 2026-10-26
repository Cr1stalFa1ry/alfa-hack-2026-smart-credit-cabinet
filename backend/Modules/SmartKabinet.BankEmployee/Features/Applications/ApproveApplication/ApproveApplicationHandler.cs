using Microsoft.EntityFrameworkCore;
using SmartKabinet.Application.Domain;
using SmartKabinet.Application.Infrastructure.Persistence;
using SmartKabinet.BankEmployee.Features.Applications.Common;
using SmartKabinet.Shared;

namespace SmartKabinet.BankEmployee.Features.Applications.ApproveApplication;

public class ApproveApplicationHandler(
    ApplicationDbContext appDb,
    IBankApplicationDossierBuilder dossierBuilder)
{
    public async Task<Result<BankApplicationDossierDto>> Handle(
        ApproveApplicationCommand command,
        CancellationToken ct = default)
    {
        var app = await appDb.Applications
            .Include(a => a.CurrentOffer)
            .FirstOrDefaultAsync(a => a.Id == command.ApplicationId, ct);

        if (app is null)
        {
            return Error.NotFound("Application.NotFound", "Заявка не найдена.");
        }

        if (app.Status != ApplicationStatus.Review && app.Status != ApplicationStatus.Offer)
        {
            return Error.Validation("Application.InvalidStatus", "Одобрение аналитиком доступно только для заявок в статусе review или offer.");
        }

        var fromStatus = app.Status;
        var amount = command.ApprovedAmount ?? app.CurrentOffer?.ApprovedAmount ?? app.RequestedAmount;
        var term = command.TermMonths ?? app.CurrentOffer?.TermMonths ?? app.RequestedTermMonths ?? 12;
        var rate = command.AnnualRatePercent ?? app.CurrentOffer?.AnnualRatePercent ?? 18m;
        var monthlyRate = (double)(rate / 100m / 12m);
        var factor = Math.Pow(1 + monthlyRate, -term);
        var payment = Math.Round((decimal)((double)amount * monthlyRate / (1 - factor)), 2);

        app.Status = ApplicationStatus.Offer;
        app.Decision = CreditDecision.Approved;
        app.CurrentOffer = new ApplicationOffer
        {
            Id = Guid.NewGuid(),
            ApprovedAmount = amount,
            TermMonths = term,
            AnnualRatePercent = rate,
            MonthlyPayment = payment,
            IsCounterOffer = app.CurrentOffer?.IsCounterOffer ?? (amount != app.RequestedAmount || term != app.RequestedTermMonths),
            ReasonCode = command.ReasonCode ?? app.CurrentOffer?.ReasonCode ?? "OFFER_APPROVED_BY_ANALYST"
        };
        app.UpdatedAt = DateTimeOffset.UtcNow;

        appDb.TransitionHistory.Add(new TransitionRecord
        {
            ApplicationId = app.Id,
            FromStatus = fromStatus,
            ToStatus = ApplicationStatus.Offer,
            Actor = "analyst",
            Comment = command.Comment ?? (fromStatus == ApplicationStatus.Offer ? "Условия оферты обновлены аналитиком (T12)" : "Одобрено аналитиком (T12)")
        });

        await appDb.SaveChangesAsync(ct);

        var dossier = await dossierBuilder.BuildAsync(app, ct);
        return Result.Success(dossier);
    }
}
