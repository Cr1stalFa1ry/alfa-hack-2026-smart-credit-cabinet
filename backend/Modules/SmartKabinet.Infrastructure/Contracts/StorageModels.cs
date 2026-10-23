using SmartKabinet.Shared;

namespace SmartKabinet.Infrastructure.Contracts;

public record StoredFileDescriptor(
    string FileKey,
    string FileName,
    string ContentType,
    long SizeBytes,
    string? ETag,
    DateTimeOffset UploadedAt
);

public sealed class StoredFileStream : IAsyncDisposable, IDisposable
{
    private readonly IDisposable? _underlyingResource;
    private bool _disposed;

    public Stream Stream { get; }
    public string ContentType { get; }
    public string FileName { get; }
    public long? ContentLength { get; }

    public StoredFileStream(
        Stream stream,
        string contentType,
        string fileName,
        long? contentLength = null,
        IDisposable? underlyingResource = null)
    {
        Stream = stream;
        ContentType = contentType;
        FileName = fileName;
        ContentLength = contentLength;
        _underlyingResource = underlyingResource;
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        Stream.Dispose();
        _underlyingResource?.Dispose();
    }

    public async ValueTask DisposeAsync()
    {
        if (_disposed) return;
        _disposed = true;
        await Stream.DisposeAsync();
        if (_underlyingResource is IAsyncDisposable asyncDisposable)
        {
            await asyncDisposable.DisposeAsync();
        }
        else
        {
            _underlyingResource?.Dispose();
        }
    }
}

public static class StorageErrors
{
    public static Error FileNotFound(string fileKey) =>
        Error.NotFound("Storage.FileNotFound", $"Файл с ключом '{fileKey}' не найден в хранилище.");

    public static Error InvalidFile(string message) =>
        Error.Validation("Storage.InvalidFile", message);

    public static Error UploadFailed(string message) =>
        Error.Failure("Storage.UploadFailed", $"Не удалось загрузить файл в S3: {message}");

    public static Error DownloadFailed(string message) =>
        Error.Failure("Storage.DownloadFailed", $"Не удалось прочитать файл из S3: {message}");

    public static Error DeleteFailed(string message) =>
        Error.Failure("Storage.DeleteFailed", $"Не удалось удалить файл из S3: {message}");

    public static Error BucketOperationFailed(string message) =>
        Error.Failure("Storage.BucketError", $"Ошибка работы с бакетом S3: {message}");
}
