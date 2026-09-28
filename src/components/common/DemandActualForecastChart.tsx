import React, { useState, useMemo } from 'react';
import { Sparkles, CheckCircle2, TrendingUp, Info } from 'lucide-react';

interface HistoryPoint {
  date: string;
  day: string;
  actualMeals: number;
  predictedMeals: number;
  recommendedPrep: number;
  isHoldoutTest: boolean;
  residual: number;
}

interface DemandActualForecastChartProps {
  data: HistoryPoint[];
  mae: number;
  r2Score: number;
  isTrained: boolean;
}

export const DemandActualForecastChart: React.FC<DemandActualForecastChartProps> = ({
  data,
  mae,
  r2Score,
  isTrained,
}) => {
  const [filterView, setFilterView] = useState<'all' | 'holdout' | 'last14'>('last14');
  const [hoveredPoint, setHoveredPoint] = useState<HistoryPoint | null>(null);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);

  const displayPoints = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (filterView === 'holdout') {
      const holdouts = data.filter(d => d.isHoldoutTest);
      return holdouts.length > 0 ? holdouts : data.slice(-7);
    }
    if (filterView === 'last14') {
      return data.slice(-14);
    }
    return data;
  }, [data, filterView]);

  const width = 740;
  const height = 260;
  const padding = { top: 25, right: 30, bottom: 45, left: 60 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Compute min & max
  const values = displayPoints.flatMap(d => [d.actualMeals, d.predictedMeals, d.recommendedPrep]);
  const minVal = Math.max(0, Math.floor((Math.min(...(values.length ? values : [1000])) - 200) / 200) * 200);
  const maxVal = Math.ceil((Math.max(...(values.length ? values : [3000])) + 200) / 200) * 200;
  const range = maxVal - minVal || 1;

  const getX = (index: number) => {
    if (displayPoints.length <= 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (displayPoints.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return padding.top + chartHeight - ((val - minVal) / range) * chartHeight;
  };

  // Build SVG paths
  const actualPath = useMemo(() => {
    if (displayPoints.length === 0) return '';
    return displayPoints
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.actualMeals).toFixed(1)}`)
      .join(' ');
  }, [displayPoints, minVal, range]);

  const predictedPath = useMemo(() => {
    if (displayPoints.length === 0) return '';
    return displayPoints
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.predictedMeals).toFixed(1)}`)
      .join(' ');
  }, [displayPoints, minVal, range]);

  const prepPath = useMemo(() => {
    if (displayPoints.length === 0) return '';
    return displayPoints
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.recommendedPrep).toFixed(1)}`)
      .join(' ');
  }, [displayPoints, minVal, range]);

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(pct => Math.round(minVal + pct * range));

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              Actual Consumption vs. AI Predicted Demand
            </h3>
            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {isTrained ? 'REGRESSION VALIDATION' : 'BASELINE MODE'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Model fitting against real kitchen consumption; amber markers denote the chronological holdout validation set
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setFilterView('last14')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filterView === 'last14'
                ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Recent 14 Days
          </button>
          <button
            type="button"
            onClick={() => setFilterView('holdout')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filterView === 'holdout'
                ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Holdout Test Set
          </button>
          <button
            type="button"
            onClick={() => setFilterView('all')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filterView === 'all'
                ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Full History ({data.length}d)
          </button>
        </div>
      </div>

      {/* SVG Visualization */}
      <div className="relative mt-3 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none overflow-visible">
          {/* Grid lines */}
          {yTicks.map(tick => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono"
                >
                  {tick.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Holdout Region highlight background */}
          {displayPoints.some(d => d.isHoldoutTest) && (
            <rect
              x={getX(displayPoints.findIndex(d => d.isHoldoutTest))}
              y={padding.top}
              width={chartWidth - (getX(displayPoints.findIndex(d => d.isHoldoutTest)) - padding.left)}
              height={chartHeight}
              fill="#fef3c7"
              fillOpacity="0.25"
            />
          )}

          {/* Recommended Prep Line (Dotted Slate) */}
          <path
            d={prepPath}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.8"
          />

          {/* Predicted Demand Line (Emerald Solid) */}
          <path
            d={predictedPath}
            fill="none"
            stroke="#059669"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Actual Consumption Line (Dark Slate Solid with dots) */}
          <path
            d={actualPath}
            fill="none"
            stroke="#0f172a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {displayPoints.map((d, idx) => {
            const x = getX(idx);
            const yActual = getY(d.actualMeals);
            const yPred = getY(d.predictedMeals);

            return (
              <g
                key={idx}
                className="cursor-pointer group"
                onMouseEnter={() => {
                  setHoveredPoint(d);
                  setHoverCoord({ x, y: yActual });
                }}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Vertical residual error bar */}
                <line
                  x1={x}
                  y1={yActual}
                  x2={x}
                  y2={yPred}
                  stroke={d.residual >= 0 ? '#10b981' : '#f43f5e'}
                  strokeWidth="1.5"
                  opacity="0.5"
                  strokeDasharray="2 2"
                />

                {/* Actual consumption point */}
                <circle
                  cx={x}
                  cy={yActual}
                  r={d.isHoldoutTest ? 5 : 3.5}
                  fill={d.isHoldoutTest ? '#f59e0b' : '#0f172a'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="transition-transform group-hover:scale-125"
                />

                {/* X-axis date labels */}
                {(displayPoints.length <= 14 || idx % 2 === 0) && (
                  <text
                    x={x}
                    y={height - 15}
                    textAnchor="middle"
                    className="text-[10px] fill-slate-500 font-mono"
                  >
                    {d.day}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && hoverCoord && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-900 text-white rounded-lg p-3 shadow-xl text-xs space-y-1 transform -translate-x-1/2 -translate-y-full mb-2 min-w-[190px]"
            style={{
              left: `${(hoverCoord.x / width) * 100}%`,
              top: `${(hoverCoord.y / height) * 100}%`,
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-700 pb-1 text-[11px]">
              <span className="font-semibold text-slate-300 font-mono">{hoveredPoint.date} ({hoveredPoint.day})</span>
              {hoveredPoint.isHoldoutTest && (
                <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                  HOLDOUT TEST
                </span>
              )}
            </div>
            <div className="flex justify-between items-center text-slate-200 pt-0.5">
              <span>Actual Consumption:</span>
              <span className="font-mono font-bold text-white">{hoveredPoint.actualMeals} meals</span>
            </div>
            <div className="flex justify-between items-center text-emerald-300">
              <span>Model Prediction:</span>
              <span className="font-mono font-bold">{hoveredPoint.predictedMeals} meals</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Recommended Prep:</span>
              <span className="font-mono">{hoveredPoint.recommendedPrep} meals</span>
            </div>
            <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800">
              <span className="text-slate-400">Residual Error:</span>
              <span
                className={`font-mono font-semibold ${
                  hoveredPoint.residual >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {hoveredPoint.residual > 0 ? `+${hoveredPoint.residual}` : hoveredPoint.residual} meals
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Legend & Performance Stats */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-slate-900 inline-block"></span>
            <span className="w-2 h-2 rounded-full bg-slate-900 -ml-2 inline-block"></span>
            <span>Actual Meals Served</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-600 inline-block"></span>
            <span>AI Model Prediction</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-b border-dashed border-slate-400 inline-block"></span>
            <span>Recommended Batch Target</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span>Holdout Evaluation Point</span>
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-slate-700">
          <span>Holdout MAE: <strong>{mae} meals</strong></span>
          <span>·</span>
          <span>R² Score: <strong>{r2Score}</strong></span>
        </div>
      </div>
    </div>
  );
};
