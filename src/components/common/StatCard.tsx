import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  change?: number; // e.g. +4.5 or -12.3
  changeLabel?: string;
  inverseChange?: boolean; // if true, negative is positive (like waste reduction)
  subtitle?: string;
  icon?: React.ElementType;
  onClick?: () => void;
  actionHint?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  change,
  changeLabel = 'vs last period',
  inverseChange = false,
  subtitle,
  icon: Icon,
  onClick,
  actionHint,
}) => {
  const isPositive = change !== undefined ? (inverseChange ? change < 0 : change > 0) : null;
  const isNeutral = change === 0;

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={e => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs transition-all flex flex-col justify-between group ${
        onClick
          ? 'cursor-pointer hover:border-emerald-400 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20'
          : 'hover:border-slate-300'
      }`}
    >
      <div>
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span className="group-hover:text-slate-900 transition-colors flex items-center gap-1.5">
            <span>{label}</span>
          </span>
          {Icon && (
            <div className="w-7 h-7 rounded-lg bg-[#f0f7f4] text-emerald-800 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Icon className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
            {value}
          </span>
          {unit && <span className="text-sm font-medium text-slate-500">{unit}</span>}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        {change !== undefined ? (
          <div className="flex items-center gap-1.5 text-xs">
            <span
              className={`flex items-center font-semibold ${
                isNeutral
                  ? 'text-slate-500'
                  : isPositive
                  ? 'text-emerald-700'
                  : 'text-rose-600'
              }`}
            >
              {isNeutral ? (
                <Minus className="w-3 h-3 mr-0.5" />
              ) : change > 0 ? (
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3 h-3 mr-0.5" />
              )}
              {Math.abs(change)}%
            </span>
            <span className="text-slate-400 text-[11px]">{changeLabel}</span>
          </div>
        ) : (
          <span className="text-slate-400 text-[11px]">{subtitle || 'Active monitoring'}</span>
        )}

        {onClick && (
          <span className="text-[10px] text-emerald-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
            <span>{actionHint || 'Open module'}</span>
            <span>&rarr;</span>
          </span>
        )}
        {!onClick && subtitle && change !== undefined && (
          <span className="text-[11px] text-slate-400 hidden xl:inline">{subtitle}</span>
        )}
      </div>
    </div>
  );
};
