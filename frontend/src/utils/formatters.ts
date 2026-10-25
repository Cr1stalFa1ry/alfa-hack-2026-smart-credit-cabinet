export const formatRubles = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 ₽';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDateTime = (isoString: string | undefined): string => {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
};

export const formatDate = (isoString: string | undefined): string => {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return isoString;
  }
};

export const formatInn = (inn: string | undefined): string => {
  if (!inn) return '—';
  // 12 digits for individual entrepreneur (ИП)
  if (inn.length === 12) {
    return `${inn.slice(0, 4)} ${inn.slice(4, 8)} ${inn.slice(8)}`;
  }
  return inn;
};

export const formatPercent = (value: number | undefined): string => {
  if (value === undefined || value === null) return '0%';
  return `${value.toFixed(1)}%`;
};

/**
 * Standard rational bank annuity payment calculation
 * P = S * [ r * (1 + r)^n ] / [ (1 + r)^n - 1 ]
 */
export const calculateMonthlyPayment = (
  amount: number | undefined | null,
  annualRatePercent: number | undefined | null,
  termMonths: number | undefined | null
): number => {
  const S = Number(amount || 0);
  const n = Number(termMonths || 0);
  const rate = Number(annualRatePercent || 0);

  if (S <= 0 || n <= 0) return 0;
  if (rate <= 0) return Math.round(S / n);

  const monthlyRate = rate / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, n);
  const payment = (S * monthlyRate * factor) / (factor - 1);
  return Math.round(payment);
};
