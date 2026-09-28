import React, { useState } from 'react';
import { TimeSeriesSustainabilityPoint } from '../../types/sustainability';
import { ShieldCheck, ArrowUpRight, TrendingDown, CheckCircle2 } from 'lucide-react';

interface RecoveredVsWastedChartProps {
  dataPoints: TimeSeriesSustainabilityPoint[];
}

export const RecoveredVsWastedChart: React.FC<RecoveredVsWastedChartProps> = ({ dataPoints }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const width = 560;
  const height = 240;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(
    ...dataPoints.map(d => Math.max(d.wasteKg, d.recoveredDeliveredKg)),
    10
  ) * 1.2;

  const getY = (val: number) => {
    if (maxVal <= 0) return 0;
    return (val / maxVal) * chartHeight;
  };

  const barCount = dataPoints.length || 1;
  const slotWidth = chartWidth / barCount;
  const singleBarWidth = Math.min(14, Math.max(8, slotWidth * 0.32));

  const totalWaste = dataPoints.reduce((sum, d) => sum + d.wasteKg, 0);
  const totalRecovered = dataPoints.reduce((sum, d) => sum + d.recoveredDeliveredKg, 0);
  const recoveryRatio = totalWaste + totalRecovered > 0
    ? Number(((totalRecovered / (totalWaste + totalRecovered)) * 100).toFixed(1))
    : 0;

  const activePoint = hoveredIdx !== null && dataPoints[hoveredIdx] ? dataPoints[hoveredIdx] : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              Food Recovered vs. Discarded Waste
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              {recoveryRatio}% Recovery Ratio
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Confirmed delivered surplus redirected to community pantries vs. kitchen discards
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] self-start sm:self-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600"></span>
            <span className="font-medium text-slate-700">Delivered Recovery</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500"></span>
            <span className="font-medium text-slate-700">Discarded Waste</span>
          </div>
        </div>
      </div>

      {/* SVG Comparison Bars */}
      <div className="relative w-full overflow-x-auto mt-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none overflow-visible"
          style={{ minWidth: '440px' }}
        >
          {/* Y Axis Grid Lines */}
          {[0, 0.33, 0.66, 1.0].map((ratio, idx) => {
            const y = paddingTop + chartHeight * (1 - ratio);
            const val = Math.round(maxVal * ratio);
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                  fontFamily="monospace"
                >
                  {val}kg
                </text>
              </g>
            );
          })}

          {/* Grouped Bars per Period */}
          {dataPoints.map((d, idx) => {
            const groupCenter = paddingLeft + idx * slotWidth + slotWidth / 2;
            const wasteX = groupCenter - singleBarWidth - 1.5;
            const recX = groupCenter + 1.5;

            const wasteH = Math.max(3, getY(d.wasteKg));
            const wasteY = paddingTop + chartHeight - wasteH;

            const recH = Math.max(3, getY(d.recoveredDeliveredKg));
            const recY = paddingTop + chartHeight - recH;

            const isHovered = hoveredIdx === idx;

            return (
              <g
                key={idx}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Hit Box */}
                <rect
                  x={groupCenter - slotWidth / 2}
                  y={paddingTop}
                  width={slotWidth}
                  height={chartHeight + 25}
                  fill={isHovered ? 'rgba(16, 185, 129, 0.05)' : 'transparent'}
                  rx="4"
                />

                {/* Waste Bar (Rose) */}
                <rect
                  x={wasteX}
                  y={wasteY}
                  width={singleBarWidth}
                  height={wasteH}
                  rx="3"
                  fill={isHovered ? '#e11d48' : '#f43f5e'}
                  className="transition-all duration-150"
                />

                {/* Recovered & Delivered Bar (Emerald) */}
                <rect
                  x={recX}
                  y={recY}
                  width={singleBarWidth}
                  height={recH}
                  rx="3"
                  fill={isHovered ? '#059669' : '#10b981'}
                  className="transition-all duration-150"
                />

                {/* Period Label */}
                <text
                  x={groupCenter}
                  y={height - paddingBottom + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight={isHovered ? '700' : '500'}
                  fill={isHovered ? '#0f172a' : '#64748b'}
                >
                  {d.dateLabel.split(' ')[0]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {activePoint && hoveredIdx !== null && (
          <div
            className="absolute z-20 bg-slate-900 text-white rounded-xl p-3 shadow-xl pointer-events-none text-xs w-60 border border-slate-700/80 -translate-x-1/2 -translate-y-full"
            style={{
              left: `${((paddingLeft + hoveredIdx * slotWidth + slotWidth / 2) / width) * 100}%`,
              top: `${paddingTop + 60}px`,
            }}
          >
            <div className="font-bold text-white pb-1.5 border-b border-slate-800 flex justify-between">
              <span>{activePoint.dateLabel}</span>
              <span className="text-[10px] text-emerald-400 font-mono">
                {activePoint.mealsPrepared} meals
              </span>
            </div>
            <div className="mt-2 space-y-1 text-[11px]">
              <div className="flex justify-between items-center text-emerald-400 font-medium">
                <span>Recovered & Delivered:</span>
                <span className="font-bold font-mono">{activePoint.recoveredDeliveredKg} kg</span>
              </div>
              <div className="flex justify-between items-center text-rose-400 font-medium">
                <span>Kitchen Discarded Waste:</span>
                <span className="font-bold font-mono">{activePoint.wasteKg} kg</span>
              </div>
              <div className="pt-1.5 mt-1 border-t border-slate-800 text-[10px] text-slate-300 flex justify-between">
                <span>Net Edible Saved:</span>
                <span className="text-emerald-300 font-semibold font-mono">
                  {Math.max(0, activePoint.recoveredDeliveredKg - activePoint.wasteKg).toFixed(1)} kg net
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1 text-emerald-700 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Recovered food verified by digital recipient timestamp prior to inclusion</span>
        </span>
        <span className="font-mono text-[10px] text-slate-400">Target Diversion &gt; 90%</span>
      </div>
    </div>
  );
};
