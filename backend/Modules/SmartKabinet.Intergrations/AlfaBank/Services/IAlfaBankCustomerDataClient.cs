using SmartKabinet.Intergrations.AlfaBank.Models;

namespace SmartKabinet.Intergrations.AlfaBank.Services;

public interface IAlfaBankCustomerDataClient
{
    /// <summary>
    /// Проверка, является ли заемщик действующим клиентом Альфа-Банка,
    /// и получение выписки, оборотов и остатков по счетам из внутренней базы банка
    /// </summary>
    /// <param name="inn">12-значный ИНН предпринимателя</param>
    /// <param name="cancellationToken">Токен отмены</param>
    Task<AlfaCustomerProfileResult> GetCustomerByInnAsync(string inn, CancellationToken cancellationToken = default);
}
