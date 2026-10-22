using SmartKabinet.Application.Commands;
using ApplicationId = SmartKabinet.Application.Contracts.ApplicationId;

namespace SmartKabinet.Application.Contracts;

public interface IApplicationModule
{
    Task<IReadOnlyList<ApplicationListItemDto>> ListForClientAsync(Guid clientId, CancellationToken ct);
}

public interface ICreateDraft
{
    Task<ApplicationId> CreateDraftAsync(CreateDraftCommand cmd, CancellationToken ct);
}

public interface ISaveDraft
{
    Task SaveDraftAsync(SaveDraftCommand cmd, CancellationToken ct);
}

public interface ISubmitApplication
{
    Task SubmitAsync(SubmitApplicationCommand cmd, CancellationToken ct);
}

public interface IRetryCheck
{
    Task RetryCheckAsync(RetryCheckCommand cmd, CancellationToken ct);
}

public interface IRespondToInfoRequest
{
    Task RespondToInfoRequestAsync(RespondInfoCommand cmd, CancellationToken ct);
}

public interface IWithdrawApplication
{
    Task WithdrawAsync(WithdrawCommand cmd, CancellationToken ct);
}

public interface IGetApplication
{
    Task<ApplicationDto?> GetAsync(Guid id, Guid clientId, CancellationToken ct);
}


