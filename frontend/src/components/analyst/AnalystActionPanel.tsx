import React, { useState } from 'react';
import { CreditApplication } from '../../types/application';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Modal } from '../common/Modal';
import { Check, X, HelpCircle, RefreshCw, Ban } from 'lucide-react';

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

  // Form states
  const [approveAmount, setApproveAmount] = useState(application.requestedAmount);
  const [approveTerm, setApproveTerm] = useState(application.requestedTermMonths);
  const [approveRate, setApproveRate] = useState(14.9);
  const [comment, setComment] = useState('');
  const [reasonCode, setReasonCode] = useState('HIGH_RISK_SCORE');

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
          <Input
            label="Срок кредитования (месяцев)"
            type="number"
            value={approveTerm}
            onChange={(e) => setApproveTerm(Number(e.target.value))}
            required
          />
          <Input
            label="Годовая процентная ставка (%)"
            type="number"
            step="0.1"
            value={approveRate}
            onChange={(e) => setApproveRate(Number(e.target.value))}
            required
          />
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
