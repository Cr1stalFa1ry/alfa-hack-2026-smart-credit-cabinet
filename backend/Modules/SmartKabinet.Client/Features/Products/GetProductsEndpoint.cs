using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SmartKabinet.Application.Contracts;

namespace SmartKabinet.Client.Features.Products;

public static class GetProductsEndpoint
{
    public static RouteGroupBuilder MapProductsEndpoints(this RouteGroupBuilder group, string namePrefix = "Client")
    {
        // GET /api/client/products or /api/products
        group.MapGet("/", (IGetCreditProducts service) =>
        {
            var products = service.GetAll();
            return Results.Ok(products);
        })
        .AllowAnonymous()
        .WithName($"{namePrefix}GetCreditProducts")
        .WithSummary("Каталог доступных кредитных продуктов банка (WC, EQ, START)");

        // GET /api/client/products/{code}
        group.MapGet("/{code}", (string code, IGetCreditProducts service) =>
        {
            var product = service.GetByCode(code);
            return product is not null
                ? Results.Ok(product)
                : Results.NotFound(new { error = $"Кредитный продукт '{code}' не найден." });
        })
        .AllowAnonymous()
        .WithName($"{namePrefix}GetCreditProductByCode")
        .WithSummary("Получить параметры кредитного продукта по коду (WC, EQ, START)");

        return group;
    }
}
