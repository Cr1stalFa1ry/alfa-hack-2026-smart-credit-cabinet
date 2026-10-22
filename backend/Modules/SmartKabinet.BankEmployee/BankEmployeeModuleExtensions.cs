using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Application.Domain;
using SmartKabinet.Application.Infrastructure.Persistence;
using SmartKabinet.Auth.Infrastructure.Security;
using SmartKabinet.BankEmployee.Infrastructure.Persistence;
using Wolverine;

namespace SmartKabinet.BankEmployee;

public record AnalystDecisionRequest(
    decimal? ApprovedAmount = null,
    int? TermMonths = null,
    decimal? AnnualRatePercent = null,
    string? ReasonCode = null,
    string? Comment = null
);

public static class BankEmployeeModuleExtensions
{
    public static IServiceCollection AddBankEmployeeModule(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        services.AddDbContext<BankEmployeeDbContext>(options =>
        {
            if (!string.IsNullOrWhiteSpace(connectionString) && !connectionString.Contains("InMemory", StringComparison.OrdinalIgnoreCase))
            {
                options.UseNpgsql(connectionString, b => b.MigrationsHistoryTable("__EFMigrationsHistory_BankEmployee", "bank_employee"));
            }
            else
            {
                options.UseInMemoryDatabase("SmartKabinetBankEmployeeDb");
            }
        });

        return services;
    }

    public static IEndpointRouteBuilder MapBankEmployeeEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/employee").WithTags("Bank Employee Workplace");

