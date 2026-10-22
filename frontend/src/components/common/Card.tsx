import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'flat' | 'outline' | 'alfa';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className,
  ...props
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3.5 sm:p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const variantClasses = {
    default:
      'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none',
    flat: 'bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800',
    outline: 'bg-transparent border border-slate-300 dark:border-slate-700',
    alfa: 'bg-gradient-to-br from-alfa-50 dark:from-alfa-950/40 to-white dark:to-slate-900 border border-alfa-200 dark:border-alfa-900/60 shadow-sm shadow-alfa-500/5',
  };

  return (
    <div
      className={clsx(
        'rounded-2xl transition-all duration-150',
        paddingClasses[padding],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
