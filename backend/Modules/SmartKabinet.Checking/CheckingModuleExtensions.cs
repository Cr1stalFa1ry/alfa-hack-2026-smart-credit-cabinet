using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace SmartKabinet.Checking;

public static class CheckingModuleExtensions
{
    public static IServiceCollection AddCheckingModule(this IServiceCollection services, IConfiguration configuration)
    {
        // Регистрация сервисов модуля проверки/скоринга
        return services;
    }

    public static IEndpointRouteBuilder MapCheckingEndpoints(this IEndpointRouteBuilder app)
    {
        return app;
    }
}
