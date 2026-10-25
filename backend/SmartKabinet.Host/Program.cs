using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.OpenApi;
using SmartKabinet.Application;
using SmartKabinet.Application.Infrastructure.Persistence;
using SmartKabinet.Auth;
using SmartKabinet.Auth.Infrastructure.Persistence;
using SmartKabinet.Auth.Infrastructure.Security;
using SmartKabinet.BankEmployee;
using SmartKabinet.BankEmployee.Infrastructure.Persistence;
using SmartKabinet.Checking;
using SmartKabinet.Client;
using SmartKabinet.Client.Infrastructure.Persistence;
using SmartKabinet.Infrastructure;
using SmartKabinet.Intergrations;
using SmartKabinet.Intergrations.AlfaBank.Persistence;
using Wolverine;

// Разрешаем DateTime без указания часового пояса (Kind=Unspecified) для Npgsql / PostgreSQL
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// Сериализация enum в виде строковых значений ("Review", "Offer", etc.)
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});

// Swagger / OpenAPI с поддержкой JWT Bearer авторизации
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "SmartKabinet API — Кредитный кабинет ИП (Alfa-Hack 2026)",
        Version = "v1",
        Description = "API кредитного кабинета предпринимателя"
    });

    var scheme = new OpenApiSecurityScheme
    {
        Description = "Введите JWT токен доступа в формате: Bearer {токен}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    };

    c.AddSecurityDefinition("Bearer", scheme);

    c.AddSecurityRequirement(doc => new OpenApiSecurityRequirement
    {
        { new OpenApiSecuritySchemeReference("Bearer", doc), new List<string>() }
    });
});

// Wolverine: Автосканирование сборок всех модулей и разрешение зависимостей DbContext
builder.Host.UseWolverine(opts =>
{
    opts.ServiceLocationPolicy = JasperFx.CodeGeneration.Model.ServiceLocationPolicy.AlwaysAllowed;

    opts.Discovery.IncludeAssembly(typeof(SmartKabinet.Auth.AuthModuleExtensions).Assembly);
    opts.Discovery.IncludeAssembly(typeof(SmartKabinet.Client.ClientModuleExtensions).Assembly);
    opts.Discovery.IncludeAssembly(typeof(SmartKabinet.BankEmployee.BankEmployeeModuleExtensions).Assembly);
    opts.Discovery.IncludeAssembly(typeof(SmartKabinet.Application.ApplicationModuleExtensions).Assembly);
    opts.Discovery.IncludeAssembly(typeof(SmartKabinet.Checking.CheckingModuleExtensions).Assembly);
});

// Регистрация модулей
builder.Services.AddAuthModule(builder.Configuration);
builder.Services.AddClientModule(builder.Configuration);
builder.Services.AddBankEmployeeModule(builder.Configuration);
builder.Services.AddApplicationModule(builder.Configuration);
builder.Services.AddCheckingModule(builder.Configuration);
builder.Services.AddIntegrationsModule(builder.Configuration);
builder.Services.AddInfrastructureModule(builder.Configuration);

var app = builder.Build();

// Swagger UI (доступен по /swagger и по корню /)
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "SmartKabinet API v1");
    c.RoutePrefix = "swagger";
});

app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();

app.UseAuthentication();
app.UseAuthorization();

// Маппинг эндпоинтов модулей
app.MapAuthEndpoints();
app.MapClientEndpoints();
app.MapBankEmployeeEndpoints();
app.MapApplicationEndpoints();
app.MapCheckingEndpoints();
app.MapIntegrationsEndpoints();
app.MapInfrastructureEndpoints();

app.Run();