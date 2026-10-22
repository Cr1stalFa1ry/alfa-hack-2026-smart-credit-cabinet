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
using SmartKabinet.Client.Features.Applications;
using SmartKabinet.Client.Infrastructure.Persistence;
using SmartKabinet.Intergrations.Ml.Models;
using SmartKabinet.Intergrations.Ml.Services;
using Wolverine;

namespace SmartKabinet.Client;

public static class ClientModuleExtensions
{
    public static IServiceCollection AddClientModule(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        services.AddDbContext<ClientDbContext>(options =>
        {
            if (!string.IsNullOrWhiteSpace(connectionString) && !connectionString.Contains("InMemory", StringComparison.OrdinalIgnoreCase))
            {
                options.UseNpgsql(connectionString, b => b.MigrationsHistoryTable("__EFMigrationsHistory_Client", "client"));
            }
            else
            {
                options.UseInMemoryDatabase("SmartKabinetClientDb");
            }
        });

        return services;
    }

    public static IEndpointRouteBuilder MapClientEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/client").WithTags("Client Cabinet");

        // GET /api/client/profile
        group.MapGet("/profile", async (
            IUserContext userContext,
            ClientDbContext dbContext) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();

            var profile = await dbContext.Clients.FirstOrDefaultAsync(c => c.UserId == userContext.UserId.Value);
            return profile is not null ? Results.Ok(profile) : Results.NotFound(new { error = "Профиль клиента не найден." });
        })
        .RequireAuthorization()
        .WithName("GetClientProfile")
        .WithSummary("Получение профиля текущего клиента ИП");

        // POST /api/client/applications/draft (T01)
        group.MapPost("/applications/draft", async (
            CreateDraftRequest request,
            IUserContext userContext,
            ApplicationDbContext appDb) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();

            var app = new Application.Domain.Application
            {
                Id = Guid.NewGuid(),
                ClientId = userContext.UserId.Value,
                Inn = request.Inn,
                Status = ApplicationStatus.Draft,
                Stage = (BusinessStage)request.Stage,
                Purpose = (LoanPurpose)request.Purpose,
                RequestedAmount = request.RequestedAmount,
                OwnContribution = request.OwnContribution,
                RequestedTermMonths = request.RequestedTermMonths,
                BkiConsent = request.BkiConsent,
                PersonalDataConsent = request.PersonalDataConsent,
                EquipmentSupplier = request.EquipmentSupplier,
                EquipmentPrice = request.EquipmentPrice,
                CreatedAt = DateTimeOffset.UtcNow
            };

            appDb.Applications.Add(app);
            appDb.TransitionHistory.Add(new TransitionRecord
            {
                ApplicationId = app.Id,
                FromStatus = ApplicationStatus.Draft,
                ToStatus = ApplicationStatus.Draft,
                Actor = "client",
                Comment = "Создан черновик заявки (T01)"
            });

            await appDb.SaveChangesAsync();
            return Results.Created($"/api/client/applications/{app.Id}", new { applicationId = app.Id, status = app.Status.ToString() });
        })
        .RequireAuthorization()
        .WithName("CreateApplicationDraft")
        .WithSummary("T01: Создание черновика заявки на кредит");

        // PUT /api/client/applications/{id}/draft (T02)
        group.MapPut("/applications/{id:guid}/draft", async (
            Guid id,
            UpdateDraftRequest request,
            IUserContext userContext,
            ApplicationDbContext appDb) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();

            var app = await appDb.Applications.FirstOrDefaultAsync(a => a.Id == id && a.ClientId == userContext.UserId.Value);
            if (app is null) return Results.NotFound(new { error = "Заявка не найдена." });

            if (app.Status != ApplicationStatus.Draft)
            {
                return Results.BadRequest(new { error = "После отправки редактирование заявки закрыто." });
            }

            app.RequestedAmount = request.RequestedAmount;
            app.OwnContribution = request.OwnContribution;
            app.RequestedTermMonths = request.RequestedTermMonths;
            app.BkiConsent = request.BkiConsent;
            app.PersonalDataConsent = request.PersonalDataConsent;
            app.StatementFilePath = request.StatementFilePath;
            app.FinancialReserve = request.FinancialReserve;
            app.UpdatedAt = DateTimeOffset.UtcNow;

            appDb.TransitionHistory.Add(new TransitionRecord
            {
                ApplicationId = app.Id,
                FromStatus = ApplicationStatus.Draft,
                ToStatus = ApplicationStatus.Draft,
                Actor = "client",
                Comment = "Сохранены изменения в черновике (T02)"
            });

            await appDb.SaveChangesAsync();
            return Results.Ok(new { message = "Черновик успешно обновлен", applicationId = app.Id });
        })
        .RequireAuthorization()
        .WithName("SaveApplicationDraft")
        .WithSummary("T02: Сохранение черновика заявки");

        // POST /api/client/applications/{id}/submit (T03)
        group.MapPost("/applications/{id:guid}/submit", async (
            Guid id,
            IUserContext userContext,
            ApplicationDbContext appDb,
            IMessageBus bus) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();

            var app = await appDb.Applications.FirstOrDefaultAsync(a => a.Id == id && a.ClientId == userContext.UserId.Value);
            if (app is null) return Results.NotFound(new { error = "Заявка не найдена." });

            if (!ApplicationStateMachine.CanTransition(app.Status, ApplicationStatus.Checking))
            {
                return Results.BadRequest(new { error = $"Недопустимый переход из статуса {app.Status} в checking." });
            }

            if (!app.BkiConsent || !app.PersonalDataConsent)
            {
                return Results.BadRequest(new { error = "Для отправки обязательны согласия на запрос в БКИ и обработку персональных данных." });
            }

            var fromStatus = app.Status;
            app.Status = ApplicationStatus.Checking;
            app.UpdatedAt = DateTimeOffset.UtcNow;

            appDb.TransitionHistory.Add(new TransitionRecord
            {
                ApplicationId = app.Id,
                FromStatus = fromStatus,
                ToStatus = ApplicationStatus.Checking,
                Actor = "client",
                Comment = "Заявка отправлена клиентом на проверку (T03)"
            });

            await appDb.SaveChangesAsync();

            // Публикуем событие в шину Wolverine для модуля Checking
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

            return Results.Ok(new { message = "Заявка успешно отправлена на проверку", applicationId = app.Id, status = app.Status.ToString() });
        })
        .RequireAuthorization()
        .WithName("SubmitApplication")
        .WithSummary("T03: Отправка заявки на проверку (переход в checking)");

        // POST /api/client/applications/{id}/retry-check (T06)
        group.MapPost("/applications/{id:guid}/retry-check", async (
            Guid id,
            IUserContext userContext,
            ApplicationDbContext appDb,
            IMessageBus bus) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();

            var app = await appDb.Applications.FirstOrDefaultAsync(a => a.Id == id && a.ClientId == userContext.UserId.Value);
            if (app is null) return Results.NotFound(new { error = "Заявка не найдена." });

            if (app.Status != ApplicationStatus.WaitingCheck)
            {
                return Results.BadRequest(new { error = "Повтор проверки доступен только из статуса waiting_check." });
            }

            app.Status = ApplicationStatus.Checking;
            app.UpdatedAt = DateTimeOffset.UtcNow;

            appDb.TransitionHistory.Add(new TransitionRecord
            {
                ApplicationId = app.Id,
                FromStatus = ApplicationStatus.WaitingCheck,
                ToStatus = ApplicationStatus.Checking,
                Actor = "client",
                Comment = "Повторный запуск проверки клиентом (T06)"
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

            return Results.Ok(new { message = "Проверка запущена повторно", applicationId = app.Id, status = app.Status.ToString() });
        })
        .RequireAuthorization()
        .WithName("RetryApplicationCheck")
        .WithSummary("T06: Повторный запуск проверки из waiting_check");

        // POST /api/client/applications/{id}/respond-info (T10)
        group.MapPost("/applications/{id:guid}/respond-info", async (
            Guid id,
            RespondInfoRequest request,
            IUserContext userContext,
            ApplicationDbContext appDb,
            IMessageBus bus) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();

            var app = await appDb.Applications.FirstOrDefaultAsync(a => a.Id == id && a.ClientId == userContext.UserId.Value);
            if (app is null) return Results.NotFound(new { error = "Заявка не найдена." });

            if (app.Status != ApplicationStatus.NeedInfo)
            {
                return Results.BadRequest(new { error = "Ответ на запрос доступен только в статусе need_info." });
            }

            if (!string.IsNullOrEmpty(request.StatementFilePath)) app.StatementFilePath = request.StatementFilePath;
            if (request.FinancialReserve.HasValue) app.FinancialReserve = request.FinancialReserve.Value;

            app.Status = ApplicationStatus.Checking;
            app.UpdatedAt = DateTimeOffset.UtcNow;

            appDb.TransitionHistory.Add(new TransitionRecord
            {
                ApplicationId = app.Id,
                FromStatus = ApplicationStatus.NeedInfo,
                ToStatus = ApplicationStatus.Checking,
                Actor = "client",
                Comment = request.Comment ?? "Клиент предоставил запрошенные сведения (T10)"
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

            return Results.Ok(new { message = "Сведения переданы, заявка возвращена на проверку", applicationId = app.Id, status = app.Status.ToString() });
        })
        .RequireAuthorization()
        .WithName("RespondRequestedInfo")
        .WithSummary("T10: Ответ клиента на дозапрос банка (переход в checking)");

        // POST /api/client/applications/{id}/withdraw (T17)
        group.MapPost("/applications/{id:guid}/withdraw", async (
            Guid id,
            IUserContext userContext,
            ApplicationDbContext appDb) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();

            var app = await appDb.Applications.FirstOrDefaultAsync(a => a.Id == id && a.ClientId == userContext.UserId.Value);
            if (app is null) return Results.NotFound(new { error = "Заявка не найдена." });

            if (!ApplicationStateMachine.CanTransition(app.Status, ApplicationStatus.Closed))
            {
                return Results.BadRequest(new { error = $"Заявку в статусе {app.Status} нельзя отозвать." });
            }

            var fromStatus = app.Status;
            app.Status = ApplicationStatus.Closed;
            app.UpdatedAt = DateTimeOffset.UtcNow;

            appDb.TransitionHistory.Add(new TransitionRecord
            {
                ApplicationId = app.Id,
                FromStatus = fromStatus,
                ToStatus = ApplicationStatus.Closed,
                Actor = "client",
                Comment = "Заявка отозвана клиентом (T17)"
            });

            await appDb.SaveChangesAsync();
            return Results.Ok(new { message = "Заявка успешно отозвана и закрыта", applicationId = app.Id, status = app.Status.ToString() });
        })
        .RequireAuthorization()
        .WithName("WithdrawApplication")
        .WithSummary("T17: Отзыв заявки клиентом (переход в closed)");

        // GET /api/client/applications/{id}
        group.MapGet("/applications/{id:guid}", async (
            Guid id,
            IUserContext userContext,
            ApplicationDbContext appDb) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();

            var app = await appDb.Applications
                .Include(a => a.CurrentOffer)
                .FirstOrDefaultAsync(a => a.Id == id && a.ClientId == userContext.UserId.Value);

            if (app is null) return Results.NotFound(new { error = "Заявка не найдена." });

            var clientTexts = ClientReasonHelper.GetClientTexts(app.ReasonCodes);
            var offerDto = app.CurrentOffer is not null
                ? new ApplicationOfferDto(
                    app.CurrentOffer.ApprovedAmount,
                    app.CurrentOffer.TermMonths,
                    app.CurrentOffer.AnnualRatePercent,
                    app.CurrentOffer.MonthlyPayment,
                    app.CurrentOffer.IsCounterOffer,
                    app.CurrentOffer.ReasonCode)
                : null;

            return Results.Ok(new
            {
                app.Id,
                app.ClientId,
                app.Inn,
                Status = app.Status.ToString().ToLowerInvariant(),
                Decision = app.Decision.ToString(),
                app.RequestedAmount,
                app.OwnContribution,
                app.RequestedTermMonths,
                app.ReasonCodes,
                ClientReasonTexts = clientTexts,
                Offer = offerDto,
                app.CreatedAt,
                app.UpdatedAt
            });
        })
        .RequireAuthorization()
        .WithName("GetClientApplicationById")
        .WithSummary("Просмотр заявки клиентом (без отображения внутренних баллов/DSCR)");

        // GET /api/client/applications
        group.MapGet("/applications", async (
            IUserContext userContext,
            ApplicationDbContext appDb) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();

            var apps = await appDb.Applications
                .Include(a => a.CurrentOffer)
                .Where(a => a.ClientId == userContext.UserId.Value)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            var result = apps.Select(app => new
            {
                app.Id,
                app.Inn,
                Status = app.Status.ToString().ToLowerInvariant(),
                Decision = app.Decision.ToString(),
                app.RequestedAmount,
                app.RequestedTermMonths,
                ClientReasonTexts = ClientReasonHelper.GetClientTexts(app.ReasonCodes),
                HasOffer = app.CurrentOffer is not null,
                app.CreatedAt
            });

            return Results.Ok(result);
        })
        .RequireAuthorization()
        .WithName("GetClientApplications")
        .WithSummary("Список всех заявок текущего клиента ИП");

        // POST /api/client/applications/{id}/statement (Анализ выписки через ML сервис)
        group.MapPost("/applications/{id:guid}/statement", async (
            Guid id,
            IFormFile file,
            string? asOf,
            IUserContext userContext,
            ApplicationDbContext appDb,
            ClientDbContext clientDb,
            IMlServiceClient mlClient,
            CancellationToken ct) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();

            var app = await appDb.Applications.FirstOrDefaultAsync(a => a.Id == id && a.ClientId == userContext.UserId.Value, ct);
            if (app is null) return Results.NotFound(new { error = "Заявка не найдена." });

            if (file == null || file.Length == 0)
            {
                return Results.BadRequest(new { error = "Файл выписки не передан или пуст." });
            }

            var profile = await clientDb.Clients.FirstOrDefaultAsync(c => c.UserId == userContext.UserId.Value, ct);
            var ownerName = profile is not null ? $"{profile.LastName} {profile.FirstName}".Trim() : null;

            using var stream = file.OpenReadStream();
            var analysisResult = await mlClient.AnalyzeStatementAsync(stream, file.FileName, asOf, ownerName, ct);

            // Сохраняем имя файла
            app.StatementFilePath = file.FileName;

            if (analysisResult.Status == "ok" && analysisResult.Metrics is not null)
            {
                app.HistoryMonths = analysisResult.Metrics.MonthsCount;
                app.ExistingMonthlyObligations = analysisResult.Metrics.AvgMonthlyLoanPaymentsRub;
                app.ProjectedMonthlyRevenue = analysisResult.Metrics.AvgMonthlyRevenueRub;
            }

            app.UpdatedAt = DateTimeOffset.UtcNow;
            await appDb.SaveChangesAsync(ct);

            return Results.Ok(new
            {
                applicationId = app.Id,
                status = analysisResult.Status,
                reason = analysisResult.Reason,
                metrics = analysisResult.Metrics,
                message = analysisResult.Message
            });
        })
        .DisableAntiforgery()
        .RequireAuthorization()
        .WithName("UploadAndAnalyzeStatement")
        .WithSummary("Загрузка и ML-анализ банковской выписки (CSV/XLSX) для заявки");

        // GET /api/client/applications/{id}/explanation (Человекочитаемое объяснение решения через ML)
        group.MapGet("/applications/{id:guid}/explanation", async (
            Guid id,
            IUserContext userContext,
            ApplicationDbContext appDb,
            IMlServiceClient mlClient,
            CancellationToken ct) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();

            var app = await appDb.Applications.FirstOrDefaultAsync(a => a.Id == id && a.ClientId == userContext.UserId.Value, ct);
            if (app is null) return Results.NotFound(new { error = "Заявка не найдена." });

            var primaryReason = app.ReasonCodes.FirstOrDefault();
            if (string.IsNullOrWhiteSpace(primaryReason))
            {
                return Results.Ok(new
                {
                    applicationId = app.Id,
                    status = app.Status.ToString().ToLowerInvariant(),
                    explanation = "Заявка находится в обработке.",
                    source = "default"
                });
            }

            var details = new Dictionary<string, object>
            {
                ["requested_amount"] = app.RequestedAmount,
                ["stage"] = app.Stage.ToString(),
                ["status"] = app.Status.ToString()
            };

            var mlExplanation = await mlClient.ExplainDecisionAsync(primaryReason, details, "client", ct);

            return Results.Ok(new
            {
                applicationId = app.Id,
                status = app.Status.ToString().ToLowerInvariant(),
                reasonCode = primaryReason,
                explanation = mlExplanation.Text,
                source = mlExplanation.Source
            });
        })
        .RequireAuthorization()
        .WithName("GetApplicationExplanation")
        .WithSummary("Получение человекочитаемого объяснения решения (ML Qwen / Fallback)");

        return app;
    }
}
