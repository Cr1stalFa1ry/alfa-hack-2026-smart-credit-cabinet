using Microsoft.EntityFrameworkCore;
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

        if (app is null)
        {
            return Error.NotFound("Application.NotFound", "Заявка не найдена.");
        }

        var dossier = await dossierBuilder.BuildAsync(app, ct);
        return Result.Success(dossier);
    }
}
