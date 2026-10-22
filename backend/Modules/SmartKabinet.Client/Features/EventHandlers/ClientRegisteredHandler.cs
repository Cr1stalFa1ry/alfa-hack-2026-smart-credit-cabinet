using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SmartKabinet.Auth.Contracts;
using SmartKabinet.Client.Domain;
using SmartKabinet.Client.Infrastructure.Persistence;

namespace SmartKabinet.Client.Features.EventHandlers;

public class ClientRegisteredHandler
{
    private readonly ClientDbContext _dbContext;
    private readonly ILogger<ClientRegisteredHandler> _logger;

    public ClientRegisteredHandler(ClientDbContext dbContext, ILogger<ClientRegisteredHandler> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task Handle(ClientRegistered @event)
    {
        _logger.LogInformation(
            "[Wolverine: Auth -> Client] Регистрация клиента ИП: UserId={UserId}, Username={Username}, ИНН={Inn}",
            @event.UserId, @event.Username, @event.Inn);

        var exists = await _dbContext.Clients.AnyAsync(c => c.UserId == @event.UserId);
        if (!exists)
        {
            var profile = new ClientProfile
            {
                Id = Guid.NewGuid(),
                UserId = @event.UserId,
                Username = @event.Username,
                Inn = @event.Inn,
                FirstName = @event.FirstName,
                LastName = @event.LastName,
                CreatedAt = @event.RegisteredAt
            };

            _dbContext.Clients.Add(profile);
            await _dbContext.SaveChangesAsync();
            _logger.LogInformation("[Client Module] Создан профиль клиента с Id={ClientId}", profile.Id);
        }
    }
}
