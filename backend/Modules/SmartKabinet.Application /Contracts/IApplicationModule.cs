using SmartKabinet.Application.Commands;
using SmartKabinet.Shared;
using ApplicationId = SmartKabinet.Application.Contracts.ApplicationId;

namespace SmartKabinet.Application.Contracts;

public interface IApplicationModule
{
    Task<IReadOnlyList<ApplicationListItemDto>> ListForClientAsync(Guid clientId, CancellationToken ct);
}

public interface ICreateDraft
{
    Task<Result<ApplicationId>> CreateDraftAsync(CreateDraftCommand cmd, CancellationToken ct);
}

public interface ISaveDraft
{
    Task<Result> SaveDraftAsync(SaveDraftCommand cmd, CancellationToken ct);
}

public interface ISubmitApplication
{
    Task<Result> SubmitAsync(SubmitApplicationCommand cmd, CancellationToken ct);
}

public interface IRetryCheck
{
    Task<Result> RetryCheckAsync(RetryCheckCommand cmd, CancellationToken ct);
}

public interface IRespondToInfoRequest
{
    Task<Result> RespondToInfoRequestAsync(RespondInfoCommand cmd, CancellationToken ct);
}

public interface IWithdrawApplication
{
    Task<Result> WithdrawAsync(WithdrawCommand cmd, CancellationToken ct);
}

public interface IGetApplication
{
    Task<Result<ApplicationDto>> GetAsync(Guid id, Guid clientId, CancellationToken ct);
}

public interface IGetCreditProducts
{
    IReadOnlyList<CreditProductDto> GetAll();
    CreditProductDto? GetByCode(string code);
}


