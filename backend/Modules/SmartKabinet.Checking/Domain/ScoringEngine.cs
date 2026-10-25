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
        if (monthlyRate <= 0) return Math.Ceiling((loanAmount / termMonths) * 100m) / 100m;

        var factor = Math.Pow(1 + monthlyRate, -termMonths);
        var payment = (double)loanAmount * monthlyRate / (1 - factor);
        return Math.Ceiling((decimal)payment * 100m) / 100m;
    }

    public static decimal CalculateDscr(decimal netCashFlow, decimal newMonthlyPayment, decimal existingObligations)
    {
        var totalPayments = newMonthlyPayment + existingObligations;
        if (totalPayments <= 0) return 999m;
        return netCashFlow / totalPayments;
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
        // 1. Оценка фактора КИ (макс 25, R21)
        var bkiScore = overdueDays == 0 ? 25m : (overdueDays <= 30 ? 10m : 0m);

        // 2. История бизнеса (макс 15, R18 / R22)
        decimal historyScore = operatingMonths switch
        {
            >= 24 => 15m,
            >= 12 => 10m,
            >= 6 => 5m,
            _ => 0m
        };

        // 3. Вариация поступлений CV (макс 15, R19 / R22)
        decimal cvScore = coefficientOfVariation switch
        {
            <= 0.30m => 15m,
            <= 0.60m => 8m,
            _ => 0m
        };

        // 4. Сумма кредита <= 25% годовой выручки (макс 5, R23)
        var ratioScore = annualInflow > 0 && (requestedAmount / annualInflow <= 0.25m) ? 5m : 0m;

        // 5. Опорный платеж Mref и опорное покрытие Kref при RATE_REF = 24% (R20)
        var refPayment = CalculateMonthlyPayment(requestedAmount, 24m, requestedTermMonths);
        var refDscr = CalculateDscr(netCashFlow, refPayment, existingMonthlyObligations);

        decimal dscrScore = refDscr switch
        {
            >= 1.50m => 40m,
            >= 1.20m => 25m,
            >= 1.00m => 10m,
            _ => 0m
        };

        var totalScore = bkiScore + historyScore + cvScore + ratioScore + dscrScore;

        // Исход 1: 70+ баллов -> Проверяем Kfinal >= 1.5 на запрошенных условиях (R25)
        if (totalScore >= 70m)
        {
            var rate = totalScore >= 85m ? 18m : 21m;
            var finalPayment = CalculateMonthlyPayment(requestedAmount, rate, requestedTermMonths);
            var finalDscr = CalculateDscr(netCashFlow, finalPayment, existingMonthlyObligations);

            if (finalDscr >= 1.50m)
            {
                return new ScoringCalculationResult(
                    Approved: true,
                    IsCounterOffer: false,
                    Score: totalScore,
                    Dscr: Math.Round(finalDscr, 2),
                    AnnualRatePercent: rate,
                    MonthlyPayment: finalPayment,
                    ApprovedTermMonths: requestedTermMonths,
                    ApprovedAmount: requestedAmount,
                    ReasonCodes: new List<string> { "OFFER_ORIGINAL" }
                );
            }
            // Если при балле >= 70 итоговое покрытие < 1.5, переходим к подбору срока по R26
        }

        // Исход 2: 50-69 баллов (или 70+ с недостаточным исходным покрытием) -> Встречное предложение со ставкой 24% (R26)
        if (totalScore >= 50m)
        {
            var counterRate = 24m;
            var currentTerm = requestedTermMonths + 6;

            while (currentTerm <= maxProductTermMonths)
            {
                var counterPayment = CalculateMonthlyPayment(requestedAmount, counterRate, currentTerm);
                var counterDscr = CalculateDscr(netCashFlow, counterPayment, existingMonthlyObligations);

                if (counterDscr >= 1.50m)
                {
                    return new ScoringCalculationResult(
                        Approved: true,
                        IsCounterOffer: true,
                        Score: totalScore,
                        Dscr: Math.Round(counterDscr, 2),
                        AnnualRatePercent: counterRate,
                        MonthlyPayment: counterPayment,
                        ApprovedTermMonths: currentTerm,
                        ApprovedAmount: requestedAmount,
                        ReasonCodes: new List<string> { "OFFER_COUNTER", "DSCR_LOW" }
                    );
                }

                currentTerm += 6;
            }

            // Если даже при максимальном сроке Kfinal не достиг 1.5 -> отказ (R26 / TC27)
            return new ScoringCalculationResult(
                Approved: false,
                IsCounterOffer: false,
                Score: totalScore,
                Dscr: Math.Round(refDscr, 2),
                AnnualRatePercent: counterRate,
                MonthlyPayment: refPayment,
                ApprovedTermMonths: requestedTermMonths,
                ApprovedAmount: 0m,
                ReasonCodes: new List<string> { "NO_FEASIBLE_TERMS" }
            );
        }

        // Исход 3: Ниже 50 баллов -> Отказ (R24 / TC13)
        return new ScoringCalculationResult(
            Approved: false,
            IsCounterOffer: false,
            Score: totalScore,
            Dscr: Math.Round(refDscr, 2),
            AnnualRatePercent: 0m,
            MonthlyPayment: 0m,
            ApprovedTermMonths: 0,
            ApprovedAmount: 0m,
            ReasonCodes: new List<string> { "SCORE_BELOW_MIN" }
        );
    }
}
