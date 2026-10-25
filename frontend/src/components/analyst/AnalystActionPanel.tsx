import React, { useState } from 'react';
import { CreditApplication } from '../../types/application';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Modal } from '../common/Modal';
import { formatRubles, formatPercent, calculateMonthlyPayment } from '../../utils/formatters';
import { Check, X, HelpCircle, RefreshCw, Ban, Sparkles, Calculator } from 'lucide-react';

interface AnalystActionPanelProps {
  application: CreditApplication;
  onApprove: (params: { approvedAmount: number; approvedTermMonths: number; annualInterestRate: number; comment?: string }) => Promise<void>;
  onDecline: (reasonCode: string, comment: string) => Promise<void>;
  onRequestInfo: (prompt: string) => Promise<void>;
  onReturnToChecking: (comment?: string) => Promise<void>;
  onCloseNonCredit: (reasonCode: string, comment: string) => Promise<void>;
}

export const AnalystActionPanel: React.FC<AnalystActionPanelProps> = ({
  application,
  onApprove,
  onDecline,
  onRequestInfo,
  onReturnToChecking,
  onCloseNonCredit,
}) => {
  const [activeModal, setActiveModal] = useState<'approve' | 'decline' | 'need_info' | 'recheck' | 'close' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states with fallback to calculated scoring recommendation if present
  const defaultAmount = application.currentOffer?.approvedAmount || application.recommendedOffer?.approvedAmount || application.offer?.approvedAmount || application.requestedAmount;
  const defaultTerm = application.currentOffer?.termMonths || application.recommendedOffer?.approvedTermMonths || application.offer?.approvedTermMonths || application.requestedTermMonths;
  const defaultRate = application.currentOffer?.annualRatePercent || application.recommendedOffer?.annualInterestRate || application.offer?.annualInterestRate || 18.0;

  const [approveAmount, setApproveAmount] = useState(defaultAmount);
  const [approveTerm, setApproveTerm] = useState(defaultTerm);
  const [approveRate, setApproveRate] = useState(defaultRate);
  const [comment, setComment] = useState('');
  const [reasonCode, setReasonCode] = useState('HIGH_RISK_SCORE');

  React.useEffect(() => {
    setApproveAmount(application.currentOffer?.approvedAmount || application.recommendedOffer?.approvedAmount || application.offer?.approvedAmount || application.requestedAmount);
    setApproveTerm(application.currentOffer?.termMonths || application.recommendedOffer?.approvedTermMonths || application.offer?.approvedTermMonths || application.requestedTermMonths);
    setApproveRate(application.currentOffer?.annualRatePercent || application.recommendedOffer?.annualInterestRate || application.offer?.annualInterestRate || 18.0);
  }, [application]);

  const currentMonthlyPayment = calculateMonthlyPayment(approveAmount, approveRate, approveTerm);
  const totalRepayment = currentMonthlyPayment * Number(approveTerm || 0);

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleDeclineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onDecline(reasonCode, comment || 'Отказ по результатам экспертной оценки андеррайтера');
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

  const handleCloseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onCloseNonCredit('PRODUCT_NA_AMOUNT', comment || 'Запрашиваемые параметры не соответствуют продуктовой линейке');
      setActiveModal(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="bg-gradient-to-r from-purple-50/50 dark:from-purple-950/30 via-white dark:via-slate-900 to-slate-50 dark:to-slate-900 border-purple-200 dark:border-purple-900/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
              Рабочее место андеррайтера
            </span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
              Принятие экспертного решения по заявке
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Доступны переходы T11–T16 согласно регламенту оценки рисков
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* T12 Approve */}
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Check className="w-4 h-4" />}
              onClick={() => {
                setComment('');
                setActiveModal('approve');
              }}
            >
              Одобрить оферту (T12)
            </Button>

            {/* T11 Need Info */}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<HelpCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />}
              onClick={() => {
                setComment('Просим прислать выписку по счетам за последние 6 месяцев для подтверждения оборотов');
                setActiveModal('need_info');
              }}
            >
              Запросить сведения (T11)
            </Button>

            {/* T14 Recheck */}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
              onClick={() => {
                setComment('Параметры скорректированы, запуск повторного скоринга');
                setActiveModal('recheck');
              }}
            >
              На скоринг (T14)
            </Button>

            {/* T13 Decline */}
            <Button
              variant="danger"
              size="sm"
              leftIcon={<X className="w-4 h-4" />}
              onClick={() => {
                setComment('');
                setActiveModal('decline');
              }}
            >
              Отказать (T13)
            </Button>

            {/* T16 Close non-credit */}
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Ban className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
              onClick={() => {
                setComment('');
                setActiveModal('close');
              }}
            >
              Закрыть (T16)
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal: T12 Approve */}
      <Modal
        isOpen={activeModal === 'approve'}
        onClose={() => setActiveModal(null)}
        title="Одобрение кредитной заявки (T12)"
        description="Сформируйте финальные условия оферты для предпринимателя"
      >
        <form onSubmit={handleApproveSubmit} className="space-y-4">
          <Input
            label="Одобренная сумма (₽)"
            type="number"
            value={approveAmount}
            onChange={(e) => setApproveAmount(Number(e.target.value))}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Срок кредитования (мес)"
              type="number"
              value={approveTerm}
              onChange={(e) => setApproveTerm(Number(e.target.value))}
              required
            />
            <Input
              label="Ставка (% годовых)"
              type="number"
              step="0.1"
              value={approveRate}
              onChange={(e) => setApproveRate(Number(e.target.value))}
              required
            />
          </div>

          {/* Dynamic calculated payment and terms box */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <Calculator className="w-3.5 h-3.5 text-alfa-500" />
                Расчётный платёж (аннуитет):
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white text-base">
                {formatRubles(currentMonthlyPayment)} <span className="text-xs font-normal text-slate-400">/ мес</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
              <span>Всего к возврату за {approveTerm} мес.:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {formatRubles(totalRepayment)}
              </span>
            </div>
            {application.offer && (
              <div className="pt-1.5 mt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" /> Рекомендация: {formatRubles(application.offer.approvedAmount)} • {application.offer.approvedTermMonths} мес • {formatPercent(application.offer.annualInterestRate)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setApproveAmount(application.offer!.approvedAmount);
                    setApproveTerm(application.offer!.approvedTermMonths);
                    setApproveRate(application.offer!.annualInterestRate);
                  }}
                  className="text-alfa-600 dark:text-alfa-400 hover:underline font-bold shrink-0 ml-2"
                >
                  Применить
                </button>
              </div>
            )}
          </div>

          <Textarea
            label="Комментарий андеррайтера (для аудита)"
            placeholder="Обоснование решения, учтенные факторы..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setActiveModal(null)}>
              Отмена
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Утвердить оферту
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: T11 Need Info */}
      <Modal
        isOpen={activeModal === 'need_info'}
        onClose={() => setActiveModal(null)}
        title="Запрос сведений у клиента (T11)"
        description="Заявка перейдет в статус need_info. Клиент получит уведомление"
      >
        <form onSubmit={handleNeedInfoSubmit} className="space-y-4">
          <Textarea
            label="Текст запроса клиенту"
            placeholder="Укажите, какие документы или пояснения требуются..."
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
              Быстрые шаблоны дозапроса сведений:
            </span>
            <div className="flex flex-col gap-1.5">
              {[
                'Предоставьте выписку по расчетному счету за последние 6 месяцев для подтверждения оборотов',
                'Приложите договор аренды коммерческого помещения или свидетельство о собственности',
                'Предоставьте спецификацию или счёт на оплату оборудования от выбранного поставщика',
                'Поясните расхождение между заявленной выручкой и данными налоговой отчётности',
              ].map((templateText, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setComment(templateText)}
                  className="text-left text-xs p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  • {templateText}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setActiveModal(null)}>
              Отмена
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Отправить запрос клиенту
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: T13 Decline */}
      <Modal
        isOpen={activeModal === 'decline'}
        onClose={() => setActiveModal(null)}
        title="Отказ по заявке (T13)"
        description="Зафиксируйте код причины и комментарий для прозрачного информирования"
      >
        <form onSubmit={handleDeclineSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Причина отказа
            </label>
            <select
              className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-alfa-100"
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
            >
              <option value="HIGH_RISK_SCORE">Недостаточный скоринговый балл (высокий риск)</option>
              <option value="DSCR_TOO_LOW">Коэффициент покрытия долга (DSCR) ниже норматива</option>
              <option value="CRITICAL_BKI_OVERDUE">Критические просрочки по данным БКИ</option>
              <option value="TAX_ARREARS">Наличие непогашенной налоговой задолженности в ФНС</option>
              <option value="DISCREPANCY_IN_TURNOVER">Существенные расхождения в заявленной и реальной выручке</option>
            </select>
          </div>

          <Textarea
            label="Пояснение клиенту"
            placeholder="Опишите причину понятным языком..."
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setActiveModal(null)}>
              Отмена
            </Button>
            <Button variant="danger" type="submit" isLoading={isSubmitting}>
              Подтвердить отказ
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: T14 Recheck */}
      <Modal
        isOpen={activeModal === 'recheck'}
        onClose={() => setActiveModal(null)}
        title="Возврат на автопроверку (T14)"
        description="Заявка вернется в checking для пересчета скоринга"
      >
        <form onSubmit={handleRecheckSubmit} className="space-y-4">
          <Textarea
            label="Причина повторной проверки"
            placeholder="Уточнены обороты / обновлена выписка..."
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setActiveModal(null)}>
              Отмена
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Отправить на скоринг
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: T16 Close non-credit */}
      <Modal
        isOpen={activeModal === 'close'}
        onClose={() => setActiveModal(null)}
        title="Некредитное закрытие (T16)"
        description="Закрытие заявки по некредитным препятствиям (например, несоответствие продукту)"
      >
        <form onSubmit={handleCloseSubmit} className="space-y-4">
          <Textarea
            label="Комментарий"
            placeholder="Причина закрытия..."
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setActiveModal(null)}>
              Отмена
            </Button>
            <Button variant="danger" type="submit" isLoading={isSubmitting}>
              Закрыть заявку
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
