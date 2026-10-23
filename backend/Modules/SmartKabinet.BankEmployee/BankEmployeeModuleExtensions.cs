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
using SmartKabinet.Intergrations.Synthetic.Services;
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
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is required for BankEmployee module.");

        services.AddDbContext<BankEmployeeDbContext>(options =>
        {
            options.UseNpgsql(connectionString, b => b.MigrationsHistoryTable("__EFMigrationsHistory_BankEmployee", "bank_employee"));
        });

        return services;
    }

    public static IEndpointRouteBuilder MapBankEmployeeEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/employee")
            .WithTags("Bank Employee Workplace")
            .RequireAuthorization(AuthPolicies.EmployeeOnly);

        // GET /api/employee/profile
        group.MapGet("/profile", async (
            IUserContext userContext,
            BankEmployeeDbContext dbContext) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsBankEmployee) return Results.Forbid();

            var profile = await dbContext.Employees.FirstOrDefaultAsync(e => e.UserId == userContext.UserId.Value);
            return profile is not null ? Results.Ok(profile) : Results.NotFound(new { error = "Профиль сотрудника не найден." });
        })
        .RequireAuthorization(AuthPolicies.EmployeeOnly)
        .WithName("GetBankEmployeeProfile")
        .WithSummary("Получение профиля сотрудника банка");

        // GET /api/employee/applications/queue
        group.MapGet("/applications/queue", async (
            string? status,
            IUserContext userContext,
            ApplicationDbContext appDb) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsBankEmployee) return Results.Forbid();

            var query = appDb.Applications
                .Include(a => a.CurrentOffer)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status) && status != "all")
            {
                if (Enum.TryParse<ApplicationStatus>(status, true, out var parsedStatus))
                {
                    query = query.Where(a => a.Status == parsedStatus);
                }
            }

            var queue = await query
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return Results.Ok(queue);
        })
        .RequireAuthorization(AuthPolicies.EmployeeOnly)
        .WithName("GetEmployeeQueue")
        .WithSummary("Рабочая очередь заявок аналитика");

        // GET /api/employee/applications/{id}
        group.MapGet("/applications/{id:guid}", async Task<IResult> (
            Guid id,
            IUserContext userContext,
            ApplicationDbContext appDb,
            ICompanyLookupService? lookupService) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsBankEmployee) return Results.Forbid();

            var app = await appDb.Applications
                .Include(a => a.CurrentOffer)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (app is null) return Results.NotFound(new { error = "Заявка не найдена." });

            return await BuildApplicationResponseAsync(app, appDb, lookupService);
        })
        .RequireAuthorization(AuthPolicies.EmployeeOnly)
        .WithName("GetEmployeeApplicationById")
        .WithSummary("Детальное досье заявки для аналитика банка со скорингом и аудитом");

        // POST /api/employee/applications/{id}/approve (T12)
        group.MapPost("/applications/{id:guid}/approve", async Task<IResult> (
            Guid id,
            AnalystDecisionRequest request,
            IUserContext userContext,
            ApplicationDbContext appDb,
            ICompanyLookupService? lookupService) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsBankEmployee) return Results.Forbid();

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
            return await BuildApplicationResponseAsync(app, appDb, lookupService);
        })
        .RequireAuthorization(AuthPolicies.EmployeeOnly)
        .WithName("AnalystApproveApplication")
        .WithSummary("T12: Одобрение заявки аналитиком (переход в offer)");

        // POST /api/employee/applications/{id}/decline (T13)
        group.MapPost("/applications/{id:guid}/decline", async Task<IResult> (
            Guid id,
            AnalystDecisionRequest request,
            IUserContext userContext,
            ApplicationDbContext appDb,
            ICompanyLookupService? lookupService) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsBankEmployee) return Results.Forbid();

            var app = await appDb.Applications
                .Include(a => a.CurrentOffer)
                .FirstOrDefaultAsync(a => a.Id == id);
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
            return await BuildApplicationResponseAsync(app, appDb, lookupService);
        })
        .RequireAuthorization(AuthPolicies.EmployeeOnly)
        .WithName("AnalystDeclineApplication")
        .WithSummary("T13: Отказ аналитика (переход в declined)");

        // POST /api/employee/applications/{id}/request-info (T11)
        group.MapPost("/applications/{id:guid}/request-info", async Task<IResult> (
            Guid id,
            AnalystDecisionRequest request,
            IUserContext userContext,
            ApplicationDbContext appDb,
            ICompanyLookupService? lookupService) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsBankEmployee) return Results.Forbid();

            var app = await appDb.Applications
                .Include(a => a.CurrentOffer)
                .FirstOrDefaultAsync(a => a.Id == id);
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
            return await BuildApplicationResponseAsync(app, appDb, lookupService);
        })
        .RequireAuthorization(AuthPolicies.EmployeeOnly)
        .WithName("AnalystRequestInfo")
        .WithSummary("T11: Запрос сведений у клиента аналитиком (переход в need_info)");

        // POST /api/employee/applications/{id}/recheck (T14)
        group.MapPost("/applications/{id:guid}/recheck", async Task<IResult> (
            Guid id,
            IUserContext userContext,
            ApplicationDbContext appDb,
            IMessageBus bus,
            ICompanyLookupService? lookupService) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsBankEmployee) return Results.Forbid();

            var app = await appDb.Applications
                .Include(a => a.CurrentOffer)
                .FirstOrDefaultAsync(a => a.Id == id);
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

            return await BuildApplicationResponseAsync(app, appDb, lookupService);
        })
        .RequireAuthorization(AuthPolicies.EmployeeOnly)
        .WithName("AnalystRecheckApplication")
        .WithSummary("T14: Уточнены факты аналитиком, возврат на автопроверку (переход в checking)");

        // POST /api/employee/applications/{id}/close (T16: Некредитное препятствие)
        group.MapPost("/applications/{id:guid}/close", async Task<IResult> (
            Guid id,
            AnalystDecisionRequest request,
            IUserContext userContext,
            ApplicationDbContext appDb,
            ICompanyLookupService? lookupService) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsBankEmployee) return Results.Forbid();

            var app = await appDb.Applications
                .Include(a => a.CurrentOffer)
                .FirstOrDefaultAsync(a => a.Id == id);
            if (app is null) return Results.NotFound(new { error = "Заявка не найдена." });
            if (app.Status != ApplicationStatus.Review && app.Status != ApplicationStatus.Checking)
            {
                return Results.BadRequest(new { error = "Закрытие по некредитной причине доступно только из статусов review или checking." });
            }

            var prevStatus = app.Status;
            app.Status = ApplicationStatus.Closed;
            app.Decision = CreditDecision.Declined;
            if (!string.IsNullOrWhiteSpace(request.ReasonCode))
            {
                app.ReasonCodes = new List<string> { request.ReasonCode };
            }
            app.UpdatedAt = DateTimeOffset.UtcNow;

            appDb.TransitionHistory.Add(new TransitionRecord
            {
                ApplicationId = app.Id,
                FromStatus = prevStatus,
                ToStatus = ApplicationStatus.Closed,
                Actor = "analyst",
                ReasonCode = request.ReasonCode,
                Comment = request.Comment ?? "Некредитное препятствие (T16)"
            });

            await appDb.SaveChangesAsync();
            return await BuildApplicationResponseAsync(app, appDb, lookupService);
        })
        .RequireAuthorization(AuthPolicies.EmployeeOnly)
        .WithName("AnalystCloseApplication")
        .WithSummary("T16: Закрытие заявки аналитиком по некредитному препятствию (переход в closed)");

        return app;
    }

    private static async Task<IResult> BuildApplicationResponseAsync(
        SmartKabinet.Application.Domain.Application app,
        ApplicationDbContext appDb,
        ICompanyLookupService? lookupService)
    {
        var transitions = await appDb.TransitionHistory
            .Where(t => t.ApplicationId == app.Id)
            .OrderBy(t => t.Timestamp)
            .ToListAsync();

        string companyName = $"ИП (ИНН {app.Inn})";
        CompanyLookupDto? companyInfo = null;
        if (lookupService is not null && !string.IsNullOrWhiteSpace(app.Inn))
        {
            try
            {
                var lookupRes = await lookupService.LookupByInnAsync(app.Inn);
                if (lookupRes.IsSuccess && lookupRes.Value is not null)
                {
                    companyInfo = lookupRes.Value;
                    if (!string.IsNullOrWhiteSpace(companyInfo.FullName))
                    {
                        companyName = companyInfo.FullName;
                    }
                }
            }
            catch
            {
                // ignore lookup error
            }
        }

        var historyDtos = transitions.Select(t => new
        {
            id = t.Id.ToString(),
            transitionCode = !string.IsNullOrWhiteSpace(t.ReasonCode) && t.ReasonCode.StartsWith("T") ? t.ReasonCode : "T00",
            fromStatus = t.FromStatus.ToString().ToLowerInvariant(),
            toStatus = t.ToStatus.ToString().ToLowerInvariant(),
            actor = t.Actor.ToLowerInvariant(),
            actorName = t.Actor switch
            {
                "client" => "Клиент ИП",
                "analyst" => "Аналитик Банка",
                _ => "SmartKabinet Engine"
            },
            reasonCode = t.ReasonCode,
            comment = t.Comment,
            timestamp = t.Timestamp.ToString("o")
        }).ToList();

        var response = new
        {
            id = app.Id,
            applicationId = app.Id,
            clientId = app.ClientId,
            inn = app.Inn,
            companyName,
            stage = (int)app.Stage,
            purpose = (int)app.Purpose,
            productCode = !string.IsNullOrWhiteSpace(app.ProductCode) 
                ? app.ProductCode 
                : (app.Purpose == LoanPurpose.Equipment ? "EQ" : (app.Stage == BusinessStage.Prelaunch ? "START" : "WC")),
            requestedAmount = app.RequestedAmount,
            ownContribution = app.OwnContribution,
            requestedTermMonths = app.RequestedTermMonths ?? 12,
            neededByDate = app.NeededByDate,
            asSoonAsPossible = app.AsSoonAsPossible,
            bkiConsent = app.BkiConsent,
            personalDataConsent = app.PersonalDataConsent,
            purposeText = app.Purpose == LoanPurpose.Equipment ? "Покупка оборудования" : "Пополнение оборотных средств",
            monthlyRevenue = app.ProjectedMonthlyRevenue ?? (companyInfo?.AnnualRevenue.HasValue == true ? companyInfo.AnnualRevenue.Value / 12m : 0m),
            monthlyExpenses = companyInfo?.AverageMonthlyExpenses ?? 0m,
            equipmentPrice = app.EquipmentPrice,
            equipmentSupplier = app.EquipmentSupplier,
            equipmentList = app.EquipmentList,
            status = app.Status.ToString().ToLowerInvariant(),
            decision = app.Decision.ToString(),
            reasonCodes = app.ReasonCodes,
            createdAt = app.CreatedAt.ToString("o"),
            updatedAt = (app.UpdatedAt ?? app.CreatedAt).ToString("o"),
            history = historyDtos,
            currentOffer = app.CurrentOffer is not null ? new
            {
                approvedAmount = app.CurrentOffer.ApprovedAmount,
                termMonths = app.CurrentOffer.TermMonths,
                annualRatePercent = app.CurrentOffer.AnnualRatePercent,
                monthlyPayment = app.CurrentOffer.MonthlyPayment,
                isCounterOffer = app.CurrentOffer.IsCounterOffer,
                reasonCode = app.CurrentOffer.ReasonCode
            } : null,
            scoring = companyInfo is not null ? new
            {
                score = companyInfo.IsBankrupt || companyInfo.HasFnsBlock || companyInfo.ZskRiskLevel == "HIGH" ? 35 : 82,
                riskLevel = companyInfo.IsBankrupt || companyInfo.HasFnsBlock || companyInfo.ZskRiskLevel == "HIGH" ? "high" : "low",
                dscr = companyInfo.NetCashFlow > 0 && app.CurrentOffer?.MonthlyPayment > 0 
                    ? Math.Round((double)(companyInfo.NetCashFlow.Value / app.CurrentOffer.MonthlyPayment), 2)
                    : 1.45,
                netCashFlow = companyInfo.NetCashFlow ?? (app.ProjectedMonthlyRevenue ?? 300_000m) * 0.4m,
                recommendedMaxPayment = (companyInfo.NetCashFlow ?? (app.ProjectedMonthlyRevenue ?? 300_000m) * 0.4m) * 0.7m,
                calculatedAt = DateTime.UtcNow.ToString("o"),
                stopFactors = new object[]
                {
                    new {
                        id = "sf-fns",
                        code = "FNS_BLOCK",
                        title = "Блокировки счетов ФНС",
                        description = companyInfo.HasFnsBlock ? "Обнаружены решения о приостановлении операций по счетам" : "Решений ФНС о блокировке счетов не обнаружено",
                        isTriggered = companyInfo.HasFnsBlock,
                        severity = "critical"
                    },
                    new {
                        id = "sf-zsk",
                        code = "ZSK_RISK",
                        title = "Платформа ЗСК ЦБ РФ",
                        description = $"Уровень риска: {companyInfo.ZskRiskLevel}",
                        isTriggered = companyInfo.ZskRiskLevel == "HIGH",
                        severity = "critical"
                    },
                    new {
                        id = "sf-bankrupt",
                        code = "EFRSB_BANKRUPTCY",
                        title = "Реестр банкротств ЕФРСБ",
                        description = companyInfo.IsBankrupt ? "Найдены сведения о признании ИП банкротом" : "Сведений о процедурах банкротства не обнаружено",
                        isTriggered = companyInfo.IsBankrupt,
                        severity = "critical"
                    }
                },
                egrip = new
                {
                    inn = companyInfo.Inn,
                    ogrnip = companyInfo.Ogrnip ?? "",
                    fullName = companyInfo.FullName ?? companyName,
                    status = companyInfo.EgripStatus ?? "ACTIVE",
                    registrationDate = companyInfo.RegistrationDate?.ToString("yyyy-MM-dd") ?? "",
                    okved = companyInfo.OkvedMain ?? "",
                    okvedName = companyInfo.OkvedMainName ?? "",
                    region = companyInfo.RegionName ?? ""
                },
                fns = new
                {
                    taxDebtAmount = 0m,
                    hasSuspendedAccounts = companyInfo.HasFnsBlock,
                    isDisqualifiedPerson = false,
                    lastReportingSubmitted = true
                },
                bki = new
                {
                    rating = companyInfo.IsAlfaClient ? 780 : 710,
                    activeLoansCount = companyInfo.IsAlfaClient ? 1 : 0,
                    totalDebt = 0m,
                    maxOverdueDays = 0,
                    currentOverdueAmount = 0m,
                    hasCriticalDelays = false
                }
            } : null
        };

        return Results.Ok(response);
    }
}
