using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using SmartKabinet.Intergrations.Ml.Models;
using SmartKabinet.Intergrations.Ml.Services;
using Xunit;

namespace SmartKabinet.Infrastructure.Tests;

public class InvoiceVerificationTests
{
    private readonly MlServiceClient _client;

    public InvoiceVerificationTests()
    {
        var config = new ConfigurationBuilder().Build();
        var httpClient = new HttpClient { BaseAddress = new Uri("http://localhost:8000") };
        _client = new MlServiceClient(httpClient, config, NullLogger<MlServiceClient>.Instance);
    }

    [Fact]
    public void VerifyInvoice_WhenPriceAndInnMatch_ReturnsMatched()
    {
        // Arrange
        var doc = new DocumentReadResult(
            DocumentType: "INVOICE",
            Status: "EXTRACTED",
            NeedsReview: false,
            BuyerInn: "770123456789",
            TotalAmountRub: 1_250_000m,
            SupplierInn: "7799887766"
        );

        // Act - comparing with equipment_price (1_250_000), not loan amount (e.g. 1_000_000)
        var result = _client.VerifyInvoiceAgainstApplication(
            doc,
            expectedEquipmentPrice: 1_250_000m,
            expectedBuyerInn: "770123456789",
            expectedSupplierInn: "7799887766"
        );

        // Assert
        Assert.True(result.IsMatched);
        Assert.False(result.NeedsReview);
        Assert.Empty(result.Discrepancies);
    }

    [Fact]
    public void VerifyInvoice_WhenAmountDiffersFromEquipmentPrice_ReturnsAmountMismatch()
    {
        // Arrange: invoice is 1_500_000, equipment_price in app is 1_200_000
        var doc = new DocumentReadResult(
            DocumentType: "INVOICE",
            Status: "EXTRACTED",
            NeedsReview: false,
            BuyerInn: "770123456789",
            TotalAmountRub: 1_500_000m
        );

        // Act
        var result = _client.VerifyInvoiceAgainstApplication(
            doc,
            expectedEquipmentPrice: 1_200_000m,
            expectedBuyerInn: "770123456789"
        );

        // Assert
        Assert.False(result.IsMatched);
        Assert.True(result.NeedsReview);
        Assert.Contains(result.Discrepancies, d => d.Contains("AMOUNT_MISMATCH"));
    }

    [Fact]
    public void VerifyInvoice_WhenBuyerInnDiffers_ReturnsBuyerMismatch()
    {
        // Arrange
        var doc = new DocumentReadResult(
            DocumentType: "INVOICE",
            Status: "EXTRACTED",
            NeedsReview: false,
            BuyerInn: "999999999999",
            TotalAmountRub: 500_000m
        );

        // Act
        var result = _client.VerifyInvoiceAgainstApplication(
            doc,
            expectedEquipmentPrice: 500_000m,
            expectedBuyerInn: "770123456789"
        );

        // Assert
        Assert.False(result.IsMatched);
        Assert.True(result.NeedsReview);
        Assert.Contains(result.Discrepancies, d => d.Contains("BUYER_MISMATCH"));
    }
}
