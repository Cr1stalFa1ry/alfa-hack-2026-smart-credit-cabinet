using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SmartKabinet.Client.Features.Applications;
using SmartKabinet.Client.Features.Profile.GetProfile;
using SmartKabinet.Client.Infrastructure.Persistence;

namespace SmartKabinet.Client;

public static class ClientModuleExtensions
{
    public static IServiceCollection AddClientModule(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is required for Client module.");

        services.AddDbContext<ClientDbContext>(options =>
        {
            options.UseNpgsql(connectionString, b => b.MigrationsHistoryTable("__EFMigrationsHistory_Client", "client"));
        });

        return services;
    }

    public static IEndpointRouteBuilder MapClientEndpoints(this IEndpointRouteBuilder app)
    {
        var clientGroup = app.MapGroup("/api/client").WithTags("Client Cabinet");
        clientGroup.MapGetProfileEndpoint();

        app.MapApplicationsEndpoints();

        return app;
    }
}
