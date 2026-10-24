namespace SmartKabinet.Application.Domain;

public static class CreditProductCodes
{
    public const string WorkingCapital = "WC";
    public const string Equipment = "EQ";
    public const string Start = "START";

    public static readonly IReadOnlyList<string> All = [WorkingCapital, Equipment, Start];

    public static bool IsValid(string? code) =>
        !string.IsNullOrWhiteSpace(code) && All.Contains(code.Trim().ToUpperInvariant());

    public static string ResolveProductCode(BusinessStage stage, LoanPurpose purpose, string? explicitCode = null)
    {
        if (!string.IsNullOrWhiteSpace(explicitCode))
        {
            var upper = explicitCode.Trim().ToUpperInvariant();
            if (All.Contains(upper)) return upper;
        }

        if (purpose == LoanPurpose.Equipment) return Equipment;
        if (stage == BusinessStage.Prelaunch && purpose == LoanPurpose.WorkingCapital) return Start;
        return WorkingCapital;
    }
}
