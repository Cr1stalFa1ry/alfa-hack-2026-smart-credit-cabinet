using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SmartKabinet.Intergrations.AlfaBank.Services;
using SmartKabinet.Intergrations.AlfaBank.Simulators;

namespace SmartKabinet.Intergrations;

public static class IntegrationsModuleExtensions
{
    public static IServiceCollection AddIntegrationsModule(this IServiceCollection services, IConfiguration configuration)
    {
        // Регистрация синтетической базы данных Альфа-Банка
        services.AddSingleton<AlfaSyntheticDatabase>();

        // Регистрация клиента получения данных клиента Альфа-Банка
        services.AddScoped<IAlfaBankCustomerDataClient, AlfaBankSyntheticSimulator>();

        return services;
    }

    /// <summary>
    /// Эндпоинты для проверки интеграций и симуляторов
    /// </summary>
    public static IEndpointRouteBuilder MapIntegrationsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/integrations").WithTags("Integrations & Simulators");

        // GET /api/integrations/alfa-customer/{inn}
        group.MapGet("/alfa-customer/{inn}", async (
            string inn,
            IAlfaBankCustomerDataClient client,
            CancellationToken ct) =>
        {
            var result = await client.GetCustomerByInnAsync(inn, ct);
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
        .WithName("GetAlfaBankCustomerByInn")
        .WithSummary("Проверка статуса клиента Альфа-Банка и получение выписки/оборотов по ИНН");

        return app;
    }
}
