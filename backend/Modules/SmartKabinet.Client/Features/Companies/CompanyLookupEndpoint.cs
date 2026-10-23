using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SmartKabinet.Intergrations.Synthetic.Services;
using SmartKabinet.Shared;

namespace SmartKabinet.Client.Features.Companies;

public static class CompanyLookupEndpoint
{
    public static RouteGroupBuilder MapCompanyLookupEndpoints(this RouteGroupBuilder group)
    {
        // GET /api/client/companies/lookup?inn=...
        group.MapGet("/lookup", async (string inn, ICompanyLookupService service, CancellationToken ct) =>
        {
            var result = await service.LookupByInnAsync(inn, ct);
            return result.ToHttpResult();
        })
        .WithName("LookupCompanyByInn")
        .WithSummary("Автозаполнение реквизитов ИП по ИНН из ЕГРИП и базы банка");

        return group;
    }
}
