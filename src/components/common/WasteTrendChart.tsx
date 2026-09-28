import React, { useState } from 'react';
import { WasteTrendPoint } from '../../types';
import { Trash2 } from 'lucide-react';

interface WasteTrendChartProps {
  data: WasteTrendPoint[];
}

export type WasteCategoryFilter = 'all' | 'prep' | 'plate' | 'overproduction' | 'spoilage';

export const WasteTrendChart: React.FC<WasteTrendChartProps> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<WasteCategoryFilter>('all');

  const width = 560;
  const height = 240;
  const paddingLeft = 38;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
        <Trash2 className="w-8 h-8 text-slate-300 mb-2" />
        <h4 className="text-sm font-bold text-slate-800">No waste audit records found</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          No recorded kitchen waste logs in the selected time range.
        </p>
      </div>
    );
  }

  // Sums across the entire dataset for category breakdown percentage
  const totalPrepAll = data.reduce((acc, d) => acc + d.prepWasteKg, 0);
  const totalPlateAll = data.reduce((acc, d) => acc + d.plateWasteKg, 0);
  const totalOverAll = data.reduce((acc, d) => acc + d.overproductionKg, 0);
  const totalSpoilAll = data.reduce((acc, d) => acc + d.spoilageKg, 0);
  const totalAll = totalPrepAll + totalPlateAll + totalOverAll + totalSpoilAll || 1;

  const prepPercent = Math.round((totalPrepAll / totalAll) * 100);
  const platePercent = Math.round((totalPlateAll / totalAll) * 100);
  const overPercent = Math.round((totalOverAll / totalAll) * 100);
  const spoilPercent = Math.round((totalSpoilAll / totalAll) * 100);

  const maxTotal = Math.max(...data.map(d => d.totalKg)) * 1.15;
  const divisor = data.length || 1;
  const barWidth = Math.min(32, Math.max(12, chartWidth / divisor - 12));

  const getY = (val: number) => {
    if (maxTotal <= 0) return 0;
    return (val / maxTotal) * chartHeight;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
            Food Waste Trend & Category Breakdown
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Measured scrap kg across kitchen stations by waste category
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Streams
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('prep')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              activeCategory === 'prep'
                ? 'bg-emerald-700 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="w-2 h-2 rounded-xs bg-emerald-600 inline-block"></span>
            <span>Prep ({prepPercent}%)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('plate')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              activeCategory === 'plate'
                ? 'bg-rose-700 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="w-2 h-2 rounded-xs bg-rose-600 inline-block"></span>
            <span>Plate ({platePercent}%)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('overproduction')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              activeCategory === 'overproduction'
                ? 'bg-amber-700 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="w-2 h-2 rounded-xs bg-amber-600 inline-block"></span>
            <span>Overprod ({overPercent}%)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('spoilage')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              activeCategory === 'spoilage'
                ? 'bg-slate-700 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="w-2 h-2 rounded-xs bg-slate-400 inline-block"></span>
            <span>Spoilage ({spoilPercent}%)</span>
          </button>
        </div>
      </div>

      <div className="relative mt-3 w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-56 select-none overflow-visible"
        >
          {/* Horizontal grid */}
          {[0, 0.33, 0.66, 1].map((ratio, i) => {
            const val = Math.round(ratio * maxTotal);
            const y = height - paddingBottom - ratio * chartHeight;
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                  fontFamily="monospace"
                >
                  {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}k`}
                </text>
              </g>
            );
          })}

          {/* Stacked Bars */}
          {data.map((d, i) => {
            const x = paddingLeft + i * (chartWidth / data.length) + (chartWidth / data.length - barWidth) / 2;
            const isHovered = hoveredIdx === i;

            const hPrep = getY(d.prepWasteKg);
            const hPlate = getY(d.plateWasteKg);
            const hOver = getY(d.overproductionKg);
            const hSpoil = getY(d.spoilageKg);

            let currentBottom = height - paddingBottom;
            const yPrep = currentBottom - hPrep;
            currentBottom = yPrep;
            const yPlate = currentBottom - hPlate;
            currentBottom = yPlate;
            const yOver = currentBottom - hOver;
            currentBottom = yOver;
            const ySpoil = currentBottom - hSpoil;

            const labelText = d.period.split(' ')[0];

            // Opacities based on activeCategory
            const prepOpacity = activeCategory === 'all' || activeCategory === 'prep' ? 1 : 0.2;
            const plateOpacity = activeCategory === 'all' || activeCategory === 'plate' ? 1 : 0.2;
            const overOpacity = activeCategory === 'all' || activeCategory === 'overproduction' ? 1 : 0.2;
            const spoilOpacity = activeCategory === 'all' || activeCategory === 'spoilage' ? 1 : 0.2;

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Background highlight on hover */}
                {isHovered && (
                  <rect
                    x={x - 4}
                    y={paddingTop}
                    width={barWidth + 8}
                    height={chartHeight}
                    fill="#f8fafc"
                    rx={4}
                  />
                )}

                {/* Prep Waste (green) */}
                <rect
                  x={x}
                  y={yPrep}
                  width={barWidth}
                  height={Math.max(1, hPrep)}
                  fill="#059669"
                  fillOpacity={prepOpacity}
                  className="transition-all"
                />

                {/* Plate Waste (rose) */}
                <rect
                  x={x}
                  y={yPlate}
                  width={barWidth}
                  height={Math.max(1, hPlate)}
                  fill="#e11d48"
                  fillOpacity={plateOpacity}
                  className="transition-all"
                />

                {/* Overproduction (amber) */}
                <rect
                  x={x}
                  y={yOver}
                  width={barWidth}
                  height={Math.max(1, hOver)}
                  fill="#d97706"
                  fillOpacity={overOpacity}
                  className="transition-all"
                />

                {/* Spoilage (slate) */}
                <rect
                  x={x}
                  y={ySpoil}
                  width={barWidth}
                  height={Math.max(1, hSpoil)}
                  fill="#94a3b8"
                  fillOpacity={spoilOpacity}
                  rx={2}
                  className="transition-all"
                />

                {/* Day label */}
                <text
                  x={x + barWidth / 2}
                  y={height - 12}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight={isHovered ? '600' : '400'}
                  fill={isHovered ? '#0f172a' : '#64748b'}
                >
                  {labelText}
                </text>

                {/* Total kg on top */}
                <text
                  x={x + barWidth / 2}
                  y={ySpoil - 4}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#475569"
                  fontFamily="monospace"
                  fontWeight="500"
                >
                  {d.totalKg.toFixed(0)}
                </text>
              </g>
            );
          })}
        </svg>

        {hoveredIdx !== null && hoveredIdx < data.length && (
          <div className="absolute top-1 left-4 bg-slate-900/95 text-white text-xs rounded-lg p-3 shadow-lg pointer-events-none border border-slate-700 min-w-48 z-10 animate-in fade-in duration-100">
            <div className="font-semibold text-emerald-300">
              {data[hoveredIdx].period}
            </div>
            <div className="mt-1.5 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-emerald-400">Prep Trim:</span>
                <span className="font-mono">{data[hoveredIdx].prepWasteKg} kg ({Math.round((data[hoveredIdx].prepWasteKg / (data[hoveredIdx].totalKg || 1)) * 100)}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-400">Plate Scrap:</span>
                <span className="font-mono">{data[hoveredIdx].plateWasteKg} kg ({Math.round((data[hoveredIdx].plateWasteKg / (data[hoveredIdx].totalKg || 1)) * 100)}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-400">Overproduction:</span>
                <span className="font-mono">{data[hoveredIdx].overproductionKg} kg ({Math.round((data[hoveredIdx].overproductionKg / (data[hoveredIdx].totalKg || 1)) * 100)}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Spoilage:</span>
                <span className="font-mono">{data[hoveredIdx].spoilageKg} kg</span>
              </div>
              <div className="pt-1 mt-1 border-t border-slate-700 flex justify-between font-bold">
                <span>Total Waste:</span>
                <span className="font-mono text-white">{data[hoveredIdx].totalKg} kg</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="text-emerald-700 font-medium">
          Plate return scrap accounts for {platePercent}% of total wet-weight scrape
        </span>
        <span className="text-[11px] text-slate-400">Unit: kg wet-weight</span>
      </div>
    </div>
  );
};
