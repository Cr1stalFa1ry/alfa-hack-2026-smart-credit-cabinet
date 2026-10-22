using Microsoft.EntityFrameworkCore;
using SmartKabinet.Application.Commands;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Application.Domain;
using SmartKabinet.Application.Infrastructure.Persistence;
using Wolverine;

namespace SmartKabinet.Application.Features.Commands;

public class RetryCheckHandler(ApplicationDbContext dbContext, IMessageBus bus) : IRetryCheck
{
    public async Task RetryCheckAsync(RetryCheckCommand cmd, CancellationToken ct = default)
    {
        await Handle(cmd, ct);
    }

    public async Task Handle(RetryCheckCommand cmd, CancellationToken ct = default)
    {
        var app = await dbContext.Applications.FirstOrDefaultAsync(
            a => a.Id == cmd.ApplicationId && a.ClientId == cmd.ClientId, ct);

        if (app is null)
        {
            throw new InvalidOperationException($"Заявка {cmd.ApplicationId} не найдена для данного клиента.");
        }

        if (app.Status != ApplicationStatus.WaitingCheck)
        {
            throw new InvalidOperationException($"Повторить проверку можно только из статуса waiting_check (текущий: {app.Status}).");
        }

        app.Status = ApplicationStatus.Checking;
        app.UpdatedAt = DateTimeOffset.UtcNow;

        dbContext.TransitionHistory.Add(new TransitionRecord
        {
            ApplicationId = app.Id,
            FromStatus = ApplicationStatus.WaitingCheck,
            ToStatus = ApplicationStatus.Checking,
            Actor = "client",
            Comment = "Повторный запуск проверки клиентом (T06)"
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
