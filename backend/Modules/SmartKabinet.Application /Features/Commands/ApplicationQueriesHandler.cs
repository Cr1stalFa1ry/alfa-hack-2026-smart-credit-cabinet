using Microsoft.EntityFrameworkCore;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Application.Domain;
using SmartKabinet.Application.Infrastructure.Persistence;
using SmartKabinet.Shared;

namespace SmartKabinet.Application.Features.Commands;

public class ApplicationQueriesHandler(ApplicationDbContext dbContext) : IGetApplication, IApplicationModule
{
    public async Task<Result<ApplicationDto>> GetAsync(Guid id, Guid clientId, CancellationToken ct = default)
    {
        var app = await dbContext.Applications
            .Include(a => a.CurrentOffer)
            .FirstOrDefaultAsync(a => a.Id == id && a.ClientId == clientId, ct);

        if (app is null)
        {
            return Error.NotFound("Application.NotFound", "Заявка не найдена.");
        }

        var clientTexts = ClientReasonHelper.GetClientTexts(app.ReasonCodes);
        var offerDto = app.CurrentOffer is not null
            ? new ApplicationOfferDto(
                app.CurrentOffer.ApprovedAmount,
                app.CurrentOffer.TermMonths,
                app.CurrentOffer.AnnualRatePercent,
                app.CurrentOffer.MonthlyPayment,
                app.CurrentOffer.IsCounterOffer,
                app.CurrentOffer.ReasonCode)
            : null;

        var productCode = !string.IsNullOrWhiteSpace(app.ProductCode)
            ? app.ProductCode
            : CreditProductCodes.ResolveProductCode(app.Stage, app.Purpose);

        return new ApplicationDto(
            app.Id,
            app.ClientId,
            app.Inn,
            app.Status.ToString().ToLowerInvariant(),
            app.Decision.ToString(),
            productCode,
            app.RequestedAmount,
            app.OwnContribution,
            app.RequestedTermMonths,
            app.ReasonCodes,
            clientTexts,
            offerDto,
            app.CreatedAt,
            app.UpdatedAt
        );
    }

    public async Task<IReadOnlyList<ApplicationListItemDto>> ListForClientAsync(Guid clientId, CancellationToken ct = default)
    {
        var apps = await dbContext.Applications
            .Include(a => a.CurrentOffer)
            .Where(a => a.ClientId == clientId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(ct);

        return apps.Select(app => new ApplicationListItemDto(
            app.Id,
            app.Inn,
            app.Status.ToString().ToLowerInvariant(),
            app.Decision.ToString(),
            !string.IsNullOrWhiteSpace(app.ProductCode)
                ? app.ProductCode
                : CreditProductCodes.ResolveProductCode(app.Stage, app.Purpose),
            app.RequestedAmount,
            app.RequestedTermMonths,
            ClientReasonHelper.GetClientTexts(app.ReasonCodes),
            app.CurrentOffer is not null,
            app.CreatedAt
        )).ToList();
    }
}
