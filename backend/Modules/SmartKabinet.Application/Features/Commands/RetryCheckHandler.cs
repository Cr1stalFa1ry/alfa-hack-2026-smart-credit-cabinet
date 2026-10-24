using Microsoft.EntityFrameworkCore;
using SmartKabinet.Application.Commands;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Application.Domain;
using SmartKabinet.Application.Infrastructure.Persistence;
using SmartKabinet.Shared;
using Wolverine;

namespace SmartKabinet.Application.Features.Commands;

public class RetryCheckHandler(ApplicationDbContext dbContext, IMessageBus bus) : IRetryCheck
{
    public async Task<Result> RetryCheckAsync(RetryCheckCommand cmd, CancellationToken ct = default)
    {
        return await Handle(cmd, ct);
    }

    public async Task<Result> Handle(RetryCheckCommand cmd, CancellationToken ct = default)
    {
        var app = await dbContext.Applications.FirstOrDefaultAsync(
            a => a.Id == cmd.ApplicationId && a.ClientId == cmd.ClientId, ct);

        if (app is null)
        {
            return Error.NotFound("Application.NotFound", $"Заявка {cmd.ApplicationId} не найдена для данного клиента.");
        }

        if (app.Status != ApplicationStatus.WaitingCheck)
        {
            return Error.Conflict("Application.InvalidStatus", $"Повторить проверку можно только из статуса waiting_check (текущий: {app.Status}).");
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

        if (string.IsNullOrWhiteSpace(app.ProductCode))
        {
            app.ProductCode = CreditProductCodes.ResolveProductCode(app.Stage, app.Purpose);
        }

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
            app.PersonalIncome,
            app.ProductCode
        ));

        return Result.Success();
    }
}
