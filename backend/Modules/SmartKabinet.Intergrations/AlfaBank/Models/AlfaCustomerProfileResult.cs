namespace SmartKabinet.Intergrations.AlfaBank.Models;

public class AlfaCustomerProfileResult
{
    public bool Success { get; set; }
    public bool IsFound { get; set; }
    public bool IsAlfaClient => Data?.IsAlfaClient ?? false;
    public AlfaCustomerProfile? Data { get; set; }
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }

    public static AlfaCustomerProfileResult Found(AlfaCustomerProfile data) => new()
    {
        Success = true,
        IsFound = true,
        Data = data
    };

    public static AlfaCustomerProfileResult NotFound(string inn) => new()
    {
        Success = true,
        IsFound = false,
        Data = new AlfaCustomerProfile
        {
            Inn = inn,
            IsAlfaClient = false
        },
        ErrorCode = "NOT_ALFA_CLIENT",
        ErrorMessage = $"ИП с ИНН {inn} не имеет открытых счетов в Альфа-Банке."
    };

    public static AlfaCustomerProfileResult Error(string code, string message) => new()
    {
        Success = false,
        IsFound = false,
        ErrorCode = code,
        ErrorMessage = message
    };
}
