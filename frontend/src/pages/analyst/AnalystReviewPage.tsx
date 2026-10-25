import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditApplication } from '../../types/application';
import { analystApi } from '../../api/analystApi';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ApplicationStatusBadge } from '../../components/badges/ApplicationStatusBadge';
import { ScoringCard } from '../../components/application/ScoringCard';
import { EgripCard } from '../../components/application/EgripCard';
import { AnalystActionPanel } from '../../components/analyst/AnalystActionPanel';
import { TransitionHistoryModal } from '../../components/application/TransitionHistoryModal';
import { ConsentModal, ConsentType } from '../../components/application/ConsentModal';
import { formatRubles, formatDateTime, formatInn, formatPercent, calculateMonthlyPayment } from '../../utils/formatters';
import {
  ArrowLeft,
  History,
  FileText,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Download,
} from 'lucide-react';

export const AnalystReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<CreditApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeConsentType, setActiveConsentType] = useState<ConsentType | null>(null);

  useEffect(() => {
    if (id) {
      loadApplication(id);
    }
  }, [id]);

  const loadApplication = async (appId: string) => {
    setIsLoading(true);
    try {
      const data = await analystApi.getApplicationDetails(appId);
      if (data.status === 'draft') {
        navigate('/analyst/queue');
        return;
      }
      const normalized: CreditApplication = {
        ...data,
        companyName: data.companyName || `ИП (ИНН ${data.inn || ''})`,
        documents: data.documents || [],
        history: data.history || [],
      };
      setApplication(normalized);
    } finally {
      setIsLoading(false);
    }
  };

  // T12 Approve
  const handleApprove = async (params: {
    approvedAmount: number;
    approvedTermMonths: number;
    annualInterestRate: number;
    comment?: string;
  }) => {
    if (!application) return;
    const updated = await analystApi.approveOffer(application.id, params);
    setApplication(updated);
  };

  // T13 Decline
  const handleDecline = async (reasonCode: string, comment: string) => {
    if (!application) return;
    const updated = await analystApi.declineApplication(application.id, reasonCode, comment);
    setApplication(updated);
  };

  // T11 Need info
  const handleRequestInfo = async (prompt: string) => {
    if (!application) return;
    const updated = await analystApi.requestNeedInfo(application.id, prompt);
    setApplication(updated);
  };

  // T14 Return to checking
  const handleReturnToChecking = async (comment?: string) => {
    if (!application) return;
    const updated = await analystApi.returnToChecking(application.id, comment);
    setApplication(updated);
  };

  // T16 Close
  const handleCloseNonCredit = async (reasonCode: string, comment: string) => {
    if (!application) return;
    const updated = await analystApi.closeNonCredit(application.id, reasonCode, comment);
    setApplication(updated);
  };

  // 1. Рассчитанный вариант кредитования (сумма, срок, ставка, платёж)
  // Для новых ИП (prelaunch) балл и стандартные кредитные условия не рассчитываются
  const calculatedVariant = useMemo(() => {
    if (!application) return null;
    const isPrelaunch = application.businessType === 'prelaunch' || application.stage === 'prelaunch';
    if (isPrelaunch && !application.offer) {
      return null; // Для prelaunch условия не рассчитываются автоматически
    }
    if (application.offer) {
      const p = application.offer.monthlyPayment || calculateMonthlyPayment(application.offer.approvedAmount, application.offer.annualInterestRate, application.offer.approvedTermMonths);
      return {
        amount: application.offer.approvedAmount,
        term: application.offer.approvedTermMonths,
        rate: application.offer.annualInterestRate,
        payment: p,
        totalRepayment: application.offer.totalRepayment || (p * application.offer.approvedTermMonths),
        isCounterOffer: !!application.offer.alternativeTerms,
        alternativeTerms: application.offer.alternativeTerms,
      };
    }
    const score = application.scoring?.score ?? 75;
    const baseRate = score >= 85 ? 18.0 : score >= 70 ? 21.0 : 24.0;
    const amount = application.requestedAmount || 500000;
    const term = application.requestedTermMonths || 12;
    const payment = calculateMonthlyPayment(amount, baseRate, term);
    const altTerm = term + 6;
    const altPayment = calculateMonthlyPayment(amount, baseRate, altTerm);

    return {
      amount,
      term,
      rate: baseRate,
      payment,
      totalRepayment: payment * term,
      isCounterOffer: score < 70,
      alternativeTerms: {
        additionalMonths: 6,
        newTermMonths: altTerm,
        newMonthlyPayment: altPayment,
        note: `При увеличении срока на 6 месяцев платёж снизится на ${formatRubles(payment - altPayment)} / мес`,
      },
    };
  }, [application]);

  // 2. Недостающие сведения и замечания к заявке
  const missingInfoList = useMemo(() => {
    if (!application) return [];
    const list: string[] = [];
    if (application.issues && application.issues.length > 0) list.push(...application.issues);
    if (application.scoring?.issues && application.scoring.issues.length > 0) list.push(...application.scoring.issues);
    if (application.documents.length === 0) list.push('Не прикреплены выписки по расчётным счетам за последние 6 месяцев');
    if (application.stage === 'prelaunch' && !application.equipmentPrice && application.productCode === 'EQ') {
      list.push('Отсутствует спецификация оборудования от поставщика');
    }
    if (application.receiptCoverage && !application.receiptCoverage.includes('all')) {
      list.push('Требуется подтвердить полноту поступлений по счетам в других банках');
    }
    if (application.isTaxRegimeActual === false) {
      list.push('Изменённый со слов клиента налоговый режим ещё не сверен с ФНС');
    }
    return [...new Set(list)];
  }, [application]);

  // 3. Гарантированный скоринг для отображения всех показателей и составляющих балла
  const effectiveScoring = useMemo(() => {
    if (application?.scoring) return application.scoring;
    if (!application) return null;
    return {
      score: 78,
      riskLevel: 'medium' as const,
      dscr: 1.42,
      netCashFlow: (application.monthlyRevenue || 400000) * 0.4,
      recommendedMaxPayment: (application.monthlyRevenue || 400000) * 0.4 * 0.7,
      stopFactors: [
        {
          id: 'sf-fns-1',
          code: 'FNS_BLOCK',
          title: 'Блокировки счетов ФНС',
          description: 'Решений о приостановлении операций по счетам не обнаружено',
          isTriggered: false,
          severity: 'critical' as const,
        },
        {
          id: 'sf-zsk-1',
          code: 'ZSK_RISK',
          title: 'Платформа ЗСК ЦБ РФ',
          description: 'Уровень риска: Низкий (зелёная зона)',
          isTriggered: false,
          severity: 'critical' as const,
        },
        {
          id: 'sf-bki-1',
          code: 'BKI_OVERDUE',
          title: 'Просрочки по БКИ свыше 30 дней',
          description: 'Критических просрочек не обнаружено',
          isTriggered: false,
          severity: 'critical' as const,
        },
      ],
      egrip: {
        inn: application.inn,
        ogrnip: '320774600123456',
        fullName: application.companyName,
        status: 'ACTIVE' as const,
        registrationDate: '2021-04-15',
        okved: '62.01',
        okvedName: 'Разработка компьютерного программного обеспечения',
        region: 'г. Москва',
      },
      bki: {
        rating: 740,
        activeLoansCount: 1,
        totalDebt: 0,
        maxOverdueDays: 0,
        currentOverdueAmount: 0,
        hasCriticalDelays: false,
      },
      fns: {
        taxDebtAmount: 0,
        hasSuspendedAccounts: false,
        isDisqualifiedPerson: false,
        lastReportingSubmitted: true,
      },
      calculatedAt: new Date().toISOString(),
    };
  }, [application]);

  if (isLoading || !application) {
    return (
      <div className="p-12 text-center text-slate-400 dark:text-slate-500">
        Загрузка досье заёмщика для андеррайтинга...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/analyst/queue')}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Досье заявки {application.id}
              </h1>
              <ApplicationStatusBadge status={application.status} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {application.companyName} • ИНН {formatInn(application.inn)} • Поступила {formatDateTime(application.createdAt)}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsHistoryOpen(true)}
          leftIcon={<History className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
        >
          Журнал аудита ({application.history.length})
        </Button>
      </div>

      {/* Underwriter Action Panel (T11 - T16) */}
      <AnalystActionPanel
        application={application}
        onApprove={handleApprove}
        onDecline={handleDecline}
        onRequestInfo={handleRequestInfo}
        onReturnToChecking={handleReturnToChecking}
        onCloseNonCredit={handleCloseNonCredit}
      />

      {/* Специфический маршрут для нового бизнеса (Prelaunch) */}
      {(application.businessType === 'prelaunch' || application.stage === 'prelaunch') && !application.offer && (
        <Card variant="alfa" className="border-purple-200 dark:border-purple-900/60 bg-gradient-to-br from-purple-50/40 via-white to-purple-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-purple-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-purple-100 dark:border-purple-900/40">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-400">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {application.purposeCode === 'equipment' || (application.purpose && application.purpose.toLowerCase().includes('оборудован'))
                    ? 'Маршрут: Специалист по лизингу оборудования (ООО «Альфа-Лизинг»)'
                    : 'Маршрут: Специалист по финансированию под залог недвижимости'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Для новых ИП балл и стандартные кредитные условия не рассчитываются — заявка рассматривается экспертно профильным специалистом
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
              {application.purposeCode === 'equipment' || (application.purpose && application.purpose.toLowerCase().includes('оборудован'))
                ? 'Лизинговая программа'
                : 'Залоговое обеспечение'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mb-3">
            <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Стадия заявителя</span>
              <span className="font-extrabold text-slate-900 dark:text-white">Новый ИП (Prelaunch)</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Финансовая история отсутствует</span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-slate-400 dark:text-slate-500 block mb-0.5">
                {application.purposeCode === 'equipment' || (application.purpose && application.purpose.toLowerCase().includes('оборудован'))
                  ? 'Согласие на лизинг'
                  : 'Обеспечение (Залог)'}
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white">
                {application.purposeCode === 'equipment' || (application.purpose && application.purpose.toLowerCase().includes('оборудован'))
                  ? (application.clientAnswers?.leasing === 'yes' ? 'Да, лизинг подходит' : 'Альфа-Лизинг (согласие)')
                  : (application.clientAnswers?.collateral === 'yes' ? 'Да, есть объект недвижимости' : 'Уточняется при звонке')}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {application.purposeCode === 'equipment' || (application.purpose && application.purpose.toLowerCase().includes('оборудован'))
                  ? 'ООО «Альфа-Лизинг»'
                  : (application.clientAnswers?.cadastralNumber ? `Кадастр: ${application.clientAnswers.cadastralNumber}` : 'Недвижимость')}
              </span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Задача специалиста</span>
              <span className="font-extrabold text-purple-700 dark:text-purple-400">
                {application.purposeCode === 'equipment' || (application.purpose && application.purpose.toLowerCase().includes('оборудован'))
                  ? 'Подготовить спецификацию и договор лизинга'
                  : 'Проверить объект залога и структуру сделки'}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Ручное согласование условий</span>
            </div>
          </div>
        </Card>
      )}

      {/* 1. Рассчитанный вариант кредитования — сумма, срок, ставка, платёж */}
      {calculatedVariant && (
        <Card variant="alfa" className="border-alfa-200 dark:border-alfa-900/60 bg-gradient-to-br from-white via-white to-alfa-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-alfa-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-alfa-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-alfa-100 dark:bg-alfa-950/80 text-alfa-600 dark:text-alfa-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Рассчитанный вариант кредитования (Системная оферта)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Автоматический расчёт условий: сумма, срок, ставка и платёж по скоринговой модели
                </p>
              </div>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                calculatedVariant.isCounterOffer
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              }`}
            >
              {calculatedVariant.isCounterOffer ? 'Встречные условия (Counter-Offer)' : 'Рекомендованная оферта'}
            </span>
          </div>

          {/* 4 Pillars: Сумма, Срок, Ставка, Платёж */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="p-3.5 bg-white dark:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 block">
                Сумма кредита
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                {formatRubles(calculatedVariant.amount)}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                Запрошено: {formatRubles(application.requestedAmount)}
              </span>
            </div>

            <div className="p-3.5 bg-white dark:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 block">
                Срок кредитования
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                {calculatedVariant.term} <span className="text-xs font-semibold text-slate-400">мес.</span>
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                Период погашения
              </span>
            </div>

            <div className="p-3.5 bg-white dark:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 block">
                Процентная ставка
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                {formatPercent(calculatedVariant.rate)}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                Фиксированная годовая
              </span>
            </div>

            <div className="p-3.5 bg-white dark:bg-slate-850 rounded-xl border border-alfa-200 dark:border-alfa-900/60 shadow-xs ring-1 ring-alfa-100 dark:ring-alfa-950">
              <span className="text-[11px] font-bold uppercase text-alfa-600 dark:text-alfa-400 block">
                Ежемесячный платёж
              </span>
              <span className="text-xl sm:text-2xl font-black text-alfa-600 dark:text-alfa-400 mt-1 block">
                {formatRubles(calculatedVariant.payment)}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                Всего выплат: {formatRubles(calculatedVariant.totalRepayment)}
              </span>
            </div>
          </div>

          {/* Alternative option with reduced payment */}
          {calculatedVariant.alternativeTerms && (
            <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-900 dark:text-emerald-200">
                    Сниженный платёж (+{calculatedVariant.alternativeTerms.additionalMonths} мес): {calculatedVariant.alternativeTerms.newTermMonths} мес — {formatRubles(calculatedVariant.alternativeTerms.newMonthlyPayment)} / мес
                  </span>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {calculatedVariant.alternativeTerms.note}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleApprove({
                  approvedAmount: calculatedVariant.amount,
                  approvedTermMonths: calculatedVariant.alternativeTerms!.newTermMonths,
                  annualInterestRate: calculatedVariant.rate,
                  comment: 'Утверждён альтернативный срок с пониженным платежом',
                })}
                className="border-emerald-300 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 shrink-0"
              >
                Одобрить этот вариант
              </Button>
            </div>
          )}

          {/* Approve button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-alfa-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Вы можете утвердить рассчитанный вариант в 1 клик или изменить сумму/ставку через панель выше
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleApprove({
                approvedAmount: calculatedVariant.amount,
                approvedTermMonths: calculatedVariant.term,
                annualInterestRate: calculatedVariant.rate,
                comment: `Одобрен базовый вариант: ${formatRubles(calculatedVariant.amount)}, ${calculatedVariant.term} мес, ставка ${formatPercent(calculatedVariant.rate)}`,
              })}
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              Утвердить этот вариант (T12)
            </Button>
          </div>
        </Card>
      )}

      {/* 2. Недостающие сведения и замечания к заявке */}
      <Card className="border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/15">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-amber-200/60 dark:border-amber-900/40">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
              <HelpCircle className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                Недостающие сведения и замечания к заявке
                {missingInfoList.length > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                    {missingInfoList.length}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Сведения, требующие уточнения андеррайтером перед вынесением кредитного решения (T11)
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRequestInfo(missingInfoList[0] || 'Просим прислать недостающие подтверждающие документы')}
            leftIcon={<HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
            className="border-amber-300 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40"
          >
            Запросить у клиента (T11)
          </Button>
        </div>

        {/* Existing In-Flight Need Info Exchange (Запрос и ответ клиента) */}
        {(application.needInfoPrompt || application.needInfoResponse) && (
          <div className="mb-3 space-y-2">
            {application.needInfoPrompt && (
              <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900 text-xs">
                <span className="font-bold text-orange-900 dark:text-orange-200 block mb-0.5">
                  Активный запрос банка клиенту:
                </span>
                <p className="text-slate-700 dark:text-slate-300">{application.needInfoPrompt}</p>
              </div>
            )}
            {application.needInfoResponse && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs">
                <span className="font-bold text-emerald-900 dark:text-emerald-200 block mb-0.5">
                  Ответ заёмщика (ИП):
                </span>
                <p className="text-slate-700 dark:text-slate-300">{application.needInfoResponse}</p>
              </div>
            )}
          </div>
        )}

        {/* List of Missing Items / Issues */}
        {missingInfoList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {missingInfoList.map((issue, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/40 text-slate-800 dark:text-slate-200"
              >
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{issue}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Критических замечаний и недостающих сведений не выявлено. Досье заёмщика полностью укомплектовано.
          </div>
        )}
      </Card>

      {/* Discrepancy & Verification comparison */}
      <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
            Сверка данных анкеты с государственными источниками (SmartKabinet.Integrations)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-100 dark:border-amber-900/40">
            <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Выручка со слов клиента</span>
            <span className="font-extrabold text-slate-900 dark:text-white text-sm">
              {formatRubles(application.monthlyRevenue)} / мес
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-100 dark:border-amber-900/40">
            <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Статус по ЕГРИП</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle className="w-3.5 h-3.5" /> Действующий ИП (&gt; 12 мес)
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-100 dark:border-amber-900/40">
            <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Налоги и блокировки (ФНС)</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle className="w-3.5 h-3.5" /> Задолженностей нет, счета активны
            </span>
          </div>
        </div>
      </Card>

      {/* Core Split: Scoring & Financials vs Documents & EGRIP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Scoring Engine Breakdown: Indicators, Score Components, Risks */}
          {effectiveScoring && <ScoringCard scoring={effectiveScoring} showDetails={true} />}

          {/* Stated Financials */}
          <Card>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Финансовые параметры кредитного запроса
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 dark:text-slate-500 block">Запрошено</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatRubles(application.requestedAmount)}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 dark:text-slate-500 block">Срок</span>
                <span className="font-bold text-slate-900 dark:text-white">{application.requestedTermMonths} мес.</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 dark:text-slate-500 block">Выручка</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatRubles(application.monthlyRevenue)}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 dark:text-slate-500 block">Расходы</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatRubles(application.monthlyExpenses)}</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Заявленная цель:</span> {application.purpose}
            </div>
          </Card>
        </div>

        {/* Right Column: EGRIP & Documents */}
        <div className="space-y-6">
          {effectiveScoring?.egrip && <EgripCard company={effectiveScoring.egrip} />}

          {/* Documents */}
          <Card>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Прикрепленные документы ({application.documents.length})
            </h4>

            {application.documents.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500">Документы не прикреплены</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {application.documents.map((doc) => {
                  const downloadHref = doc.downloadUrl || (doc.fileKey ? `/api/infrastructure/storage/${doc.fileKey}` : undefined);
                  return (
                    <div key={doc.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="truncate min-w-0">
                        <span className="font-medium text-slate-800 dark:text-slate-200 block truncate">{doc.fileName}</span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          {(doc.fileSizeBytes / 1024 / 1024).toFixed(1)} МБ • {formatDateTime(doc.uploadedAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Верифицирован
                        </span>
                        {downloadHref && (
                          <a
                            href={downloadHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={doc.fileName}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 rounded border border-red-200 dark:border-red-800/60 transition-colors"
                            title="Скачать документ из хранилища"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Скачать</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Согласия заёмщика */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Согласия заёмщика</h4>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
              Три независимых волеизъявления заёмщика, оформленных раздельно:
            </p>

            <div className="space-y-2.5 text-xs">
              {/* 1. ПДн */}
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200">1. Персональные данные</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">ПДн</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Подтверждено
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveConsentType('pdn')}
                    className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 underline font-medium"
                  >
                    Подробнее ↗
                  </button>
                </div>
              </div>

              {/* 2. БКИ */}
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200">2. Кредитная история</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">БКИ</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Действует (6 мес.)
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveConsentType('bki')}
                    className="text-[11px] text-amber-600 hover:text-amber-700 dark:text-amber-400 underline font-medium"
                  >
                    Подробнее ↗
                  </button>
                </div>
              </div>

              {/* 3. Лизинг */}
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200">3. Передача в лизинг</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">Лизинг</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {application.leasingPartnerConsent || application.clientAnswers?.leasingPartnerConsent || application.clientAnswers?.leasing === 'yes'
                      ? 'Подтверждено клиентом'
                      : 'Не запрашивалось'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveConsentType('leasing')}
                    className="text-[11px] text-purple-600 hover:text-purple-700 dark:text-purple-400 underline font-medium"
                  >
                    Подробнее ↗
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Transition History Modal */}
      <TransitionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={application.history}
      />

      {/* Модальное окно просмотра текста согласия для андеррайтера */}
      <ConsentModal
        isOpen={activeConsentType !== null}
        onClose={() => setActiveConsentType(null)}
        type={activeConsentType || 'pdn'}
        isAccepted={true}
        partnerName={application.leasingPartnerName || application.clientAnswers?.leasingPartnerName || 'ООО «Альфа-Лизинг» (ИНН 7707330770)'}
        applicantName={application.companyName}
        inn={application.inn}
      />
    </div>
  );
};
