using Microsoft.EntityFrameworkCore;
using SmartKabinet.Application.Domain;
using SmartKabinet.Application.Infrastructure.Persistence;
using SmartKabinet.BankEmployee.Features.Applications.Common;
using SmartKabinet.Shared;

namespace SmartKabinet.BankEmployee.Features.Applications.GetApplicationById;

public class GetEmployeeApplicationByIdHandler(
    ApplicationDbContext appDb,
    IBankApplicationDossierBuilder dossierBuilder)
{
    public async Task<Result<BankApplicationDossierDto>> Handle(
        GetEmployeeApplicationByIdQuery query,
        CancellationToken ct = default)
    {
        var app = await appDb.Applications
            .Include(a => a.CurrentOffer)
            .FirstOrDefaultAsync(a => a.Id == query.Id, ct);

        if (app is null || app.Status == ApplicationStatus.Draft)
        {
            return Error.NotFound("Application.NotFound", "Заявка не найдена или еще находится в статусе черновика.");
        }

        var dossier = await dossierBuilder.BuildAsync(app, ct);
        return Result.Success(dossier);
    }
}
