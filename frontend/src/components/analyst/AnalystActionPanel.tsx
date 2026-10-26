import React, { useState, useMemo } from 'react';
import { CreditApplication } from '../../types/application';
import { Modal } from '../common/Modal';
import { formatRubles, formatPercent, calculateMonthlyPayment } from '../../utils/formatters';
import {
  Check,
  X,
  HelpCircle,
  RefreshCw,
  Ban,
  Sparkles,
  Calculator,
  AlertTriangle,
  Trash2,
  SlidersHorizontal,
} from 'lucide-react';

interface AnalystActionPanelProps {
  application: CreditApplication;
  onApprove: (params: {
    approvedAmount: number;
    approvedTermMonths: number;
    annualInterestRate: number;
    comment?: string;
  }) => Promise<void>;
  onDecline: (reasonCode: string, comment: string) => Promise<void>;
  onRequestInfo: (prompt: string) => Promise<void>;
  onReturnToChecking: (comment?: string) => Promise<void>;
  onCloseNonCredit: (reasonCode: string, comment: string) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export const AnalystActionPanel: React.FC<AnalystActionPanelProps> = ({
  application,
  onApprove,
  onDecline,
  onRequestInfo,
  onReturnToChecking,
  onCloseNonCredit,
  onDelete,
}) => {
  const [activeModal, setActiveModal] = useState<
    'approve' | 'decline' | 'need_info' | 'recheck' | 'close' | 'confirm_approve' | 'confirm_decline' | 'confirm_close' | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  type PresetType = 'scoring' | 'ai' | 'custom';
  const [selectedPreset, setSelectedPreset] = useState<PresetType>('scoring');

  // 1. ScoringEngine: авто-расчет по кредитной политике и скоринговому баллу
  const scoringScore = application.scoring?.score ?? 78;
  const scoringAmount =
    application.offer?.approvedAmount ||
    application.currentOffer?.approvedAmount ||
    application.recommendedOffer?.approvedAmount ||
    application.requestedAmount ||
    1000000;
  const scoringTerm =
    application.offer?.approvedTermMonths ||
    application.currentOffer?.termMonths ||
    application.recommendedOffer?.approvedTermMonths ||
    application.requestedTermMonths ||
    12;
  const scoringRate =
    application.offer?.annualInterestRate ||
    application.currentOffer?.annualRatePercent ||
    application.recommendedOffer?.annualInterestRate ||
    (scoringScore >= 85 ? 18.0 : scoringScore >= 70 ? 21.0 : scoringScore >= 50 ? 23.5 : 25.0);
  const scoringPayment = calculateMonthlyPayment(scoringAmount, scoringRate, scoringTerm);

  // 2. AI-ассистент: альтернативный вариант со снижением долговой нагрузки за счёт адаптивного срока (+6 мес)
  const aiAmount = scoringAmount;
  const aiTerm =
    application.offer?.alternativeTerms?.newTermMonths ||
    (scoringTerm + 6);
  const aiRate = scoringRate; // Ставка соответствует скоринговой модели банка
  const aiPayment = calculateMonthlyPayment(aiAmount, aiRate, aiTerm);
  const paymentSavings = Math.max(0, scoringPayment - aiPayment);

  const [approveAmount, setApproveAmount] = useState(scoringAmount);
  const [approveTerm, setApproveTerm] = useState(scoringTerm);
  const [approveRate, setApproveRate] = useState(scoringRate);
  const [comment, setComment] = useState('');
  const [reasonCode, setReasonCode] = useState('HIGH_RISK_SCORE');

  const getScoringComment = () =>
    `Одобрено на базовых условиях ScoringEngine (балл ${scoringScore}/100, ставка ${formatPercent(scoringRate)}, срок ${scoringTerm} мес.).`;

  const getAiComment = () =>
    paymentSavings > 0
      ? `Рекомендация AI-модели: адаптированный срок ${aiTerm} мес. (+${aiTerm - scoringTerm} мес.) со снижением платежа на ${formatRubles(paymentSavings)}/мес для обеспечения безопасного запаса NCF.`
      : `Рекомендация AI-модели: адаптированные условия кредитования на основе риск-профиля.`;

  const getCustomComment = () =>
    `Индивидуальные условия, скорректированные аналитиком.`;

  const applyPreset = (preset: PresetType) => {
    setSelectedPreset(preset);
    if (preset === 'scoring') {
      setApproveAmount(scoringAmount);
      setApproveTerm(scoringTerm);
      setApproveRate(scoringRate);
      setComment(getScoringComment());
    } else if (preset === 'ai') {
      setApproveAmount(aiAmount);
      setApproveTerm(aiTerm);
      setApproveRate(aiRate);
      setComment(getAiComment());
    } else if (preset === 'custom') {
      if (!comment || comment.includes('ScoringEngine') || comment.includes('Рекомендация AI')) {
        setComment(getCustomComment());
      }
    }
  };

  React.useEffect(() => {
    setApproveAmount(scoringAmount);
    setApproveTerm(scoringTerm);
    setApproveRate(scoringRate);
  }, [application]);

  const currentMonthlyPayment = calculateMonthlyPayment(approveAmount, approveRate, approveTerm);
  const totalRepayment = currentMonthlyPayment * Number(approveTerm || 0);

  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveModal('confirm_approve');
  };

