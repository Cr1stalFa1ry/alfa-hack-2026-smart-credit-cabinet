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
public record RequestAlternativeOfferRequest(
    decimal? RequestedAmount = null,
    int? RequestedTermMonths = null,
    decimal? DesiredMonthlyPayment = null,
    string? Comment = null
);

public static class SignAndDisburseEndpoints
{
    public static RouteGroupBuilder MapSignAndDisburseEndpoints(this RouteGroupBuilder group)
    {
        // Обработчик принятия оферты
        var acceptHandler = async (
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
        };

        // POST /api/client/applications/{id}/accept (T21: Принятие оферты заёмщиком)
        group.MapPost("/{id:guid}/accept", acceptHandler)
            .RequireAuthorization(AuthPolicies.ClientOnly)
            .WithName("AcceptCreditOffer")
            .WithSummary("T21: Принятие кредитной оферты клиентом");

        // Алиас /accept-offer
        group.MapPost("/{id:guid}/accept-offer", acceptHandler)
            .RequireAuthorization(AuthPolicies.ClientOnly)
            .ExcludeFromDescription();

        // POST /api/client/applications/{id}/request-alternative (Запрос альтернативных условий заёмщиком)
        group.MapPost("/{id:guid}/request-alternative", async (
            Guid id,
            RequestAlternativeOfferRequest? request,
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
                return Results.BadRequest(new { error = $"Запрос пересмотра доступен только для заявок со сформированной офертой (текущий: {app.Status})." });
            }

            var fromStatus = app.Status;
            app.Status = ApplicationStatus.Review;
            app.Decision = CreditDecision.ReviewRequired;
            app.UpdatedAt = DateTimeOffset.UtcNow;

            var commentParts = new List<string>();
            if (!string.IsNullOrWhiteSpace(request?.Comment))
            {
                commentParts.Add(request.Comment.Trim());
            }
            if (request?.RequestedAmount.HasValue == true && request.RequestedAmount.Value > 0)
            {
                commentParts.Add($"желаемая сумма: {request.RequestedAmount.Value:N0} ₽");
            }
            if (request?.RequestedTermMonths.HasValue == true && request.RequestedTermMonths.Value > 0)
            {
                commentParts.Add($"желаемый срок: {request.RequestedTermMonths.Value} мес.");
            }
            if (request?.DesiredMonthlyPayment.HasValue == true && request.DesiredMonthlyPayment.Value > 0)
            {
                commentParts.Add($"желаемый платёж: {request.DesiredMonthlyPayment.Value:N0} ₽/мес.");
            }

            var fullComment = commentParts.Count > 0
                ? $"Клиент запросил пересмотр условий: {string.Join("; ", commentParts)}"
                : "Клиент запросил альтернативные условия кредитования";

            if (app.CurrentOffer != null)
            {
                app.CurrentOffer.IsCounterOffer = true;
                app.CurrentOffer.ReasonCode = "CLIENT_REQUESTED_REVISION";
            }

            appDb.TransitionHistory.Add(new TransitionRecord
            {
                ApplicationId = app.Id,
                FromStatus = fromStatus,
                ToStatus = ApplicationStatus.Review,
                Actor = "client",
                ReasonCode = "CLIENT_COUNTER_OFFER_REQUEST",
                Comment = fullComment
            });

            await appDb.SaveChangesAsync();

            return Results.Ok(new
            {
                applicationId = app.Id,
                status = "review",
                message = "Запрос на пересмотр условий направлен кредитному аналитику."
            });
        })
        .RequireAuthorization(AuthPolicies.ClientOnly)
        .WithName("RequestAlternativeOfferTerms")
        .WithSummary("Запрос заёмщиком альтернативных параметров оферты");

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
