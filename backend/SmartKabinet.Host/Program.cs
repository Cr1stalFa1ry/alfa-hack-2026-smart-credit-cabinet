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

// Инициализация БД
await InitializeDatabasesAsync(app);

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


///
/// 
/// 
static async Task InitializeDatabasesAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        var authDb = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
        var clientDb = scope.ServiceProvider.GetRequiredService<ClientDbContext>();
        var empDb = scope.ServiceProvider.GetRequiredService<BankEmployeeDbContext>();
        var appDb = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var synthDb = scope.ServiceProvider.GetRequiredService<SyntheticDbContext>();

        logger.LogInformation("Проверка подключения и создание схем/таблиц БД...");

        await EnsureTablesExistAsync(authDb);
        await EnsureTablesExistAsync(clientDb);
        await EnsureTablesExistAsync(empDb);
        await EnsureTablesExistAsync(appDb);
        await EnsureTablesExistAsync(synthDb);

        // Сидирование дефолтных пользователей и синтетических данных
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        AuthDbContext.SeedDefaultUsers(authDb, hasher);
        await SyntheticDbContext.SeedPostgresDefaultDataAsync(synthDb);

        logger.LogInformation("База данных успешно инициализирована (схемы: auth, client, bank_employee, credit_app, public).");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Ошибка при подключении или инициализации PostgreSQL: {Message}", ex.Message);
    }
}

static async Task EnsureTablesExistAsync(DbContext db)
{
    if (db.Database.IsRelational())
    {
        var creator = db.Database.GetService<IRelationalDatabaseCreator>();
        if (!await creator.ExistsAsync())
        {
            await creator.CreateAsync();
        }
        
        var firstEntity = db.Model.GetEntityTypes().FirstOrDefault();
        if (firstEntity is not null)
        {
            var tableName = firstEntity.GetTableName();
            var schemaName = firstEntity.GetSchema();

            if (!string.IsNullOrEmpty(tableName))
            {
                try
                {
                    var conn = db.Database.GetDbConnection();
                    var wasOpen = conn.State == System.Data.ConnectionState.Open;
                    if (!wasOpen) await conn.OpenAsync();

                    using var cmd = conn.CreateCommand();
                    cmd.CommandText = string.IsNullOrEmpty(schemaName)
                        ? "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = @tableName AND table_schema = current_schema());"
                        : "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = @tableName AND table_schema = @schemaName);";

                    var pTable = cmd.CreateParameter();
                    pTable.ParameterName = "@tableName";
                    pTable.Value = tableName;
                    cmd.Parameters.Add(pTable);

                    if (!string.IsNullOrEmpty(schemaName))
                    {
                        var pSchema = cmd.CreateParameter();
                        pSchema.ParameterName = "@schemaName";
                        pSchema.Value = schemaName;
                        cmd.Parameters.Add(pSchema);
                    }

                    var exists = (bool)(await cmd.ExecuteScalarAsync() ?? false);
                    if (!wasOpen) await conn.CloseAsync();

                    if (exists)
                    {
                        // Таблицы данной схемы уже существуют — пропускаем CreateTablesAsync
                        return;
                    }
                }
                catch
                {
                    // В случае непредвиденных ошибок запроса к системному каталогу переходим к стандартному механизму
                }
            }
        }

        try
        {
            await creator.CreateTablesAsync();
        }
        catch
        {
            // Таблицы или схема уже существуют в БД
        }
    }
}
