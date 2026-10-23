/**
 * Расчёт по демонстрационным правилам Excel. Нет ML и автоматического решения.
 * Взято из прототипа "Альфа — кабинет со скорингом.html".
 */

export interface ScoringFact {
  month: string;
  receipts: number | string;
  outflows: number | string;
}

export interface ScoringDebtInput {
  ref: string;
  payment: number | string;
  conflict?: boolean;
}

export interface ScoringInput {
  asOf?: string;
  stage?: 'operating' | 'new' | 'paused' | string;
  purpose?: 'equipment' | 'working_capital' | string;
  amount?: number | string | null;
  term?: number | null;
  equipmentCost?: number | string | null;
  ownFunds?: number | string | null;
  householdExpenses?: number | string | null;
  extraExpenses?: number | string | null;
  personalIncome?: number | string | null;
  committedCosts?: number | string | null;
  cashReserve?: number | string | null;
  incomeContinues?: string;
  forecastOnly?: boolean;
  facts?: ScoringFact[];
  debts?: ScoringDebtInput[];
  resolvedDebtPayment?: number | string | null;
  debtsComplete?: boolean;
  debtReconciled?: boolean;
  factsState?: 'AVAILABLE' | 'MISSING' | string;
  sourceStatus?: 'SUCCESS' | 'ERROR' | 'INCOMPLETE' | string;
  creditHistory?: 'FOUND' | 'NO_RECORD' | 'ERROR' | string;
  currentOverdue?: number | string;
  overdueDays?: number;
  activityFirstMonth?: string;
  registrationMonth?: string;
  issues?: string[];
}

export interface ScoringComponent {
  key: string;
  label: string;
  points: number;
  max: number;
  value: any;
  rule: string;
}

export interface CandidateOffer {
  amount: number;
  term: number;
  rate: number;
  payment: number;
  coverage: number;
  type: 'ORIGINAL' | 'COUNTER';
  passes: boolean;
}

export interface ScoringResult {
  engine: string;
  rulesVersion: string;
  assessmentAsOf: string;
  profile: 'FULL' | 'LIMITED' | 'CONSULTATION' | null;
  state: 'ready' | 'provisional' | 'insufficient' | 'manual' | 'waiting' | 'stop' | 'product_na' | 'error';
  recommendation: string;
  score: number | null;
  components: ScoringComponent[];
  metrics: Record<string, any>;
  candidate: CandidateOffer | null;
  candidates: CandidateOffer[];
  issues: string[];
  risks: string[];
  codes: string[];
  product: string | null;
  autoDecision: boolean;
  inputFingerprint?: string;
}

export const validAmount = (v: any): boolean =>
  v !== null &&
  v !== undefined &&
  v !== '' &&
  /^\d+(\.\d{1,2})?$/.test(String(v)) &&
  Number.isFinite(Number(v)) &&
  Number(v) <= Number.MAX_SAFE_INTEGER / 100;

export const monthIndex = (s?: string | null): number | null =>
  /^\d{4}-(0[1-9]|1[0-2])$/.test(s || '')
    ? Number(s!.slice(0, 4)) * 12 + Number(s!.slice(5, 7)) - 1
    : null;

/**
 * Exact rational annuity, rounded UP to a kopeck, avoiding floating-point ceil errors.
 */
export function pmt(amount: any, rate: any, term: any): number | null {
  if (
    !validAmount(amount) ||
    !Number.isFinite(Number(rate)) ||
    rate < 0 ||
    rate > 10 ||
    !Number.isInteger(term) ||
    term < 1 ||
    term > 600
  )
    return null;

  const principal = BigInt(Math.round(Number(amount) * 100));
  const annualBps = BigInt(Math.round(Number(rate) * 10000));
  const den = 120000n;

  if (annualBps === 0n) return Number((principal + BigInt(term) - 1n) / BigInt(term)) / 100;

  const x = (den + annualBps) ** BigInt(term);
  const y = den ** BigInt(term);
  const numerator = principal * annualBps * x;
  const divisor = den * (x - y);
  return Number((numerator + divisor - 1n) / divisor) / 100;
}

