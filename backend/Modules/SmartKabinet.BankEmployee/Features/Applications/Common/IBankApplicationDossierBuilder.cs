namespace SmartKabinet.BankEmployee.Features.Applications.Common;

public interface IBankApplicationDossierBuilder
{
    Task<BankApplicationDossierDto> BuildAsync(
        SmartKabinet.Application.Domain.Application app,
        CancellationToken ct = default);
}
