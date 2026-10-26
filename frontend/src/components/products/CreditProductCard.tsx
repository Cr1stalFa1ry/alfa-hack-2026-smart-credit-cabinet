import React from 'react';
import { CreditProductConfig, ProductCode } from '../../types/products';
import { ProductCodeBadge } from '../badges/ProductCodeBadge';
import { formatRubles } from '../../utils/formatters';
import { Button } from '../common/Button';
import { Check, ShieldCheck, UserCheck, Cpu, ArrowRight } from 'lucide-react';

interface CreditProductCardProps {
  product: CreditProductConfig;
  isSelected?: boolean;
  onSelect?: (code: ProductCode) => void;
  actionText?: string;
  showAction?: boolean;
  compact?: boolean;
  className?: string;
}

export const CreditProductCard: React.FC<CreditProductCardProps> = ({
  product,
  isSelected = false,
  onSelect,
  actionText = 'Выбрать продукт',
  showAction = true,
  compact = false,
  className = '',
}) => {
  const isSelectedStyles = isSelected
    ? 'ring-2 ring-alfa-500 border-alfa-500 bg-alfa-50/20 dark:bg-alfa-950/20'
    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900';

  const accentBorderColor: Record<ProductCode, string> = {
    WC: 'border-t-emerald-500',
    EQ: 'border-t-blue-500',
    START: 'border-t-purple-500',
    RESTART: 'border-t-amber-500',
  };

  const getDecisionIcon = () => {
    switch (product.decisionMaker) {
      case 'system':
        return <Cpu className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'analyst':
        return <UserCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      case 'hybrid':
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <div
      onClick={() => onSelect && onSelect(product.code)}
      className={`rounded-2xl border border-t-4 transition-all duration-200 p-5 flex flex-col justify-between ${accentBorderColor[product.code]} ${isSelectedStyles} ${
        onSelect ? 'cursor-pointer hover:shadow-md' : ''
      } ${className}`}
    >
      <div className="space-y-4">
        {/* Header with Badges */}
        <div className="flex items-start justify-between gap-3">
          <ProductCodeBadge code={product.code} size="md" />
          {isSelected && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-alfa-600 dark:text-alfa-400 bg-alfa-50 dark:bg-alfa-950/60 px-2 py-0.5 rounded-full border border-alfa-200 dark:border-alfa-800">
              <Check className="w-3 h-3 stroke-[3]" /> Выбран
            </span>
          )}
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {product.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Financial Parameters */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 block">
              Лимит суммы
            </span>
            <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 block">
              {formatRubles(product.minAmount)} – {formatRubles(product.maxAmount)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 block">
              Срок кредита
            </span>
            <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 block">
              {product.minTermMonths} – {product.maxTermMonths} мес.
            </span>
          </div>
        </div>

        {/* Rate & Audience Info */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span className="text-slate-400 dark:text-slate-500">Ставка:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              от {product.minInterestRate}% до {product.maxInterestRate}%
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span className="text-slate-400 dark:text-slate-500">Для кого:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {product.allowedStages.length > 1
                ? 'Operating и Prelaunch'
                : product.allowedStages[0] === 'operating'
                ? 'Действующий бизнес'
                : 'Только Prelaunch (новый)'}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="mt-0.5">{getDecisionIcon()}</span>
              <span>
                <strong className="text-slate-700 dark:text-slate-300 font-medium">Условия: </strong>
                {product.decisionRule}
              </span>
            </div>
          </div>
        </div>
      </div>

      {showAction && onSelect && (
        <div className="pt-4 mt-3">
          <Button
            type="button"
            variant={isSelected ? 'primary' : 'outline'}
            size="sm"
            className="w-full justify-center"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product.code);
            }}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
};
