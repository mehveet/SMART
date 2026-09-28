import React, { useState } from 'react';
import { DemandDataPoint, TimeResolution } from '../../types';
import { Sparkles, Calendar, RotateCcw } from 'lucide-react';

interface DemandVsActualChartProps {
  data: DemandDataPoint[];
  onTimeResolutionChange?: (res: TimeResolution) => void;
  selectedResolution?: TimeResolution;
}

export const DemandVsActualChart: React.FC<DemandVsActualChartProps> = ({
  data,
  onTimeResolutionChange,
  selectedResolution,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [localResolution, setLocalResolution] = useState<TimeResolution>('daily');

  const currentResolution = selectedResolution || localResolution;

  const handleResolutionSwitch = (res: TimeResolution) => {
    setLocalResolution(res);
    if (onTimeResolutionChange) {
      onTimeResolutionChange(res);
    }
  };

  // Derive points based on resolution
  const displayData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    if (currentResolution === 'daily') {
      return data;
    }

    if (currentResolution === 'weekly') {
      // If we have 30 or 90 days, chunk by 7 days. If 7 days or less, create 4 representative weekly comparison points
      if (data.length <= 7) {
        // Build 4 recent week comparison points from base multiplier
        return [
          {
            date: '2026-09-01',
            day: 'Week 1',
            predictedMeals: 14200,
            actualConsumption: 13950,
            prepRecommendation: 14350,
            overproductionRisk: 'low' as const,
            weather: 'Avg 27°C, 2 Rain Days',
            specialEvent: 'Semester Orientation',
          },
          {
            date: '2026-09-08',
            day: 'Week 2',
            predictedMeals: 15100,
            actualConsumption: 14920,
            prepRecommendation: 15250,
            overproductionRisk: 'low' as const,
            weather: 'Avg 29°C, Clear',
          },
          {
            date: '2026-09-15',
            day: 'Week 3',
            predictedMeals: 14650,
            actualConsumption: 14380,
            prepRecommendation: 14800,
            overproductionRisk: 'moderate' as const,
            weather: 'Avg 26°C, Monsoon Showers',
            specialEvent: 'Heavy Rainfall Advisory',
          },
          {
            date: '2026-09-22',
            day: 'Week 4 (Current)',
            predictedMeals: 14850,
            actualConsumption: 14590,
            prepRecommendation: 14920,
            overproductionRisk: 'low' as const,
            weather: 'Avg 28°C, Partly Cloudy',
          },
        ];
      }

      // Chunk existing data into 7-day buckets
      const chunkSize = 7;
      const chunks: DemandDataPoint[] = [];
      for (let i = 0; i < data.length; i += chunkSize) {
        const slice = data.slice(i, i + chunkSize);
        const weekNum = Math.floor(i / chunkSize) + 1;
        const totalPred = slice.reduce((sum, d) => sum + d.predictedMeals, 0);
        const totalActual = slice.reduce((sum, d) => sum + d.actualConsumption, 0);
        const totalPrep = slice.reduce((sum, d) => sum + d.prepRecommendation, 0);
        chunks.push({
          date: slice[0].date,
          day: `Week ${weekNum}`,
          predictedMeals: totalPred,
          actualConsumption: totalActual,
          prepRecommendation: totalPrep,
          overproductionRisk: slice.some(s => s.overproductionRisk === 'high')
            ? 'high'
            : slice.some(s => s.overproductionRisk === 'moderate')
            ? 'moderate'
            : 'low',
          weather: `${slice.length}-day aggregate`,
        });
      }
      return chunks;
    }

    if (currentResolution === 'monthly') {
      return [
        {
          date: '2026-07-01',
          day: 'July',
          predictedMeals: 58200,
          actualConsumption: 56900,
          prepRecommendation: 58800,
          overproductionRisk: 'low' as const,
          weather: 'Monsoon Month Avg 25°C',
          specialEvent: 'Summer Term Schedule',
        },
        {
          date: '2026-08-01',
          day: 'August',
          predictedMeals: 64500,
          actualConsumption: 63800,
          prepRecommendation: 65100,
          overproductionRisk: 'low' as const,
          weather: 'Late Monsoon Avg 27°C',
          specialEvent: 'Full Campus Resumption',
        },
        {
          date: '2026-09-01',
          day: 'September (MTD)',
          predictedMeals: 68400,
          actualConsumption: 67100,
          prepRecommendation: 68900,
          overproductionRisk: 'low' as const,
          weather: 'Autumn Transition Avg 28°C',
          specialEvent: 'Peak Operations',
        },
      ];
    }

    return data;
  }, [data, currentResolution]);

  const width = 680;
  const height = 240;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  if (!displayData || displayData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
        <Calendar className="w-8 h-8 text-slate-300 mb-2" />
        <h4 className="text-sm font-bold text-slate-800">No demand forecast records found</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          No historical attendance or production records match the selected query.
        </p>
      </div>
    );
  }

  const maxVal = Math.max(
    ...displayData.map(d => Math.max(d.predictedMeals, d.actualConsumption, d.prepRecommendation))
  ) * 1.08;
  const minVal = Math.max(
    0,
    Math.min(...displayData.map(d => Math.min(d.predictedMeals, d.actualConsumption, d.prepRecommendation))) * 0.88
  );

  const getX = (index: number) => {
    const divisor = displayData.length > 1 ? displayData.length - 1 : 1;
    return paddingLeft + (index / divisor) * chartWidth;
  };

  const getY = (val: number) => {
    const range = maxVal - minVal;
    if (range <= 0) return height / 2;
    return height - paddingBottom - ((val - minVal) / range) * chartHeight;
  };

  const prepPoints = displayData.map((d, i) => `${getX(i)},${getY(d.prepRecommendation)}`).join(' ');
  const actualPoints = displayData.map((d, i) => `${getX(i)},${getY(d.actualConsumption)}`).join(' ');
  const predPoints = displayData.map((d, i) => `${getX(i)},${getY(d.predictedMeals)}`).join(' ');

  const areaActual = `${actualPoints} ${getX(displayData.length - 1)},${height - paddingBottom} ${getX(0)},${height - paddingBottom}`;

  const hoveredPoint = hoveredIndex !== null && hoveredIndex < displayData.length ? displayData[hoveredIndex] : null;

  // Calculate total variance in this set
  const totalActual = displayData.reduce((acc, d) => acc + d.actualConsumption, 0);
  const totalPrep = displayData.reduce((acc, d) => acc + d.prepRecommendation, 0);
  const varianceMeals = totalPrep - totalActual;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              Demand vs. Actual Meals Prepared
            </h3>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200">
              AI MODEL v2.4
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            AI predicted requirement vs meals actually served across meal shifts
          </p>
        </div>

        {/* Time Resolution Filters: Daily, Weekly, Monthly */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            {(['daily', 'weekly', 'monthly'] as TimeResolution[]).map(res => (
              <button
                key={res}
                type="button"
                onClick={() => handleResolutionSwitch(res)}
                className={`px-2.5 py-1 font-medium rounded-md transition-colors capitalize ${
                  currentResolution === res
                    ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {res}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between pt-2 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-slate-600 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-600 inline-block"></span>
            <span>Prep Target</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-sky-600 inline-block"></span>
            <span>Actual Served</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-500 inline-block border-b border-amber-500 border-dashed"></span>
            <span>AI Baseline</span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
          Net Variance: <span className="font-semibold text-slate-700">+{varianceMeals} meals buffer</span>
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="relative mt-3 w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-56 select-none overflow-visible"
        >
          {/* Subtle horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const val = Math.round(minVal + ratio * (maxVal - minVal));
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
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                  fontFamily="monospace"
                >
                  {val >= 1000 ? `${(val / 1000).toFixed(val >= 10000 ? 0 : 1)}k` : val}
                </text>
              </g>
            );
          })}

          {/* Shaded Area for Actual */}
          <polygon points={areaActual} fill="#0284c7" fillOpacity="0.07" />

          {/* AI Baseline Line */}
          <polyline
            points={predPoints}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.75"
            strokeDasharray="4 4"
          />

          {/* Prep Target Line */}
          <polyline
            points={prepPoints}
            fill="none"
            stroke="#059669"
            strokeWidth="2.2"
          />

          {/* Actual Consumption Line */}
          <polyline
            points={actualPoints}
            fill="none"
            stroke="#0284c7"
            strokeWidth="2.5"
          />

          {/* Data Points & Interactivity */}
          {displayData.map((d, i) => {
            const x = getX(i);
            const isHovered = hoveredIndex === i;

            return (
              <g key={i}>
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={height - paddingBottom}
                    stroke="#94a3b8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Actual dot */}
                <circle
                  cx={x}
                  cy={getY(d.actualConsumption)}
                  r={isHovered ? 5 : 3.5}
                  fill="#0284c7"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />

                {/* Prep dot */}
                <circle
                  cx={x}
                  cy={getY(d.prepRecommendation)}
                  r={isHovered ? 4.5 : 3}
                  fill="#059669"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />

                {/* Date Label */}
                <text
                  x={x}
                  y={height - 12}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight={isHovered ? '600' : '400'}
                  fill={isHovered ? '#0f172a' : '#64748b'}
                >
                  {d.day}
                </text>

                {/* Hover trigger */}
                <rect
                  x={x - chartWidth / (displayData.length * 2)}
                  y={0}
                  width={chartWidth / displayData.length}
                  height={height}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Dynamic Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-1 right-2 bg-slate-900/95 text-white text-xs rounded-lg p-3 shadow-lg pointer-events-none backdrop-blur-xs border border-slate-700 min-w-52 z-10 animate-in fade-in zoom-in-95 duration-100">
            <div className="font-semibold text-emerald-300 flex items-center justify-between">
              <span>{hoveredPoint.day}</span>
              <span className="text-[10px] text-slate-400 font-normal">{hoveredPoint.weather}</span>
            </div>
            {hoveredPoint.specialEvent && (
              <div className="text-[10px] text-amber-300 mt-0.5">
                Event: {hoveredPoint.specialEvent}
              </div>
            )}
            <div className="mt-2 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Prep Target:</span>
                <span className="font-mono font-medium text-emerald-400">{hoveredPoint.prepRecommendation} meals</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Actual Consumption:</span>
                <span className="font-mono font-medium text-sky-400">{hoveredPoint.actualConsumption} meals</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">AI Baseline:</span>
                <span className="font-mono font-medium text-amber-400">{hoveredPoint.predictedMeals} meals</span>
              </div>
              <div className="pt-1 mt-1 border-t border-slate-700 flex justify-between font-bold">
                <span className="text-slate-300">Variance:</span>
                <span className="font-mono text-white">
                  {hoveredPoint.prepRecommendation - hoveredPoint.actualConsumption > 0
                    ? `+${hoveredPoint.prepRecommendation - hoveredPoint.actualConsumption} surplus meals`
                    : `${hoveredPoint.actualConsumption - hoveredPoint.prepRecommendation} deficit`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Insight */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Forecast Model Accuracy: <strong className="text-slate-800 font-mono">97.8%</strong> (Sample Calibration)</span>
        </span>
        <span className="text-[11px] text-slate-400">Simulated Attendance Signals Active</span>
      </div>
    </div>
  );
};
