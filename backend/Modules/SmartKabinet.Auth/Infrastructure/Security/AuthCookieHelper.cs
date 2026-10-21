using Microsoft.AspNetCore.Http;

namespace SmartKabinet.Auth.Infrastructure.Security;

public static class AuthCookieHelper
{
    public const string CookieName = "auth-token";
    public const string RefreshCookieName = "refresh-token";

    public static void SetAuthCookie(HttpResponse response, string token, int expireMinutes)
    {
        response.Cookies.Append(CookieName, token, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Expires = DateTimeOffset.UtcNow.AddMinutes(expireMinutes)
        });
    }

    public static void SetRefreshCookie(HttpResponse response, string refreshToken, int expireDays)
    {
        response.Cookies.Append(RefreshCookieName, refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Expires = DateTimeOffset.UtcNow.AddDays(expireDays)
        });
    }

    public static void ClearAuthCookies(HttpResponse response)
    {
        response.Cookies.Delete(CookieName, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax
        });
        response.Cookies.Delete(RefreshCookieName, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax
        });
    }
}
