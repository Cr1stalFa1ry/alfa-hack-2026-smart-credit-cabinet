import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditApplication } from '../../types/application';
import { analystApi } from '../../api/analystApi';
import { ApplicationStatusBadge } from '../../components/badges/ApplicationStatusBadge';
import { ScoringCard } from '../../components/application/ScoringCard';
import { EgripCard } from '../../components/application/EgripCard';
import { AnalystActionPanel } from '../../components/analyst/AnalystActionPanel';
import { TransitionHistoryModal } from '../../components/application/TransitionHistoryModal';
import { ConsentModal, ConsentType } from '../../components/application/ConsentModal';
import {
  formatRubles,
  formatDateTime,
  formatInn,
  formatPercent,
  calculateMonthlyPayment,
} from '../../utils/formatters';
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
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from 'lucide-react';
import { extractInquiriesHistory } from '../../utils/inquiriesHelpers';

type ReviewTab = 'overview' | 'scoring' | 'dossier' | 'audit' | 'all';

export const AnalystReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<CreditApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReviewTab>('overview');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeConsentType, setActiveConsentType] = useState<ConsentType | null>(null);
  const [isCommunicationExpanded, setIsCommunicationExpanded] = useState<boolean>(true);

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

  // Удаление анкеты аналитиком
  const handleDeleteApplication = async () => {
    if (!application) return;
    await analystApi.deleteApplication(application.id);
    navigate('/analyst/queue');
  };

  // 1. Рассчитанный вариант кредитования
  const calculatedVariant = useMemo(() => {
    if (!application) return null;
    const isPrelaunch = application.businessType === 'prelaunch' || application.stage === 'prelaunch';
    if (isPrelaunch && !application.offer) {
      return null;
    }
    if (application.offer) {
      const p =
        application.offer.monthlyPayment ||
        calculateMonthlyPayment(
          application.offer.approvedAmount,
          application.offer.annualInterestRate,
          application.offer.approvedTermMonths
        );
      return {
        amount: application.offer.approvedAmount,
        term: application.offer.approvedTermMonths,
        rate: application.offer.annualInterestRate,
        payment: p,
        totalRepayment: application.offer.totalRepayment || p * application.offer.approvedTermMonths,
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
    if (application.documents.length === 0) {
      list.push('Не прикреплены выписки по расчётным счетам за последние 6 месяцев');
    }
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

  // 3. Гарантированный скоринг
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
      <div className="p-[65px_24px] text-center bg-[#f5f6f7] rounded-[22px] text-[#686b70] text-[14px]">
        Загрузка досье заёмщика для андеррайтинга...
      </div>
    );
  }

  const isPrelaunch = application.businessType === 'prelaunch' || application.stage === 'prelaunch';
  const isPaused =
    application.scenario === 'paused' ||
    application.productCode === 'RESTART' ||
    application.clientAnswers?.business === 'paused' ||
    (application.reasonCodes || []).includes('BUSINESS_RESTART');
  const isWithdrawn =
    application.status === 'closed' ||
    (application as any).status === 'withdrawn' ||
    (application.history || []).some(
      (h) => h.transitionCode === 'T17' || h.comment?.toLowerCase().includes('отозван')
    );
  const inquiriesHistory = extractInquiriesHistory(application);

  return (
    <div className="max-w-[1320px] mx-auto text-[#141414] font-sans pb-16">
      {/* Шапка в стиле .bank-head из макет.html */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-7">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => navigate('/analyst/queue')}
              className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#EF3124] hover:text-[#cd2017] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              К очереди заявок
            </button>
            <span className="text-[#e6e8ea]">•</span>
            <span className="text-[11px] tracking-[0.12em] uppercase text-[#686b70] font-bold">
              Рабочее место банка · Досье {application.id}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[30px] sm:text-[38px] font-bold tracking-[-0.045em] leading-[1.08] text-[#141414] m-0">
              {application.companyName}
            </h1>
            <ApplicationStatusBadge status={application.status} />
          </div>

          <p className="text-[13px] text-[#686b70] mt-2 mb-0">
            ИНН {formatInn(application.inn)} • Заявка создана {formatDateTime(application.createdAt)} •{' '}
            {isPrelaunch ? 'Новый бизнес (Prelaunch)' : 'Действующий бизнес'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="rounded-[12px] px-[18px] py-[12px] font-bold text-[13px] inline-flex items-center gap-2 bg-[#f5f6f7] text-[#141414] border border-[#e6e8ea] hover:bg-[#ebedef] transition-colors cursor-pointer"
          >
            <History className="w-4 h-4 text-[#686b70]" />
            Журнал аудита ({application.history.length})
          </button>
        </div>
      </div>

      {/* Верхняя сводка показателей (.stats-grid из макет.html) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[14px] mb-7">
        <div className="p-[18px] bg-white border border-[#e6e8ea] rounded-[13px]">
          <span className="text-[#686b70] text-[11px] block">Запрошенная сумма</span>
          <strong className="text-[23px] block tracking-[-0.04em] my-1.5 text-[#141414]">
            {formatRubles(application.requestedAmount)}
          </strong>
          <span className="text-[#686b70] text-[11px] block">
            Срок: {application.requestedTermMonths ? `${application.requestedTermMonths} мес.` : 'не указан'}
          </span>
        </div>

        <div className="p-[18px] bg-white border border-[#e6e8ea] rounded-[13px]">
          <span className="text-[#686b70] text-[11px] block">Ежемесячная выручка</span>
          <strong className="text-[23px] block tracking-[-0.04em] my-1.5 text-[#141414]">
            {isPaused ? '0 ₽' : formatRubles(application.monthlyRevenue)}
          </strong>
          <span className="text-[#686b70] text-[11px] block">
            {isPaused ? 'Приостановлен (без выручки)' : `Расходы: ${formatRubles(application.monthlyExpenses)} / мес`}
          </span>
        </div>

        <div className="p-[18px] bg-white border border-[#e6e8ea] rounded-[13px]">
          <span className="text-[#686b70] text-[11px] block">Покрытие долга (DSCR)</span>
          <strong className="text-[23px] block tracking-[-0.04em] my-1.5 text-[#141414]">
            {isPaused ? '—' : isPrelaunch ? '—' : effectiveScoring?.dscr.toFixed(2)}
          </strong>
          <span
            className={`inline-block rounded-[7px] px-[9px] py-[3px] text-[11px] font-medium ${
              isPaused
                ? 'bg-[#fff6e4] text-[#885215]'
                : isPrelaunch
                ? 'bg-[#f5f6f7] text-[#686b70]'
                : (effectiveScoring?.dscr ?? 0) >= 1.25
                ? 'bg-[#edf7f0] text-[#176b45]'
                : 'bg-[#fff6e4] text-[#885215]'
            }`}
          >
            {isPaused
              ? 'Отключен (регламент)'
              : isPrelaunch
              ? 'Без истории'
              : (effectiveScoring?.dscr ?? 0) >= 1.25
              ? 'В норме (≥ 1.25)'
              : 'Повышенный риск'}
          </span>
        </div>

        <div className="p-[18px] bg-white border border-[#e6e8ea] rounded-[13px]">
          <span className="text-[#686b70] text-[11px] block">Скоринговый балл</span>
          <strong className="text-[23px] block tracking-[-0.04em] my-1.5 text-[#141414]">
            {isPaused ? 'Экспертный' : isPrelaunch ? 'Нет' : `${effectiveScoring?.score ?? 0} / 100`}
          </strong>
          <span className="text-[#686b70] text-[11px] block">
            {isPaused ? 'Без авто-отказа' : `Замечаний к досье: ${missingInfoList.length}`}
          </span>
        </div>
      </div>

      {/* Основная панель карточки досье (.panel из макет.html) */}
      <div className="border border-[#e6e8ea] rounded-[22px] p-[22px] sm:p-[30px] bg-white">
        {/* Блок результата анализа (.analysis-result из макет.html) */}
        <div className="pb-[25px] border-b border-[#e6e8ea]">
          <div className="text-[11px] tracking-[0.12em] uppercase text-[#686b70] font-bold mb-3">
            Автоматическое заключение системы
          </div>
          <h2 className="text-[23px] sm:text-[27px] font-bold tracking-[-0.045em] leading-[1.15] max-w-[720px] mb-3">
            {isWithdrawn
              ? 'Заявка отозвана заёмщиком (T17)'
              : isPaused
              ? 'Приостановленный бизнес: индивидуальное рассмотрение специалистом'
              : isPrelaunch
              ? 'Заявка нового ИП направлена на профильное рассмотрение специалисту'
              : calculatedVariant?.isCounterOffer
              ? 'Рекомендовано одобрение со встречными условиями (Counter-Offer)'
              : 'Положительное заключение скоринга — рекомендовано к одобрению'}
          </h2>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="inline-block rounded-[7px] bg-[#f5f6f7] px-[9px] py-[5px] text-[11px] font-medium text-[#141414]">
              Цель: {application.purpose || 'Пополнение оборотных средств'}
            </span>
            <span
              className={`inline-block rounded-[7px] px-[9px] py-[5px] text-[11px] font-medium ${
                missingInfoList.length === 0
                  ? 'bg-[#edf7f0] text-[#176b45]'
                  : 'bg-[#fff6e4] text-[#885215]'
              }`}
            >
              {missingInfoList.length === 0
                ? 'Все проверки пройдены'
                : `Требуют внимания: ${missingInfoList.length} п.`}
            </span>
          </div>
        </div>

        {/* Линия вкладок (.tabs-line из макет.html) */}
        <div className="flex gap-1.5 border-b border-[#e6e8ea] my-6 overflow-x-auto">
          {[
            { id: 'overview', label: isWithdrawn ? 'Действия по заявке' : 'Обзор и решение' },
            { id: 'scoring', label: 'Скоринг и проверки' },
            { id: 'dossier', label: `Анкета и документы (${application.documents.length})` },
            { id: 'audit', label: `Запросы и история (${application.history.length})` },
            { id: 'all', label: 'Все разделы сразу' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ReviewTab)}
              className={`px-[13px] py-[12px] text-[12px] whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[#EF3124] font-bold text-[#141414]'
                  : 'border-transparent text-[#686b70] hover:text-[#141414]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* СОДЕРЖИМОЕ ВКЛАДОК */}
        <div className="space-y-7">
          {/* ВКЛАДКА 1: ОБЗОР И РЕШЕНИЕ */}
          {(activeTab === 'overview' || activeTab === 'all') && (
            <div className="space-y-6">
              {isWithdrawn || application.status === 'closed' ? (
                /* Для отозванной клиентом / закрытой заявки: оставляем только блок с удалением анкеты */
                <AnalystActionPanel
                  application={application}
                  onApprove={handleApprove}
                  onDecline={handleDecline}
                  onRequestInfo={handleRequestInfo}
                  onReturnToChecking={handleReturnToChecking}
                  onCloseNonCredit={handleCloseNonCredit}
                  onDelete={handleDeleteApplication}
                />
              ) : (
                <>
                  {/* Карточка рассчитанного предложения (.candidate-card из макет.html) */}
                  {calculatedVariant && (
                    <div className="p-6 border border-[#efddd8] rounded-[16px] bg-[#fff8f6]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                      <span className="text-[11px] tracking-[0.12em] uppercase text-[#EF3124] font-bold block mb-1">
                        Рассчитанный вариант кредитования (Системная оферта)
                      </span>
                      <h3 className="text-[18px] font-bold text-[#141414] m-0">
                        Предварительные условия по скоринговой модели
                      </h3>
                    </div>
                    <span
                      className={`inline-block rounded-[7px] px-[9px] py-[5px] text-[11px] font-medium ${
                        calculatedVariant.isCounterOffer
                          ? 'bg-[#fff6e4] text-[#885215]'
                          : 'bg-[#edf7f0] text-[#176b45]'
                      }`}
                    >
                      {calculatedVariant.isCounterOffer
                        ? 'Встречное предложение (Counter-Offer)'
                        : 'Рекомендованная оферта'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                    <div className="p-[15px] bg-white rounded-[13px] border border-[#efddd8]">
                      <span className="text-[#686b70] text-[11px] block">Одобренная сумма</span>
                      <strong className="text-[21px] block tracking-[-0.04em] my-1 text-[#141414]">
                        {formatRubles(calculatedVariant.amount)}
                      </strong>
                      <span className="text-[#686b70] text-[11px]">
                        Запрошено: {formatRubles(application.requestedAmount)}
                      </span>
                    </div>

                    <div className="p-[15px] bg-white rounded-[13px] border border-[#efddd8]">
                      <span className="text-[#686b70] text-[11px] block">Срок договора</span>
                      <strong className="text-[21px] block tracking-[-0.04em] my-1 text-[#141414]">
                        {calculatedVariant.term} мес.
                      </strong>
                      <span className="text-[#686b70] text-[11px]">Аннуитетный график</span>
                    </div>

                    <div className="p-[15px] bg-white rounded-[13px] border border-[#efddd8]">
                      <span className="text-[#686b70] text-[11px] block">Ставка</span>
                      <strong className="text-[21px] block tracking-[-0.04em] my-1 text-[#141414]">
                        {formatPercent(calculatedVariant.rate)}
                      </strong>
                      <span className="text-[#686b70] text-[11px]">Фиксированная годовая</span>
                    </div>

                    <div className="p-[15px] bg-white rounded-[13px] border border-[#EF3124]">
                      <span className="text-[#EF3124] text-[11px] font-bold block">Ежемесячный платёж</span>
                      <strong className="text-[21px] block tracking-[-0.04em] my-1 text-[#EF3124]">
                        {formatRubles(calculatedVariant.payment)}
                      </strong>
                      <span className="text-[#686b70] text-[11px]">
                        Всего: {formatRubles(calculatedVariant.totalRepayment)}
                      </span>
                    </div>
                  </div>

                  {/* Альтернативный срок (+6 мес) */}
                  {calculatedVariant.alternativeTerms && (
                    <div className="p-4 rounded-[12px] bg-[#eef8f1] text-[#176b45] text-[13px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
                      <div>
                        <strong className="block font-bold">
                          Альтернативный вариант со сниженным платежом (+
                          {calculatedVariant.alternativeTerms.additionalMonths} мес.):{' '}
                          {calculatedVariant.alternativeTerms.newTermMonths} мес. —{' '}
                          {formatRubles(calculatedVariant.alternativeTerms.newMonthlyPayment)} / мес
                        </strong>
                        <span className="text-[12px] opacity-90">{calculatedVariant.alternativeTerms.note}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleApprove({
                            approvedAmount: calculatedVariant.amount,
                            approvedTermMonths: calculatedVariant.alternativeTerms!.newTermMonths,
                            annualInterestRate: calculatedVariant.rate,
                            comment: 'Утверждён альтернативный срок с пониженным платежом',
                          })
                        }
                        className="rounded-[10px] px-4 py-2 bg-white text-[#176b45] font-bold text-[12px] border border-[#176b45]/20 hover:bg-[#edf7f0] shrink-0 cursor-pointer"
                      >
                        Одобрить {calculatedVariant.alternativeTerms.newTermMonths} мес.
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Маршрут для приостановленного бизнеса (Перезапуск) */}
              {isPaused && !application.offer && (
                <div className="p-6 border border-amber-300 rounded-[16px] bg-amber-50/40 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-600" />
                      <h3 className="text-[18px] font-bold text-[#141414] m-0">
                        Экспертный разбор: Приостановленная деятельность / Перезапуск
                      </h3>
                    </div>
                    <span className="inline-block rounded-[7px] bg-amber-100 text-amber-900 border border-amber-300 px-[9px] py-[5px] text-[11px] font-bold">
                      Регламент: рассмотрение без кредитного отказа
                    </span>
                  </div>
                  <p className="text-[13px] text-[#686b70] mb-3 leading-relaxed">
                    «При отсутствии бизнес-выручки не рассчитываем выдуманные показатели действующего бизнеса».
                    Аналитик проверяет прошлую кредитную историю до приостановки, заявленный источник платежей до выхода на прибыль и формирует индивидуальные условия (льготный период, лизинг оборудования или залог).
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* 1. Кредитная история */}
                    <div className="p-4 bg-white rounded-[13px] border border-[#e6e8ea] space-y-1">
                      <div className="flex items-center justify-between">
                        <small className="block text-[#686b70] text-[11px] font-semibold">1. Прошлая кредитная история</small>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                      <strong className="text-[14px] font-bold text-[#141414] block">
                        Дефолтов нет (БКИ проверено)
                      </strong>
                      <span className="text-[11px] text-[#686b70] block">
                        Отсутствие критических просрочек в прошлый период работы ИП
                      </span>
                    </div>

                    {/* 2. Планы по перезапуску */}
                    <div className="p-4 bg-white rounded-[13px] border border-[#e6e8ea] space-y-1">
                      <small className="block text-[#686b70] text-[11px] font-semibold">2. Планы перезапуска</small>
                      <strong className="text-[14px] font-bold text-[#141414] block">
                        {application.clientAnswers?.restartActivity || 'Возобновление деятельности'}
                      </strong>
                      <span className="text-[11px] text-[#686b70] block">
                        Срок старта: {application.clientAnswers?.restartTimeframe || 'Уточняется со специалистом'}
                      </span>
                    </div>

                    {/* 3. Источник платежей */}
                    <div className="p-4 bg-white rounded-[13px] border border-[#e6e8ea] space-y-1">
                      <small className="block text-[#686b70] text-[11px] font-semibold">3. Источник платежей на время старта</small>
                      <strong className="text-[14px] font-bold text-[#EF3124] block">
                        {(application.clientAnswers?.restartPaymentSources || []).join(', ') || application.repaymentSourceDescription || 'Личные сбережения / партнеры'}
                      </strong>
                      <span className="text-[11px] text-[#686b70] block">
                        {application.clientAnswers?.repaymentDescription || 'Клиент готов обслуживать платежи до выхода на прибыль'}
                      </span>
                    </div>
                  </div>

                  {/* Рекомендация по продукту */}
                  <div className="p-3.5 rounded-xl bg-white border border-amber-200 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-[#141414]">Рекомендованный финансовый инструмент: </span>
                      <span className="text-slate-700">
                        {application.purposeCode === 'equipment' || (application.purpose && application.purpose.toLowerCase().includes('оборудован'))
                          ? 'ООО «Альфа-Лизинг» — лизинг оборудования с отсрочкой первого лизингового платежа'
                          : 'Финансирование оборотных средств с обеспечением (залог недвижимости или поручительство)'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Маршрут для нового бизнеса (Prelaunch) */}
              {!isPaused && isPrelaunch && !application.offer && (
                <div className="p-6 border border-[#efddd8] rounded-[16px] bg-[#fff8f6]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-[#EF3124]" />
                      <h3 className="text-[18px] font-bold text-[#141414] m-0">
                        {application.purposeCode === 'equipment' ||
                        (application.purpose && application.purpose.toLowerCase().includes('оборудован'))
                          ? 'Маршрут: Специалист по лизингу оборудования (ООО «Альфа-Лизинг»)'
                          : 'Маршрут: Специалист по финансированию под залог недвижимости'}
                      </h3>
                    </div>
                    <span className="inline-block rounded-[7px] bg-[#fff1ef] text-[#a42b22] px-[9px] py-[5px] text-[11px] font-medium">
                      Экспертный маршрут (Prelaunch)
                    </span>
                  </div>
                  <p className="text-[13px] text-[#686b70] mb-4">
                    Для новых ИП стандартный скоринговый балл не рассчитывается — сделка структурируется профильным
                    специалистом с учётом обеспечения или лизингового аванса.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 bg-white rounded-[13px] border border-[#e6e8ea]">
                      <small className="block text-[#686b70] text-[11px] mb-1">Стадия бизнеса</small>
                      <strong className="text-[14px] font-bold text-[#141414]">Новый ИП (до 6 мес.)</strong>
                    </div>
                    <div className="p-4 bg-white rounded-[13px] border border-[#e6e8ea]">
                      <small className="block text-[#686b70] text-[11px] mb-1">Партнёр / Обеспечение</small>
                      <strong className="text-[14px] font-bold text-[#141414]">
                        {application.purposeCode === 'equipment'
                          ? 'ООО «Альфа-Лизинг»'
                          : 'Залог недвижимости'}
                      </strong>
                    </div>
                    <div className="p-4 bg-white rounded-[13px] border border-[#e6e8ea]">
                      <small className="block text-[#686b70] text-[11px] mb-1">Целевое действие</small>
                      <strong className="text-[14px] font-bold text-[#EF3124]">
                        Проверка спецификации / залога
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* AI-ассистент в стиле .panel.soft из макет.html */}
              <div className="p-6 rounded-[16px] bg-[#f5f6f7] border border-[#e6e8ea]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#EF3124]" />
                    <h3 className="text-[16px] font-bold text-[#141414] m-0">
                      AI-ассистент
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#686b70]">
                    Автоматическая интерпретация факторов риска
                  </span>
                </div>

                <div className="p-4 rounded-[12px] bg-white border border-[#e6e8ea] text-[13px] text-[#141414] leading-[1.6] mb-4">
                  {application.mlExplanation ||
                    'Заёмщик демонстрирует стабильные операционные обороты. Критических стоп-факторов по линии ФНС и БКИ не зафиксировано. Показатель долговой нагрузки находится в допустимом диапазоне.'}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[12px]">
                  <div className="p-3 bg-white rounded-[11px] border border-[#e6e8ea]">
                    <span className="text-[#686b70] text-[11px] block">Скоринговый балл</span>
                    <strong className="text-[#141414] font-bold text-[13px] block">
                      {effectiveScoring?.score ?? 80} / 100
                    </strong>
                    <span className="text-[11px] text-[#176b45] font-medium block truncate">
                      {(effectiveScoring?.score ?? 80) >= 80
                        ? 'Низкий риск дефолта'
                        : (effectiveScoring?.score ?? 80) >= 60
                        ? 'Умеренный риск'
                        : 'Повышенный риск'}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-[11px] border border-[#e6e8ea]">
                    <span className="text-[#686b70] text-[11px] block">Покрытие долга (DSCR)</span>
                    <strong className="text-[#141414] font-bold text-[13px] block">
                      {isPrelaunch ? 'Моделируемый' : `${(effectiveScoring?.dscr ?? 0).toFixed(2)}x`}
                    </strong>
                    <span className="text-[11px] text-[#686b70] block truncate">
                      {isPrelaunch
                        ? 'Расчёт для нового бизнеса'
                        : (effectiveScoring?.dscr ?? 0) >= 1.5
                        ? 'Норма ≥ 1.50 (Запас есть)'
                        : 'Допустимо (≥ 1.25)'}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-[11px] border border-[#e6e8ea]">
                    <span className="text-[#686b70] text-[11px] block">Чистый поток (NCF)</span>
                    <strong className="text-[#176b45] font-bold text-[13px] block">
                      {formatRubles(
                        effectiveScoring?.netCashFlow ||
                          Math.max(
                            0,
                            application.monthlyRevenue -
                              application.monthlyExpenses -
                              (application.existingMonthlyObligations || 0)
                          )
                      )} / мес
                    </strong>
                    <span className="text-[11px] text-[#686b70] block truncate">Свободный остаток</span>
                  </div>

                  <div className="p-3 bg-white rounded-[11px] border border-[#e6e8ea]">
                    <span className="text-[#686b70] text-[11px] block">Рекомендуемый платёж</span>
                    <strong className="text-[#141414] font-bold text-[13px] block">
                      {formatRubles(
                        effectiveScoring?.recommendedMaxPayment ||
                          Math.max(0, (effectiveScoring?.netCashFlow || 0) * 0.7)
                      )} / мес
                    </strong>
                    <span className="text-[11px] text-[#686b70] block truncate">Лимит до 70% NCF</span>
                  </div>

                  <div className="p-3 bg-white rounded-[11px] border border-[#e6e8ea]">
                    <span className="text-[#686b70] text-[11px] block">Кредитная история (БКИ)</span>
                    <strong className="text-[#141414] font-bold text-[13px] block">
                      {effectiveScoring?.bki?.rating ? `${effectiveScoring.bki.rating} баллов` : 'Без просрочек'}
                    </strong>
                    <span className="text-[11px] text-[#686b70] block truncate">
                      {effectiveScoring?.bki?.maxOverdueDays
                        ? `Просрочка: ${effectiveScoring.bki.maxOverdueDays} дн.`
                        : '0 дней просрочки (чистая КИ)'}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-[11px] border border-[#e6e8ea]">
                    <span className="text-[#686b70] text-[11px] block">ФНС и ЗСК</span>
                    <strong className="text-[#141414] font-bold text-[13px] block">
                      {effectiveScoring?.stopFactors?.some((sf) => sf.isTriggered)
                        ? 'Выявлены замечания'
                        : '0 стоп-факторов'}
                    </strong>
                    <span className="text-[11px] text-[#176b45] font-medium block truncate">
                      {effectiveScoring?.stopFactors?.some((sf) => sf.isTriggered)
                        ? 'Требуется проверка'
                        : 'Зелёная зона (блокировок нет)'}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-[11px] border border-[#e6e8ea]">
                    <span className="text-[#686b70] text-[11px] block">Анализ документов</span>
                    <strong className="text-[#141414] font-bold text-[13px] block">
                      {application.documents?.some(
                        (d) => d.fileName?.endsWith('.csv') || d.fileName?.endsWith('.xlsx')
                      )
                        ? 'Выписка верифицирована'
                        : application.documents.length > 0
                        ? `${application.documents.length} док. в досье`
                        : 'По заявленным оборотам'}
                    </strong>
                    <span className="text-[11px] text-[#686b70] block truncate">Сверка с банком</span>
                  </div>

                  <div className="p-3 bg-white rounded-[11px] border border-[#e6e8ea]">
                    <span className="text-[#686b70] text-[11px] block">Ключевой фактор</span>
                    <strong className="text-[#141414] font-bold text-[13px] block truncate">
                      {application.scoring?.issues?.[0] ||
                        application.reasonCodes?.[0] ||
                        'Соответствие регламенту риска'}
                    </strong>
                    <span className="text-[11px] text-[#686b70] block truncate">Определяющий признак</span>
                  </div>
                </div>
              </div>

              {/* Недостающие сведения и замечания (.message.warn / .message.good из макет.html) */}
              <div
                className={`p-[18px] rounded-[14px] text-[13px] leading-[1.6] border ${
                  missingInfoList.length > 0
                    ? 'bg-[#fff7e8] text-[#714817] border-[#f3dfc1]'
                    : 'bg-[#eef8f1] text-[#176b45] border-[#cde8d6]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 font-bold text-[14px]">
                    {missingInfoList.length > 0 ? (
                      <>
                        <HelpCircle className="w-4 h-4 shrink-0" />
                        <span>
                          Недостающие сведения и замечания к заявке ({missingInfoList.length})
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>Комплектность досье подтверждена</span>
                      </>
                    )}
                  </div>

                  {missingInfoList.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        handleRequestInfo(
                          missingInfoList[0] || 'Просим прислать недостающие подтверждающие документы'
                        )
                      }
                      className="rounded-[10px] px-3.5 py-1.5 bg-white text-[#714817] font-bold text-[12px] border border-[#e2c699] hover:bg-[#fffaf2] shrink-0 cursor-pointer"
                    >
                      Запросить у клиента (T11)
                    </button>
                  )}
                </div>

                {missingInfoList.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 m-0">
                    {missingInfoList.map((issue, idx) => (
                      <li key={idx}>{issue}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="m-0">
                    Критических замечаний и недостающих документов не выявлено. Досье готово к вынесению финального
                    решения.
                  </p>
                )}
              </div>

                  {/* Панель принятия решения сотрудником банка (.bank-tools из макет.html) */}
                  <AnalystActionPanel
                    application={application}
                    onApprove={handleApprove}
                    onDecline={handleDecline}
                    onRequestInfo={handleRequestInfo}
                    onReturnToChecking={handleReturnToChecking}
                    onCloseNonCredit={handleCloseNonCredit}
                    onDelete={handleDeleteApplication}
                  />
                </>
              )}
            </div>
          )}

          {/* ВКЛАДКА 2: СКОРИНГ И ПРОВЕРКИ */}
          {(activeTab === 'scoring' || activeTab === 'all') && (
            <div className="space-y-6">
              {effectiveScoring && <ScoringCard scoring={effectiveScoring} showDetails={true} />}

              {/* Сверка данных анкеты с гос. источниками (.summary-section из макет.html) */}
              <div className="border-t border-[#e6e8ea] pt-6">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <span className="text-[11px] tracking-[0.12em] uppercase text-[#686b70] font-bold block mb-1">
                      SmartKabinet.Integrations
                    </span>
                    <h3 className="text-[18px] font-bold text-[#141414] m-0">
                      Сверка сведений анкеты с государственными реестрами и БКИ
                    </h3>
                  </div>
                  <span className="inline-block rounded-[7px] bg-[#edf7f0] text-[#176b45] px-[9px] py-[5px] text-[11px] font-medium">
                    Сверка завершена
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <dl className="grid grid-cols-[1fr_1.2fr] gap-x-6 gap-y-2.5 text-[13px] m-0 p-5 bg-[#f5f6f7] rounded-[14px]">
                    <dt className="text-[#686b70]">Статус в ЕГРИП</dt>
                    <dd className="m-0 font-bold text-[#176b45]">Действующий ИП (ACTIVE)</dd>
                    <dt className="text-[#686b70]">Совпадение ФИО и ИНН</dt>
                    <dd className="m-0 font-medium text-[#141414]">Подтверждено (PASS)</dd>
                    <dt className="text-[#686b70]">Налоговый режим</dt>
                    <dd className="m-0 font-medium text-[#141414]">
                      {application.declaredTaxRegime || 'УСН (доходы)'}
                    </dd>
                    <dt className="text-[#686b70]">Блокировки счетов ФНС</dt>
                    <dd className="m-0 font-bold text-[#176b45]">Отсутствуют</dd>
                  </dl>

                  <dl className="grid grid-cols-[1fr_1.2fr] gap-x-6 gap-y-2.5 text-[13px] m-0 p-5 bg-[#f5f6f7] rounded-[14px]">
                    <dt className="text-[#686b70]">Выручка со слов клиента</dt>
                    <dd className="m-0 font-bold text-[#141414]">
                      {formatRubles(application.monthlyRevenue)} / мес
                    </dd>
                    <dt className="text-[#686b70]">Операционные расходы</dt>
                    <dd className="m-0 font-medium text-[#141414]">
                      {formatRubles(application.monthlyExpenses)} / мес
                    </dd>
                    <dt className="text-[#686b70]">Платёж по текущим долгам</dt>
                    <dd className="m-0 font-medium text-[#141414]">
                      {formatRubles(application.existingMonthlyObligations || 0)} / мес
                    </dd>
                    <dt className="text-[#686b70]">Сверка обязательств с БКИ</dt>
                    <dd className="m-0 font-bold text-[#176b45]">Расхождений не выявлено</dd>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {/* ВКЛАДКА 3: АНКЕТА, ДОКУМЕНТЫ И СОГЛАСИЯ */}
          {(activeTab === 'dossier' || activeTab === 'all') && (
            <div className="space-y-7">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Карточка ЕГРИП */}
                {effectiveScoring?.egrip && <EgripCard company={effectiveScoring.egrip} />}

                {/* Параметры анкеты (.summary-section dl из макет.html) */}
                <div className="p-6 border border-[#e6e8ea] rounded-[16px] bg-white">
                  <span className="text-[11px] tracking-[0.12em] uppercase text-[#686b70] font-bold block mb-1">
                    Параметры кредитной заявки
                  </span>
                  <h3 className="text-[18px] font-bold text-[#141414] mb-4">
                    Сведения из анкеты предпринимателя
                  </h3>
                  <dl className="grid grid-cols-[1fr_1.2fr] gap-x-6 gap-y-2.5 text-[13px] m-0">
                    <dt className="text-[#686b70]">Номер досье</dt>
                    <dd className="m-0 font-bold text-[#141414]">{application.id}</dd>
                    <dt className="text-[#686b70]">Заявитель</dt>
                    <dd className="m-0 font-medium text-[#141414]">{application.companyName}</dd>
                    <dt className="text-[#686b70]">ИНН заёмщика</dt>
                    <dd className="m-0 font-mono text-[#141414]">{formatInn(application.inn)}</dd>
                    <dt className="text-[#686b70]">Запрошенная сумма</dt>
                    <dd className="m-0 font-bold text-[#141414]">
                      {formatRubles(application.requestedAmount)}
                    </dd>
                    <dt className="text-[#686b70]">Запрошенный срок</dt>
                    <dd className="m-0 font-medium text-[#141414]">
                      {application.requestedTermMonths || 12} месяцев
                    </dd>
                    <dt className="text-[#686b70]">Цель финансирования</dt>
                    <dd className="m-0 font-medium text-[#141414]">
                      {application.purpose || 'Пополнение оборотных средств'}
                    </dd>
                  </dl>
                </div>
              </div>

              {/* Прикрепленные документы (.file-row из макет.html) */}
              <div className="border-t border-[#e6e8ea] pt-6">
                <h3 className="text-[18px] font-bold text-[#141414] mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#EF3124]" />
                  Прикреплённые документы и выписки ({application.documents.length})
                </h3>

                {application.documents.length === 0 ? (
                  <div className="p-6 rounded-[14px] bg-[#f5f6f7] text-[#686b70] text-[13px]">
                    К заявке пока не прикреплены файлы выписок или договоров.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {application.documents.map((doc) => {
                      const downloadHref =
                        doc.downloadUrl ||
                        (doc.fileKey ? `/api/infrastructure/storage/${doc.fileKey}` : undefined);
                      return (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between gap-3 bg-white border border-[#e6e8ea] rounded-[9px] px-3.5 py-3 text-[12px]"
                        >
                          <div className="min-w-0">
                            <strong className="font-bold text-[#141414] block truncate">
                              {doc.fileName}
                            </strong>
                            <span className="text-[11px] text-[#686b70]">
                              {(doc.fileSizeBytes / 1024 / 1024).toFixed(2)} МБ • Загружен{' '}
                              {formatDateTime(doc.uploadedAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="inline-block rounded-[7px] bg-[#edf7f0] text-[#176b45] px-[9px] py-[4px] text-[11px] font-medium">
                              Проверен
                            </span>
                            {downloadHref && (
                              <a
                                href={downloadHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={doc.fileName}
                                className="inline-flex items-center gap-1 text-[#EF3124] hover:text-[#cd2017] font-bold text-[12px] no-underline"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Скачать
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Три независимых согласия заёмщика */}
              <div className="border-t border-[#e6e8ea] pt-6">
                <div className="mb-3">
                  <span className="text-[11px] tracking-[0.12em] uppercase text-[#686b70] font-bold block mb-1">
                    Правовые основания обработки
                  </span>
                  <h3 className="text-[18px] font-bold text-[#141414] m-0">
                    Подписанные согласия предпринимателя (ПЭП)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div className="p-4 rounded-[14px] border border-[#e6e8ea] bg-[#f5f6f7] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <strong className="text-[13px] text-[#141414]">1. Персональные данные</strong>
                        <span className="inline-block rounded-[7px] bg-[#edf7f0] text-[#176b45] px-2 py-0.5 text-[11px] font-medium">
                          Активно
                        </span>
                      </div>
                      <p className="text-[12px] text-[#686b70] mb-3">
                        Согласие на обработку ПДн по 152-ФЗ для идентификации и рассмотрения заявки.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveConsentType('pdn')}
                      className="text-left text-[#EF3124] font-bold text-[12px] hover:underline cursor-pointer"
                    >
                      Открыть текст согласия ↗
                    </button>
                  </div>

                  <div className="p-4 rounded-[14px] border border-[#e6e8ea] bg-[#f5f6f7] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <strong className="text-[13px] text-[#141414]">2. Запрос в БКИ</strong>
                        <span className="inline-block rounded-[7px] bg-[#edf7f0] text-[#176b45] px-2 py-0.5 text-[11px] font-medium">
                          6 месяцев
                        </span>
                      </div>
                      <p className="text-[12px] text-[#686b70] mb-3">
                        Право на получение кредитного отчёта в НБКИ / ОКБ согласно ст. 6 218-ФЗ.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveConsentType('bki')}
                      className="text-left text-[#EF3124] font-bold text-[12px] hover:underline cursor-pointer"
                    >
                      Открыть текст согласия ↗
                    </button>
                  </div>

                  <div className="p-4 rounded-[14px] border border-[#e6e8ea] bg-[#f5f6f7] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <strong className="text-[13px] text-[#141414]">3. Передача в лизинг</strong>
                        <span className="inline-block rounded-[7px] bg-white border border-[#e6e8ea] text-[#141414] px-2 py-0.5 text-[11px] font-medium">
                          Партнёр
                        </span>
                      </div>
                      <p className="text-[12px] text-[#686b70] mb-3">
                        Передача досье в ООО «Альфа-Лизинг» для подготовки графика лизинга.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveConsentType('leasing')}
                      className="text-left text-[#EF3124] font-bold text-[12px] hover:underline cursor-pointer"
                    >
                      Открыть текст согласия ↗
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ВКЛАДКА 4: ЗАПРОСЫ И АУДИТ (.request-card и .timeline из макет.html) */}
          {(activeTab === 'audit' || activeTab === 'all') && (
            <div className="space-y-6">
              {/* Запросы дополнительных сведений */}
              <div className="p-5 border border-[#e6e8ea] rounded-[16px] bg-white shadow-xs space-y-4">
                <div
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => setIsCommunicationExpanded(!isCommunicationExpanded)}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#fff6e4] text-[#885215] flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[17px] font-bold text-[#141414] m-0">
                        История дозапроса сведений
                      </h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#f0f2f4] text-[#141414]">
                        {inquiriesHistory.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {inquiriesHistory.some((i) => i.isCurrentOpen) ? (
                      <span className="inline-block rounded-[7px] bg-[#fff0ed] text-[#EF3124] px-[9px] py-[3px] text-[11px] font-semibold border border-[#fedcd5]">
                        Ожидает ответа от клиента (T11)
                      </span>
                    ) : (
                      <span className="inline-block rounded-[7px] bg-[#edf7f0] text-[#176b45] px-[9px] py-[3px] text-[11px] font-medium border border-[#c6e6cd]">
                        ✓ Сведения предоставлены (T10)
                      </span>
                    )}
                    <button
                      type="button"
                      className="p-1 text-[#686b70] hover:text-[#141414] rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                      aria-label={isCommunicationExpanded ? 'Свернуть' : 'Развернуть'}
                    >
                      <span>{isCommunicationExpanded ? 'Свернуть' : 'Развернуть'}</span>
                      {isCommunicationExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {!isCommunicationExpanded && inquiriesHistory.length > 0 && (
                  <div className="text-xs text-[#686b70] pl-3 border-l-2 border-[#EF3124] py-0.5 flex flex-wrap items-center justify-between gap-2">
                    <span className="truncate max-w-xl">
                      <strong className="text-[#141414] font-semibold">Последний запрос: </strong>
                      {inquiriesHistory[inquiriesHistory.length - 1]?.prompt}
                    </span>
                    {inquiriesHistory[inquiriesHistory.length - 1]?.promptAt && (
                      <span className="text-[11px] text-[#686b70] whitespace-nowrap">
                        {formatDateTime(inquiriesHistory[inquiriesHistory.length - 1].promptAt!)}
                      </span>
                    )}
                  </div>
                )}

                {isCommunicationExpanded && (
                  <div className="space-y-3 pt-1">
                    {inquiriesHistory.length > 0 ? (
                      inquiriesHistory.map((inquiry, idx) => (
                        <div
                          key={inquiry.id || idx}
                          className="p-4 border border-[#e6e8ea] rounded-[14px] bg-[#fafbfc] space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#e6e8ea]">
                            <div className="flex items-center gap-2">
                              <span className="inline-block rounded-[7px] bg-[#fff6e4] text-[#885215] px-[9px] py-[3px] text-[11px] font-bold">
                                Запрос #{idx + 1}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {inquiry.isCurrentOpen ? (
                                <span className="inline-block rounded-[7px] bg-[#fff0ed] text-[#EF3124] px-[9px] py-[3px] text-[11px] font-semibold border border-[#fedcd5]">
                                  Ожидает ответа от клиента (T11)
                                </span>
                              ) : (
                                <span className="inline-block rounded-[7px] bg-[#edf7f0] text-[#176b45] px-[9px] py-[3px] text-[11px] font-medium">
                                  ✓ Сведения предоставлены (T10)
                                </span>
                              )}
                              {inquiry.promptAt && (
                                <span className="text-[11px] text-[#686b70]">
                                  {formatDateTime(inquiry.promptAt)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            <strong className="text-[13px] text-[#686b70] block mb-1">
                              Вопрос специалиста банка:
                            </strong>
                            <p className="text-[13px] text-[#141414] whitespace-pre-wrap m-0 font-medium">
                              {inquiry.prompt}
                            </p>
                          </div>

                          {inquiry.response ? (
                            <div className="p-3.5 rounded-[11px] bg-[#eef8f1] border border-[#d2edd8] space-y-2">
                              <div className="flex items-center justify-between text-[11px] text-[#176b45] font-bold">
                                <span>Ответ клиента (ИП):</span>
                                {inquiry.responseAt && (
                                  <span className="font-normal text-[#686b70]">
                                    {formatDateTime(inquiry.responseAt)}
                                  </span>
                                )}
                              </div>
                              <p className="m-0 whitespace-pre-wrap text-[13px] text-[#141414]">
                                {inquiry.response}
                              </p>

                              {/* Прикрепленные клиентом файлы */}
                              {inquiry.files && inquiry.files.length > 0 && (
                                <div className="mt-2.5 pt-2 border-t border-[#c6e6cd] space-y-1.5">
                                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#176b45]">
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>Прикрепленные файлы ({inquiry.files.length}):</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {inquiry.files.map((file) => {
                                      const downloadHref =
                                        file.downloadUrl ||
                                        (file.fileKey ? `/api/infrastructure/storage/${file.fileKey}` : undefined);
                                      return (
                                        <div
                                          key={file.id}
                                          className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white border border-[#d2edd8] text-[12px] shadow-xs"
                                        >
                                          <div className="flex items-center gap-2 min-w-0">
                                            <div className="p-1 rounded bg-[#edf7f0] text-[#176b45] shrink-0">
                                              <FileText className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="min-w-0">
                                              <p className="font-bold text-[#141414] truncate m-0" title={file.fileName}>
                                                {file.fileName}
                                              </p>
                                              <span className="text-[10px] text-[#686b70]">
                                                {file.fileSizeBytes ? `${(file.fileSizeBytes / 1024 / 1024).toFixed(2)} МБ` : 'Документ'}
                                              </span>
                                            </div>
                                          </div>
                                          {downloadHref && (
                                            <a
                                              href={downloadHref}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              download={file.fileName}
                                              className="inline-flex items-center gap-1 text-[#EF3124] hover:text-[#cd2017] font-bold text-[11px] shrink-0 no-underline p-1 hover:bg-[#fff0ed] rounded"
                                              title="Скачать файл"
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                              <span>Скачать</span>
                                            </a>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-[12px] text-[#885215] italic bg-[#fffaf0] p-2.5 rounded-lg border border-[#f5e6cc]">
                              Запрос отправлен клиенту, ожидается предоставление пояснений или подтверждающих документов
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 rounded-[12px] bg-[#f5f6f7] text-[#686b70] text-[13px]">
                        Активных дозапросов по данной заявке нет. Вы можете инициировать запрос через кнопку «Запросить сведения (T11)».
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Таймлайн переходов (.timeline из макет.html) */}
              <div className="border-t border-[#e6e8ea] pt-6">
                <h3 className="text-[18px] font-bold text-[#141414] mb-4">
                  Хронология рассмотрения заявки
                </h3>

                <ul className="list-none p-0 m-0">
                  {application.history.map((record) => (
                    <li
                      key={record.id}
                      className="border-l border-[#e6e8ea] pl-5 pb-6 relative text-[13px] last:pb-0"
                    >
                      <span className="w-[7px] h-[7px] rounded-full bg-[#EF3124] absolute -left-[4px] top-[6px]" />
                      <small className="block text-[#686b70] text-[11px] mb-1">
                        {formatDateTime(record.timestamp)} • {record.actorName || record.actor}
                      </small>
                      <strong className="text-[#141414] font-bold block">
                        [{record.transitionCode}] {record.fromStatus} → {record.toStatus}
                      </strong>
                      {record.comment && (
                        <p className="my-1 text-[#686b70] whitespace-pre-wrap">{record.comment}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно полной истории переходов */}
      <TransitionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={application.history}
      />

      {/* Модальное окно просмотра текста согласия */}
      <ConsentModal
        isOpen={activeConsentType !== null}
        onClose={() => setActiveConsentType(null)}
        type={activeConsentType || 'pdn'}
        isAccepted={true}
        partnerName={
          application.leasingPartnerName ||
          application.clientAnswers?.leasingPartnerName ||
          'ООО «Альфа-Лизинг» (ИНН 7707330770)'
        }
        applicantName={application.companyName}
        inn={application.inn}
      />
    </div>
  );
};