import React from 'react';

const VARIANT_MAP = {
  income: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  expense: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  debt: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  receivable: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  info: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  neutral: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
};

export const Badge = ({ children, variant = 'neutral', icon: Icon, className = '' }) => {
  const styles = VARIANT_MAP[variant] || VARIANT_MAP.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border transition-colors ${styles} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </span>
  );
};

export default Badge;
