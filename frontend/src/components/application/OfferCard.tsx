import React, { useState } from 'react';
import { CreditOffer } from '../../types/application';
import { formatRubles, formatPercent, formatDate } from '../../utils/formatters';
import { CheckCircle2, ArrowRight, SlidersHorizontal, Sparkles } from 'lucide-react';

interface OfferCardProps {
  offer: CreditOffer;
  onAccept: (useAlternative: boolean) => Promise<void>;
  onRequestAlternative?: () => void;
  isLoading?: boolean;
}

export const OfferCard: React.FC<OfferCardProps> = ({
  offer,
  onAccept,
  onRequestAlternative,
  isLoading = false,
}) => {
  const [selectedTerm, setSelectedTerm] = useState<'standard' | 'alternative'>('standard');
  const isAccepted = offer.isAccepted;

  return (
    <div className="p-6 sm:p-[30px] border border-[#efddd8] rounded-[22px] bg-[#fff8f6] text-[#141414]">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] tracking-[0.12em] uppercase text-[#EF3124] font-bold">
            Персональное кредитное предложение Альфа-Банка
          </span>
          {offer.isCounterOffer && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#fde68a] text-[#78350f] px-2.5 py-0.5 text-[11px] font-bold">
              <Sparkles className="w-3 h-3" /> Встречное предложение
            </span>
          )}
        </div>
        {offer.expirationDate && (
          <span className="inline-block rounded-[7px] bg-white border border-[#efddd8] px-[9px] py-[4px] text-[11px] text-[#686b70]">
            Действует до {formatDate(offer.expirationDate)}
          </span>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-[32px] sm:text-[38px] font-bold tracking-[-0.045em] leading-[1.08] text-[#141414] mb-2">
          {formatRubles(offer.approvedAmount)}
        </h2>
        <p className="text-[14px] text-[#686b70] m-0">
          Фиксированная ставка {formatPercent(offer.annualInterestRate)} годовых • Без скрытых комиссий
        </p>
      </div>

      {/* Выбор варианта срока (.choice из макет.html) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-6">
        <label
          onClick={() => !isAccepted && setSelectedTerm('standard')}
          className={`p-5 rounded-[14px] border cursor-pointer transition-colors block ${
            selectedTerm === 'standard'
              ? 'border-[#EF3124] bg-[#fff1ef]'
              : 'border-[#e6e8ea] bg-white hover:border-[#D1D5D8]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-bold uppercase text-[#686b70]">Базовый вариант</span>
            <span className="inline-block rounded-[7px] bg-white px-2.5 py-0.5 text-[11px] font-bold text-[#141414] border border-[#e6e8ea]">
              {offer.approvedTermMonths} мес.
            </span>
          </div>
          <strong className="text-[25px] font-bold tracking-[-0.04em] block text-[#141414]">
            {formatRubles(offer.monthlyPayment)}{' '}
            <span className="text-[12px] font-normal text-[#686b70]">/ мес</span>
          </strong>
          <span className="text-[12px] text-[#686b70] block mt-2">
            Всего к возврату: {formatRubles(offer.totalRepayment)}
          </span>
        </label>

        {offer.alternativeTerms && (
          <label
            onClick={() => !isAccepted && setSelectedTerm('alternative')}
            className={`p-5 rounded-[14px] border cursor-pointer transition-colors block ${
              selectedTerm === 'alternative'
                ? 'border-[#EF3124] bg-[#fff1ef]'
                : 'border-[#e6e8ea] bg-white hover:border-[#D1D5D8]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-bold uppercase text-[#176b45]">Сниженный платёж</span>
              <span className="inline-block rounded-[7px] bg-[#edf7f0] text-[#176b45] px-2.5 py-0.5 text-[11px] font-bold">
                {offer.alternativeTerms.newTermMonths} мес. (+{offer.alternativeTerms.additionalMonths} мес.)
              </span>
            </div>
            <strong className="text-[25px] font-bold tracking-[-0.04em] block text-[#176b45]">
              {formatRubles(offer.alternativeTerms.newMonthlyPayment)}{' '}
              <span className="text-[12px] font-normal text-[#686b70]">/ мес</span>
            </strong>
            <span className="text-[12px] text-[#686b70] block mt-2">{offer.alternativeTerms.note}</span>
          </label>
        )}
      </div>

      <div className="pt-5 border-t border-[#efddd8] flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-[12px] text-[#686b70]">
          Средства зачисляются на расчётный счёт в Альфа-Банке сразу после акцепта оферты
        </span>

        {isAccepted ? (
          <div className="inline-flex items-center gap-2 px-4 py-3 rounded-[12px] bg-[#edf7f0] text-[#176b45] font-bold text-[14px]">
            <CheckCircle2 className="w-5 h-5" />
            Оферта принята • Кредит выдан
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onAccept(selectedTerm === 'alternative')}
              className="rounded-[12px] px-[21px] py-[14px] font-bold text-[14px] inline-flex items-center justify-center gap-2.5 bg-[#EF3124] hover:bg-[#cd2017] text-white transition-colors cursor-pointer disabled:opacity-45"
            >
              <span>{isLoading ? 'Оформление...' : 'Принять предложение'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {onRequestAlternative && (
              <button
                type="button"
                disabled={isLoading}
                onClick={onRequestAlternative}
                className="rounded-[12px] px-[18px] py-[14px] font-bold text-[14px] inline-flex items-center justify-center gap-2 bg-white hover:bg-[#fff1ef] text-[#141414] hover:text-[#EF3124] border border-[#d1d5d8] hover:border-[#fac6c2] transition-colors cursor-pointer disabled:opacity-45"
              >
                <SlidersHorizontal className="w-4 h-4 text-[#686b70]" />
                <span>Запросить другие условия</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};