export function mergeDebts(rows?: ScoringDebtInput[]): {
  total: number | null;
  rows: Array<{ ref: string; payment: number; values: number[]; conflict: boolean }>;
  issues: string[];
} {
  const groups = new Map<string, { ref: string; payment: number; values: number[] }>();
  const issues: string[] = [];

  if (!Array.isArray(rows)) return { total: null, rows: [], issues: ['Список обязательств не получен'] };

  for (const x of rows) {
    if (!x.ref || !validAmount(x.payment)) {
      issues.push('Не указан договор или платёж по обязательству');
      continue;
    }
    const prev = groups.get(x.ref);
    if (!prev) {
      groups.set(x.ref, { ref: x.ref, payment: +x.payment, values: [+x.payment] });
    } else {
      prev.payment = Math.max(prev.payment, +x.payment);
      prev.values.push(+x.payment);
    }
  }

  const result = [...groups.values()].map((x) => ({ ...x, conflict: new Set(x.values).size > 1 }));
  return {
    total: issues.length ? null : result.reduce((n, x) => n + x.payment, 0),
    rows: result,
    issues,
  };
}

export function coveragePoints(k: number, p: any): number {
  return k >= p.COVER_APPROVE
    ? p.PTS_COVER_HIGH
    : k >= p.COVER_MIDDLE
    ? p.PTS_COVER_MIDDLE
    : k >= p.COVER_LOW
    ? p.PTS_COVER_LOW
    : p.PTS_COVER_DEFICIT;
}

export function historyPoints(m: number | null, p: any): number {
  if (m === null) return p.PTS_HISTORY_NEW;
  return m >= p.HISTORY_LONG
    ? p.PTS_HISTORY_LONG
    : m >= p.HISTORY_MIDDLE
    ? p.PTS_HISTORY_MIDDLE
    : m >= p.HISTORY_SHORT
    ? p.PTS_HISTORY_SHORT
    : p.PTS_HISTORY_NEW;
}

export function cvPoints(cv: number | null, p: any): number {
  return cv === null
    ? p.PTS_CV_HIGH
    : cv <= p.CV_LOW
    ? p.PTS_CV_LOW
    : cv <= p.CV_MIDDLE
    ? p.PTS_CV_MIDDLE
    : p.PTS_CV_HIGH;
}

