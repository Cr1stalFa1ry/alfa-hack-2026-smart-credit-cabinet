using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SmartKabinet.Auth.Infrastructure.Security;
using SmartKabinet.BankEmployee.Features.Applications;
using SmartKabinet.BankEmployee.Features.Applications.ApproveApplication;
using SmartKabinet.BankEmployee.Features.Applications.CloseApplication;
using SmartKabinet.BankEmployee.Features.Applications.Common;
using SmartKabinet.BankEmployee.Features.Applications.DeclineApplication;
using SmartKabinet.BankEmployee.Features.Applications.GetApplicationById;
using SmartKabinet.BankEmployee.Features.Applications.GetQueue;
using SmartKabinet.BankEmployee.Features.Applications.RecheckApplication;
using SmartKabinet.BankEmployee.Features.Applications.RequestInfo;
using SmartKabinet.BankEmployee.Features.Profile.GetProfile;
using SmartKabinet.BankEmployee.Infrastructure.Persistence;

namespace SmartKabinet.BankEmployee;

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

        // Builder для формирования досье заявки
        services.AddScoped<IBankApplicationDossierBuilder, BankApplicationDossierBuilder>();

        // VSA Handlers
        services.AddScoped<GetBankEmployeeProfileHandler>();
        services.AddScoped<GetEmployeeQueueHandler>();
        services.AddScoped<GetEmployeeApplicationByIdHandler>();
        services.AddScoped<ApproveApplicationHandler>();
        services.AddScoped<DeclineApplicationHandler>();
        services.AddScoped<RequestInfoHandler>();
        services.AddScoped<RecheckApplicationHandler>();
        services.AddScoped<CloseApplicationHandler>();

        return services;
    }

    public static IEndpointRouteBuilder MapBankEmployeeEndpoints(this IEndpointRouteBuilder app)
    {
        var employeeGroup = app.MapGroup("/api/employee")
            .WithTags("Bank Employee Workplace")
            .RequireAuthorization(AuthPolicies.EmployeeOnly);

        // Профиль сотрудника
        employeeGroup.MapGetBankEmployeeProfileEndpoint();

        // Заявки сотрудника банка
        app.MapBankEmployeeApplicationsEndpoints();

        return app;
    }
}
