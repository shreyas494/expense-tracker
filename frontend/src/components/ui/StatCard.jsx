import React from 'react';
import { motion } from 'framer-motion';

export const StatCard = ({
  title,
  amount,
  subtitle,
  icon: Icon,
  iconBg = 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  badgeText,
  badgeVariant = 'neutral',
  accentColor = 'border-l-teal-500',
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {typeof amount === 'number' ? `₹${amount.toLocaleString('en-IN')}` : amount}
          </h3>
          {subtitle && (
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 pt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {badgeText && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-500 dark:text-slate-400">{badgeText}</span>
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
