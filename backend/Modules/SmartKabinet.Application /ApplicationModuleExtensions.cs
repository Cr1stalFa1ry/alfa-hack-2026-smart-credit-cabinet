using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SmartKabinet.Application.Infrastructure.Persistence;

namespace SmartKabinet.Application;

public static class ApplicationModuleExtensions
{
    public static IServiceCollection AddApplicationModule(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        services.AddDbContext<ApplicationDbContext>(options =>
        {
            if (!string.IsNullOrWhiteSpace(connectionString) && !connectionString.Contains("InMemory", StringComparison.OrdinalIgnoreCase))
            {
                options.UseNpgsql(connectionString, b => b.MigrationsHistoryTable("__EFMigrationsHistory_Application", "credit_app"));
            }
            else
            {
                options.UseInMemoryDatabase("SmartKabinetApplicationDb");
            }
        });

        return services;
    }

    public static IEndpointRouteBuilder MapApplicationEndpoints(this IEndpointRouteBuilder app)
    {
        // Внутренние эндпоинты ядра заявок при необходимости
        return app;
    }
}
