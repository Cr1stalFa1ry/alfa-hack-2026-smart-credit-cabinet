using SmartKabinet.Auth;
using SmartKabinet.Intergrations;

var builder = WebApplication.CreateBuilder(args);

// Модули
builder.Services.AddAuthModule(builder.Configuration);
builder.Services.AddIntegrationsModule(builder.Configuration);

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

// использование тестовых пользователей и синтетических данных
// app.UseAuthModuleSeed();
// await app.UseSyntheticDataSeedAsync();

app.MapAuthEndpoints();

app.MapIntegrationsEndpoints();

app.Run();
