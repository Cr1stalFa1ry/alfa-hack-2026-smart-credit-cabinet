using SmartKabinet.Application.Commands;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Application.Domain;
using SmartKabinet.Application.Infrastructure.Persistence;
using SmartKabinet.Shared;
using ApplicationId = SmartKabinet.Application.Contracts.ApplicationId;

namespace SmartKabinet.Application.Features.Commands;

public class CreateDraftHandler(ApplicationDbContext dbContext) : ICreateDraft
{
    public async Task<Result<ApplicationId>> CreateDraftAsync(CreateDraftCommand command, CancellationToken ct = default)
    {
        return await Handle(command, ct);
    }

    public async Task<Result<ApplicationId>> Handle(CreateDraftCommand command, CancellationToken ct = default)
    {
        if (command.RequestedAmount <= 0)
        {
            return Error.Validation("Application.InvalidAmount", "Запрашиваемая сумма кредита должна быть больше 0.");
        }

        var stage = (BusinessStage)command.Stage;
        var purpose = (LoanPurpose)command.Purpose;
        var productCode = CreditProductCodes.ResolveProductCode(stage, purpose, command.ProductCode);

        var app = new Application.Domain.Application
        {
            Id = Guid.NewGuid(),
            ClientId = command.ClientId,
            Inn = command.Inn,
            Status = ApplicationStatus.Draft,
            Stage = stage,
            Purpose = purpose,
            ProductCode = productCode,
            RequestedAmount = command.RequestedAmount,
            OwnContribution = command.OwnContribution,
            RequestedTermMonths = command.RequestedTermMonths,
            BkiConsent = command.BkiConsent,
            PersonalDataConsent = command.PersonalDataConsent,
            EquipmentSupplier = command.EquipmentSupplier,
            EquipmentPrice = command.EquipmentPrice,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.Applications.Add(app);
        dbContext.TransitionHistory.Add(new TransitionRecord
        {
            ApplicationId = app.Id,
            FromStatus = ApplicationStatus.Draft,
            ToStatus = ApplicationStatus.Draft,
            Actor = "client",
            Comment = "Создан черновик заявки (T01)"
        });

        await dbContext.SaveChangesAsync(ct);
        return Result.Success(new ApplicationId(app.Id));
    }
}
