using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SmartKabinet.Intergrations.AlfaBank.Features;
using SmartKabinet.Intergrations.AlfaBank.Persistence;
using SmartKabinet.Intergrations.AlfaBank.Services;
using SmartKabinet.Intergrations.AlfaBank.Simulators;
using SmartKabinet.Intergrations.Ml.Models;
using SmartKabinet.Intergrations.Ml.Services;
using SmartKabinet.Intergrations.Synthetic.Services;

namespace SmartKabinet.Intergrations;

public static class IntegrationsModuleExtensions
{
    public static IServiceCollection AddIntegrationsModule(this IServiceCollection services, IConfiguration configuration)
    {
        // 1. Подключение PostgreSQL SyntheticDbContext
        var connectionString = configuration.GetConnectionString("SyntheticDb") 
                               ?? configuration.GetConnectionString("DefaultConnection")
                               ?? "Host=localhost;Port=5432;Database=smart_kabinet_synthetic_db;Username=postgres;Password=postgres";

        services.AddDbContext<SyntheticDbContext>(options =>
        {
            options.UseNpgsql(connectionString);
        });

        // 2. Handlers и клиенты
        services.AddScoped<GetCustomerByInnHandler>();
        services.AddScoped<SynthesizeCustomerHandler>();
        services.AddScoped<IAlfaBankCustomerDataClient, AlfaBankSyntheticSimulator>();
        services.AddScoped<ICompanyLookupService, CompanyLookupService>();
        services.AddScoped<IEquipmentCatalogService, EquipmentCatalogService>();

        // 3. ML Service HTTP Client (Python / FastAPI)
        services.AddHttpClient<IMlServiceClient, MlServiceClient>();

        return services;
    }

    /// <summary>
    /// Автоматическое сидирование синтетических клиентов Альфа-Банка в PostgreSQL
    /// </summary>
    public static async Task<IApplicationBuilder> UseSyntheticDataSeedAsync(this IApplicationBuilder app)
    {
        using var scope = app.ApplicationServices.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SyntheticDbContext>();

        // Если используется реальный Postgres, гарантируем создание таблиц
        if (db.Database.IsRelational())
        {
            await db.Database.EnsureCreatedAsync();
        }

        await SyntheticDbContext.SeedPostgresDefaultDataAsync(db);
        return app;
    }

    /// <summary>
    /// Эндпоинты для работы с синтетическими данными Альфа-Банка и ML сервисом
    /// </summary>
    public static IEndpointRouteBuilder MapIntegrationsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/integrations").WithTags("Integrations & PostgreSQL Simulators");

        // GET /api/integrations/alfa-customer/{inn}
        group.MapGet("/alfa-customer/{inn}", async (
            string inn,
            GetCustomerByInnHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(inn, ct);
            if (!result.Success)
            {
                if (result.ErrorCode == "SOURCE_UNAVAILABLE")
                {
                    return Results.StatusCode(StatusCodes.Status503ServiceUnavailable);
                }
                return Results.BadRequest(new { error = result.ErrorCode, message = result.ErrorMessage });
            }

            return Results.Ok(result);
        })
        .WithName("GetAlfaCustomerByInn")
        .WithSummary("Получение данных клиента Альфа-Банка из PostgreSQL по ИНН");

