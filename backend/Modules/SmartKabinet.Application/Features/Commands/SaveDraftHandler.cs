using Microsoft.EntityFrameworkCore;
using SmartKabinet.Application.Commands;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Application.Domain;
using SmartKabinet.Application.Infrastructure.Persistence;
using SmartKabinet.Shared;

namespace SmartKabinet.Application.Features.Commands;

public class SaveDraftHandler(ApplicationDbContext dbContext) : ISaveDraft
{
    public async Task<Result> SaveDraftAsync(SaveDraftCommand cmd, CancellationToken ct = default)
    {
        return await Handle(cmd, ct);
    }

    public async Task<Result> Handle(SaveDraftCommand cmd, CancellationToken ct = default)
    {
        var app = await dbContext.Applications.FirstOrDefaultAsync(
            a => a.Id == cmd.ApplicationId && a.ClientId == cmd.ClientId, ct);

        if (app is null)
        {
            return Error.NotFound("Application.NotFound", $"Заявка {cmd.ApplicationId} не найдена для данного клиента.");
        }

        if (app.Status != ApplicationStatus.Draft)
        {
            return Error.Conflict("Application.InvalidStatus", $"Заявка находится в статусе {app.Status} и не может быть изменена.");
        }

        app.RequestedAmount = cmd.RequestedAmount;
        app.OwnContribution = cmd.OwnContribution;
        app.RequestedTermMonths = cmd.RequestedTermMonths;
        app.BkiConsent = cmd.BkiConsent;
        app.PersonalDataConsent = cmd.PersonalDataConsent;

        if (!string.IsNullOrWhiteSpace(cmd.ProductCode) && CreditProductCodes.IsValid(cmd.ProductCode))
        {
            app.ProductCode = cmd.ProductCode.Trim().ToUpperInvariant();
        }
        else if (string.IsNullOrWhiteSpace(app.ProductCode))
        {
            app.ProductCode = CreditProductCodes.ResolveProductCode(app.Stage, app.Purpose);
        }

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
        return Result.Success();
    }
}
