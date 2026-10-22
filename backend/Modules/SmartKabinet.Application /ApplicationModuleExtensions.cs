using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Application.Features.Commands;
using SmartKabinet.Application.Infrastructure.Persistence;

namespace SmartKabinet.Application;

public static class ApplicationModuleExtensions
{
    public static IServiceCollection AddApplicationModule(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is required for Application module.");

        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseNpgsql(connectionString, b => b.MigrationsHistoryTable("__EFMigrationsHistory_Application", "credit_app"));
        });

        // Регистрация сервисов и обработчиков команд
        services.AddScoped<CreateDraftHandler>();
        services.AddScoped<ICreateDraft>(sp => sp.GetRequiredService<CreateDraftHandler>());

        services.AddScoped<SaveDraftHandler>();
        services.AddScoped<ISaveDraft>(sp => sp.GetRequiredService<SaveDraftHandler>());

        services.AddScoped<SubmitApplicationHandler>();
        services.AddScoped<ISubmitApplication>(sp => sp.GetRequiredService<SubmitApplicationHandler>());

        services.AddScoped<RetryCheckHandler>();
        services.AddScoped<IRetryCheck>(sp => sp.GetRequiredService<RetryCheckHandler>());

        services.AddScoped<RespondInfoHandler>();
        services.AddScoped<IRespondToInfoRequest>(sp => sp.GetRequiredService<RespondInfoHandler>());

        services.AddScoped<WithdrawHandler>();
        services.AddScoped<IWithdrawApplication>(sp => sp.GetRequiredService<WithdrawHandler>());

        services.AddScoped<ApplicationQueriesHandler>();
        services.AddScoped<IGetApplication>(sp => sp.GetRequiredService<ApplicationQueriesHandler>());
        services.AddScoped<IApplicationModule>(sp => sp.GetRequiredService<ApplicationQueriesHandler>());

        return services;
    }

    public static IEndpointRouteBuilder MapApplicationEndpoints(this IEndpointRouteBuilder app)
    {
        return app;
    }
}
