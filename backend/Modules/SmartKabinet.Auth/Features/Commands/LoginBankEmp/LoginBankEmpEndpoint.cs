using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Options;
using SmartKabinet.Auth.Features.DTOs;
using SmartKabinet.Auth.Infrastructure.Security;
using SmartKabinet.Shared;
using Wolverine;

namespace SmartKabinet.Auth.Features.Commands.LoginBankEmp;

public static class LoginBankEmpEndpoint
{
    public static RouteGroupBuilder MapLoginBankEmpEndpoint(this RouteGroupBuilder group)
    {
        group.MapPost("/employee/login", async (
            LoginBankEmpCommand command,
            IMessageBus bus,
            IOptions<JwtOptions> jwtOptions,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var result = await bus.InvokeAsync<Result<AuthResponse>>(command, ct);
            if (result.IsFailure)
            {
                return result.ToHttpResult();
            }

            var response = result.Value;
            AuthCookieHelper.SetAuthCookie(httpContext.Response, response.AccessToken, jwtOptions.Value.ExpireMinutes);
            AuthCookieHelper.SetRefreshCookie(httpContext.Response, response.RefreshToken, 7);
            return Results.Ok(response);
        })
        .WithName("LoginBankEmp")
        .WithSummary("Вход для сотрудника банка");
        
        return group;
    }
}