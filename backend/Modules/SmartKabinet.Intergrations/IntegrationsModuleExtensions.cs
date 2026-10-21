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
    /// Эндпоинты для работы с синтетическими данными Альфа-Банка
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

        return app;
    }
}
