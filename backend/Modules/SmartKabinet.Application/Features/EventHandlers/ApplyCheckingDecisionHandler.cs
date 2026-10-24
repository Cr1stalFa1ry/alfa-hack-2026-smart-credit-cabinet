using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Application.Domain;
using SmartKabinet.Application.Infrastructure.Persistence;

namespace SmartKabinet.Application.Features.EventHandlers;

public class ApplyCheckingDecisionHandler
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<ApplyCheckingDecisionHandler> _logger;

    public ApplyCheckingDecisionHandler(ApplicationDbContext dbContext, ILogger<ApplyCheckingDecisionHandler> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task Handle(ApplyCheckingDecisionCommand command)
    {
        var app = await _dbContext.Applications
            .Include(a => a.CurrentOffer)
            .FirstOrDefaultAsync(a => a.Id == command.ApplicationId);

        if (app is null)
        {
            _logger.LogWarning("Заявка {ApplicationId} не найдена для применения решения скоринга.", command.ApplicationId);
            return;
        }

        var targetStatus = (ApplicationStatus)command.TargetStatus;
        if (!ApplicationStateMachine.CanTransition(app.Status, targetStatus))
        {
            _logger.LogWarning("Недопустимый переход State Machine: {From} -> {To} для заявки {ApplicationId}",
                app.Status, targetStatus, app.Id);
            return;
        }

        var fromStatus = app.Status;
        app.Status = targetStatus;
        app.Decision = (CreditDecision)command.Decision;
        app.ReasonCodes = command.ReasonCodes;
        app.UpdatedAt = DateTimeOffset.UtcNow;

        if (command.Offer is not null)
        {
            app.CurrentOffer = new ApplicationOffer
            {
                Id = Guid.NewGuid(),
                ApprovedAmount = command.Offer.ApprovedAmount,
                TermMonths = command.Offer.TermMonths,
                AnnualRatePercent = command.Offer.AnnualRatePercent,
                MonthlyPayment = command.Offer.MonthlyPayment,
                IsCounterOffer = command.Offer.IsCounterOffer,
                ReasonCode = command.Offer.ReasonCode
            };
        }

        _dbContext.TransitionHistory.Add(new TransitionRecord
        {
            ApplicationId = app.Id,
            FromStatus = fromStatus,
            ToStatus = targetStatus,
            Actor = "system",
            ReasonCode = command.ReasonCodes.FirstOrDefault(),
            Comment = command.Comment
        });

        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("[Wolverine: Checking -> Application] Применено решение: Заявка {AppId}, Статус={Status}, Решение={Decision}",
            app.Id, app.Status, app.Decision);
    }
}
