using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Util;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SmartKabinet.Infrastructure.Contracts;
using SmartKabinet.Shared;

namespace SmartKabinet.Infrastructure.Infrastructure;

public class S3StorageService : IS3StorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly S3StorageOptions _options;
    private readonly ILogger<S3StorageService> _logger;

    public S3StorageService(
        IAmazonS3 s3Client,
        IOptions<S3StorageOptions> options,
        ILogger<S3StorageService> logger)
    {
        _s3Client = s3Client;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<Result<StoredFileDescriptor>> UploadAsync(
        Stream stream,
        string fileName,
        string contentType,
        string? folder = null,
        CancellationToken ct = default)
    {
        if (stream == null || stream.CanRead == false)
        {
            return Result.Failure<StoredFileDescriptor>(StorageErrors.InvalidFile("Поток файла недоступен для чтения."));
        }

        if (string.IsNullOrWhiteSpace(fileName))
        {
            return Result.Failure<StoredFileDescriptor>(StorageErrors.InvalidFile("Имя файла не может быть пустым."));
        }

        var sanitizedFileName = Path.GetFileName(fileName);
        var uniquePrefix = $"{Guid.NewGuid():N}";
        var key = string.IsNullOrWhiteSpace(folder)
            ? $"{uniquePrefix}_{sanitizedFileName}"
            : $"{folder.Trim('/')}/{uniquePrefix}_{sanitizedFileName}";

        try
        {
            if (_options.AutoCreateBucket)
            {
                await EnsureBucketExistsAsync(ct);
            }

            var resolvedContentType = string.IsNullOrWhiteSpace(contentType) 
                ? ResolveContentTypeByExtension(sanitizedFileName) 
                : contentType;

            var putRequest = new PutObjectRequest
            {
                BucketName = _options.BucketName,
                Key = key,
                InputStream = stream,
                ContentType = resolvedContentType
            };

            putRequest.Metadata.Add("original-filename", Uri.EscapeDataString(sanitizedFileName));
            putRequest.Metadata.Add("uploaded-at", DateTimeOffset.UtcNow.ToString("O"));

            var response = await _s3Client.PutObjectAsync(putRequest, ct);

            long size = stream.CanSeek ? stream.Length : 0;

            _logger.LogInformation("Файл {FileName} успешно загружен в S3 бакет {Bucket} с ключом {Key}",
                sanitizedFileName, _options.BucketName, key);

            var descriptor = new StoredFileDescriptor(
                FileKey: key,
                FileName: sanitizedFileName,
                ContentType: resolvedContentType,
                SizeBytes: size,
                ETag: response.ETag,
                UploadedAt: DateTimeOffset.UtcNow
            );

            return Result.Success(descriptor);
        }
        catch (AmazonS3Exception ex)
        {
            _logger.LogError(ex, "Ошибка AWS S3 при загрузке файла {FileName} в бакет {Bucket}", fileName, _options.BucketName);
            return Result.Failure<StoredFileDescriptor>(StorageErrors.UploadFailed(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Непредвиденная ошибка при загрузке файла {FileName} в S3", fileName);
            return Result.Failure<StoredFileDescriptor>(StorageErrors.UploadFailed(ex.Message));
        }
    }

    public async Task<Result<StoredFileStream>> DownloadAsync(
        string fileKey,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(fileKey))
        {
            return Result.Failure<StoredFileStream>(StorageErrors.InvalidFile("Ключ файла не может быть пустым."));
        }

        try
        {
            var getRequest = new GetObjectRequest
            {
                BucketName = _options.BucketName,
                Key = fileKey
            };

            var response = await _s3Client.GetObjectAsync(getRequest, ct);

            var originalFileName = Path.GetFileName(fileKey);
            if (response.Metadata["original-filename"] is { } encodedName && !string.IsNullOrWhiteSpace(encodedName))
            {
                try
                {
                    originalFileName = Uri.UnescapeDataString(encodedName);
                }
                catch
                {
                    // Использовать имя из ключа при ошибке декодирования
                }
            }

            var contentType = response.Headers.ContentType ?? ResolveContentTypeByExtension(originalFileName);

            var storedStream = new StoredFileStream(
                stream: response.ResponseStream,
                contentType: contentType,
                fileName: originalFileName,
                contentLength: response.ContentLength,
                underlyingResource: response
            );

            return Result.Success(storedStream);
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound || ex.ErrorCode == "NoSuchKey")
        {
            _logger.LogWarning("Файл с ключом {Key} не найден в S3 бакете {Bucket}", fileKey, _options.BucketName);
            return Result.Failure<StoredFileStream>(StorageErrors.FileNotFound(fileKey));
        }
        catch (AmazonS3Exception ex)
        {
            _logger.LogError(ex, "Ошибка AWS S3 при скачивании файла с ключом {Key}", fileKey);
            return Result.Failure<StoredFileStream>(StorageErrors.DownloadFailed(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Непредвиденная ошибка при скачивании файла {Key} из S3", fileKey);
            return Result.Failure<StoredFileStream>(StorageErrors.DownloadFailed(ex.Message));
        }
    }

    public Task<Result<string>> GetPresignedUrlAsync(
        string fileKey,
        TimeSpan? expiry = null,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(fileKey))
        {
            return Task.FromResult(Result.Failure<string>(StorageErrors.InvalidFile("Ключ файла не может быть пустым.")));
        }

        try
        {
            var expires = DateTime.UtcNow.Add(expiry ?? TimeSpan.FromHours(1));

            var request = new GetPreSignedUrlRequest
            {
                BucketName = _options.BucketName,
                Key = fileKey,
                Expires = expires,
                Verb = HttpVerb.GET
            };

            var url = _s3Client.GetPreSignedURL(request);
            return Task.FromResult(Result.Success(url));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при генерации presigned URL для {Key}", fileKey);
            return Task.FromResult(Result.Failure<string>(StorageErrors.DownloadFailed(ex.Message)));
        }
    }

    public async Task<Result> DeleteAsync(
        string fileKey,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(fileKey))
        {
            return Result.Failure(StorageErrors.InvalidFile("Ключ файла не может быть пустым."));
        }

        try
        {
            var deleteRequest = new DeleteObjectRequest
            {
                BucketName = _options.BucketName,
                Key = fileKey
            };

            await _s3Client.DeleteObjectAsync(deleteRequest, ct);
            _logger.LogInformation("Файл с ключом {Key} удален из бакета {Bucket}", fileKey, _options.BucketName);
            return Result.Success();
        }
        catch (AmazonS3Exception ex)
        {
            _logger.LogError(ex, "Ошибка AWS S3 при удалении файла {Key}", fileKey);
            return Result.Failure(StorageErrors.DeleteFailed(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Непредвиденная ошибка при удалении файла {Key}", fileKey);
            return Result.Failure(StorageErrors.DeleteFailed(ex.Message));
        }
    }

    public async Task<bool> ExistsAsync(
        string fileKey,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(fileKey)) return false;

        try
        {
            var request = new GetObjectMetadataRequest
            {
                BucketName = _options.BucketName,
                Key = fileKey
            };

            await _s3Client.GetObjectMetadataAsync(request, ct);
            return true;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound || ex.ErrorCode == "NoSuchKey")
        {
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Ошибка проверки существования объекта {Key} в S3", fileKey);
            return false;
        }
    }

    public async Task<Result> EnsureBucketExistsAsync(CancellationToken ct = default)
    {
        try
        {
            var exists = await AmazonS3Util.DoesS3BucketExistV2Async(_s3Client, _options.BucketName);
            if (!exists)
            {
                _logger.LogInformation("Бакет {Bucket} не найден. Создание нового бакета...", _options.BucketName);
                var putBucketRequest = new PutBucketRequest
                {
                    BucketName = _options.BucketName
                };
                await _s3Client.PutBucketAsync(putBucketRequest, ct);
                _logger.LogInformation("Бакет {Bucket} успешно создан", _options.BucketName);
            }
            return Result.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при проверке/создании бакета {Bucket}", _options.BucketName);
            return Result.Failure(StorageErrors.BucketOperationFailed(ex.Message));
        }
    }

    private static string ResolveContentTypeByExtension(string fileName)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        return ext switch
        {
            ".pdf" => "application/pdf",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".doc" => "application/msword",
            ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".xls" => "application/vnd.ms-excel",
            ".csv" => "text/csv; charset=utf-8",
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".txt" => "text/plain; charset=utf-8",
            ".json" => "application/json",
            _ => "application/octet-stream"
        };
    }
}
