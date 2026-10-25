using Microsoft.EntityFrameworkCore;
using SmartKabinet.Application.Domain;
using SmartKabinet.Application.Infrastructure.Persistence;
using SmartKabinet.Shared;

namespace SmartKabinet.BankEmployee.Features.Applications.GetQueue;

public class GetEmployeeQueueHandler(ApplicationDbContext appDb)
{
    public async Task<Result<List<SmartKabinet.Application.Domain.Application>>> Handle(
        GetEmployeeQueueQuery query,
        CancellationToken ct = default)
    {
        var dbQuery = appDb.Applications
            .Include(a => a.CurrentOffer)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Status) && query.Status != "all")
        {
            if (Enum.TryParse<ApplicationStatus>(query.Status, true, out var parsedStatus))
            {
                dbQuery = dbQuery.Where(a => a.Status == parsedStatus);
            }
        }

        var queue = await dbQuery
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(ct);

        return Result.Success(queue);
    }
}