export function evaluate(input: ScoringInput, config: any): ScoringResult {
  const p = config.parameters;
  const result: ScoringResult = {
    engine: 'RULES_ONLY',
    rulesVersion: config.version,
    assessmentAsOf: input.asOf || config.assessmentAsOf,
    profile: null,
    state: 'insufficient',
    recommendation: 'Уточнить сведения',
    score: null,
    components: [],
    metrics: {},
    candidate: null,
    candidates: [],
    issues: [],
    risks: [],
    codes: [],
    product: null,
    autoDecision: false,
  };

  const issue = (code: string, text: string) => {
    result.codes.push(code);
    result.issues.push(text);
  };
  const risk = (code: string, text: string) => {
    result.codes.push(code);
    result.risks.push(text);
  };

  for (const text of input.issues || []) issue('EVIDENCE_REVIEW', text);

  if (input.stage === 'paused') {
    result.profile = 'CONSULTATION';
    result.state = 'manual';
    result.recommendation = 'Индивидуальная консультация';
    return result;
  }

  const debts = mergeDebts(input.debts);
  result.metrics.debtRows = debts.rows;
  result.metrics.debtPayment = validAmount(input.resolvedDebtPayment)
    ? +input.resolvedDebtPayment!
    : debts.total;

  for (const msg of debts.issues) issue('OBLIGATIONS_REQUIRED', msg);
  if (debts.rows.some((d) => d.conflict) && !input.debtReconciled)
    issue(
      'DEBT_RECONCILIATION',
      'Есть расхождения по одному договору: использован максимум платежей только для предварительного расчёта'
    );
  if (!input.debtsComplete) issue('OBLIGATIONS_REQUIRED', 'Полнота обязательств не подтверждена');

  const household = validAmount(input.householdExpenses) ? +input.householdExpenses! : null;
  if (household === null)
    issue('PERSONAL_EXPENSES_REQUIRED', 'Не указаны обязательные личные расходы без кредитов');

  const asOfIndex = monthIndex(result.assessmentAsOf.slice(0, 7));
  const lastClosed = asOfIndex === null ? null : asOfIndex - 1;
  const rows = Array.isArray(input.facts)
    ? input.facts.slice().sort((a, b) => String(a.month).localeCompare(String(b.month)))
    : [];
  const factErrors: string[] = [];

  rows.forEach((f, i) => {
    const m = monthIndex(f.month);
    if (m === null || lastClosed === null || m > lastClosed)
      factErrors.push('Некорректный или незакрытый месяц');
    if (i && m !== monthIndex(rows[i - 1].month)! + 1)
      factErrors.push('Повтор или разрыв месячных фактов');
    if (!validAmount(f.receipts) || !validAmount(f.outflows))
      factErrors.push('Некорректная сумма в месячных фактах');
  });

  if (rows.length && monthIndex(rows.at(-1)!.month) !== lastClosed)
    factErrors.push('Нет последнего закрытого месяца');

  if (factErrors.length) {
    result.state = 'error';
    result.recommendation = 'Исправить входные данные';
    for (const msg of factErrors) issue('FACTS_INVALID', msg);
    return result;
  }

  const facts = rows.slice(-p.MAX_FACT_MONTHS);
  result.metrics.months = facts.length;
  result.metrics.period = facts.length ? `${facts[0].month} — ${facts.at(-1)!.month}` : null;

  if (facts.length) {
    const mean = (k: 'receipts' | 'outflows') =>
      facts.reduce((n, x) => n + Number(x[k]), 0) / facts.length;
    result.metrics.receipts = mean('receipts');
    result.metrics.outflows = mean('outflows');
    result.metrics.extraExpenses = validAmount(input.extraExpenses) ? +input.extraExpenses! : 0;
    result.metrics.availableCash =
      household === null
        ? null
        : result.metrics.receipts -
          result.metrics.outflows -
          household -
          result.metrics.extraExpenses;

    const variance =
      facts.reduce((n, x) => n + (Number(x.receipts) - result.metrics.receipts) ** 2, 0) /
      facts.length;
    result.metrics.stdDev = Math.sqrt(variance);
    result.metrics.cv =
      result.metrics.receipts > 0 ? result.metrics.stdDev / result.metrics.receipts : null;
    result.metrics.annualReceipts =
      facts.length >= 12
        ? facts.slice(-12).reduce((n, x) => n + Number(x.receipts), 0)
        : null;
  } else {
    result.metrics.receipts = null;
    result.metrics.outflows = null;
    result.metrics.availableCash = null;
    result.metrics.cv = null;
    result.metrics.annualReceipts = null;
  }

  const actualDuration =
    monthIndex(input.activityFirstMonth) === null
      ? null
      : lastClosed! - monthIndex(input.activityFirstMonth)! + 1;
  const shortObserved =
    facts.length > 0 &&
    facts.length < p.MIN_FACT_MONTHS &&
    actualDuration !== null &&
    actualDuration >= facts.length;
  const limited =
    input.stage === 'new' ||
    (input.stage === 'operating' &&
      facts.length < p.MIN_FACT_MONTHS &&
      (input.factsState === 'MISSING' || shortObserved));

  if (limited) {
    result.profile = 'LIMITED';
    result.state = 'manual';
    result.recommendation = 'Ручная проверка источника платежей';
    const income = validAmount(input.personalIncome) ? +input.personalIncome! : null;
    const costs = validAmount(input.committedCosts) ? +input.committedCosts! : null;
    result.metrics.personalIncome = income;
    result.metrics.committedCosts = costs;
    result.metrics.availableCash =
      income === null || household === null || costs === null
        ? null
        : income - household - costs;

    if (income === null)
      issue(
        'OTHER_SOURCE_REQUIRED',
        'Нет суммы текущего регулярного дохода; прогноз и слова клиента не подтверждают платёжеспособность'
      );
    if (costs === null)
      issue('COMMITTED_COSTS_REQUIRED', 'Не указаны обязательные ежемесячные расходы бизнеса');
    if (input.incomeContinues !== 'yes' && input.incomeContinues !== 'Да')
      risk('INCOME_CONTINUITY', 'Продолжение регулярного дохода не подтверждено');
    if (input.forecastOnly)
      risk('FORECAST_ONLY', 'Погашение основано только на будущей выручке');
    if (input.cashReserve !== null && input.cashReserve !== undefined)
      result.metrics.reserve = validAmount(input.cashReserve) ? +input.cashReserve : null;

    risk(
      'LIMITED_HISTORY',
      'Нет достаточной истории текущей деятельности. Балл, ставка и условия кредита не рассчитываются автоматически.'
    );
    return result;
  }

  result.profile = 'FULL';
  if (input.stage !== 'operating') {
    issue('STAGE_REQUIRED', 'Не определена стадия бизнеса');
    return result;
  }
  if (input.factsState !== 'AVAILABLE' || facts.length < p.MIN_FACT_MONTHS) {
    issue('FACTS_REQUIRED', `Нужно минимум ${p.MIN_FACT_MONTHS} закрытых месяцев фактов`);
  }

  const product =
    config.products[
      input.purpose === 'equipment' ? 'EQ' : input.purpose === 'working_capital' ? 'WC' : ''
    ];
  if (!product) {
    result.state = 'product_na';
    issue('PRODUCT_NOT_APPLICABLE', 'Цель не поддерживается расчётом условий');
    return result;
  }
  result.product = input.purpose === 'equipment' ? 'EQ' : 'WC';

  const amount = validAmount(input.amount) ? +input.amount! : null;
  const term = input.term === null || input.term === undefined ? product.defaultTerm : input.term;
  result.metrics.amount = amount;
  result.metrics.term = term;
  result.metrics.defaultTermUsed = input.term === null || input.term === undefined;

  if (amount === null || amount <= 0 || !Number.isInteger(term) || term <= 0) {
    result.state = 'error';
    issue('INVALID_REQUEST', 'Некорректная сумма или срок финансирования');
    return result;
  }
  if (
    amount < product.minAmount ||
    amount > product.maxAmount ||
    term < product.minTerm ||
    term > product.maxTerm
  ) {
    result.state = 'product_na';
    result.recommendation = 'Параметры вне рамок продукта';
    issue(
      'PRODUCT_OUT_OF_BOUNDS',
      `Сумма вне диапазона ${product.minAmount}–${product.maxAmount} или срок вне ${product.minTerm}–${product.maxTerm}`
    );
    return result;
  }

  if (result.product === 'EQ') {
    if (!validAmount(input.equipmentCost) || !validAmount(input.ownFunds)) {
      issue('EQUIPMENT_REQUIRED', 'Не указана стоимость оборудования или собственный взнос');
    } else if (
      Math.round(Number(input.equipmentCost) * 100) - Math.round(Number(input.ownFunds) * 100) !==
      Math.round(amount * 100)
    ) {
      issue(
        'EQUIPMENT_ARITHMETIC',
        'Сумма кредита должна быть равна стоимости оборудования за вычетом собственного взноса'
      );
    } else if (+input.ownFunds! < +input.equipmentCost! * product.minContribution) {
      result.state = 'product_na';
      result.recommendation = 'Собственный взнос ниже минимального';
      issue('CONTRIBUTION_LOW', `Собственный взнос ниже ${(product.minContribution * 100).toFixed(0)}%`);
      return result;
    }
  }

  const C = result.metrics.availableCash;
  const D = result.metrics.debtPayment;
  result.metrics.referenceRate = p.RATE_REF;
  result.metrics.referencePayment = pmt(amount, p.RATE_REF, term);
  result.metrics.referenceCoverage =
    C === null || D === null || result.metrics.referencePayment === null || D + result.metrics.referencePayment === 0
      ? null
      : C / (D + result.metrics.referencePayment);

  if (input.sourceStatus === 'ERROR' || input.sourceStatus === 'INCOMPLETE') {
    result.state = 'waiting';
    result.recommendation = 'Повторить необходимую проверку';
    issue('SOURCE_UNAVAILABLE', 'Синтетический источник сведений вернул ошибку или неполные данные');
  }
  if (input.sourceStatus !== 'SUCCESS' || !['FOUND', 'NO_RECORD'].includes(input.creditHistory || '')) {
    issue('CREDIT_DATA_REQUIRED', 'Сведения БКИ не получены успешно');
  }
  if (
    input.sourceStatus === 'SUCCESS' &&
    ['FOUND', 'NO_RECORD'].includes(input.creditHistory || '') &&
    validAmount(input.currentOverdue) &&
    Number.isInteger(input.overdueDays) &&
    input.overdueDays! >= 0
  ) {
    if (input.overdueDays! > p.STOP_OVERDUE_DAYS || +input.currentOverdue! > 0) {
      result.state = 'stop';
      result.recommendation = 'Проверить блокирующий фактор';
      risk(
        'CREDIT_STOP',
        'По синтетическому ответу есть текущая просрочка или историческая просрочка больше 30 дней. Требуется решение сотрудника'
      );
      return result;
    }
  } else {
    issue('DELINQUENCY_REQUIRED', 'Показатели просрочек не получены полностью');
  }

  const first = monthIndex(input.activityFirstMonth);
  const duration = first === null || lastClosed === null ? null : lastClosed - first + 1;
  result.metrics.activityMonths = duration;

  if (duration === null || duration < facts.length || first! < monthIndex(input.registrationMonth)!) {
    issue('ACTIVITY_DATE_REQUIRED', 'Нужно уточнить первый полный месяц фактической деятельности');
  }
  if (result.metrics.cv === null) {
    risk('CV_NOT_ASSESSABLE', 'При нулевых средних поступлениях устойчивость не оценивается; это не CV=0');
  }
  if (result.metrics.annualReceipts === null) {
    risk('ANNUAL_DATA_UNAVAILABLE', 'Нет 12 месяцев: годовые поступления не достраиваются прогнозом');
  }

  if (
    C === null ||
    D === null ||
    result.codes.some((c) =>
      ['CREDIT_DATA_REQUIRED', 'DELINQUENCY_REQUIRED', 'ACTIVITY_DATE_REQUIRED', 'EQUIPMENT_REQUIRED'].includes(c)
    )
  ) {
    result.state = 'insufficient';
    return result;
  }

  const K = result.metrics.referenceCoverage;
  result.components = [
    { key: 'coverage', label: 'Покрытие платежей', points: coveragePoints(K, p), max: 40, value: K, rule: 'R20–R21' },
    {
      key: 'credit',
      label: 'Кредитные сведения',
      points: (input.overdueDays || 0) > 0 ? p.PTS_MINOR_ADVERSE : p.PTS_NO_ADVERSE,
      max: 25,
      value:
        input.creditHistory === 'NO_RECORD'
          ? 'Записей нет; это не положительная история'
          : (input.overdueDays || 0) > 0
          ? 'Историческая просрочка до 30 дней'
          : 'В синтетическом ответе нет просрочек',
      rule: 'R09–R10, R21',
    },
    {
      key: 'history',
      label: 'Длительность деятельности',
      points: historyPoints(duration, p),
      max: 15,
      value: duration,
      rule: 'R18, R22',
    },
    {
      key: 'variation',
      label: 'Устойчивость поступлений',
      points: cvPoints(result.metrics.cv, p),
      max: 15,
      value: result.metrics.cv,
      rule: 'R19, R22',
    },
    {
      key: 'annual',
      label: 'Сумма к годовым поступлениям',
      points:
        result.metrics.annualReceipts > 0 && amount / result.metrics.annualReceipts <= p.AMOUNT_ANNUAL_RATIO
          ? p.PTS_ANNUAL_RATIO
          : 0,
      max: 5,
      value: result.metrics.annualReceipts > 0 ? amount / result.metrics.annualReceipts : null,
      rule: 'R23',
    },
  ];

  result.score = result.components.reduce((n, c) => n + c.points, 0);

  if (C <= 0 || result.score < p.SCORE_COUNTER) {
    result.state = result.issues.length ? 'provisional' : 'stop';
    result.recommendation = result.issues.length
      ? 'Уточнить данные перед оценкой'
      : 'Проверить недостаточность денежного потока';
    risk(
      C <= 0 ? 'NO_AVAILABLE_CASH' : 'SCORE_BELOW_MIN',
      C <= 0
        ? 'После указанных расходов доступный поток неположительный'
        : 'Балл ниже демонстрационного порога 50'
    );
    return result;
  }

  function candidate(n: number, rate: number, type: 'ORIGINAL' | 'COUNTER'): CandidateOffer {
    const payment = pmt(amount, rate, n)!;
    const coverage = C / (D + payment);
    const x: CandidateOffer = {
      amount: amount!,
      term: n,
      rate,
      payment,
      coverage,
      type,
      passes: coverage >= p.COVER_APPROVE,
    };
    result.candidates.push(x);
    return x;
  }

  if (result.score >= p.SCORE_OFFER) {
    const original = candidate(
      term,
      result.score >= p.SCORE_HIGH ? p.RATE_HIGH : p.RATE_STANDARD,
      'ORIGINAL'
    );
    if (original.passes) result.candidate = original;
  }

  if (!result.candidate) {
    for (let n = term + p.TERM_STEP; n <= product.maxTerm; n += p.TERM_STEP) {
      const x = candidate(n, p.RATE_COUNTER, 'COUNTER');
      if (x.passes) {
        result.candidate = x;
        break;
      }
    }
  }

  if (!result.candidate) {
    result.state = result.issues.length ? 'provisional' : 'stop';
    result.recommendation = result.issues.length
      ? 'Уточнить данные перед оценкой'
      : 'Проверить отсутствие подходящих условий';
    risk(
      'NO_FEASIBLE_TERMS',
      'В допустимых сроках и демонстрационных ставках не найдено покрытие не ниже 1,5'
    );
    return result;
  }

  result.state = result.issues.length ? 'provisional' : 'ready';
  result.recommendation =
    result.state === 'ready'
      ? 'Рассмотреть рассчитанные условия'
      : 'Проверить сведения перед предложением';
  return result;
}
