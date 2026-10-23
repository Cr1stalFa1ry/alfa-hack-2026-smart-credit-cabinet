import React from 'react';
import { ProductCode } from '../../types/products';
import { CREDIT_PRODUCTS } from '../../config/products';
import { Wrench, Repeat, Rocket } from 'lucide-react';

interface ProductCodeBadgeProps {
  code?: ProductCode | string;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProductCodeBadge: React.FC<ProductCodeBadgeProps> = ({
  code,
  showName = true,
  size = 'md',
  className = '',
}) => {
  const normalizedCode = (code?.toUpperCase() || 'WC') as ProductCode;
  const config = CREDIT_PRODUCTS[normalizedCode] || CREDIT_PRODUCTS.WC;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2 font-bold',
  }[size];

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  const colorStyles: Record<ProductCode, string> = {
    EQ: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60',
    WC: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
    START: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/60',
  };

  const getIcon = () => {
    switch (normalizedCode) {
      case 'EQ':
        return <Wrench className={iconSize} />;
      case 'WC':
        return <Repeat className={iconSize} />;
      case 'START':
        return <Rocket className={iconSize} />;
      default:
        return <Repeat className={iconSize} />;
    }
  };

  return (
    <span
      title={`${config.name} (${config.code}) — ${config.description}`}
      className={`inline-flex items-center font-extrabold rounded-md border tracking-tight transition-colors ${
        colorStyles[normalizedCode] || colorStyles.WC
      } ${sizeClasses} ${className}`}
    >
      {getIcon()}
      <span className="font-mono">{config.code}</span>
      {showName && <span className="font-medium text-opacity-90">• {config.shortName}</span>}
    </span>
  );
};
