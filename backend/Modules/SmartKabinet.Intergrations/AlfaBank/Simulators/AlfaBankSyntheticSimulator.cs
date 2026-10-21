using Microsoft.Extensions.Logging;
using SmartKabinet.Intergrations.AlfaBank.Models;
using SmartKabinet.Intergrations.AlfaBank.Services;

namespace SmartKabinet.Intergrations.AlfaBank.Simulators;

public class AlfaBankSyntheticSimulator : IAlfaBankCustomerDataClient
{
    private readonly AlfaSyntheticDatabase _database;
    private readonly ILogger<AlfaBankSyntheticSimulator> _logger;

    public AlfaBankSyntheticSimulator(
        AlfaSyntheticDatabase database,
        ILogger<AlfaBankSyntheticSimulator> logger)
    {
        _database = database;
        _logger = logger;
    }

    public async Task<AlfaCustomerProfileResult> GetCustomerByInnAsync(
        string inn, 
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Запрос данных клиента Альфа-Банка по ИНН: {Inn}", inn);

        // Имитация минимальной сетевой задержки обращения к банковской АБС
        await Task.Delay(50, cancellationToken);

        if (string.IsNullOrWhiteSpace(inn) || inn.Length != 12 || !inn.All(char.IsDigit))
        {
            return AlfaCustomerProfileResult.Error(
                "INVALID_INN", 
                "ИНН должен состоять из 12 цифр.");
        }

        // Тестовый сценарий TC18/TC19 из спецификации хакатона: источник недоступен (503 / SOURCE_UNAVAILABLE)
        if (inn == "500100000066")
        {
            _logger.LogWarning("Симуляция недоступности источника 503 для ИНН {Inn}", inn);
            return AlfaCustomerProfileResult.Error(
                "SOURCE_UNAVAILABLE", 
                "Внутренняя система Альфа-Банка временно недоступна (503). Повторите проверку позже.");
        }

        // Поиск во внутренней синтетической базе данных Альфа-Банка
        if (_database.TryGetCustomer(inn, out var profile) && profile != null)
        {
            _logger.LogInformation("Клиент Альфа-Банка найден по ИНН {Inn}: {OrgName}", inn, profile.OrganizationName);
            return AlfaCustomerProfileResult.Found(profile);
        }

        // Заемщик не имеет счетов в Альфа-Банке (например, новый ИП 500100000044)
        _logger.LogInformation("ИП с ИНН {Inn} не является клиентом Альфа-Банка.", inn);
        return AlfaCustomerProfileResult.NotFound(inn);
    }
}
