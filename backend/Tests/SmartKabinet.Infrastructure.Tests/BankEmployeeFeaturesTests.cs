using Microsoft.EntityFrameworkCore;
using Moq;
using SmartKabinet.Application.Contracts;
using SmartKabinet.Application.Domain;
using SmartKabinet.Application.Infrastructure.Persistence;
using SmartKabinet.BankEmployee.Domain;
using SmartKabinet.BankEmployee.Features.Applications.ApproveApplication;
using SmartKabinet.BankEmployee.Features.Applications.CloseApplication;
using SmartKabinet.BankEmployee.Features.Applications.Common;
using SmartKabinet.BankEmployee.Features.Applications.DeclineApplication;
using SmartKabinet.BankEmployee.Features.Applications.GetApplicationById;
using SmartKabinet.BankEmployee.Features.Applications.GetQueue;
using SmartKabinet.BankEmployee.Features.Applications.RecheckApplication;
using SmartKabinet.BankEmployee.Features.Applications.RequestInfo;
using SmartKabinet.BankEmployee.Features.Profile.GetProfile;
using SmartKabinet.BankEmployee.Infrastructure.Persistence;
using SmartKabinet.Shared;
using Wolverine;
using Xunit;

namespace SmartKabinet.Infrastructure.Tests;

public class BankEmployeeFeaturesTests
{
    private ApplicationDbContext CreateAppDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new ApplicationDbContext(options);
    }

    private BankEmployeeDbContext CreateEmployeeDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<BankEmployeeDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new BankEmployeeDbContext(options);
    }

    private Mock<IBankApplicationDossierBuilder> CreateMockDossierBuilder()
    {
        var mock = new Mock<IBankApplicationDossierBuilder>();
        mock.Setup(b => b.BuildAsync(It.IsAny<SmartKabinet.Application.Domain.Application>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((SmartKabinet.Application.Domain.Application app, CancellationToken _) =>
                new BankApplicationDossierDto(
                    app.Id,
                    app.Id,
                    app.ClientId,
                    app.Inn,
                    "ИП Тест",
                    (int)app.Stage,
                    (int)app.Purpose,
                    "WC",
                    app.RequestedAmount,
                    app.OwnContribution,
                    app.RequestedTermMonths ?? 12,
                    null,
                    false,
                    true,
                    true,
                    "Оборотные средства",
                    100_000m,
                    50_000m,
                    null,
                    null,
                    null,
                    app.Status.ToString().ToLowerInvariant(),
                    app.Decision.ToString(),
                    app.ReasonCodes,
                    app.CreatedAt.ToString("o"),
                    (app.UpdatedAt ?? app.CreatedAt).ToString("o"),
                    new List<TransitionHistoryDto>(),
                    null,
                    null
                ));
        return mock;
    }

    [Fact]
    public async Task GetBankEmployeeProfileHandler_ReturnsProfile_WhenExists()
    {
        var db = CreateEmployeeDbContext(nameof(GetBankEmployeeProfileHandler_ReturnsProfile_WhenExists));
        var userId = Guid.NewGuid();
        db.Employees.Add(new BankEmployeeProfile
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Username = "analyst1",
            FirstName = "Иван",
            LastName = "Иванов"
        });
        await db.SaveChangesAsync();

        var handler = new GetBankEmployeeProfileHandler(db);
        var result = await handler.Handle(new GetBankEmployeeProfileQuery(userId));

        Assert.True(result.IsSuccess);
        Assert.Equal("analyst1", result.Value.Username);
    }

    [Fact]
    public async Task GetBankEmployeeProfileHandler_ReturnsNotFound_WhenDoesNotExist()
    {
        var db = CreateEmployeeDbContext(nameof(GetBankEmployeeProfileHandler_ReturnsNotFound_WhenDoesNotExist));
        var handler = new GetBankEmployeeProfileHandler(db);

        var result = await handler.Handle(new GetBankEmployeeProfileQuery(Guid.NewGuid()));

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.NotFound, result.Error.Type);
    }

    [Fact]
    public async Task GetEmployeeQueueHandler_ReturnsFilteredApplications()
    {
        var db = CreateAppDbContext(nameof(GetEmployeeQueueHandler_ReturnsFilteredApplications));
        db.Applications.Add(new SmartKabinet.Application.Domain.Application
        {
            Id = Guid.NewGuid(),
            ClientId = Guid.NewGuid(),
            Inn = "770100000001",
            Status = ApplicationStatus.Review
        });
        db.Applications.Add(new SmartKabinet.Application.Domain.Application
        {
            Id = Guid.NewGuid(),
            ClientId = Guid.NewGuid(),
            Inn = "770100000002",
            Status = ApplicationStatus.Checking
        });
        await db.SaveChangesAsync();

        var handler = new GetEmployeeQueueHandler(db);

        var allResult = await handler.Handle(new GetEmployeeQueueQuery("all"));
        Assert.True(allResult.IsSuccess);
        Assert.Equal(2, allResult.Value.Count);

        var reviewResult = await handler.Handle(new GetEmployeeQueueQuery("Review"));
        Assert.True(reviewResult.IsSuccess);
        Assert.Single(reviewResult.Value);
        Assert.Equal(ApplicationStatus.Review, reviewResult.Value[0].Status);
    }

    [Fact]
    public async Task ApproveApplicationHandler_T12_TransitionsToOffer_AndCreatesOffer()
    {
        var db = CreateAppDbContext(nameof(ApproveApplicationHandler_T12_TransitionsToOffer_AndCreatesOffer));
        var appId = Guid.NewGuid();
        db.Applications.Add(new SmartKabinet.Application.Domain.Application
        {
            Id = appId,
            ClientId = Guid.NewGuid(),
            Inn = "770100000001",
            Status = ApplicationStatus.Review,
            RequestedAmount = 500_000m,
            RequestedTermMonths = 12
        });
        await db.SaveChangesAsync();

        var mockDossierBuilder = CreateMockDossierBuilder();
        var handler = new ApproveApplicationHandler(db, mockDossierBuilder.Object);

        var command = new ApproveApplicationCommand(
            appId,
            ApprovedAmount: 400_000m,
            TermMonths: 24,
            AnnualRatePercent: 18.5m,
            Comment: "Согласовано аналитиком"
        );

        var result = await handler.Handle(command);

        Assert.True(result.IsSuccess);

        var updated = await db.Applications.Include(a => a.CurrentOffer).FirstAsync(a => a.Id == appId);
        Assert.Equal(ApplicationStatus.Offer, updated.Status);
        Assert.Equal(CreditDecision.Approved, updated.Decision);
        Assert.NotNull(updated.CurrentOffer);
        Assert.Equal(400_000m, updated.CurrentOffer.ApprovedAmount);
        Assert.Equal(24, updated.CurrentOffer.TermMonths);
        Assert.Equal(18.5m, updated.CurrentOffer.AnnualRatePercent);

        var transition = await db.TransitionHistory.FirstOrDefaultAsync(t => t.ApplicationId == appId);
        Assert.NotNull(transition);
        Assert.Equal(ApplicationStatus.Review, transition.FromStatus);
        Assert.Equal(ApplicationStatus.Offer, transition.ToStatus);
        Assert.Equal("analyst", transition.Actor);
    }

    [Fact]
    public async Task DeclineApplicationHandler_T13_TransitionsToDeclined_WithReasonCode()
    {
        var db = CreateAppDbContext(nameof(DeclineApplicationHandler_T13_TransitionsToDeclined_WithReasonCode));
        var appId = Guid.NewGuid();
        db.Applications.Add(new SmartKabinet.Application.Domain.Application
        {
            Id = appId,
            ClientId = Guid.NewGuid(),
            Inn = "770100000001",
            Status = ApplicationStatus.Review
        });
        await db.SaveChangesAsync();

        var mockDossierBuilder = CreateMockDossierBuilder();
        var handler = new DeclineApplicationHandler(db, mockDossierBuilder.Object);

        var command = new DeclineApplicationCommand(
            appId,
            ReasonCode: "DSCR_LOW",
            Comment: "Высокая долговая нагрузка"
        );

        var result = await handler.Handle(command);

        Assert.True(result.IsSuccess);

        var updated = await db.Applications.FirstAsync(a => a.Id == appId);
        Assert.Equal(ApplicationStatus.Declined, updated.Status);
        Assert.Equal(CreditDecision.Declined, updated.Decision);
        Assert.Contains("DSCR_LOW", updated.ReasonCodes);
    }

    [Fact]
    public async Task RequestInfoHandler_T11_TransitionsToNeedInfo()
    {
        var db = CreateAppDbContext(nameof(RequestInfoHandler_T11_TransitionsToNeedInfo));
        var appId = Guid.NewGuid();
        db.Applications.Add(new SmartKabinet.Application.Domain.Application
        {
            Id = appId,
            ClientId = Guid.NewGuid(),
            Inn = "770100000001",
            Status = ApplicationStatus.Review
        });
        await db.SaveChangesAsync();

        var mockDossierBuilder = CreateMockDossierBuilder();
        var handler = new RequestInfoHandler(db, mockDossierBuilder.Object);

        var command = new RequestInfoCommand(
            appId,
            ReasonCode: "NEED_DOCS",
            Comment: "Предоставьте выписку по расчетному счету за последние 6 месяцев"
        );

        var result = await handler.Handle(command);

        Assert.True(result.IsSuccess);

        var updated = await db.Applications.FirstAsync(a => a.Id == appId);
        Assert.Equal(ApplicationStatus.NeedInfo, updated.Status);
        Assert.Equal(CreditDecision.ReviewRequired, updated.Decision);
        Assert.Contains("NEED_DOCS", updated.ReasonCodes);
    }

    [Fact]
    public async Task RecheckApplicationHandler_T14_TransitionsToChecking_AndPublishesEvent()
    {
        var db = CreateAppDbContext(nameof(RecheckApplicationHandler_T14_TransitionsToChecking_AndPublishesEvent));
        var appId = Guid.NewGuid();
        db.Applications.Add(new SmartKabinet.Application.Domain.Application
        {
            Id = appId,
            ClientId = Guid.NewGuid(),
            Inn = "770100000001",
            Status = ApplicationStatus.Review,
            RequestedAmount = 300_000m,
            RequestedTermMonths = 12
        });
        await db.SaveChangesAsync();

        var busMock = new Mock<IMessageBus>();
        var mockDossierBuilder = CreateMockDossierBuilder();
        var handler = new RecheckApplicationHandler(db, busMock.Object, mockDossierBuilder.Object);

        var command = new RecheckApplicationCommand(appId);
        var result = await handler.Handle(command);

        Assert.True(result.IsSuccess);

        var updated = await db.Applications.FirstAsync(a => a.Id == appId);
        Assert.Equal(ApplicationStatus.Checking, updated.Status);

        busMock.Verify(b => b.PublishAsync(
            It.Is<ApplicationSubmittedEvent>(e => e.ApplicationId == appId),
            It.IsAny<DeliveryOptions>()),
            Times.Once);
    }

    [Fact]
    public async Task CloseApplicationHandler_T16_TransitionsToClosed()
    {
        var db = CreateAppDbContext(nameof(CloseApplicationHandler_T16_TransitionsToClosed));
        var appId = Guid.NewGuid();
        db.Applications.Add(new SmartKabinet.Application.Domain.Application
        {
            Id = appId,
            ClientId = Guid.NewGuid(),
            Inn = "770100000001",
            Status = ApplicationStatus.Review
        });
        await db.SaveChangesAsync();

        var mockDossierBuilder = CreateMockDossierBuilder();
        var handler = new CloseApplicationHandler(db, mockDossierBuilder.Object);

        var command = new CloseApplicationCommand(
            appId,
            ReasonCode: "FNS_BLOCK",
            Comment: "Закрытие по блокировке счетов ФНС"
        );

        var result = await handler.Handle(command);

        Assert.True(result.IsSuccess);

        var updated = await db.Applications.FirstAsync(a => a.Id == appId);
        Assert.Equal(ApplicationStatus.Closed, updated.Status);
        Assert.Equal(CreditDecision.Declined, updated.Decision);
    }

    [Fact]
    public async Task ApproveApplicationHandler_CanModifyOffer_WhenStatusIsOffer()
    {
        var db = CreateAppDbContext(nameof(ApproveApplicationHandler_CanModifyOffer_WhenStatusIsOffer));
        var appId = Guid.NewGuid();
        db.Applications.Add(new SmartKabinet.Application.Domain.Application
        {
            Id = appId,
            ClientId = Guid.NewGuid(),
            Inn = "770100000001",
            Status = ApplicationStatus.Offer,
            RequestedAmount = 1_000_000m,
            RequestedTermMonths = 12
        });
        await db.SaveChangesAsync();

        var mockDossierBuilder = CreateMockDossierBuilder();
        var handler = new ApproveApplicationHandler(db, mockDossierBuilder.Object);

        var command = new ApproveApplicationCommand(
            appId,
            ApprovedAmount: 1_200_000m,
            TermMonths: 24,
            AnnualRatePercent: 21.0m,
            Comment: "Встречное предложение банка"
        );

        var result = await handler.Handle(command);

        Assert.True(result.IsSuccess);
        var updated = await db.Applications.Include(a => a.CurrentOffer).FirstAsync(a => a.Id == appId);
        Assert.Equal(ApplicationStatus.Offer, updated.Status);
        Assert.Equal(1_200_000m, updated.CurrentOffer?.ApprovedAmount);
        Assert.Equal(24, updated.CurrentOffer?.TermMonths);
    }

    [Fact]
    public async Task DeclineApplicationHandler_CanDecline_WhenStatusIsOffer()
    {
        var db = CreateAppDbContext(nameof(DeclineApplicationHandler_CanDecline_WhenStatusIsOffer));
        var appId = Guid.NewGuid();
        db.Applications.Add(new SmartKabinet.Application.Domain.Application
        {
            Id = appId,
            ClientId = Guid.NewGuid(),
            Inn = "770100000001",
            Status = ApplicationStatus.Offer,
            RequestedAmount = 1_000_000m
        });
        await db.SaveChangesAsync();

        var mockDossierBuilder = CreateMockDossierBuilder();
        var handler = new DeclineApplicationHandler(db, mockDossierBuilder.Object);

        var command = new DeclineApplicationCommand(
            appId,
            ReasonCode: "HIGH_RISK_SCORE",
            Comment: "Отказ аналитика после рассмотрения"
        );

        var result = await handler.Handle(command);

        Assert.True(result.IsSuccess);
        var updated = await db.Applications.FirstAsync(a => a.Id == appId);
        Assert.Equal(ApplicationStatus.Declined, updated.Status);
    }

    [Fact]
    public void ApplicationStateMachine_AllowsCounterOfferTransitions()
    {
        Assert.True(ApplicationStateMachine.CanTransition(ApplicationStatus.Offer, ApplicationStatus.Review));
        Assert.True(ApplicationStateMachine.CanTransition(ApplicationStatus.Offer, ApplicationStatus.Offer));
        Assert.True(ApplicationStateMachine.CanTransition(ApplicationStatus.Offer, ApplicationStatus.Declined));
    }
}
