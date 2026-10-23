using System.Net;
using System.Text;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using SmartKabinet.Infrastructure.Contracts;
using SmartKabinet.Infrastructure.Infrastructure;
using Xunit;

namespace SmartKabinet.Infrastructure.Tests;

public class S3StorageServiceTests
{
    private readonly Mock<IAmazonS3> _s3ClientMock;
    private readonly Mock<ILogger<S3StorageService>> _loggerMock;
    private readonly IOptions<S3StorageOptions> _options;
    private readonly S3StorageService _sut;

    public S3StorageServiceTests()
    {
        _s3ClientMock = new Mock<IAmazonS3>();
        _loggerMock = new Mock<ILogger<S3StorageService>>();
        _options = Options.Create(new S3StorageOptions
        {
            ServiceUrl = "http://localhost:9000",
            BucketName = "test-documents-bucket",
            AutoCreateBucket = false
        });

        _sut = new S3StorageService(_s3ClientMock.Object, _options, _loggerMock.Object);
    }

    [Fact]
    public async Task UploadAsync_ValidFile_ReturnsSuccessWithDescriptor()
    {
        // Arrange
        var content = "Sample PDF content";
        var bytes = Encoding.UTF8.GetBytes(content);
        using var stream = new MemoryStream(bytes);
        var fileName = "invoice_expenses.pdf";

        _s3ClientMock.Setup(x => x.PutObjectAsync(It.IsAny<PutObjectRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PutObjectResponse
            {
                ETag = "\"test-etag-12345\"",
                HttpStatusCode = HttpStatusCode.OK
            });

        // Act
        var result = await _sut.UploadAsync(stream, fileName, "application/pdf", "expenses");

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Equal(fileName, result.Value.FileName);
        Assert.Equal("application/pdf", result.Value.ContentType);
        Assert.Equal(bytes.Length, result.Value.SizeBytes);
        Assert.Equal("\"test-etag-12345\"", result.Value.ETag);
        Assert.StartsWith("expenses/", result.Value.FileKey);
        Assert.EndsWith("_invoice_expenses.pdf", result.Value.FileKey);

        _s3ClientMock.Verify(x => x.PutObjectAsync(It.Is<PutObjectRequest>(r =>
            r.BucketName == "test-documents-bucket" &&
            r.Key == result.Value.FileKey &&
            r.ContentType == "application/pdf"
        ), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UploadAsync_EmptyFileName_ReturnsValidationError()
    {
        // Arrange
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes("test"));

        // Act
        var result = await _sut.UploadAsync(stream, "", "application/pdf");

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal("Storage.InvalidFile", result.Error.Code);
    }

    [Fact]
    public async Task UploadAsync_S3ThrowsException_ReturnsUploadFailedError()
    {
        // Arrange
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes("test"));
        _s3ClientMock.Setup(x => x.PutObjectAsync(It.IsAny<PutObjectRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new AmazonS3Exception("Connection refused"));

        // Act
        var result = await _sut.UploadAsync(stream, "doc.pdf", "application/pdf");

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal("Storage.UploadFailed", result.Error.Code);
    }

    [Fact]
    public async Task DownloadAsync_ExistingFile_ReturnsStoredFileStream()
    {
        // Arrange
        var fileKey = "expenses/test-guid_report.docx";
        var content = "Fake docx content";
        var memoryStream = new MemoryStream(Encoding.UTF8.GetBytes(content));

        var response = new GetObjectResponse
        {
            ResponseStream = memoryStream,
            Headers = { ContentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
            ContentLength = memoryStream.Length
        };
        response.Metadata.Add("original-filename", Uri.EscapeDataString("report.docx"));

        _s3ClientMock.Setup(x => x.GetObjectAsync(It.IsAny<GetObjectRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(response);

        // Act
        var result = await _sut.DownloadAsync(fileKey);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Equal("report.docx", result.Value.FileName);
        Assert.Equal("application/vnd.openxmlformats-officedocument.wordprocessingml.document", result.Value.ContentType);

        using var reader = new StreamReader(result.Value.Stream);
        var readContent = await reader.ReadToEndAsync();
        Assert.Equal(content, readContent);
    }

    [Fact]
    public async Task DownloadAsync_NoSuchKey_ReturnsFileNotFound()
    {
        // Arrange
        var fileKey = "non_existent.pdf";
        _s3ClientMock.Setup(x => x.GetObjectAsync(It.IsAny<GetObjectRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new AmazonS3Exception("Not Found") { StatusCode = HttpStatusCode.NotFound, ErrorCode = "NoSuchKey" });

        // Act
        var result = await _sut.DownloadAsync(fileKey);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal("Storage.FileNotFound", result.Error.Code);
    }

    [Fact]
    public async Task GetPresignedUrlAsync_ValidKey_ReturnsUrl()
    {
        // Arrange
        var fileKey = "documents/contract.pdf";
        var expectedUrl = "https://s3.example.com/test-documents-bucket/documents/contract.pdf?sig=123";

        _s3ClientMock.Setup(x => x.GetPreSignedURL(It.IsAny<GetPreSignedUrlRequest>()))
            .Returns(expectedUrl);

        // Act
        var result = await _sut.GetPresignedUrlAsync(fileKey);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(expectedUrl, result.Value);
    }

    [Fact]
    public async Task DeleteAsync_CallsS3Client_ReturnsSuccess()
    {
        // Arrange
        var fileKey = "documents/to_delete.pdf";
        _s3ClientMock.Setup(x => x.DeleteObjectAsync(It.IsAny<DeleteObjectRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DeleteObjectResponse());

        // Act
        var result = await _sut.DeleteAsync(fileKey);

        // Assert
        Assert.True(result.IsSuccess);
        _s3ClientMock.Verify(x => x.DeleteObjectAsync(It.Is<DeleteObjectRequest>(r =>
            r.BucketName == "test-documents-bucket" && r.Key == fileKey
        ), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ExistsAsync_ReturnsTrueWhenObjectExists()
    {
        // Arrange
        var fileKey = "documents/exists.pdf";
        _s3ClientMock.Setup(x => x.GetObjectMetadataAsync(It.IsAny<GetObjectMetadataRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GetObjectMetadataResponse());

        // Act
        var exists = await _sut.ExistsAsync(fileKey);

        // Assert
        Assert.True(exists);
    }

    [Fact]
    public async Task ExistsAsync_ReturnsFalseWhenObjectDoesNotExist()
    {
        // Arrange
        var fileKey = "documents/missing.pdf";
        _s3ClientMock.Setup(x => x.GetObjectMetadataAsync(It.IsAny<GetObjectMetadataRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new AmazonS3Exception("Not Found") { StatusCode = HttpStatusCode.NotFound, ErrorCode = "NoSuchKey" });

        // Act
        var exists = await _sut.ExistsAsync(fileKey);

        // Assert
        Assert.False(exists);
    }
}
