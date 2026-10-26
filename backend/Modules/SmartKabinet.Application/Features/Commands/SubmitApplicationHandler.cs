using Microsoft.EntityFrameworkCore;
using SmartKabinet.Application.Commands;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Application.Domain;
using SmartKabinet.Application.Infrastructure.Persistence;
using SmartKabinet.Shared;
using Wolverine;

namespace SmartKabinet.Application.Features.Commands;

public class SubmitApplicationHandler(ApplicationDbContext dbContext, IMessageBus bus) : ISubmitApplication
{
    public async Task<Result> SubmitAsync(SubmitApplicationCommand cmd, CancellationToken ct = default)
    {
        return await Handle(cmd, ct);
    }

    public async Task<Result> Handle(SubmitApplicationCommand cmd, CancellationToken ct = default)
    {
        var app = await dbContext.Applications.FirstOrDefaultAsync(
            a => a.Id == cmd.ApplicationId && a.ClientId == cmd.ClientId, ct);

        if (app is null)
        {
            return Error.NotFound("Application.NotFound", $"Заявка {cmd.ApplicationId} не найдена для данного клиента.");
        }

        if (app.Status != ApplicationStatus.Draft)
        {
            return Error.Conflict("Application.InvalidStatus", $"Заявку в статусе {app.Status} нельзя подать повторно.");
        }

        if (!app.PersonalDataConsent)
        {
            return Error.Validation("Application.ConsentsRequired", "Необходимо предоставить согласие на обработку данных.");
        }

        app.Status = ApplicationStatus.Checking;
        app.UpdatedAt = DateTimeOffset.UtcNow;

        if (string.IsNullOrWhiteSpace(app.ProductCode))
        {
            app.ProductCode = CreditProductCodes.ResolveProductCode(app.Stage, app.Purpose);
        }

        dbContext.TransitionHistory.Add(new TransitionRecord
        {
            ApplicationId = app.Id,
            FromStatus = ApplicationStatus.Draft,
            ToStatus = ApplicationStatus.Submitted,
            Actor = "client",
            ReasonCode = "T03",
            Comment = "Заявка отправлена клиентом на проверку (T03)"
        });

        dbContext.TransitionHistory.Add(new TransitionRecord
        {
            ApplicationId = app.Id,
            FromStatus = ApplicationStatus.Submitted,
            ToStatus = ApplicationStatus.Checking,
            Actor = "system",
            ReasonCode = "T03",
            Comment = "Заявка передана на скоринг и проверку стоп-факторов"
        });

        await dbContext.SaveChangesAsync(ct);

        // Немедленный запуск проверки и скоринга
        await bus.InvokeAsync(new ApplicationSubmittedEvent(
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
            app.ProductCode,
            app.MonthlyRevenue,
            app.MonthlyExpenses,
            app.HouseholdExpenses,
            app.ExistingMonthlyObligations,
            app.DebtsVerificationStatus,
            app.ExpensesCoverageStatus,
            app.HasAdditionalIncome,
            app.AdditionalIncomeAmount
        ));

        return Result.Success();
    }
}
