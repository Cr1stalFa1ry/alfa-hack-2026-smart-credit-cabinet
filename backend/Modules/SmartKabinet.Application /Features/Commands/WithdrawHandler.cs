using Microsoft.EntityFrameworkCore;
using SmartKabinet.Application.Commands;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Application.Domain;
using SmartKabinet.Application.Infrastructure.Persistence;

namespace SmartKabinet.Application.Features.Commands;

public class WithdrawHandler(ApplicationDbContext dbContext) : IWithdrawApplication
{
    public async Task WithdrawAsync(WithdrawCommand cmd, CancellationToken ct = default)
    {
        await Handle(cmd, ct);
    }

    public async Task Handle(WithdrawCommand cmd, CancellationToken ct = default)
    {
        var app = await dbContext.Applications.FirstOrDefaultAsync(
            a => a.Id == cmd.ApplicationId && a.ClientId == cmd.ClientId, ct);

        if (app is null)
        {
            throw new InvalidOperationException($"Заявка {cmd.ApplicationId} не найдена для данного клиента.");
        }

        if (!ApplicationStateMachine.CanTransition(app.Status, ApplicationStatus.Closed))
        {
            throw new InvalidOperationException($"Заявку в статусе {app.Status} нельзя отозвать.");
        }

        var fromStatus = app.Status;
        app.Status = ApplicationStatus.Closed;
        app.UpdatedAt = DateTimeOffset.UtcNow;

        dbContext.TransitionHistory.Add(new TransitionRecord
        {
            ApplicationId = app.Id,
            FromStatus = fromStatus,
            ToStatus = ApplicationStatus.Closed,
            Actor = "client",
            Comment = "Заявка отозвана клиентом (T17)"
        });

        await dbContext.SaveChangesAsync(ct);
    }
}
