using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using SmartKabinet.Application.Domain;
using SmartKabinet.Application.Infrastructure.Persistence;
using SmartKabinet.Auth.Infrastructure.Security;

namespace SmartKabinet.Client.Features.Applications;

public record AcceptOfferRequest(bool? UseAlternativeTerm = false);
public record SignAgreementRequest(string? SmsCode = null);

public static class SignAndDisburseEndpoints
{
    public static RouteGroupBuilder MapSignAndDisburseEndpoints(this RouteGroupBuilder group)
    {
        // POST /api/client/applications/{id}/accept (T21: Принятие оферты заёмщиком)
        group.MapPost("/{id:guid}/accept", async (
            Guid id,
            AcceptOfferRequest? request,
            IUserContext userContext,
            ApplicationDbContext appDb) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsClient) return Results.Forbid();

            var app = await appDb.Applications
                .Include(a => a.CurrentOffer)
                .FirstOrDefaultAsync(a => a.Id == id && a.ClientId == userContext.UserId.Value);

            if (app is null) return Results.NotFound(new { error = "Заявка не найдена." });
            if (app.Status != ApplicationStatus.Offer)
            {
                return Results.BadRequest(new { error = $"Принятие оферты доступно только из статуса offer (текущий: {app.Status})." });
            }

            var fromStatus = app.Status;
            app.Status = ApplicationStatus.Accepted;
            app.UpdatedAt = DateTimeOffset.UtcNow;

            appDb.TransitionHistory.Add(new TransitionRecord
            {
                ApplicationId = app.Id,
                FromStatus = fromStatus,
                ToStatus = ApplicationStatus.Accepted,
                Actor = "client",
                Comment = "Заёмщик принял условия кредитной оферты (T21)"
            });

            await appDb.SaveChangesAsync();
            return Results.Ok(new
            {
                applicationId = app.Id,
                status = app.Status.ToString().ToLowerInvariant(),
                approvedAmount = app.CurrentOffer?.ApprovedAmount ?? app.RequestedAmount,
                approvedTermMonths = app.CurrentOffer?.TermMonths ?? app.RequestedTermMonths,
                monthlyPayment = app.CurrentOffer?.MonthlyPayment,
                annualRatePercent = app.CurrentOffer?.AnnualRatePercent,
                acceptedAt = DateTime.UtcNow,
                message = "Кредитная оферта принята заёмщиком (T21). Ожидается подписание договора."
            });
        })
        .RequireAuthorization(AuthPolicies.ClientOnly)
        .WithName("AcceptCreditOffer")
        .WithSummary("T21: Принятие кредитной оферты клиентом");

        // POST /api/client/applications/{id}/sign (T22: Симуляция подписания договора ЭЦП / SMS-кодом)
        group.MapPost("/{id:guid}/sign", async (
            Guid id,
            SignAgreementRequest? request,
            IUserContext userContext,
            ApplicationDbContext appDb) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsClient) return Results.Forbid();

            var app = await appDb.Applications
                .Include(a => a.CurrentOffer)
                .FirstOrDefaultAsync(a => a.Id == id && a.ClientId == userContext.UserId.Value);

            if (app is null) return Results.NotFound(new { error = "Заявка не найдена." });
            if (app.Status != ApplicationStatus.Accepted && app.Status != ApplicationStatus.PreConditions && app.Status != ApplicationStatus.Offer)
            {
                return Results.BadRequest(new { error = $"Подписание договора возможно только для принятой оферты (текущий: {app.Status})." });
            }

            var fromStatus = app.Status;
            app.Status = ApplicationStatus.SignedSim;
            app.UpdatedAt = DateTimeOffset.UtcNow;

            appDb.TransitionHistory.Add(new TransitionRecord
            {
                ApplicationId = app.Id,
                FromStatus = fromStatus,
                ToStatus = ApplicationStatus.SignedSim,
                Actor = "client",
                Comment = "Кредитный договор успешно подписан электронной подписью (симуляция T22)"
            });

            await appDb.SaveChangesAsync();
            return Results.Ok(new
            {
                applicationId = app.Id,
                status = app.Status.ToString().ToLowerInvariant(),
                signedAt = DateTime.UtcNow,
                message = "Договор подписан. Заявка готова к зачислению кредитных средств."
            });
        })
        .RequireAuthorization(AuthPolicies.ClientOnly)
        .WithName("SignCreditAgreement")
        .WithSummary("T22: Симуляция подписания кредитного договора клиентом");

        // POST /api/client/applications/{id}/disburse (T23: Моделируемая выдача средств на счёт ИП)
        group.MapPost("/{id:guid}/disburse", async (
            Guid id,
            IUserContext userContext,
            ApplicationDbContext appDb) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsClient) return Results.Forbid();

            var app = await appDb.Applications
                .Include(a => a.CurrentOffer)
                .FirstOrDefaultAsync(a => a.Id == id && a.ClientId == userContext.UserId.Value);

            if (app is null) return Results.NotFound(new { error = "Заявка не найдена." });
            if (app.Status != ApplicationStatus.SignedSim && app.Status != ApplicationStatus.ReadyTodisburse)
            {
                return Results.BadRequest(new { error = $"Выдача средств возможна только после подписания договора (текущий: {app.Status})." });
            }

            var fromStatus = app.Status;
            app.Status = ApplicationStatus.DisbursedSim;
            app.UpdatedAt = DateTimeOffset.UtcNow;

            appDb.TransitionHistory.Add(new TransitionRecord
            {
                ApplicationId = app.Id,
                FromStatus = fromStatus,
                ToStatus = ApplicationStatus.DisbursedSim,
                Actor = "system",
                Comment = "Кредитные средства успешно зачислены на расчётный счёт ИП (моделируемая выдача T23)"
            });

            await appDb.SaveChangesAsync();
            return Results.Ok(new
            {
                applicationId = app.Id,
                status = app.Status.ToString().ToLowerInvariant(),
                disbursedAmount = app.CurrentOffer?.ApprovedAmount ?? app.RequestedAmount,
                disbursedAt = DateTime.UtcNow,
                message = "Кредит успешно выдан. Средства переведены на расчётный счёт ИП в Альфа-Банке."
            });
        })
        .RequireAuthorization(AuthPolicies.ClientOnly)
        .WithName("DisburseCreditFunds")
        .WithSummary("T23: Моделируемая выдача кредитных средств на расчётный счёт предпринимателя");

        return group;
    }
}
