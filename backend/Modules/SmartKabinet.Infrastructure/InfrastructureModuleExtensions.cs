using Amazon.Runtime;
using Amazon.S3;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using SmartKabinet.Infrastructure.Contracts;
using SmartKabinet.Infrastructure.Features;
using SmartKabinet.Infrastructure.Infrastructure;

namespace SmartKabinet.Infrastructure;

public static class InfrastructureModuleExtensions
{
    public static IServiceCollection AddInfrastructureModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Конфигурация S3
        services.Configure<S3StorageOptions>(configuration.GetSection(S3StorageOptions.SectionName));

        // Регистрация IAmazonS3 клиента
        services.AddSingleton<IAmazonS3>(sp =>
        {
            var options = sp.GetRequiredService<IOptions<S3StorageOptions>>().Value;

            var s3Config = new AmazonS3Config
            {
                ServiceURL = options.ServiceUrl,
                ForcePathStyle = options.ForcePathStyle,
                UseHttp = options.ServiceUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            };

            if (!string.IsNullOrWhiteSpace(options.Region))
            {
                s3Config.AuthenticationRegion = options.Region;
            }

            var credentials = new BasicAWSCredentials(options.AccessKey, options.SecretKey);
            return new AmazonS3Client(credentials, s3Config);
        });

        // Регистрация S3 Storage Service
        services.AddScoped<IS3StorageService, S3StorageService>();

        return services;
    }

    public static IEndpointRouteBuilder MapInfrastructureEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/infrastructure/storage")
            .WithTags("Infrastructure.Storage");

        group.MapStorageEndpoints();

        return app;
    }
}
