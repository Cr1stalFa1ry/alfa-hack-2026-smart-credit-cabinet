using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using SmartKabinet.Auth.Features.Commands.Login;
using SmartKabinet.Auth.Features.Commands.Refresh;
using SmartKabinet.Auth.Features.Commands.Register;
using SmartKabinet.Auth.Features.Commands.RevokeRefreshToken;
using SmartKabinet.Auth.Features.DTOs;
using SmartKabinet.Auth.Features.Queries;
using SmartKabinet.Auth.Infrastructure.Persistence;
using SmartKabinet.Auth.Infrastructure.Security;

namespace SmartKabinet.Auth;

public static class AuthModuleExtensions
{
    public static IServiceCollection AddAuthModule(this IServiceCollection services, IConfiguration configuration)
    {
        // 1. Конфигурация JWT
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));

        // 2. База данных AuthDbContext (InMemory для хакатона/демо/тестов, легко переключается на PostgreSQL)
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        services.AddDbContext<AuthDbContext>(options =>
        {
            if (!string.IsNullOrWhiteSpace(connectionString) && !connectionString.Contains("InMemory", StringComparison.OrdinalIgnoreCase))
            {
                // При наличии реальной БД можно подключить Npgsql
                options.UseInMemoryDatabase("SmartKabinetAuthDb");
            }
            else
            {
                options.UseInMemoryDatabase("SmartKabinetAuthDb");
            }
        });

        // 3. Сервисы безопасности
        services.AddHttpContextAccessor();
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddSingleton<IRsaKeyProvider, RsaKeyProvider>();
        services.AddScoped<IJwtProvider, JwtProvider>();
        services.AddScoped<IRefreshTokenProvider, RefreshTokenProvider>();
        services.AddScoped<IUserContext, UserContext>();

        // 4. Handlers
        services.AddScoped<LoginHandler>();
        services.AddScoped<RegisterHandler>();
        services.AddScoped<RefreshHandler>();
        services.AddScoped<RevokeCommandHandler>();
        services.AddScoped<GetCurrentUserQueryHandler>();

        // 5. Настройка JWT Bearer Authentication с поддержкой заголовка Authorization и HttpOnly cookies
        var sp = services.BuildServiceProvider();
        var keyProvider = sp.GetRequiredService<IRsaKeyProvider>();
        var jwtOptions = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = keyProvider.GetPublicKey(),
                ValidateIssuer = !string.IsNullOrWhiteSpace(jwtOptions.Issuer),
                ValidIssuer = jwtOptions.Issuer,
                ValidateAudience = !string.IsNullOrWhiteSpace(jwtOptions.Audience),
                ValidAudience = jwtOptions.Audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromSeconds(30),
                RoleClaimType = ClaimTypes.Role,
                NameClaimType = ClaimTypes.Name
            };

            // Чтение токена также из cookie, если заголовок отсутствует
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    if (string.IsNullOrEmpty(context.Token) &&
                        context.Request.Cookies.TryGetValue(AuthCookieHelper.CookieName, out var cookieToken))
                    {
                        context.Token = cookieToken;
                    }
                    return Task.CompletedTask;
                }
            };
        });

        services.AddAuthorization();

        return services;
    }

    /// <summary>
    /// Автоматическое заполнение базы дефолтными пользователями (ИП client1..5, аналитик)
    /// </summary>
    public static IApplicationBuilder UseAuthModuleSeed(this IApplicationBuilder app)
    {
        using var scope = app.ApplicationServices.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        AuthDbContext.SeedDefaultUsers(db, hasher);
        return app;
    }

    /// <summary>
    /// Регистрация эндпоинтов модуля аутентификации
    /// </summary>
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Authentication");

        // POST /api/auth/login
        group.MapPost("/login", async (
            LoginRequest request,
            LoginHandler handler,
            HttpResponse response) =>
        {
            var authResponse = await handler.HandleAsync(request);
            if (authResponse is null)
            {
                return Results.Unauthorized();
            }

            // Устанавливаем HttpOnly cookies для браузера
            AuthCookieHelper.SetAuthCookie(response, authResponse.AccessToken, 60);
            AuthCookieHelper.SetRefreshCookie(response, authResponse.RefreshToken, 7);

            return Results.Ok(authResponse);
        })
        .WithName("Login")
        .WithSummary("Вход в систему (client1..5, analyst, admin)");

        // POST /api/auth/register
        group.MapPost("/register", async (
            RegisterClientRequest request,
            RegisterHandler handler,
            HttpResponse response) =>
        {
            var (authResponse, error) = await handler.HandleAsync(request);
            if (!string.IsNullOrEmpty(error))
            {
                return Results.BadRequest(new { error });
            }

            if (authResponse is null)
            {
                return Results.BadRequest(new { error = "Не удалось зарегистрировать пользователя." });
            }

            AuthCookieHelper.SetAuthCookie(response, authResponse.AccessToken, 60);
            AuthCookieHelper.SetRefreshCookie(response, authResponse.RefreshToken, 7);

            return Results.Created($"/api/auth/me", authResponse);
        })
        .WithName("Register")
        .WithSummary("Регистрация нового ИП заёмщика");

        // POST /api/auth/refresh
        group.MapPost("/refresh", async (
            HttpRequest request,
            HttpResponse response,
            RefreshHandler handler,
            RefreshTokenRequest? body) =>
        {
            var tokenString = body?.RefreshToken;
            if (string.IsNullOrWhiteSpace(tokenString))
            {
                request.Cookies.TryGetValue(AuthCookieHelper.RefreshCookieName, out tokenString);
            }

            var authResponse = await handler.HandleAsync(tokenString);
            if (authResponse is null)
            {
                AuthCookieHelper.ClearAuthCookies(response);
                return Results.Unauthorized();
            }

            AuthCookieHelper.SetAuthCookie(response, authResponse.AccessToken, 60);
            AuthCookieHelper.SetRefreshCookie(response, authResponse.RefreshToken, 7);

            return Results.Ok(authResponse);
        })
        .WithName("RefreshToken")
        .WithSummary("Обновление токена доступа по Refresh Token");

        // POST /api/auth/logout
        group.MapPost("/logout", async (
            HttpRequest request,
            HttpResponse response,
            RevokeCommandHandler handler,
            IUserContext userContext,
            RefreshTokenRequest? body) =>
        {
            var tokenString = body?.RefreshToken;
            if (string.IsNullOrWhiteSpace(tokenString))
            {
                request.Cookies.TryGetValue(AuthCookieHelper.RefreshCookieName, out tokenString);
            }

            if (!string.IsNullOrWhiteSpace(tokenString))
            {
                await handler.RevokeTokenAsync(tokenString);
            }
            else if (userContext.UserId.HasValue)
            {
                await handler.RevokeAllUserTokensAsync(userContext.UserId.Value);
            }

            AuthCookieHelper.ClearAuthCookies(response);
            return Results.Ok(new { message = "Успешный выход из системы" });
        })
        .WithName("Logout")
        .WithSummary("Выход из системы и отзыв токенов");

        // GET /api/auth/me
        group.MapGet("/me", async (GetCurrentUserQueryHandler handler) =>
        {
            var profile = await handler.HandleAsync();
            return profile is not null ? Results.Ok(profile) : Results.Unauthorized();
        })
        .RequireAuthorization()
        .WithName("GetCurrentUser")
        .WithSummary("Получение профиля текущего пользователя");

        // GET /.well-known/jwks.json (JWKS)
        app.MapGet("/.well-known/jwks.json", (IRsaKeyProvider keyProvider) =>
        {
            var jwks = keyProvider.GetJsonWebKeySet();
            return Results.Ok(jwks);
        })
        .AllowAnonymous()
        .WithTags("JWKS")
        .WithSummary("Публичные ключи RSA для проверки подписи JWT");

        return app;
    }
}
