using SmartKabinet.Intergrations.AlfaBank.Features;
using SmartKabinet.Intergrations.AlfaBank.Models;
using SmartKabinet.Intergrations.AlfaBank.Services;

namespace SmartKabinet.Intergrations.AlfaBank.Simulators;

public class AlfaBankSyntheticSimulator : IAlfaBankCustomerDataClient
{
    private readonly GetCustomerByInnHandler _handler;

    public AlfaBankSyntheticSimulator(GetCustomerByInnHandler handler)
    {
        _handler = handler;
    }

    public Task<AlfaCustomerProfileResult> GetCustomerByInnAsync(
        string inn, 
        CancellationToken cancellationToken = default)
    {
        return _handler.HandleAsync(inn, cancellationToken);
    }
}
