using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SmartKabinet.Auth.Contracts;
using SmartKabinet.BankEmployee.Domain;
using SmartKabinet.BankEmployee.Infrastructure.Persistence;

namespace SmartKabinet.BankEmployee.Features.EventHandlers;

public class BankEmployeeRegisteredHandler
{
    private readonly BankEmployeeDbContext _dbContext;
    private readonly ILogger<BankEmployeeRegisteredHandler> _logger;

    public BankEmployeeRegisteredHandler(BankEmployeeDbContext dbContext, ILogger<BankEmployeeRegisteredHandler> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task Handle(BankEmployeeRegistered @event)
    {
        _logger.LogInformation(
            "[Wolverine: Auth -> BankEmployee] Регистрация сотрудника банка: UserId={UserId}, Username={Username}, ФИО={FirstName} {LastName}",
            @event.UserId, @event.Username, @event.FirstName, @event.LastName);

        var exists = await _dbContext.Employees.AnyAsync(e => e.UserId == @event.UserId);
        if (!exists)
        {
            var profile = new BankEmployeeProfile
            {
                Id = Guid.NewGuid(),
                UserId = @event.UserId,
                Username = @event.Username,
                FirstName = @event.FirstName,
                LastName = @event.LastName,
                Role = "Analyst",
                CreatedAt = @event.RegisteredAt
            };

            _dbContext.Employees.Add(profile);
            await _dbContext.SaveChangesAsync();
            _logger.LogInformation("[BankEmployee Module] Создан профиль сотрудника банка Id={EmployeeId}", profile.Id);
        }
    }
}
