namespace SmartKabinet.Infrastructure.Infrastructure;

public class S3StorageOptions
{
    public const string SectionName = "S3Storage";

    /// <summary>
    /// URL S3 сервиса (например, http://localhost:9000 для MinIO или https://storage.yandexcloud.net)
    /// </summary>
    public string ServiceUrl { get; set; } = "http://localhost:9000";

    /// <summary>
    /// Имя бакета по умолчанию для документов процессов и расходов
    /// </summary>
    public string BucketName { get; set; } = "smart-kabinet-documents";

    /// <summary>
    /// Ключ доступа
    /// </summary>
    public string AccessKey { get; set; } = "minioadmin";

    /// <summary>
    /// Секретный ключ
    /// </summary>
    public string SecretKey { get; set; } = "minioadmin";

    /// <summary>
    /// Регион (для AWS / совместимых S3)
    /// </summary>
    public string Region { get; set; } = "us-east-1";

    /// <summary>
    /// Использовать Path-Style адресацию (true для MinIO и локальных S3 провайдеров)
    /// </summary>
    public bool ForcePathStyle { get; set; } = true;

    /// <summary>
    /// Автоматически создавать бакет при старте приложения, если он не существует
    /// </summary>
    public bool AutoCreateBucket { get; set; } = true;
}
