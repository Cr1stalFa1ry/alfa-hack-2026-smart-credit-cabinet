using Microsoft.EntityFrameworkCore;
using SmartKabinet.Application.Commands;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Application.Domain;
using SmartKabinet.Application.Infrastructure.Persistence;

namespace SmartKabinet.Application.Features.Commands;

public class SaveDraftHandler(ApplicationDbContext dbContext) : ISaveDraft
{
    public async Task SaveDraftAsync(SaveDraftCommand cmd, CancellationToken ct = default)
    {
        await Handle(cmd, ct);
    }

    public async Task Handle(SaveDraftCommand cmd, CancellationToken ct = default)
    {
        var app = await dbContext.Applications.FirstOrDefaultAsync(
            a => a.Id == cmd.ApplicationId && a.ClientId == cmd.ClientId, ct);

        if (app is null)
        {
            throw new InvalidOperationException($"Заявка {cmd.ApplicationId} не найдена для данного клиента.");
        }

        if (app.Status != ApplicationStatus.Draft)
        {
            throw new InvalidOperationException($"Заявка находится в статусе {app.Status} и не может быть изменена.");
        }

        app.RequestedAmount = cmd.RequestedAmount;
        app.OwnContribution = cmd.OwnContribution;
        app.RequestedTermMonths = cmd.RequestedTermMonths;
        app.BkiConsent = cmd.BkiConsent;
        app.PersonalDataConsent = cmd.PersonalDataConsent;

        if (cmd.StatementFilePath is not null) app.StatementFilePath = cmd.StatementFilePath;
        if (cmd.FinancialReserve.HasValue) app.FinancialReserve = cmd.FinancialReserve.Value;

        app.UpdatedAt = DateTimeOffset.UtcNow;

        dbContext.TransitionHistory.Add(new TransitionRecord
        {
            ApplicationId = app.Id,
            FromStatus = ApplicationStatus.Draft,
            ToStatus = ApplicationStatus.Draft,
            Actor = "client",
            Comment = "Сохранены изменения в черновике (T02)"
        });

        await dbContext.SaveChangesAsync(ct);
    }
}
