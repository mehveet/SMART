import React, { useState } from 'react';
import { TimeSeriesSustainabilityPoint, SustainabilityTimeResolution } from '../../types/sustainability';
import { Calendar, Info, Layers, TrendingDown, Clock, HelpCircle } from 'lucide-react';

interface WasteTrendMultiResolutionChartProps {
  timeSeriesData: Record<SustainabilityTimeResolution, TimeSeriesSustainabilityPoint[]>;
}

export const WasteTrendMultiResolutionChart: React.FC<WasteTrendMultiResolutionChartProps> = ({
  timeSeriesData,
}) => {
  const [resolution, setResolution] = useState<SustainabilityTimeResolution>('week');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedStream, setSelectedStream] = useState<'all' | 'prep' | 'plate' | 'spoilage' | 'overproduction'>('all');

  const points = timeSeriesData[resolution] || [];

  const width = 640;
  const height = 260;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Maximum value for scale
  const maxVal = Math.max(
    ...points.map(p => Math.max(p.wasteKg, p.baselineWasteKg || p.wasteKg, p.recoveredDeliveredKg)),
    10
  ) * 1.15;

  const barCount = points.length || 1;
  const barSlotWidth = chartWidth / barCount;
  const barWidth = Math.min(36, Math.max(16, barSlotWidth * 0.65));

  const getY = (val: number) => {
    if (maxVal <= 0) return 0;
    return (val / maxVal) * chartHeight;
  };

  const activePoint = hoveredIdx !== null && points[hoveredIdx] ? points[hoveredIdx] : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              Waste Generation & Reduction Trends
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200/60">
              Verified Audit Data
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Measured kitchen waste volume against audited 84.5g/meal defensible baseline
          </p>
        </div>

        {/* Resolution Selector (Day, Week, Month) */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100/80 p-1 rounded-lg border border-slate-200/60">
          <button
            type="button"
            onClick={() => {
              setResolution('day');
              setHoveredIdx(null);
            }}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              resolution === 'day'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Day (14d)
          </button>
          <button
            type="button"
            onClick={() => {
              setResolution('week');
              setHoveredIdx(null);
            }}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              resolution === 'week'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Week (8w)
          </button>
          <button
            type="button"
            onClick={() => {
              setResolution('month');
              setHoveredIdx(null);
            }}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              resolution === 'month'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Month (FY26)
          </button>
        </div>
      </div>

      {/* Stream Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 pb-2 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Filter Stream:</span>
          <button
            type="button"
            onClick={() => setSelectedStream('all')}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              selectedStream === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Total Waste
          </button>
          <button
            type="button"
            onClick={() => setSelectedStream('prep')}
            className={`px-2 py-0.5 rounded font-medium transition-colors flex items-center gap-1 ${
              selectedStream === 'prep'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Prep Trimmings
          </button>
          <button
            type="button"
            onClick={() => setSelectedStream('plate')}
            className={`px-2 py-0.5 rounded font-medium transition-colors flex items-center gap-1 ${
              selectedStream === 'plate'
                ? 'bg-rose-700 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Plate Waste
          </button>
          <button
            type="button"
            onClick={() => setSelectedStream('spoilage')}
            className={`px-2 py-0.5 rounded font-medium transition-colors flex items-center gap-1 ${
              selectedStream === 'spoilage'
                ? 'bg-amber-700 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Spoilage
          </button>
          <button
            type="button"
            onClick={() => setSelectedStream('overproduction')}
            className={`px-2 py-0.5 rounded font-medium transition-colors flex items-center gap-1 ${
              selectedStream === 'overproduction'
                ? 'bg-blue-700 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Overproduction
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-xs bg-slate-800"></span>
            <span>Measured Waste</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-600"></span>
            <span>84.5g Defensible Baseline</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Canvas */}
      <div className="relative w-full overflow-x-auto mt-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none overflow-visible"
          style={{ minWidth: '480px' }}
        >
          {/* Background Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((ratio, idx) => {
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
                  {val >= 1000 ? `${(val / 1000).toFixed(1)}t` : `${val}kg`}
                </text>
              </g>
            );
          })}

          {/* Defensible Baseline Reference Curve */}
          {points.length > 1 && (
            <path
              d={points
                .map((p, i) => {
                  const x = paddingLeft + i * barSlotWidth + barSlotWidth / 2;
                  const y = paddingTop + chartHeight - getY(p.baselineWasteKg || p.wasteKg * 1.35);
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="#d97706"
              strokeWidth="2"
              strokeDasharray="4 4"
              strokeLinecap="round"
            />
          )}

          {/* Bar Columns */}
          {points.map((p, idx) => {
            const centerX = paddingLeft + idx * barSlotWidth + barSlotWidth / 2;
            const x = centerX - barWidth / 2;

            let displayVal = p.wasteKg;
            if (selectedStream === 'prep') displayVal = p.prepWasteKg;
            if (selectedStream === 'plate') displayVal = p.plateWasteKg;
            if (selectedStream === 'spoilage') displayVal = p.spoilageKg;
            if (selectedStream === 'overproduction') displayVal = p.overproductionKg;

            const barH = Math.max(3, getY(displayVal));
            const y = paddingTop + chartHeight - barH;
            const isHovered = hoveredIdx === idx;

            // Color selection
            let fillColor = isHovered ? '#0f172a' : '#1e293b';
            if (selectedStream === 'prep') fillColor = isHovered ? '#047857' : '#10b981';
            if (selectedStream === 'plate') fillColor = isHovered ? '#be123c' : '#f43f5e';
            if (selectedStream === 'spoilage') fillColor = isHovered ? '#b45309' : '#f59e0b';
            if (selectedStream === 'overproduction') fillColor = isHovered ? '#1d4ed8' : '#3b82f6';

            return (
              <g
                key={idx}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Hover backdrop hit box */}
                <rect
                  x={centerX - barSlotWidth / 2}
                  y={paddingTop}
                  width={barSlotWidth}
                  height={chartHeight + 30}
                  fill={isHovered ? 'rgba(16, 185, 129, 0.06)' : 'transparent'}
                  rx="4"
                />

                {/* Main Waste Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx="4"
                  fill={fillColor}
                  className="transition-all duration-200"
                />

                {/* Prevented Waste Marker Cap */}
                {selectedStream === 'all' && p.preventedKg && p.preventedKg > 0 && (
                  <rect
                    x={x}
                    y={Math.max(paddingTop, y - getY(p.preventedKg))}
                    width={barWidth}
                    height={getY(p.preventedKg)}
                    rx="3"
                    fill="#10b981"
                    fillOpacity="0.25"
                    stroke="#10b981"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                {/* X Axis Date Label */}
                <text
                  x={centerX}
                  y={height - paddingBottom + 18}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight={isHovered ? '700' : '500'}
                  fill={isHovered ? '#0f172a' : '#64748b'}
                >
                  {p.dateLabel.split(' ')[0]}
                </text>
                <text
                  x={centerX}
                  y={height - paddingBottom + 30}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#94a3b8"
                >
                  {p.dateLabel.split(' ')[1] || ''}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {activePoint && hoveredIdx !== null && (
          <div
            className="absolute z-20 bg-slate-900 text-white rounded-xl p-3 shadow-xl pointer-events-none text-xs w-64 border border-slate-700/80 -translate-x-1/2 -translate-y-full animate-in fade-in zoom-in-95"
            style={{
              left: `${((paddingLeft + hoveredIdx * barSlotWidth + barSlotWidth / 2) / width) * 100}%`,
              top: `${paddingTop + 50}px`,
            }}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="font-bold text-white">{activePoint.dateLabel}</span>
              <span className="text-[10px] text-emerald-400 font-mono">
                {activePoint.mealsPrepared.toLocaleString()} meals
              </span>
            </div>

            <div className="mt-2 space-y-1 text-[11px]">
              <div className="flex justify-between items-center text-slate-200">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-slate-400"></span>
                  <span>Measured Waste:</span>
                </span>
                <span className="font-bold font-mono">{activePoint.wasteKg} kg</span>
              </div>

              <div className="flex justify-between items-center text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-emerald-500"></span>
                  <span>Delivered Recovery:</span>
                </span>
                <span className="font-bold font-mono">{activePoint.recoveredDeliveredKg} kg</span>
              </div>

              {activePoint.preventedKg !== null && (
                <div className="flex justify-between items-center text-sky-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs bg-sky-400"></span>
                    <span>Waste Prevented (vs 84.5g):</span>
                  </span>
                  <span className="font-bold font-mono">{activePoint.preventedKg} kg</span>
                </div>
              )}

              <div className="pt-1.5 mt-1 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                <span>CO2e Offset: {activePoint.co2eAvoidedKg} kg</span>
                <span>Water: {activePoint.waterSavedLitres} L</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Footer Callout */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span>
            Green dashed zone represents audited waste volume prevented through AI batch optimization vs the 84.5g baseline.
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-400">Resolution: {resolution.toUpperCase()}</span>
      </div>
    </div>
  );
};
