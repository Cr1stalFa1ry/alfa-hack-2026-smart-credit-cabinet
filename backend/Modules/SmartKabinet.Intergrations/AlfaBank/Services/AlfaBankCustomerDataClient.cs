using SmartKabinet.Intergrations.AlfaBank.Features;
using SmartKabinet.Intergrations.AlfaBank.Models;

namespace SmartKabinet.Intergrations.AlfaBank.Services;

public class AlfaBankCustomerDataClient(GetCustomerByInnHandler handler) : IAlfaBankCustomerDataClient
{
    public Task<AlfaCustomerProfileResult> GetCustomerByInnAsync(string inn, CancellationToken cancellationToken = default)
        => handler.HandleAsync(inn, cancellationToken);
}
