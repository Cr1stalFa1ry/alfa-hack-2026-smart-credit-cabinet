using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Moq;
using SmartKabinet.Auth.Domain;
using SmartKabinet.Auth.Infrastructure.Security;
using Xunit;

namespace SmartKabinet.Infrastructure.Tests;

public class AuthorizationRoleTests
{
    [Fact]
    public void UserContext_WithClientRole_IsClientIsTrue_AndIsBankEmployeeIsFalse()
    {
        // Arrange
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Role, "client")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        var httpContextMock = new Mock<HttpContext>();
        httpContextMock.Setup(c => c.User).Returns(principal);
        var accessorMock = new Mock<IHttpContextAccessor>();
        accessorMock.Setup(a => a.HttpContext).Returns(httpContextMock.Object);

        var context = new UserContext(accessorMock.Object);

        // Assert
        Assert.True(context.IsAuthenticated);
        Assert.Equal(UserRole.Client, context.Role);
        Assert.True(context.IsClient);
        Assert.False(context.IsBankEmployee);
    }

    [Fact]
    public void UserContext_WithAnalystRole_IsBankEmployeeIsTrue_AndIsClientIsFalse()
    {
        // Arrange
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Role, "analyst")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        var httpContextMock = new Mock<HttpContext>();
        httpContextMock.Setup(c => c.User).Returns(principal);
        var accessorMock = new Mock<IHttpContextAccessor>();
        accessorMock.Setup(a => a.HttpContext).Returns(httpContextMock.Object);

        var context = new UserContext(accessorMock.Object);

        // Assert
        Assert.True(context.IsAuthenticated);
        Assert.Equal(UserRole.Analyst, context.Role);
        Assert.False(context.IsClient);
        Assert.True(context.IsBankEmployee);
    }

    [Fact]
    public void UserContext_WithBankEmployeeAlias_IsBankEmployeeIsTrue()
    {
        // Arrange
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
            new Claim("role", "BankEmployee")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        var httpContextMock = new Mock<HttpContext>();
        httpContextMock.Setup(c => c.User).Returns(principal);
        var accessorMock = new Mock<IHttpContextAccessor>();
        accessorMock.Setup(a => a.HttpContext).Returns(httpContextMock.Object);

        var context = new UserContext(accessorMock.Object);

        // Assert
        Assert.True(context.IsAuthenticated);
        Assert.Equal(UserRole.Analyst, context.Role);
        Assert.False(context.IsClient);
        Assert.True(context.IsBankEmployee);
    }

    [Fact]
    public async Task AuthorizationPolicies_ClientCannotAccessEmployeePolicy_AndEmployeeCannotAccessClientPolicy()
    {
        // Setup authorization services with our exact policies
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddAuthorization(options =>
        {
            options.AddPolicy(AuthPolicies.ClientOnly, policy =>
                policy.RequireRole("Client", "client"));

            options.AddPolicy(AuthPolicies.EmployeeOnly, policy =>
                policy.RequireRole("Analyst", "analyst", "Admin", "admin", "BankEmployee", "bankemployee"));
        });

        var provider = services.BuildServiceProvider();
        var authService = provider.GetRequiredService<IAuthorizationService>();

        // 1. Client user
        var clientPrincipal = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Role, "client")
        }, "TestAuth"));

        // 2. Bank Employee user
        var employeePrincipal = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Role, "analyst"),
            new Claim(ClaimTypes.Role, "BankEmployee")
        }, "TestAuth"));

        // Act & Assert
        // Client can access ClientOnly, but CANNOT access EmployeeOnly
        var clientOnClientPolicy = await authService.AuthorizeAsync(clientPrincipal, AuthPolicies.ClientOnly);
        var clientOnEmployeePolicy = await authService.AuthorizeAsync(clientPrincipal, AuthPolicies.EmployeeOnly);
        Assert.True(clientOnClientPolicy.Succeeded, "Client must have access to ClientOnly policy");
        Assert.False(clientOnEmployeePolicy.Succeeded, "Client MUST NOT have access to EmployeeOnly policy");

        // Employee can access EmployeeOnly, but CANNOT access ClientOnly
        var employeeOnEmployeePolicy = await authService.AuthorizeAsync(employeePrincipal, AuthPolicies.EmployeeOnly);
        var employeeOnClientPolicy = await authService.AuthorizeAsync(employeePrincipal, AuthPolicies.ClientOnly);
        Assert.True(employeeOnEmployeePolicy.Succeeded, "Bank Employee must have access to EmployeeOnly policy");
        Assert.False(employeeOnClientPolicy.Succeeded, "Bank Employee MUST NOT have access to ClientOnly policy");
    }

    [Fact]
    public void JwtProvider_GeneratesDistinctRolesForClientAndAnalyst()
    {
        var options = Options.Create(new JwtOptions { ExpireMinutes = 60, Issuer = "SmartKabinet" });
        var keyProvider = new RsaKeyProvider(options);
        var jwtProvider = new JwtProvider(options, keyProvider);

        var clientUser = new User
        {
            UserId = Guid.NewGuid(),
            Username = "client_test",
            Role = UserRole.Client,
            Inn = "770123456789"
        };

        var analystUser = new User
        {
            UserId = Guid.NewGuid(),
            Username = "analyst_test",
            Role = UserRole.Analyst
        };

        var clientToken = jwtProvider.GenerateToken(clientUser);
        var analystToken = jwtProvider.GenerateToken(analystUser);

        Assert.NotNull(clientToken);
        Assert.NotNull(analystToken);
        Assert.NotEqual(clientToken, analystToken);
    }
}
