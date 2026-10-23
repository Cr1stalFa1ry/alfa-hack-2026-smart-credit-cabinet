using Microsoft.EntityFrameworkCore;
using SmartKabinet.Intergrations.AlfaBank.Persistence;

namespace SmartKabinet.Intergrations.Synthetic.Services;

public record EquipmentItemDto(string Category, string Name, decimal ReferencePriceRub);

public interface IEquipmentCatalogService
{
    Task<IReadOnlyList<EquipmentItemDto>> GetAllAsync(CancellationToken ct = default);
    Task<EquipmentItemDto?> GetByCategoryAsync(string category, CancellationToken ct = default);
}

public class EquipmentCatalogService : IEquipmentCatalogService
{
    private readonly SyntheticDbContext _db;

    public EquipmentCatalogService(SyntheticDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<EquipmentItemDto>> GetAllAsync(CancellationToken ct = default)
    {
        return await _db.EquipmentCatalog
            .AsNoTracking()
            .OrderBy(e => e.Category)
            .Select(e => new EquipmentItemDto(e.Category, e.Name, e.ReferencePriceRub))
            .ToListAsync(ct);
    }

    public async Task<EquipmentItemDto?> GetByCategoryAsync(string category, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(category)) return null;
        var normalized = category.Trim().ToUpperInvariant();

        var item = await _db.EquipmentCatalog
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Category == normalized, ct);

        return item is not null ? new EquipmentItemDto(item.Category, item.Name, item.ReferencePriceRub) : null;
    }
}
