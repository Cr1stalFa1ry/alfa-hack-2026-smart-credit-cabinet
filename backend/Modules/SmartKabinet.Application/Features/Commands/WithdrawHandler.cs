using Microsoft.EntityFrameworkCore;
using SmartKabinet.Application.Commands;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Application.Domain;
using SmartKabinet.Application.Infrastructure.Persistence;
using SmartKabinet.Shared;

namespace SmartKabinet.Application.Features.Commands;

public class WithdrawHandler(ApplicationDbContext dbContext) : IWithdrawApplication
{
    public async Task<Result> WithdrawAsync(WithdrawCommand cmd, CancellationToken ct = default)
    {
        return await Handle(cmd, ct);
    }

    public async Task<Result> Handle(WithdrawCommand cmd, CancellationToken ct = default)
    {
        var app = await dbContext.Applications.FirstOrDefaultAsync(
            a => a.Id == cmd.ApplicationId && a.ClientId == cmd.ClientId, ct);

        if (app is null)
        {
            return Error.NotFound("Application.NotFound", $"Заявка {cmd.ApplicationId} не найдена для данного клиента.");
        }

        if (!ApplicationStateMachine.CanTransition(app.Status, ApplicationStatus.Closed))
        {
            return Error.Conflict("Application.InvalidTransition", $"Заявку в статусе {app.Status} нельзя отозвать.");
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
        return Result.Success();
    }
}
