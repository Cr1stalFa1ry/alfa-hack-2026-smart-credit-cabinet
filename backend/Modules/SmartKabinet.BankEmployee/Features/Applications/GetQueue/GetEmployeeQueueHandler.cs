using Microsoft.EntityFrameworkCore;
using SmartKabinet.Application.Domain;
using SmartKabinet.Application.Infrastructure.Persistence;
using SmartKabinet.Intergrations.Synthetic.Services;
using SmartKabinet.Shared;

namespace SmartKabinet.BankEmployee.Features.Applications.GetQueue;

public record QueueApplicationDto(
    Guid Id,
    Guid ClientId,
    string Inn,
    string CompanyName,
    string? ClientName,
    ApplicationStatus Status,
    int Stage,
    int Purpose,
    string ProductCode,
    decimal RequestedAmount,
    decimal OwnContribution,
    int RequestedTermMonths,
    DateTime? NeededByDate,
    bool AsSoonAsPossible,
    decimal? MonthlyRevenue,
    decimal? MonthlyExpenses,
    decimal? EquipmentPrice,
    string? EquipmentSupplier,
    string? EquipmentList,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    ApplicationOffer? CurrentOffer,
    string? ExpensePeriod,
    bool? HasExpenseContract,
    bool? IsTaxRegimeActual,
    string? DeclaredTaxRegime
);

public class GetEmployeeQueueHandler(
    ApplicationDbContext appDb,
    ICompanyLookupService? lookupService = null)
{
    public async Task<Result<List<QueueApplicationDto>>> Handle(
        GetEmployeeQueueQuery query,
        CancellationToken ct = default)
    {
        var dbQuery = appDb.Applications
            .Include(a => a.CurrentOffer)
            .Where(a => a.Status != ApplicationStatus.Draft)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Status) && query.Status != "all")
        {
            if (Enum.TryParse<ApplicationStatus>(query.Status, true, out var parsedStatus) && parsedStatus != ApplicationStatus.Draft)
            {
                dbQuery = dbQuery.Where(a => a.Status == parsedStatus);
            }
        }

        var queue = await dbQuery
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(ct);

        var result = new List<QueueApplicationDto>(queue.Count);
        foreach (var a in queue)
        {
            string companyName = $"ИП (ИНН {a.Inn})";
            string? clientName = null;

            if (lookupService is not null && !string.IsNullOrWhiteSpace(a.Inn))
            {
                try
                {
                    var lookupRes = await lookupService.LookupByInnAsync(a.Inn, ct);
                    if (lookupRes.IsSuccess && lookupRes.Value is not null)
                    {
                        if (!string.IsNullOrWhiteSpace(lookupRes.Value.FullName))
                        {
                            companyName = lookupRes.Value.FullName;
                        }
                        if (!string.IsNullOrWhiteSpace(lookupRes.Value.LastName) && !string.IsNullOrWhiteSpace(lookupRes.Value.FirstName))
                        {
                            clientName = $"{lookupRes.Value.LastName} {lookupRes.Value.FirstName} {lookupRes.Value.Patronymic}".Trim();
                        }
                    }
                }
                catch
                {
                    // ignore lookup errors in queue
                }
            }

            if (string.IsNullOrWhiteSpace(clientName) && companyName.StartsWith("ИП ", StringComparison.OrdinalIgnoreCase))
            {
                clientName = companyName.Substring(3).Trim();
            }

            result.Add(new QueueApplicationDto(
                a.Id,
                a.ClientId,
                a.Inn,
                companyName,
                clientName,
                a.Status,
                (int)a.Stage,
                (int)a.Purpose,
                a.ProductCode,
                a.RequestedAmount,
                a.OwnContribution,
                a.RequestedTermMonths ?? 12,
                a.NeededByDate,
                a.AsSoonAsPossible,
                a.MonthlyRevenue,
                a.MonthlyExpenses,
                a.EquipmentPrice,
                a.EquipmentSupplier,
                a.EquipmentList,
                a.CreatedAt,
                a.UpdatedAt ?? a.CreatedAt,
                a.CurrentOffer,
                a.ExpensePeriod,
                a.HasExpenseContract,
                a.IsTaxRegimeActual,
                a.DeclaredTaxRegime
            ));
        }

        return Result.Success(result);
    }
}
