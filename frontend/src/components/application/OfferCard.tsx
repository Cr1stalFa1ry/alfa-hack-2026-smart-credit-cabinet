import React, { useState } from 'react';
import { CreditOffer } from '../../types/application';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { formatRubles, formatPercent, formatDate } from '../../utils/formatters';
import { CheckCircle2, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface OfferCardProps {
  offer: CreditOffer;
  onAccept: (useAlternative: boolean) => Promise<void>;
  isLoading?: boolean;
}

export const OfferCard: React.FC<OfferCardProps> = ({ offer, onAccept, isLoading = false }) => {
  const [selectedTerm, setSelectedTerm] = useState<'standard' | 'alternative'>('standard');

  const isAccepted = offer.isAccepted;

  return (
    <Card variant="alfa" className="relative overflow-hidden">
      <div className="flex items-center gap-2 text-alfa-600 dark:text-alfa-400 font-bold text-xs uppercase tracking-wider mb-2">
        <Sparkles className="w-4 h-4" />
        Персональное кредитное предложение Альфа-Банка
      </div>

      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {formatRubles(offer.approvedAmount)}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ставка {formatPercent(offer.annualInterestRate)} годовых • Без скрытых комиссий
          </p>
        </div>

        {offer.expirationDate && (
          <span className="text-xs text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
            Действует до {formatDate(offer.expirationDate)}
          </span>
        )}
      </div>

      {/* Choice of terms: Standard vs Alternative (+6m) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Standard term */}
        <div
          onClick={() => !isAccepted && setSelectedTerm('standard')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedTerm === 'standard'
              ? 'bg-white dark:bg-slate-900 border-alfa-500 shadow-md ring-2 ring-alfa-200 dark:ring-alfa-900/60'
              : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Базовый вариант</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {offer.approvedTermMonths} месяцев
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatRubles(offer.monthlyPayment)}{' '}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ мес</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            Сумма выплат за весь срок: {formatRubles(offer.totalRepayment)}
          </p>
        </div>

        {/* Alternative term (+6 months) as requested in backend.md */}
        {offer.alternativeTerms && (
          <div
            onClick={() => !isAccepted && setSelectedTerm('alternative')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              selectedTerm === 'alternative'
                ? 'bg-white dark:bg-slate-900 border-alfa-500 shadow-md ring-2 ring-alfa-200 dark:ring-alfa-900/60'
                : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Сниженный платёж
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                {offer.alternativeTerms.newTermMonths} месяцев (+{offer.alternativeTerms.additionalMonths} мес)
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatRubles(offer.alternativeTerms.newMonthlyPayment)}{' '}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ мес</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {offer.alternativeTerms.note}
            </p>
          </div>
        )}
      </div>

      {/* Action footer */}
      <div className="pt-4 border-t border-alfa-200/60 dark:border-alfa-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Деньги зачисляются на ваш расчётный счёт в Альфа-Банке сразу после подтверждения
        </div>

        {isAccepted ? (
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Оферта принята • Кредит выдан
          </div>
        ) : (
          <Button
            size="lg"
            variant="primary"
            isLoading={isLoading}
            onClick={() => onAccept(selectedTerm === 'alternative')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Принять предложение и получить деньги
          </Button>
        )}
      </div>
    </Card>
  );
};
