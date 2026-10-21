using SmartKabinet.Auth;
using SmartKabinet.Intergrations;

var builder = WebApplication.CreateBuilder(args);

// Модули
builder.Services.AddAuthModule(builder.Configuration);
builder.Services.AddIntegrationsModule(builder.Configuration);

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

// Сидирование тестовых пользователей
app.UseAuthModuleSeed();

app.MapGet("/", () => new
{
    status = "SmartKabinet API is running",
    environment = app.Environment.EnvironmentName,
    time = DateTimeOffset.UtcNow
});

// Регистрация эндпоинтов модулей
app.MapAuthEndpoints();
app.MapIntegrationsEndpoints();

app.Run();