  const handleFinalApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove({
        approvedAmount: Number(approveAmount),
        approvedTermMonths: Number(approveTerm),
        annualInterestRate: Number(approveRate),
        comment,
      });
      setActiveModal(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeclineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveModal('confirm_decline');
  };

  const handleFinalDecline = async () => {
    setIsSubmitting(true);
    try {
      await onDecline(reasonCode, comment || 'Отказ по результатам экспертной оценки аналитика');
      setActiveModal(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNeedInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onRequestInfo(comment);
      setActiveModal(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecheckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onReturnToChecking(comment);
      setActiveModal(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveModal('confirm_close');
  };

  const handleFinalClose = async () => {
    setIsSubmitting(true);
    try {
      await onCloseNonCredit(
        'PRODUCT_NA_AMOUNT',
        comment || 'Запрашиваемые параметры не соответствуют продуктовой линейке'
      );
      setActiveModal(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isWithdrawn =
    (application as any).status === 'withdrawn' ||
    (application.history || []).some(
      (h) => h.transitionCode === 'T17' || h.comment?.toLowerCase().includes('отозван')
    );
  const isClosed = application.status === 'closed';
  const isOffer =
    application.status === 'offer' ||
    application.status === 'accepted' ||
    application.status === 'signed_sim' ||
    application.status === 'disbursed_sim';

  const counterOfferHistoryItem = (application.history || [])
    .slice()
    .reverse()
    .find(
      (h) =>
        h.reasonCode === 'CLIENT_COUNTER_OFFER_REQUEST' ||
        (h.actor === 'client' && h.comment?.toLowerCase().includes('пересмотр условий')) ||
        (h.actor === 'client' && h.comment?.toLowerCase().includes('альтернативн'))
    );
  const isClientCounterRequested = Boolean(counterOfferHistoryItem && application.status === 'review');

  const isPaused =
    application.scenario === 'paused' ||
    application.productCode === 'RESTART' ||
    application.clientAnswers?.business === 'paused' ||
    (application.reasonCodes || []).includes('BUSINESS_RESTART');

  const handleOpenApproveModal = () => {
    if (isClientCounterRequested) {
      applyPreset('custom');
      setComment('Встречное предложение банка с учётом пожеланий заёмщика');
    } else {
      applyPreset('scoring');
    }
    setActiveModal('approve');
  };

  const handleDeleteConfirm = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3.5 border border-[#D1D5D8] rounded-[11px] bg-white text-[#141414] text-[14px] focus:outline-2 focus:outline-[#EF3124] focus:outline-offset-2';

  return (
    <>
      {/* Блок инструментов банка в стиле .bank-tools из макет.html */}
      <div className="bg-[#f5f6f7] rounded-[14px] p-[22px] border border-[#e6e8ea]">
        {isWithdrawn || isClosed ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e6e8ea] text-[#686b70]">
                  {isWithdrawn ? 'T17 • Отозвана клиентом' : 'T16 • Закрыта'}
                </span>
                <span className="text-xs text-[#686b70]">Действия над заявкой заблокированы</span>
              </div>
              <h3 className="text-[18px] font-bold text-[#141414] m-0">
                {isWithdrawn ? 'Заявка отозвана клиентом' : 'Заявка закрыта'}
              </h3>
              <p className="text-[13px] text-[#686b70] mt-1 mb-0 max-w-[650px]">
                {isWithdrawn
                  ? 'Клиент отозвал кредитную анкету. Вынесение кредитных решений и запросы сведений недоступны. Вы можете удалить эту анкету из системы.'
                  : 'Заявка переведена в архивный статус закрытия. Вынесение кредитных решений недоступно. Вы можете удалить эту анкету из системы.'}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {onDelete && (
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="rounded-[12px] px-[21px] py-[13px] font-bold text-[14px] inline-flex items-center justify-center gap-2 bg-[#EF3124] hover:bg-[#cd2017] text-white transition-colors cursor-pointer shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Удалить анкету
                </button>
              )}
            </div>
          </div>
        ) : isOffer ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#edf7f0] text-[#176b45] border border-[#b8e5c8]">
                  {application.status === 'offer' ? 'T12 • Оферта утверждена и направлена клиенту' : 'T21+ • Условия согласованы'}
                </span>
                <span className="text-xs text-[#686b70]">
                  {application.status === 'offer' ? 'Ожидается решение заёмщика' : 'Оферта принята заёмщиком'}
                </span>
              </div>
              <h3 className="text-[18px] font-bold text-[#141414] m-0">
                Оферта сформирована и направлена клиенту
              </h3>
              <p className="text-[13px] text-[#686b70] mt-1 mb-0 max-w-[700px]">
                Параметры согласованной оферты: <strong className="text-[#141414]">{formatRubles(scoringAmount)}</strong> на{' '}
                <strong className="text-[#141414]">{scoringTerm} мес.</strong> по ставке{' '}
                <strong className="text-[#141414]">{formatPercent(scoringRate)}</strong> (ежемесячный платёж{' '}
                <strong className="text-[#141414]">{formatRubles(currentMonthlyPayment)}</strong>). Кнопки принятия решения скрыты до получения ответа клиента.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {onDelete && (
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="rounded-[12px] px-[18px] py-[11px] font-bold text-[13px] inline-flex items-center justify-center gap-2 bg-white text-[#686b70] border border-[#e6e8ea] hover:bg-[#eeeff1] transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-[#EF3124]" />
                  Удалить анкету
                </button>
              )}
            </div>
          </div>
        ) : isClientCounterRequested ? (
          <div className="space-y-4">
            <div className="p-4 rounded-[12px] bg-[#fff8eb] border border-[#f5c97a]">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#b45309] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#fde68a] text-[#78350f]">
                      Встречный запрос от заёмщика
                    </span>
                    <span className="text-xs text-[#92400e]">
                      Клиент запросил пересмотр ранее предложенных условий оферты
                    </span>
                  </div>
                  <p className="text-[14px] font-semibold text-[#78350f] m-0">
                    {counterOfferHistoryItem?.comment || 'Клиент запросил альтернативные условия кредитования.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-[18px] font-bold text-[#141414] m-0">
                  Решение по встречному запросу клиента
                </h3>
                <p className="text-[13px] text-[#686b70] mt-1 mb-0">
                  Вы можете предложить другой вариант оферты (скорректировать параметры) либо отказать по заявке
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleOpenApproveModal}
                  className="rounded-[12px] px-[21px] py-[13px] font-bold text-[14px] inline-flex items-center justify-center gap-2 bg-[#EF3124] hover:bg-[#cd2017] text-white transition-colors cursor-pointer shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  Предложить другой вариант (T12)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setComment('Отказ в пересмотре условий по заявке заёмщика');
                    setActiveModal('decline');
                  }}
                  className="rounded-[12px] px-[18px] py-[13px] font-bold text-[14px] inline-flex items-center justify-center gap-2 bg-white text-[#EF3124] border border-[#fac6c2] hover:bg-[#fff1ef] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  Отказать (T13)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setComment('Просим прислать дополнительные документы для обоснования запрашиваемых параметров');
                    setActiveModal('need_info');
                  }}
                  className="rounded-[12px] px-[18px] py-[13px] font-bold text-[14px] inline-flex items-center justify-center gap-2 bg-white text-[#141414] border border-[#e6e8ea] hover:bg-[#eeeff1] transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-[#885215]" />
                  Запросить сведения (T11)
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-[18px] font-bold text-[#141414] m-0">
                Принятие экспертного решения по заявке
              </h3>
            </div>

            {/* Кнопки действий: горизонтальное расположение как было изначально */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleOpenApproveModal}
                className="rounded-[12px] px-[21px] py-[13px] font-bold text-[14px] inline-flex items-center justify-center gap-2 bg-[#EF3124] hover:bg-[#cd2017] text-white transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Одобрить оферту (T12)
              </button>

              <button
                type="button"
                onClick={() => {
                  setComment('Просим прислать выписку по счетам за последние 6 месяцев для подтверждения оборотов');
                  setActiveModal('need_info');
                }}
                className="rounded-[12px] px-[18px] py-[13px] font-bold text-[14px] inline-flex items-center justify-center gap-2 bg-white text-[#141414] border border-[#e6e8ea] hover:bg-[#eeeff1] transition-colors cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-[#885215]" />
                Запросить сведения (T11)
              </button>

              <button
                type="button"
                onClick={() => {
                  setComment('Параметры скорректированы, запуск повторного скоринга');
                  setActiveModal('recheck');
                }}
                className="rounded-[12px] px-[18px] py-[13px] font-bold text-[14px] inline-flex items-center justify-center gap-2 bg-white text-[#141414] border border-[#e6e8ea] hover:bg-[#eeeff1] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-[#686b70]" />
                На скоринг (T14)
              </button>

              <button
                type="button"
                onClick={() => {
                  setComment('');
                  setActiveModal('decline');
                }}
                className="rounded-[12px] px-[18px] py-[13px] font-bold text-[14px] inline-flex items-center justify-center gap-2 bg-white text-[#EF3124] border border-[#fac6c2] hover:bg-[#fff1ef] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
                Отказать (T13)
              </button>

              <button
                type="button"
                onClick={() => {
                  setComment('');
                  setActiveModal('close');
                }}
                className="rounded-[12px] px-[14px] py-[13px] font-bold text-[13px] inline-flex items-center justify-center gap-1.5 text-[#686b70] hover:text-[#141414] transition-colors cursor-pointer border border-transparent hover:border-[#e6e8ea]"
              >
                <Ban className="w-4 h-4" />
                Закрыть (T16)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно T12: Одобрение */}
      <Modal
        isOpen={activeModal === 'approve'}
        onClose={() => setActiveModal(null)}
        maxWidth="3xl"
        title={
          isClientCounterRequested
            ? 'Предложить другой вариант оферты (T12)'
            : isPaused
            ? 'Индивидуальное предложение: Перезапуск бизнеса (T12)'
            : 'Одобрение кредитной заявки (T12)'
        }
        description={
          isClientCounterRequested
            ? 'Скорректируйте параметры оферты с учётом пожеланий заёмщика и направьте обновлённое предложение'
            : isPaused
            ? 'Сформируйте адаптированные параметры оферты (льготный период, лизинг оборудования или залог)'
            : 'Выберите источник условий или настройте индивидуальные параметры оферты'
        }
      >
        <form onSubmit={handleApproveSubmit} className="space-y-4 text-[#141414]">
          {isPaused && (
            <div className="p-3.5 rounded-[12px] bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <strong>Индивидуальный подбор условий:</strong> Для бизнеса на перезапуске рекомендуются адаптивный график погашения, льготный период на 3–6 месяцев либо лизинг оборудования через ООО «Альфа-Лизинг».
            </div>
          )}

          {/* Выбор источника условий */}
          <div>
            <label className="block font-bold text-[14px] text-[#141414] mb-2.5">
              Источник условий оферты:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. ScoringEngine */}
              <button
                type="button"
                onClick={() => applyPreset('scoring')}
                className={`text-left p-4 rounded-[14px] border transition-all cursor-pointer relative flex flex-col justify-between ${
                  selectedPreset === 'scoring'
                    ? 'border-[#EF3124] bg-[#fff8f6] ring-2 ring-[#EF3124]/30 shadow-sm'
                    : 'border-[#e6e8ea] bg-white hover:border-[#cfd2d6] hover:bg-[#fafafa]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="flex items-center gap-2 font-bold text-[14px] text-[#141414]">
                      <Calculator className={`w-4 h-4 ${selectedPreset === 'scoring' ? 'text-[#EF3124]' : 'text-[#686b70]'}`} />
                      ScoringEngine
                    </span>
                    <span
                      className={`w-3 h-3 rounded-full border-2 ${
                        selectedPreset === 'scoring'
                          ? 'border-[#EF3124] bg-[#EF3124]'
                          : 'border-[#cfd2d6] bg-white'
                      }`}
                    />
                  </div>
                  <div className="text-[15px] font-bold text-[#141414] mb-1">
                    {formatPercent(scoringRate)} • {scoringTerm} мес.
                  </div>
                  <div className="text-[12px] text-[#686b70] mb-2 font-medium">
                    {formatRubles(scoringPayment)} <span className="text-[11px] font-normal">/ мес</span>
                  </div>
                </div>
                <div className="text-[11px] text-[#686b70] pt-2 border-t border-[#efddd8]/70 leading-snug">
                  Авто-расчёт по скорингу (балл {scoringScore}/100)
                </div>
              </button>

              {/* 2. AI-ассистент */}
              <button
                type="button"
                onClick={() => applyPreset('ai')}
                className={`text-left p-4 rounded-[14px] border transition-all cursor-pointer relative flex flex-col justify-between ${
                  selectedPreset === 'ai'
                    ? 'border-purple-500 bg-purple-50/60 ring-2 ring-purple-500/30 shadow-sm'
                    : 'border-[#e6e8ea] bg-white hover:border-[#cfd2d6] hover:bg-[#fafafa]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="flex items-center gap-2 font-bold text-[14px] text-purple-950">
                      <Sparkles className={`w-4 h-4 ${selectedPreset === 'ai' ? 'text-purple-600' : 'text-[#686b70]'}`} />
                      AI-ассистент
                    </span>
                    <span
                      className={`w-3 h-3 rounded-full border-2 ${
                        selectedPreset === 'ai'
                          ? 'border-purple-600 bg-purple-600'
                          : 'border-[#cfd2d6] bg-white'
                      }`}
                    />
                  </div>
                  <div className="text-[15px] font-bold text-[#141414] mb-1">
                    {formatPercent(aiRate)} • {aiTerm} мес.
                  </div>
                  <div className="text-[12px] text-[#141414] mb-2 font-medium">
                    {formatRubles(aiPayment)} <span className="text-[11px] font-normal text-[#686b70]">/ мес</span>
                  </div>
                </div>
                <div className="text-[11px] text-purple-900 font-semibold pt-2 border-t border-purple-200/70 leading-snug">
                  {paymentSavings > 0
                    ? `Ниже на ${formatRubles(paymentSavings)}/мес (+${aiTerm - scoringTerm} мес. к сроку)`
                    : 'Оптимизация кредитной нагрузки'}
                </div>
              </button>

              {/* 3. Свой вариант */}
              <button
                type="button"
                onClick={() => applyPreset('custom')}
                className={`text-left p-4 rounded-[14px] border transition-all cursor-pointer relative flex flex-col justify-between ${
                  selectedPreset === 'custom'
                    ? 'border-slate-800 bg-slate-50 ring-2 ring-slate-800/30 shadow-sm'
                    : 'border-[#e6e8ea] bg-white hover:border-[#cfd2d6] hover:bg-[#fafafa]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="flex items-center gap-2 font-bold text-[14px] text-[#141414]">
                      <SlidersHorizontal
                        className={`w-4 h-4 ${selectedPreset === 'custom' ? 'text-slate-800' : 'text-[#686b70]'}`}
                      />
                      Свой вариант
                    </span>
                    <span
                      className={`w-3 h-3 rounded-full border-2 ${
                        selectedPreset === 'custom'
                          ? 'border-slate-800 bg-slate-800'
                          : 'border-[#cfd2d6] bg-white'
                      }`}
                    />
                  </div>
                  <div className="text-[15px] font-bold text-[#141414] mb-1">Ручные условия</div>
                  <div className="text-[12px] text-[#686b70] mb-2 font-medium">Свободный ввод параметров</div>
                </div>
                <div className="text-[11px] text-[#686b70] pt-2 border-t border-[#e6e8ea] leading-snug">
                  Экспертная настройка аналитика
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-[14px] mb-2">Одобренная сумма (₽)</label>
            <input
              type="number"
              className={inputClass}
              value={approveAmount}
              onChange={(e) => {
                setApproveAmount(Number(e.target.value));
                setSelectedPreset('custom');
              }}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-[14px] mb-2">Срок (месяцев)</label>
              <input
                type="number"
                className={inputClass}
                value={approveTerm}
                onChange={(e) => {
                  setApproveTerm(Number(e.target.value));
                  setSelectedPreset('custom');
                }}
                required
              />
            </div>
            <div>
              <label className="block font-bold text-[14px] mb-2">Ставка (% годовых)</label>
              <input
                type="number"
                step="0.1"
                className={inputClass}
                value={approveRate}
                onChange={(e) => {
                  setApproveRate(Number(e.target.value));
                  setSelectedPreset('custom');
                }}
                required
              />
            </div>
          </div>

          <div className="p-4 rounded-[14px] bg-[#fff8f6] border border-[#efddd8] space-y-2">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#686b70] flex items-center gap-1.5 font-medium">
                <Calculator className="w-4 h-4 text-[#EF3124]" />
                Расчётный аннуитетный платёж:
              </span>
              <strong className="text-[18px] font-bold text-[#141414]">
                {formatRubles(currentMonthlyPayment)} <span className="text-[12px] font-normal text-[#686b70]">/ мес</span>
              </strong>
            </div>
            <div className="flex items-center justify-between text-[12px] text-[#686b70] pt-2 border-t border-[#efddd8]">
              <span>Общая сумма выплат за {approveTerm} мес.:</span>
              <strong className="text-[#141414]">{formatRubles(totalRepayment)}</strong>
            </div>

            {selectedPreset === 'ai' && paymentSavings > 0 && (
              <div className="pt-2 border-t border-[#efddd8] flex items-center justify-between text-[12px] text-[#176b45]">
                <span className="flex items-center gap-1 font-medium">
                  <Sparkles className="w-3.5 h-3.5" /> Снижение платежа за счёт увеличения срока (+{aiTerm - scoringTerm} мес.):
                </span>
                <strong>-{formatRubles(paymentSavings)} / мес</strong>
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-[14px] mb-2">
              Комментарий аналитика <span className="text-[11px] font-normal text-[#686b70] ml-1">для аудита</span>
            </label>
            <textarea
              className={inputClass}
              rows={3}
              placeholder="Обоснование решения и учтённые факторы..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e6e8ea]">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="rounded-[12px] px-[18px] py-[12px] font-bold text-[14px] bg-[#f5f6f7] text-[#141414] border border-[#e6e8ea] cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-[12px] px-[21px] py-[12px] font-bold text-[14px] bg-[#EF3124] hover:bg-[#cd2017] text-white cursor-pointer disabled:opacity-45"
            >
              {isSubmitting ? 'Сохранение...' : 'Утвердить оферту'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Модальное окно T11: Запрос сведений */}
      <Modal
        isOpen={activeModal === 'need_info'}
        onClose={() => setActiveModal(null)}
        title="Запрос сведений у клиента (T11)"
        description="Заявка перейдёт в статус дозапроса (need_info). Предприниматель получит уведомление в кабинете"
      >
        <form onSubmit={handleNeedInfoSubmit} className="space-y-4 text-[#141414]">
          <div>
            <label className="block font-bold text-[14px] mb-2">Текст запроса клиенту</label>
            <textarea
              className={inputClass}
              rows={4}
              placeholder="Укажите, какие документы или пояснения требуются..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </div>

          <div>
            <span className="text-[11px] tracking-[0.12em] uppercase text-[#686b70] font-bold block mb-2">
              Быстрые шаблоны запроса:
            </span>
            <div className="flex flex-col gap-1.5">
              {(isPaused
                ? [
                    'Уточните бизнес-план перезапуска и прогнозируемые сроки выхода на продажи',
                    'Предоставьте документы на залог недвижимости или поручительство для обеспечения кредита',
                    'Предоставьте коммерческое предложение / спецификацию на оборудование для оформления через Альфа-Лизинг',
                    'Уточните подтверждение заявленного источника платежей (справка о доходах, выписка по сбережениям)',
                  ]
                : [
                    'Предоставьте выписку по расчётному счёту за последние 6 месяцев для подтверждения оборотов',
                    'Приложите договор аренды коммерческого помещения или свидетельство о собственности',
                    'Предоставьте спецификацию или счёт на оплату оборудования от выбранного поставщика',
                    'Поясните расхождение между заявленной выручкой и данными налоговой отчётности',
                  ]
              ).map((templateText, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setComment(templateText)}
                  className="text-left text-[12px] p-2.5 rounded-[10px] bg-[#f5f6f7] hover:bg-[#e6e8ea] text-[#141414] transition-colors cursor-pointer"
                >
                  • {templateText}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e6e8ea]">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="rounded-[12px] px-[18px] py-[12px] font-bold text-[14px] bg-[#f5f6f7] text-[#141414] border border-[#e6e8ea] cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-[12px] px-[21px] py-[12px] font-bold text-[14px] bg-[#EF3124] hover:bg-[#cd2017] text-white cursor-pointer disabled:opacity-45"
            >
              {isSubmitting ? 'Отправка...' : 'Отправить запрос клиенту'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Модальное окно T13: Отказ */}
      <Modal
        isOpen={activeModal === 'decline'}
        onClose={() => setActiveModal(null)}
        title="Отказ по заявке (T13)"
        description="Зафиксируйте код причины и пояснение для прозрачного информирования клиента"
      >
        <form onSubmit={handleDeclineSubmit} className="space-y-4 text-[#141414]">
          <div>
            <label className="block font-bold text-[14px] mb-2">Причина отказа</label>
            <select className={inputClass} value={reasonCode} onChange={(e) => setReasonCode(e.target.value)}>
              <option value="HIGH_RISK_SCORE">Недостаточный скоринговый балл (высокий риск)</option>
              <option value="DSCR_TOO_LOW">Коэффициент покрытия долга (DSCR) ниже норматива</option>
              <option value="CRITICAL_BKI_OVERDUE">Критические просрочки по данным БКИ</option>
              <option value="TAX_ARREARS">Наличие непогашенной налоговой задолженности в ФНС</option>
              <option value="DISCREPANCY_IN_TURNOVER">Существенные расхождения в заявленной и реальной выручке</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-[14px] mb-2">Пояснение клиенту</label>
            <textarea
              className={inputClass}
              rows={3}
              placeholder="Опишите причину отказа понятным языком..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e6e8ea]">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="rounded-[12px] px-[18px] py-[12px] font-bold text-[14px] bg-[#f5f6f7] text-[#141414] border border-[#e6e8ea] cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-[12px] px-[21px] py-[12px] font-bold text-[14px] bg-[#EF3124] hover:bg-[#cd2017] text-white cursor-pointer disabled:opacity-45"
            >
              Подтвердить отказ
            </button>
          </div>
        </form>
      </Modal>

      {/* Модальное окно T14: На повторную автопроверку */}
      <Modal
        isOpen={activeModal === 'recheck'}
        onClose={() => setActiveModal(null)}
        title="Возврат на автопроверку (T14)"
        description="Заявка вернётся в статус checking для повторного расчёта скоринга"
      >
        <form onSubmit={handleRecheckSubmit} className="space-y-4 text-[#141414]">
          <div>
            <label className="block font-bold text-[14px] mb-2">Причина повторной проверки</label>
            <textarea
              className={inputClass}
              rows={3}
              placeholder="Уточнены обороты / обновлена выписка..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e6e8ea]">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="rounded-[12px] px-[18px] py-[12px] font-bold text-[14px] bg-[#f5f6f7] text-[#141414] border border-[#e6e8ea] cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-[12px] px-[21px] py-[12px] font-bold text-[14px] bg-[#EF3124] hover:bg-[#cd2017] text-white cursor-pointer disabled:opacity-45"
            >
              Отправить на скоринг
            </button>
          </div>
        </form>
      </Modal>

      {/* Модальное окно T16: Некредитное закрытие */}
      <Modal
        isOpen={activeModal === 'close'}
        onClose={() => setActiveModal(null)}
        title="Некредитное закрытие (T16)"
        description="Закрытие заявки по некредитным основаниям (например, несоответствие продуктовой линейке)"
      >
        <form onSubmit={handleCloseSubmit} className="space-y-4 text-[#141414]">
          <div>
            <label className="block font-bold text-[14px] mb-2">Комментарий</label>
            <textarea
              className={inputClass}
              rows={3}
              placeholder="Укажите причину закрытия..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e6e8ea]">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="rounded-[12px] px-[18px] py-[12px] font-bold text-[14px] bg-[#f5f6f7] text-[#141414] border border-[#e6e8ea] cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-[12px] px-[21px] py-[12px] font-bold text-[14px] bg-[#EF3124] hover:bg-[#cd2017] text-white cursor-pointer disabled:opacity-45"
            >
              Закрыть заявку
            </button>
          </div>
        </form>
      </Modal>

      {/* Окно подтверждения T12: Одобрение */}
      <Modal
        isOpen={activeModal === 'confirm_approve'}
        onClose={() => setActiveModal('approve')}
        maxWidth="lg"
        title="Подтверждение одобрения кредита (T12)"
        description="Вы уверены, что хотите утвердить оферту? Проверьте итоговые параметры перед отправкой клиенту"
      >
        <div className="space-y-4 text-[#141414]">
          <div className="p-4 rounded-[12px] bg-[#fff8f6] border border-[#efddd8] flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#EF3124] shrink-0 mt-0.5" />
            <div className="text-[13px] leading-relaxed">
              <strong className="block text-[#141414] mb-1">Внимание: это действие сформирует обязательство банка</strong>
              После подтверждения заявка перейдёт в статус «Одобрено (Оферта)». Предприниматель получит уведомление в личном кабинете и сможет акцептовать условия и подписать кредитный договор.
            </div>
          </div>

          <div className="p-4 rounded-[12px] bg-[#f5f6f7] border border-[#e6e8ea] space-y-2 text-[13px]">
            <div className="flex justify-between items-center pb-2 border-b border-[#e6e8ea]">
              <span className="text-[#686b70]">Выбранный вариант:</span>
              <span className="font-bold text-xs px-2.5 py-0.5 rounded-full bg-white border border-[#d1d5d8] text-[#141414]">
                {selectedPreset === 'scoring'
                  ? 'ScoringEngine (Авто)'
                  : selectedPreset === 'ai'
                  ? 'AI-ассистент'
                  : 'Свой вариант (Экспертный)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#686b70]">Сумма кредита:</span>
              <strong className="text-[15px] text-[#141414]">{formatRubles(approveAmount)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#686b70]">Срок:</span>
              <strong className="text-[#141414]">{approveTerm} мес.</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#686b70]">Процентная ставка:</span>
              <strong className="text-[#141414]">{approveRate}% годовых</strong>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#e6e8ea]">
              <span className="text-[#686b70]">Ежемесячный платёж:</span>
              <strong className="text-[#176b45] text-[15px]">{formatRubles(currentMonthlyPayment)} / мес</strong>
            </div>
            {comment && (
              <div className="pt-2 border-t border-[#e6e8ea]">
                <span className="text-[#686b70] block text-[11px] mb-0.5">Комментарий аналитика:</span>
                <span className="text-[#141414] italic">«{comment}»</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e6e8ea]">
            <button
              type="button"
              onClick={() => setActiveModal('approve')}
              className="rounded-[12px] px-[18px] py-[12px] font-bold text-[14px] bg-[#f5f6f7] text-[#141414] border border-[#e6e8ea] hover:bg-[#e6e8ea] cursor-pointer"
            >
              Вернуться к редактированию
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalApprove}
              className="rounded-[12px] px-[21px] py-[12px] font-bold text-[14px] bg-[#EF3124] hover:bg-[#cd2017] text-white cursor-pointer disabled:opacity-45"
            >
              {isSubmitting ? 'Одобрение...' : 'Да, подтверждаю одобрение'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Окно подтверждения T13: Отказ */}
      <Modal
        isOpen={activeModal === 'confirm_decline'}
        onClose={() => setActiveModal('decline')}
        title="Подтверждение отказа по заявке (T13)"
        description="Вы уверены, что хотите отклонить эту заявку?"
      >
        <div className="space-y-4 text-[#141414]">
          <div className="p-4 rounded-[12px] bg-[#fff1ef] border border-[#fac6c2] flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#EF3124] shrink-0 mt-0.5" />
            <div className="text-[13px] leading-relaxed">
              <strong className="block text-[#141414] mb-1">Решение об отказе окончательное</strong>
              Заявка будет переведена в статус «Отклонено (T13)». Клиент увидит причину отказа в личном кабинете. Повторная подача заявки будет ограничена регламентным сроком (30 дней).
            </div>
          </div>

          <div className="p-4 rounded-[12px] bg-[#f5f6f7] border border-[#e6e8ea] space-y-2 text-[13px]">
            <div>
              <span className="text-[#686b70] block text-[11px] mb-0.5">Код причины:</span>
              <strong className="text-[#141414]">{reasonCode}</strong>
            </div>
            {comment && (
              <div className="pt-2 border-t border-[#e6e8ea]">
                <span className="text-[#686b70] block text-[11px] mb-0.5">Пояснение клиенту:</span>
                <span className="text-[#141414] italic">«{comment}»</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e6e8ea]">
            <button
              type="button"
              onClick={() => setActiveModal('decline')}
              className="rounded-[12px] px-[18px] py-[12px] font-bold text-[14px] bg-[#f5f6f7] text-[#141414] border border-[#e6e8ea] hover:bg-[#e6e8ea] cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalDecline}
              className="rounded-[12px] px-[21px] py-[12px] font-bold text-[14px] bg-[#EF3124] hover:bg-[#cd2017] text-white cursor-pointer disabled:opacity-45"
            >
              {isSubmitting ? 'Отклонение...' : 'Да, подтверждаю отказ'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Окно подтверждения T16: Некредитное закрытие */}
      <Modal
        isOpen={activeModal === 'confirm_close'}
        onClose={() => setActiveModal('close')}
        title="Подтверждение закрытия заявки (T16)"
        description="Вы уверены, что хотите закрыть эту заявку?"
      >
        <div className="space-y-4 text-[#141414]">
          <div className="p-4 rounded-[12px] bg-[#fff7e8] border border-[#f3dfc1] flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#885215] shrink-0 mt-0.5" />
            <div className="text-[13px] leading-relaxed text-[#714817]">
              <strong className="block text-[#141414] mb-1">Некредитное препятствие (T16)</strong>
              Заявка будет закрыта без вынесения кредитного решения и переведена в архивный статус.
            </div>
          </div>

          {comment && (
            <div className="p-4 rounded-[12px] bg-[#f5f6f7] border border-[#e6e8ea] text-[13px]">
              <span className="text-[#686b70] block text-[11px] mb-0.5">Причина закрытия:</span>
              <span className="text-[#141414] italic">«{comment}»</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e6e8ea]">
            <button
              type="button"
              onClick={() => setActiveModal('close')}
              className="rounded-[12px] px-[18px] py-[12px] font-bold text-[14px] bg-[#f5f6f7] text-[#141414] border border-[#e6e8ea] hover:bg-[#e6e8ea] cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalClose}
              className="rounded-[12px] px-[21px] py-[12px] font-bold text-[14px] bg-[#EF3124] hover:bg-[#cd2017] text-white cursor-pointer disabled:opacity-45"
            >
              {isSubmitting ? 'Закрытие...' : 'Да, закрыть заявку'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Модальное окно подтверждения удаления анкеты */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        title="Удаление кредитной анкеты"
        description="Подтвердите безвозвратное удаление анкеты из базы данных"
      >
        <div className="space-y-4 text-[#141414]">
          <div className="p-4 rounded-[12px] bg-[#fff1ef] border border-[#fac6c2] flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#EF3124] shrink-0 mt-0.5" />
            <div className="text-[13px] leading-relaxed text-[#cd2017]">
              <strong className="block text-[#141414] mb-1">Безвозвратное действие</strong>
              Кредитная анкета клиента{' '}
              <span className="font-semibold text-[#141414]">
                {application.companyName || (application.inn ? `ИНН ${application.inn}` : application.id)}
              </span>
              , прикрепленные документы, результаты проверок и вся история переходов будут полностью удалены.
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e6e8ea]">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setIsDeleteModalOpen(false)}
              className="rounded-[12px] px-[18px] py-[12px] font-bold text-[14px] bg-[#f5f6f7] text-[#141414] border border-[#e6e8ea] hover:bg-[#e6e8ea] cursor-pointer disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDeleteConfirm}
              className="rounded-[12px] px-[21px] py-[12px] font-bold text-[14px] bg-[#EF3124] hover:bg-[#cd2017] text-white cursor-pointer disabled:opacity-45 inline-flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Удаление...' : 'Да, удалить анкету'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};