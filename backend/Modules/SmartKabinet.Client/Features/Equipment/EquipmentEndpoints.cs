using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SmartKabinet.Intergrations.Synthetic.Services;

namespace SmartKabinet.Client.Features.Equipment;

public static class EquipmentEndpoints
{
    public static RouteGroupBuilder MapEquipmentEndpoints(this RouteGroupBuilder group)
    {
        // GET /api/client/equipment
        group.MapGet("/", async (IEquipmentCatalogService service, CancellationToken ct) =>
        {
            var items = await service.GetAllAsync(ct);
            return Results.Ok(items);
        })
        .AllowAnonymous()
        .WithName("GetEquipmentCatalog")
        .WithSummary("Каталог оборудования для кредитования (EQ)");

        // GET /api/client/equipment/{category}
        group.MapGet("/{category}", async (string category, IEquipmentCatalogService service, CancellationToken ct) =>
        {
            var item = await service.GetByCategoryAsync(category, ct);
            return item is not null 
                ? Results.Ok(item) 
                : Results.NotFound(new { error = $"Оборудование категории {category} не найдено." });
        })
        .AllowAnonymous()
        .WithName("GetEquipmentItemByCategory")
        .WithSummary("Получить оборудование по коду категории (EQ-001...)");

        return group;
    }
}
