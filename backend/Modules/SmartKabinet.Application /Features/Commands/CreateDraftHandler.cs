using SmartKabinet.Application.Commands;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Application.Domain;
using SmartKabinet.Application.Infrastructure.Persistence;
using ApplicationId = SmartKabinet.Application.Contracts.ApplicationId;

namespace SmartKabinet.Application.Features.Commands;

public class CreateDraftHandler(ApplicationDbContext dbContext) : ICreateDraft
{
    public async Task<ApplicationId> CreateDraftAsync(CreateDraftCommand command, CancellationToken ct = default)
    {
        return await Handle(command, ct);
    }

    public async Task<ApplicationId> Handle(CreateDraftCommand command, CancellationToken ct = default)
    {
        var app = new Application.Domain.Application
        {
            Id = Guid.NewGuid(),
            ClientId = command.ClientId,
            Inn = command.Inn,
            Status = ApplicationStatus.Draft,
            Stage = (BusinessStage)command.Stage,
            Purpose = (LoanPurpose)command.Purpose,
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
        return new ApplicationId(app.Id);
    }
}
