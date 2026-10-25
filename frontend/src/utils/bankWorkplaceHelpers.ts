import { ALFA_DATA } from '../data/alfaDemoData';
import { DEMO_COVERAGE, DEMO_RIGHTS } from '../data/demoCoverageRights';
import { CreditApplication } from '../types/application';
import { evaluate, ScoringInput } from './scoreEngine';

export function money(val: any): string {
  if (val === null || val === undefined || val === '') return '0 ₽';
  const num = Number(val);
  if (Number.isNaN(num)) return `${val} ₽`;
  return `${Math.round(num).toLocaleString('ru-RU')} ₽`;
}

export function ratio(val: any): string {
  if (val === null || val === undefined || !Number.isFinite(Number(val))) return 'Не рассчитано';
  return Number(val).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

export function dateLabel(isoString?: string): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function findSyntheticProfile(inn?: string) {
  if (!inn) return null;
  return ALFA_DATA.applications.find((r) => r.inn === inn) || null;
}

export function findSyntheticPassport(inn?: string) {
  if (!inn) return null;
  return ALFA_DATA.passports.find((p) => p.applicant_inn === inn) || null;
}

export function getFinancialFactsAndDebts(app: CreditApplication) {
  const profile = findSyntheticProfile(app.inn);
  const appId = profile?.application_id || app.id;

  const facts = ALFA_DATA.facts
    .filter((f) => f.application_id === appId)
    .sort((a, b) => a.month.localeCompare(b.month));

  const totalReceipts = facts.reduce((acc, f) => acc + Number(f.clean_receipts_rub || 0), 0);
  const totalOutflows = facts.reduce((acc, f) => acc + Number(f.operating_outflow_rub || 0), 0);
  const avgReceipts = facts.length ? Math.round(totalReceipts / facts.length) : null;
  const avgOutflows = facts.length ? Math.round(totalOutflows / facts.length) : null;

  const debtsRaw = ALFA_DATA.debts.filter((d) => d.application_id === appId);
  const debtGroups: Record<string, any[]> = {};
  for (const d of debtsRaw) {
    debtGroups[d.obligation_ref] = debtGroups[d.obligation_ref] || [];
    debtGroups[d.obligation_ref].push(d);
  }

  const debts = Object.entries(debtGroups).map(([ref, items]) => {
    const maxPay = Math.max(...items.map((x) => Number(x.monthly_max_payment_rub || 0)));
    const payments = items.map((x) => Number(x.monthly_max_payment_rub || 0));
    const discrepancy = new Set(payments).size > 1;
    return {
      ref,
      kind: items[0].kind || 'credit',
      payment: maxPay,
      discrepancy,
      items,
    };
  });

  return {
    facts,
    receipts: avgReceipts,
    outflows: avgOutflows,
    debts,
  };
}

export function getFindings(app: CreditApplication): string[] {
  const a = app.clientAnswers || {};
  const out: string[] = [];
  const profile = findSyntheticProfile(app.inn);

  if (a.profileCurrent === 'change') out.push('Изменены сведения ИП: проверить досье');
  if (a.passportCurrent === 'change') out.push('Введён новый паспорт: требуется проверка');
  if (profile?.registry_status && profile.registry_status !== 'ACTIVE') {
    out.push('Статус регистрации ИП требует отдельного рассмотрения');
  }
  if (profile?.applicant_match === 'нет') {
    out.push('В исходном наборе есть расхождение идентификации');
  }

  if (a.incomeContinues === 'Нет') out.push('Доход после запуска не сохранится');
  if ((a.repaymentSources || []).includes('forecast')) {
    out.push('Источник платежей основан только на прогнозе');
  }

  if (a.equipmentCostUnspecified) out.push('Стоимость оборудования пока не определена');
  if (a.ownFundsUnspecified) out.push('Первоначальный взнос не определён');
  if (a.ownFunds === '0') out.push('Нулевой взнос: проверить доступные программы');

  if (a.supplierChosen === 'Нет') out.push('Поставщик пока не выбран');
  if (a.supplierResult && a.supplierResult.status !== 'found') {
    out.push('Поставщик не проверен по справочнику');
  }
  if (a.supplierResult?.registryStatus && a.supplierResult.registryStatus !== 'ACTIVE') {
    out.push('Статус поставщика требует проверки');
  }
  if (a.supplierResult?.massAddress === 'да') out.push('Поставщик: отметка о массовом адресе');
  if (a.supplierResult?.related) out.push('ИНН поставщика совпадает с заявителем');

  if (a.taxCurrent === 'change') out.push('Налоговый режим изменён со слов клиента');
  if ((a.receiptCoverage || []).some((x: string) => x !== 'all')) {
    out.push('Поступления требуют уточнения полноты');
  }
  if (a.expensesComplete && a.expensesComplete !== 'yes') out.push('Расходы требуют уточнения');
  if (a.debtsComplete && a.debtsComplete !== 'yes') out.push('Нужно уточнить обязательства');

  const fin = getFinancialFactsAndDebts(app);
  if (fin.debts.some((x) => x.discrepancy)) {
    out.push('Есть расхождение источников по платежу одного договора');
  }

  return Array.from(new Set(out));
}

export function computeAnalysis(app: CreditApplication) {
  const profile = findSyntheticProfile(app.inn);
  const fin = getFinancialFactsAndDebts(app);
  const answers = app.clientAnswers || {};
  const v = app.scoringOverrides || {};
  const issues: string[] = [];

  const required = ['identity', 'finances'];
  if (app.purposeCode === 'equipment') required.push('supplier');
  if (answers.collateral === 'yes') required.push('property');

  for (const k of required) {
    if (app.checks?.[k] !== 'verified') {
      const labels: Record<string, string> = {
        identity: 'досье и личность',
        finances: 'финансы и источник платежей',
        supplier: 'поставщик и покупка',
        property: 'права на объект',
      };
      issues.push(`Не завершена ручная проверка: ${labels[k] || k}`);
    }
  }

  if (app.requests?.some((x) => x.status !== 'closed')) {
    issues.push('Есть незавершённые запросы клиенту');
  }

  const docs = app.documents || [];
  if (docs.some((x) => x.review !== 'verified' && x.review !== 'superseded')) {
    issues.push('Есть непроверенные документы или документы, требующие замены');
  }

  if (app.purposeCode === 'equipment') {
    const invoice = docs.some((x) => (x.group === 'equipmentDoc' || x.group === 'contract') && x.review === 'verified');
    if (!invoice) issues.push('Нет проверенного документа по текущей покупке');
    if (!v.ownFundsConfirmed || !v.note) {
      issues.push('Доступность средств для собственного взноса по новой покупке не подтверждена');
    }
  }

  const extraRows = (answers.extraDebts || []).map((x: any) => ({ ref: x.reference, payment: x.payment }));
  const debtRows = fin.debts.map((x) => ({ ref: x.ref, payment: x.payment }));

  const input: ScoringInput = {
    stage: app.businessType || 'operating',
    purpose: app.purposeCode || 'working_capital',
    asOf: ALFA_DATA.scoringConfig?.assessmentAsOf || '2026-10-23',
    amount: app.requestedAmount,
    term: app.requestedTermMonths,
    equipmentCost: answers.equipmentCost || null,
    ownFunds: answers.ownFunds || null,
    factsState: (profile as any)?.business_facts_state || 'AVAILABLE',
    facts: fin.facts.map((x) => ({ month: x.month, receipts: x.clean_receipts_rub, outflows: x.operating_outflow_rub })),
    householdExpenses: answers.personalExpenses || 50000,
    extraExpenses: v.extraExpensesConfirmed && v.extraExpenses ? Number(v.extraExpenses) : 0,
    debts: [...debtRows, ...extraRows],
    debtsComplete: answers.debtsComplete === 'yes' || Boolean(v.debtReconciled && v.note),
    debtReconciled: Boolean(v.debtReconciled && v.note),
    resolvedDebtPayment: v.debtReconciled && v.note && v.debtPayment ? Number(v.debtPayment) : null,
    activityFirstMonth: (profile as any)?.activity_first_full_month || null,
    registrationMonth: profile?.registration_date?.slice(0, 7) || '2021-09',
    sourceStatus: (profile as any)?.check_status || 'SUCCESS',
    creditHistory: (profile as any)?.person_history || 'FOUND',
    overdueDays: (profile as any)?.max_overdue_days_12m ? Number((profile as any).max_overdue_days_12m) : 0,
    currentOverdue: (profile as any)?.current_overdue_rub ? Number((profile as any).current_overdue_rub) : 0,
    issues,
  };

  const rawConfig = ALFA_DATA.scoringConfig;
  const result = evaluate(input, rawConfig);

  // Compute a simple input fingerprint
  const rawStr = JSON.stringify({ input, config: rawConfig });
  let hash = 2166136261;
  for (let i = 0; i < rawStr.length; i++) {
    hash ^= rawStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const fingerprint = (hash >>> 0).toString(16).padStart(8, '0');

  return { input, fingerprint, result };
}

export function savedAnalysisCurrent(app: CreditApplication): boolean {
  if (!app.analysis || !app.analysis.inputFingerprint) return false;
  const { fingerprint } = computeAnalysis(app);
  return app.analysis.inputFingerprint === fingerprint;
}

export function requiredChecks(app: CreditApplication): string[] {
  const ans = app.clientAnswers || {};
  const isConsult = ans.business === 'paused' || (ans.business === 'new' && ans.purpose !== 'equipment');
  const list = ['identity', 'finances'];
  if (app.purposeCode === 'equipment' && !isConsult) list.push('supplier');
  if (ans.collateral === 'yes') list.push('property');
  return list;
}

export const STATUS: Record<string, string> = {
  draft: 'Черновик',
  submitted: 'Отправлена',
  in_review: 'На проверке',
  waiting_check: 'Проверка приостановлена',
  awaiting_info: 'Ожидаем сведения от клиента',
  referral: 'Индивидуальная консультация',
  approved: 'Одобрено (условия подготовлены)',
  declined: 'Отказано',
  withdrawn: 'Отозвана клиентом',
  closed: 'Завершена',
  checking: 'На проверке',
  review: 'На проверке',
  need_info: 'Ожидаем сведения от клиента',
  offer: 'Одобрено (условия подготовлены)',
  accepted: 'Условия приняты',
};

export function getStatusBadge(status: string): { label: string; colorClass: string } {
  const norm = status?.toLowerCase() || '';
  if (['approved', 'offer', 'accepted', 'signed_sim', 'disbursed_sim'].includes(norm)) {
    return { label: STATUS[norm] || 'Одобрено', colorClass: 'green' };
  }
  if (norm === 'declined') {
    return { label: STATUS[norm] || 'Отказано', colorClass: 'red' };
  }
  if (['awaiting_info', 'need_info', 'waiting_check'].includes(norm)) {
    return { label: STATUS[norm] || 'Ожидаем сведения от клиента', colorClass: 'amber' };
  }
  return { label: STATUS[norm] || norm, colorClass: '' };
}

export function allDocuments(a: CreditApplication): any[] {
  const map = new Map<string, any>();
  if (a.documents && Array.isArray(a.documents)) {
    for (const d of a.documents) {
      map.set(d.id, d);
    }
  }
  if (a.files && typeof a.files === 'object') {
    for (const [group, list] of Object.entries(a.files)) {
      if (Array.isArray(list)) {
        for (const f of list) {
          map.set(f.id, { ...f, group: f.group || group });
        }
      }
    }
  }
  return Array.from(map.values());
}

export const STATUS_LABELS: Record<string, string> = STATUS;

export const FINAL_STATUSES = ['approved', 'offer', 'declined', 'withdrawn', 'closed', 'accepted'];

export function decisionError(
  app: CreditApplication,
  next: string,
  reason: string,
  offer: { amount?: any; term?: any; rate?: any; payment?: any },
  confirmed: boolean
): string {
  if (FINAL_STATUSES.includes(app.status)) return 'Рассмотрение уже завершено';
  if (!['in_review', 'waiting_check', 'referral', 'approved', 'declined', 'offer'].includes(next)) {
    return 'Недопустимый статус';
  }
  if (!reason.trim()) return 'Укажите понятный комментарий клиенту';
  if (['approved', 'offer', 'declined'].includes(next) && (app.requests || []).some((r) => r.status !== 'closed')) {
    return 'Сначала завершите открытые запросы клиенту';
  }
  if (next === 'approved' || next === 'offer') {
    const isNew = app.businessType === 'prelaunch' || app.clientAnswers?.business === 'new';
    const isPaused = app.clientAnswers?.business === 'paused';
    if (isNew || isPaused) {
      return 'Для начинающего или приостановленного бизнеса используйте консультацию: условия партнёра не подключены';
    }
    const needed = requiredChecks(app);
    if (needed.some((k) => app.checks?.[k] !== 'verified')) {
      return 'Завершите ручные проверки';
    }
    const docs = app.documents || [];
    if (docs.some((f) => f.review && !['verified', 'superseded'].includes(f.review))) {
      return 'Проверьте приложенные документы или запросите замену';
    }
    if (
      app.purposeCode === 'equipment' &&
      !docs.some(
        (f) =>
          (f.group === 'equipmentDoc' || (f as any).replacementForGroup === 'equipmentDoc' || (f as any).evidenceGroup === 'equipmentDoc') &&
          f.review === 'verified'
      )
    ) {
      return 'Для условий по оборудованию нужен проверенный документ покупки';
    }
    const analysis = computeAnalysis(app);
    if (!savedAnalysisCurrent(app)) {
      return 'Сохраните актуальный расчёт во вкладке «Аналитика»';
    }
    if (analysis.result.state !== 'ready' || !analysis.result.candidate) {
      return 'Сначала устраните вопросы аналитики и пересчитайте условия';
    }
    if (!confirmed) {
      return 'Подтвердите ручную проверку';
    }
    if (
      !offer ||
      ![offer.amount, offer.term, offer.rate, offer.payment].every(
        (x) => x !== undefined && x !== null && /^\d+(\.\d{1,2})?$/.test(String(x))
      )
    ) {
      return 'Заполните параметры предложения';
    }
    if (
      Number(offer.amount) <= 0 ||
      Number(offer.term) <= 0 ||
      !Number.isInteger(Number(offer.term)) ||
      Number(offer.payment) <= 0
    ) {
      return 'Проверьте сумму, срок и платёж';
    }
    const candidate = analysis.result.candidate;
    if (
      Number(offer.amount) !== candidate.amount ||
      Number(offer.term) !== candidate.term ||
      Math.round(Number(offer.rate) * 100) !== Math.round(candidate.rate * 10000) ||
      Math.round(Number(offer.payment) * 100) !== Math.round(candidate.payment * 100)
    ) {
      return 'Условия отличаются от актуального расчёта. Подставьте рассчитанный вариант из аналитики';
    }
  }
  return '';
}

export function exportApplicationJson(app: CreditApplication): void {
  const safe = structuredClone(app);
  if (safe.clientAnswers) {
    for (const key of Object.keys(safe.clientAnswers)) {
      if (key.startsWith('passport') && key !== 'passportCurrent') {
        delete safe.clientAnswers[key];
      }
    }
  }
  (safe as any).passportExport = 'Ручные паспортные реквизиты исключены';
  (safe as any).bankInputNotice = 'Банковские факты должны поступать на сервере из доверенных источников; клиентский JSON не является основанием решения';

  const blob = new Blob([JSON.stringify(safe, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${app.id}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