        // GET /api/integrations/egrip/{inn} (Синтетический реестр ЕГРИП и Альфа-Банка)
        async Task<IResult> GetEgripHandler(string inn, ICompanyLookupService lookupService, CancellationToken ct)
        {
            var result = await lookupService.LookupByInnAsync(inn, ct);
            if (!result.IsSuccess)
            {
                return result.Error.Code == "Lookup.NotFound"
                    ? Results.NotFound(new { error = result.Error.Code, message = result.Error.Message })
                    : Results.BadRequest(new { error = result.Error.Code, message = result.Error.Message });
            }

            var c = result.Value;
            var status = c.IsBankrupt ? "BANKRUPT" : (c.EgripStatus ?? "ACTIVE");
            var registrationDate = c.RegistrationDate?.ToString("yyyy-MM-dd") ?? string.Empty;
            var okved = c.OkvedMain ?? "47.19";
            var okvedName = c.OkvedMainName ?? "Торговля розничная";
            var region = c.RegionName ?? c.RegionCode ?? "г. Москва";
            var ogrnip = !string.IsNullOrWhiteSpace(c.Ogrnip) ? c.Ogrnip : $"320{c.Inn}01";

            return Results.Ok(new
            {
                inn = c.Inn,
                ogrnip,
                fullName = c.FullName ?? $"ИП {c.Inn}",
                status,
                registrationDate,
                okved,
                okvedName,
                region,
                firstName = c.FirstName,
                lastName = c.LastName,
                patronymic = c.Patronymic,
                taxRegime = c.TaxRegime,
                mspCategory = c.MspCategory,
                suggestedStage = c.SuggestedStage,
                isAlfaClient = c.IsAlfaClient,
                annualRevenue = c.AnnualRevenue,
                netCashFlow = c.NetCashFlow,
                averageMonthlyExpenses = c.AverageMonthlyExpenses,
                operatingMonths = c.OperatingMonths,
                hasFnsBlock = c.HasFnsBlock,
                zskRiskLevel = c.ZskRiskLevel,
                isBankrupt = c.IsBankrupt
            });
        }

        group.MapGet("/egrip/{inn}", GetEgripHandler)
            .AllowAnonymous()
            .WithName("GetEgripByInn")
            .WithSummary("Получение данных ИП из синтетического ЕГРИП и базы Альфа-Банка по ИНН");

        app.MapGet("/integrations/egrip/{inn}", GetEgripHandler)
            .AllowAnonymous()
            .ExcludeFromDescription();

        // POST /api/integrations/synthesize-customer
        group.MapPost("/synthesize-customer", async (
            SynthesizeCustomerRequest request,
            SynthesizeCustomerHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(request, ct);
            if (!result.Success)
            {
                return Results.BadRequest(new { error = result.ErrorCode, message = result.ErrorMessage });
            }

            return Results.Ok(result);
        })
        .WithName("SynthesizeCustomer")
        .WithSummary("Синтез / добавление нового клиента Альфа-Банка в PostgreSQL");

        // ML Service Endpoints
        var mlGroup = app.MapGroup("/api/integrations/ml").WithTags("ML Service Integrations (FastAPI)");

        // GET /api/integrations/ml/health
        mlGroup.MapGet("/health", async (IMlServiceClient mlClient, CancellationToken ct) =>
        {
            var isHealthy = await mlClient.HealthCheckAsync(ct);
            return isHealthy 
                ? Results.Ok(new { status = "ok", mlService = "available" })
                : Results.Json(new { status = "unavailable", mlService = "unreachable" }, statusCode: StatusCodes.Status503ServiceUnavailable);
        })
        .WithName("CheckMlHealth")
        .WithSummary("Проверка доступности ML микросервиса (GET /health)");

        // POST /api/integrations/ml/statement/analyze
        mlGroup.MapPost("/statement/analyze", async (
            IFormFile file,
            string? asOf,
            string? ownerName,
            IMlServiceClient mlClient,
            CancellationToken ct) =>
        {
            if (file == null || file.Length == 0)
            {
                return Results.BadRequest(new { error = "Файл выписки не передан или пуст." });
            }

            using var stream = file.OpenReadStream();
            var result = await mlClient.AnalyzeStatementAsync(stream, file.FileName, asOf, ownerName, ct);

            return Results.Ok(result);
        })
        .DisableAntiforgery()
        .WithName("AnalyzeStatementDirect")
        .WithSummary("Прямой анализ выписки (CSV/XLSX) через ML микросервис");

        // POST /api/integrations/ml/explain
        mlGroup.MapPost("/explain", async (
            ExplainDecisionRequest request,
            IMlServiceClient mlClient,
            CancellationToken ct) =>
        {
            var result = await mlClient.ExplainDecisionAsync(request.ReasonCode, request.Details, request.Actor, ct);
            return Results.Ok(result);
        })
        .WithName("ExplainDecisionDirect")
        .WithSummary("Генерация клиентского объяснения решения кредитного кабинета через ML (Qwen LLM / Fallback)");

        return app;
    }
}
