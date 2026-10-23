using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SmartKabinet.Client.Features.Applications;
using SmartKabinet.Client.Features.Companies;
using SmartKabinet.Client.Features.Equipment;
using SmartKabinet.Client.Features.Products;
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

        var companiesGroup = clientGroup.MapGroup("/companies").WithTags("Company Lookup");
        companiesGroup.MapCompanyLookupEndpoints();

        var equipmentGroup = clientGroup.MapGroup("/equipment").WithTags("Equipment Catalog");
        equipmentGroup.MapEquipmentEndpoints();

        var productsGroup = clientGroup.MapGroup("/products").WithTags("Credit Products");
        productsGroup.MapProductsEndpoints("Client");

        // Также регистрируем общий alias /api/products
        var publicProductsGroup = app.MapGroup("/api/products").WithTags("Credit Products");
        publicProductsGroup.MapProductsEndpoints("Public");

        app.MapApplicationsEndpoints();

        return app;
    }
}