        // GET /api/employee/profile
        group.MapGet("/profile", async (
            IUserContext userContext,
            BankEmployeeDbContext dbContext) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();

            var profile = await dbContext.Employees.FirstOrDefaultAsync(e => e.UserId == userContext.UserId.Value);
            return profile is not null ? Results.Ok(profile) : Results.NotFound(new { error = "Профиль сотрудника не найден." });
        })
        .RequireAuthorization()
        .WithName("GetBankEmployeeProfile")
        .WithSummary("Получение профиля сотрудника банка");

        // GET /api/employee/applications/queue
        group.MapGet("/applications/queue", async (
            ApplicationDbContext appDb) =>
        {
            var queue = await appDb.Applications
                .Include(a => a.CurrentOffer)
                .Where(a => a.Status == ApplicationStatus.Review || a.Status == ApplicationStatus.Checking)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return Results.Ok(queue);
        })
        .RequireAuthorization()
        .WithName("GetEmployeeQueue")
        .WithSummary("Рабочая очередь заявок аналитика (статусы review / checking)");

        // POST /api/employee/applications/{id}/approve (T12)
        group.MapPost("/applications/{id:guid}/approve", async (
            Guid id,
            AnalystDecisionRequest request,
            ApplicationDbContext appDb) =>
        {
            var app = await appDb.Applications
                .Include(a => a.CurrentOffer)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (app is null) return Results.NotFound(new { error = "Заявка не найдена." });
            if (app.Status != ApplicationStatus.Review)
            {
                return Results.BadRequest(new { error = "Одобрение аналитиком доступно только для заявок в статусе review." });
            }

            var amount = request.ApprovedAmount ?? app.RequestedAmount;
            var term = request.TermMonths ?? app.RequestedTermMonths ?? 12;
            var rate = request.AnnualRatePercent ?? 21m;
            var monthlyRate = (double)(rate / 100m / 12m);
            var factor = Math.Pow(1 + monthlyRate, -term);
            var payment = Math.Round((decimal)((double)amount * monthlyRate / (1 - factor)), 2);

            app.Status = ApplicationStatus.Offer;
            app.Decision = CreditDecision.Approved;
            app.CurrentOffer = new ApplicationOffer
            {
                Id = Guid.NewGuid(),
                ApprovedAmount = amount,
                TermMonths = term,
                AnnualRatePercent = rate,
                MonthlyPayment = payment,
                IsCounterOffer = false,
                ReasonCode = request.ReasonCode
            };
            app.UpdatedAt = DateTimeOffset.UtcNow;

            appDb.TransitionHistory.Add(new TransitionRecord
            {
                ApplicationId = app.Id,
                FromStatus = ApplicationStatus.Review,
                ToStatus = ApplicationStatus.Offer,
                Actor = "analyst",
                Comment = request.Comment ?? "Одобрено аналитиком (T12)"
            });

            await appDb.SaveChangesAsync();
            return Results.Ok(new { message = "Заявка успешно одобрена аналитиком", applicationId = app.Id, status = app.Status.ToString() });
        })
        .RequireAuthorization()
        .WithName("AnalystApproveApplication")
        .WithSummary("T12: Одобрение заявки аналитиком (переход в offer)");

        // POST /api/employee/applications/{id}/decline (T13)
        group.MapPost("/applications/{id:guid}/decline", async (
            Guid id,
            AnalystDecisionRequest request,
            ApplicationDbContext appDb) =>
        {
            var app = await appDb.Applications.FirstOrDefaultAsync(a => a.Id == id);
            if (app is null) return Results.NotFound(new { error = "Заявка не найдена." });
            if (app.Status != ApplicationStatus.Review)
            {
                return Results.BadRequest(new { error = "Отказ аналитика доступен только для заявок в статусе review." });
            }

            if (string.IsNullOrWhiteSpace(request.ReasonCode))
            {
                return Results.BadRequest(new { error = "Для отказа аналитика код причины обязателен." });
            }

            app.Status = ApplicationStatus.Declined;
            app.Decision = CreditDecision.Declined;
            app.ReasonCodes = new List<string> { request.ReasonCode };
            app.UpdatedAt = DateTimeOffset.UtcNow;

            appDb.TransitionHistory.Add(new TransitionRecord
            {
                ApplicationId = app.Id,
                FromStatus = ApplicationStatus.Review,
                ToStatus = ApplicationStatus.Declined,
                Actor = "analyst",
                ReasonCode = request.ReasonCode,
                Comment = request.Comment ?? "Отказ аналитика (T13)"
            });

            await appDb.SaveChangesAsync();
            return Results.Ok(new { message = "Заявка отклонена аналитиком", applicationId = app.Id, status = app.Status.ToString() });
        })
        .RequireAuthorization()
        .WithName("AnalystDeclineApplication")
        .WithSummary("T13: Отказ аналитика (переход в declined)");

        // POST /api/employee/applications/{id}/request-info (T11)
        group.MapPost("/applications/{id:guid}/request-info", async (
            Guid id,
            AnalystDecisionRequest request,
            ApplicationDbContext appDb) =>
        {
            var app = await appDb.Applications.FirstOrDefaultAsync(a => a.Id == id);
            if (app is null) return Results.NotFound(new { error = "Заявка не найдена." });
            if (app.Status != ApplicationStatus.Review)
            {
                return Results.BadRequest(new { error = "Запрос сведений доступен только из статуса review." });
            }

            app.Status = ApplicationStatus.NeedInfo;
            app.Decision = CreditDecision.ReviewRequired;
            app.ReasonCodes = new List<string> { request.ReasonCode ?? "NEED_INFO" };
            app.UpdatedAt = DateTimeOffset.UtcNow;

            appDb.TransitionHistory.Add(new TransitionRecord
            {
                ApplicationId = app.Id,
                FromStatus = ApplicationStatus.Review,
                ToStatus = ApplicationStatus.NeedInfo,
                Actor = "analyst",
                ReasonCode = request.ReasonCode,
                Comment = request.Comment ?? "Запрос сведений у заёмщика (T11)"
            });

            await appDb.SaveChangesAsync();
            return Results.Ok(new { message = "Запрос сведений направлен клиенту", applicationId = app.Id, status = app.Status.ToString() });
        })
        .RequireAuthorization()
        .WithName("AnalystRequestInfo")
        .WithSummary("T11: Запрос сведений у клиента аналитиком (переход в need_info)");

        // POST /api/employee/applications/{id}/recheck (T14)
        group.MapPost("/applications/{id:guid}/recheck", async (
            Guid id,
            ApplicationDbContext appDb,
            IMessageBus bus) =>
        {
            var app = await appDb.Applications.FirstOrDefaultAsync(a => a.Id == id);
            if (app is null) return Results.NotFound(new { error = "Заявка не найдена." });
            if (app.Status != ApplicationStatus.Review)
            {
                return Results.BadRequest(new { error = "Возврат на проверку доступен только из статуса review." });
            }

            app.Status = ApplicationStatus.Checking;
            app.UpdatedAt = DateTimeOffset.UtcNow;

            appDb.TransitionHistory.Add(new TransitionRecord
            {
                ApplicationId = app.Id,
                FromStatus = ApplicationStatus.Review,
                ToStatus = ApplicationStatus.Checking,
                Actor = "analyst",
                Comment = "Уточнены факты аналитиком, возврат на проверку (T14)"
            });

            await appDb.SaveChangesAsync();

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

            return Results.Ok(new { message = "Заявка возвращена на проверку скорингом", applicationId = app.Id, status = app.Status.ToString() });
        })
        .RequireAuthorization()
        .WithName("AnalystRecheckApplication")
        .WithSummary("T14: Уточнены факты аналитиком, возврат на автопроверку (переход в checking)");

        return app;
    }
}
