namespace SmartKabinet.Checking.Domain;

public record ScoringCalculationResult(
    bool Approved,
    bool IsCounterOffer,
    decimal Score,
    decimal Dscr,
    decimal AnnualRatePercent,
    decimal MonthlyPayment,
    int ApprovedTermMonths,
    decimal ApprovedAmount,
    List<string> ReasonCodes
);

public static class ScoringEngine
{
    public static decimal CalculateMonthlyPayment(decimal loanAmount, decimal annualRatePercent, int termMonths)
    {
        if (loanAmount <= 0 || termMonths <= 0) return 0;
        
        var monthlyRate = (double)(annualRatePercent / 100m / 12m);
        if (monthlyRate <= 0) return loanAmount / termMonths;

        var factor = Math.Pow(1 + monthlyRate, -termMonths);
        var payment = (double)loanAmount * monthlyRate / (1 - factor);
        return Math.Round((decimal)payment, 2);
    }

    public static decimal CalculateDscr(decimal netCashFlow, decimal newMonthlyPayment, decimal existingObligations)
    {
        var totalPayments = newMonthlyPayment + existingObligations;
        if (totalPayments <= 0) return 999m;
        return Math.Round(netCashFlow / totalPayments, 2);
    }

    public static ScoringCalculationResult EvaluateOperating(
        decimal requestedAmount,
        int requestedTermMonths,
        int maxProductTermMonths,
        decimal netCashFlow,
        decimal annualInflow,
        decimal coefficientOfVariation,
        int operatingMonths,
        int overdueDays,
        decimal existingMonthlyObligations)
    {
        // 1. Оценка фактора КИ (макс 25)
        var bkiScore = overdueDays == 0 ? 25m : (overdueDays <= 30 ? 10m : 0m);

        // 2. История бизнеса (макс 15)
        decimal historyScore = operatingMonths switch
        {
            >= 24 => 15m,
            >= 12 => 10m,
            >= 6 => 5m,
            _ => 0m
        };

        // 3. Вариация поступлений CV (макс 15)
        decimal cvScore = coefficientOfVariation switch
        {
            <= 0.30m => 15m,
            <= 0.60m => 8m,
            _ => 0m
        };

        // 4. Сумма кредита <= 25% годовой выручки (макс 5)
        var ratioScore = annualInflow > 0 && (requestedAmount / annualInflow <= 0.25m) ? 5m : 0m;

        // 5. DSCR при базовой ставке (21%)
        var basePayment = CalculateMonthlyPayment(requestedAmount, 21m, requestedTermMonths);
        var baseDscr = CalculateDscr(netCashFlow, basePayment, existingMonthlyObligations);

        decimal dscrScore = baseDscr switch
        {
            >= 1.50m => 40m,
            >= 1.20m => 25m,
            >= 1.00m => 10m,
            _ => 0m
        };

        var totalScore = bkiScore + historyScore + cvScore + ratioScore + dscrScore;

        // Исход 1: 70+ баллов -> Одобрено на запрошенных условиях
        if (totalScore >= 70m)
        {
            var rate = totalScore >= 85m ? 18m : 21m;
            var finalPayment = CalculateMonthlyPayment(requestedAmount, rate, requestedTermMonths);
            var finalDscr = CalculateDscr(netCashFlow, finalPayment, existingMonthlyObligations);

            return new ScoringCalculationResult(
                Approved: true,
                IsCounterOffer: false,
                Score: totalScore,
                Dscr: finalDscr,
                AnnualRatePercent: rate,
                MonthlyPayment: finalPayment,
                ApprovedTermMonths: requestedTermMonths,
                ApprovedAmount: requestedAmount,
                ReasonCodes: new List<string>()
            );
        }

        // Исход 2: 50-69 баллов -> Встречное предложение (ставка 24%, увеличение срока с шагом 6 мес)
        if (totalScore >= 50m)
        {
            var counterRate = 24m;
            var currentTerm = requestedTermMonths;

            while (currentTerm <= maxProductTermMonths)
            {
                var counterPayment = CalculateMonthlyPayment(requestedAmount, counterRate, currentTerm);
                var counterDscr = CalculateDscr(netCashFlow, counterPayment, existingMonthlyObligations);

                if (counterDscr >= 1.5m)
                {
                    return new ScoringCalculationResult(
                        Approved: true,
                        IsCounterOffer: true,
                        Score: totalScore,
                        Dscr: counterDscr,
                        AnnualRatePercent: counterRate,
                        MonthlyPayment: counterPayment,
                        ApprovedTermMonths: currentTerm,
                        ApprovedAmount: requestedAmount,
                        ReasonCodes: new List<string> { "DSCR_LOW" }
                    );
                }

                currentTerm += 6;
            }

            // Если даже при максимальном сроке DSCR не достиг 1.5 -> отказ
            return new ScoringCalculationResult(
                Approved: false,
                IsCounterOffer: false,
                Score: totalScore,
                Dscr: baseDscr,
                AnnualRatePercent: counterRate,
                MonthlyPayment: basePayment,
                ApprovedTermMonths: requestedTermMonths,
                ApprovedAmount: 0m,
                ReasonCodes: new List<string> { "DSCR_LOW" }
            );
        }

        // Исход 3: Ниже 50 баллов -> Отказ
        return new ScoringCalculationResult(
            Approved: false,
            IsCounterOffer: false,
            Score: totalScore,
            Dscr: baseDscr,
            AnnualRatePercent: 0m,
            MonthlyPayment: 0m,
            ApprovedTermMonths: 0,
            ApprovedAmount: 0m,
            ReasonCodes: new List<string> { "LOW_SCORE" }
        );
    }
}
