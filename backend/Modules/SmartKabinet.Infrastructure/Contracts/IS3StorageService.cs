using SmartKabinet.Shared;

namespace SmartKabinet.Infrastructure.Contracts;

public interface IS3StorageService
{
    /// <summary>
    /// Загрузить файл в S3 хранилище.
    /// </summary>
    /// <param name="stream">Поток данных файла</param>
    /// <param name="fileName">Исходное имя файла</param>
    /// <param name="contentType">MIME-тип (например, application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document)</param>
    /// <param name="folder">Опциональная подпапка в бакете (например, applications/123/documents)</param>
    /// <param name="ct">Токен отмены</param>
    Task<Result<StoredFileDescriptor>> UploadAsync(
        Stream stream,
        string fileName,
        string contentType,
        string? folder = null,
        CancellationToken ct = default);

    /// <summary>
    /// Прочитать/скачать файл из S3 хранилища по его ключу.
    /// </summary>
    Task<Result<StoredFileStream>> DownloadAsync(
        string fileKey,
        CancellationToken ct = default);

    /// <summary>
    /// Сгенерировать временную presigned-ссылку для прямого скачивания/просмотра файла клиентом.
    /// </summary>
    Task<Result<string>> GetPresignedUrlAsync(
        string fileKey,
        TimeSpan? expiry = null,
        CancellationToken ct = default);

    /// <summary>
    /// Удалить файл из S3 хранилища.
    /// </summary>
    Task<Result> DeleteAsync(
        string fileKey,
        CancellationToken ct = default);

    /// <summary>
    /// Проверить существование объекта в бакете.
    /// </summary>
    Task<bool> ExistsAsync(
        string fileKey,
        CancellationToken ct = default);

    /// <summary>
    /// Проверить наличие бакета и создать его, если он отсутствует.
    /// </summary>
    Task<Result> EnsureBucketExistsAsync(
        CancellationToken ct = default);
}
