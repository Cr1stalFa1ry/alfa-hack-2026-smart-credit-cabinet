using Microsoft.EntityFrameworkCore;
using SmartKabinet.Application.Commands;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Application.Domain;
using SmartKabinet.Application.Infrastructure.Persistence;
using Wolverine;

namespace SmartKabinet.Application.Features.Commands;

public class RespondInfoHandler(ApplicationDbContext dbContext, IMessageBus bus) : IRespondToInfoRequest
{
    public async Task RespondToInfoRequestAsync(RespondInfoCommand cmd, CancellationToken ct = default)
    {
        await Handle(cmd, ct);
    }

    public async Task Handle(RespondInfoCommand cmd, CancellationToken ct = default)
    {
        var app = await dbContext.Applications.FirstOrDefaultAsync(
            a => a.Id == cmd.ApplicationId && a.ClientId == cmd.ClientId, ct);

        if (app is null)
        {
            throw new InvalidOperationException($"Заявка {cmd.ApplicationId} не найдена для данного клиента.");
        }

        if (app.Status != ApplicationStatus.NeedInfo)
        {
            throw new InvalidOperationException($"Предоставить сведения можно только в статусе need_info (текущий: {app.Status}).");
        }

        if (cmd.StatementFilePath is not null) app.StatementFilePath = cmd.StatementFilePath;
        if (cmd.FinancialReserve.HasValue) app.FinancialReserve = cmd.FinancialReserve.Value;

        app.Status = ApplicationStatus.Checking;
        app.UpdatedAt = DateTimeOffset.UtcNow;

        dbContext.TransitionHistory.Add(new TransitionRecord
        {
            ApplicationId = app.Id,
            FromStatus = ApplicationStatus.NeedInfo,
            ToStatus = ApplicationStatus.InfoReceived,
            Actor = "client",
            Comment = cmd.Comment ?? "Клиент предоставил запрошенные банком сведения (T10)"
        });

        dbContext.TransitionHistory.Add(new TransitionRecord
        {
            ApplicationId = app.Id,
            FromStatus = ApplicationStatus.InfoReceived,
            ToStatus = ApplicationStatus.Checking,
            Actor = "system",
            Comment = "Заявка возвращена на повторную автопроверку"
        });

        await dbContext.SaveChangesAsync(ct);

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
    }
}
