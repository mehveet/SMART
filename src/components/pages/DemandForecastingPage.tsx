import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  TrendingUp,
  CloudRain,
  Users,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Play,
  Upload,
  Download,
  Plus,
  Table,
  Bookmark,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Cpu,
  RefreshCw,
  Clock,
  ArrowRight,
  Utensils,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DemandActualForecastChart } from '../common/DemandActualForecastChart';
import { ManualMealRecordModal } from '../modals/ManualMealRecordModal';
import { SaveForecastModal } from '../modals/SaveForecastModal';
import { DatasetPreviewModal } from '../modals/DatasetPreviewModal';
import {
  HistoricalMealRecord,
  ForecastResult,
  SavedForecastRun,
  ActionableRecommendation,
  DayForecastItem,
} from '../../types/forecasting';
import {
  SAMPLE_HISTORICAL_RECORDS,
  SAMPLE_CSV_TEMPLATE,
} from '../../data/historicalMealData';
import {
  executeForecastingEngine,
  parseAndValidateMealCSV,
} from '../../utils/forecastingEngine';

export const DemandForecastingPage: React.FC = () => {
  const {
    savedForecasts,
    saveForecastRun,
    deleteSavedForecast,
    applyForecastToSchedule,
    setActiveTab,
  } = useApp();

  // Active dataset state
  const [historicalData, setHistoricalData] = useState<HistoricalMealRecord[]>(SAMPLE_HISTORICAL_RECORDS);
  const [datasetNotice, setDatasetNotice] = useState<string | null>(null);

  // Target Forecast Controls
  const todayStr = '2026-09-24';
  const [targetStartDate, setTargetStartDate] = useState<string>(todayStr);
  const [forecastDays, setForecastDays] = useState<number>(7);
  const [mealCategoryFilter, setMealCategoryFilter] = useState<string>('All');
  const [attendanceDelta, setAttendanceDelta] = useState<number>(0);
  const [rainExpected, setRainExpected] = useState<boolean>(false);
  const [specialEventFactor, setSpecialEventFactor] = useState<number>(0);

  // Computation & Results State
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);
  const [isComputing, setIsComputing] = useState<boolean>(false);
  const [scheduleCommitted, setScheduleCommitted] = useState<boolean>(false);
  const [showAdvancedDiagnostics, setShowAdvancedDiagnostics] = useState<boolean>(false);

  // Modals
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Run computation
  const runForecastComputation = async () => {
    setIsComputing(true);
    setScheduleCommitted(false);

    try {
      const res = await fetch('/api/forecast/train-and-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          historicalData,
          targetStartDate,
          forecastDays,
          mealCategoryFilter,
          attendanceScenarioDelta: attendanceDelta,
          rainScenario: rainExpected,
          specialEventFactor,
        }),
      });

      if (res.ok) {
        const data: ForecastResult = await res.json();
        setForecastResult(data);
      } else {
        throw new Error('Fallback to client engine');
      }
    } catch {
      const fallbackResult = executeForecastingEngine({
        historicalData,
        targetStartDate,
        forecastDays,
        mealCategoryFilter,
        attendanceScenarioDelta: attendanceDelta,
        rainScenario: rainExpected,
        specialEventFactor,
      });
      setForecastResult(fallbackResult);
    } finally {
      setIsComputing(false);
    }
  };

  useEffect(() => {
    runForecastComputation();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      const validation = parseAndValidateMealCSV(text);
      if (!validation.isValid) {
        alert(`CSV Error:\n${validation.errors.join('\n')}`);
        return;
      }
      setHistoricalData(validation.validRows);
      setDatasetNotice(`Loaded ${validation.validRows.length} records from ${file.name}.`);
      runForecastComputation();
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddManualRecord = (record: HistoricalMealRecord) => {
    const updated = [...historicalData, record].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    setHistoricalData(updated);
    setDatasetNotice(`Added record for ${record.date} (${record.mealsServed} served).`);
    runForecastComputation();
  };

  const handleCommitScheduleToLine = () => {
    if (!forecastResult) return;
    applyForecastToSchedule(forecastResult);
    setScheduleCommitted(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-800" />
          <h2 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
            Demand Forecasting
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv,text/csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Upload CSV</span>
          </button>

          <button
            onClick={() => setIsManualModalOpen(true)}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Single Day Log</span>
          </button>

          <button
            onClick={() => setIsPreviewModalOpen(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Table className="w-3.5 h-3.5" />
            <span>Dataset ({historicalData.length}d)</span>
          </button>
        </div>
      </div>

      {/* 2. Fast & Simple Parameter Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <span className="text-xs font-semibold text-slate-700">
            Parameters
          </span>
          <button
            onClick={runForecastComputation}
            disabled={isComputing}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isComputing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Computing...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Forecast Computation</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Horizon Selection */}
          <div>
            <label className="block text-slate-500 font-medium mb-1.5">Horizon</label>
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {[1, 3, 7].map(days => (
                <button
                  key={days}
                  onClick={() => setForecastDays(days)}
                  className={`flex-1 py-1.5 font-semibold rounded-md transition-all cursor-pointer ${
                    forecastDays === days
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {days === 1 ? 'Today' : `${days} Days`}
                </button>
              ))}
            </div>
          </div>

          {/* Meal Service Selection */}
          <div>
            <label className="block text-slate-500 font-medium mb-1.5">Meal Service</label>
            <select
              value={mealCategoryFilter}
              onChange={e => setMealCategoryFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
            >
              <option value="All">All Meal Services</option>
              <option value="Breakfast">Breakfast Only</option>
              <option value="Lunch">Lunch Service</option>
              <option value="Dinner">Dinner Service</option>
            </select>
          </div>

          {/* Rainy Weather Toggle */}
          <div>
            <label className="block text-slate-500 font-medium mb-1.5">Weather</label>
            <button
              onClick={() => setRainExpected(!rainExpected)}
              className={`w-full p-2 rounded-lg border flex items-center justify-between transition-colors font-medium cursor-pointer ${
                rainExpected
                  ? 'bg-sky-50 text-sky-900 border-sky-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-sky-600" />
                <span>{rainExpected ? 'Rain (-6%)' : 'Normal'}</span>
              </span>
              <span className={`w-2 h-2 rounded-full ${rainExpected ? 'bg-sky-500' : 'bg-slate-300'}`} />
            </button>
          </div>

          {/* Attendance Adjustment */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-500 font-medium">Attendance Variance</label>
              <span className="font-mono font-bold text-slate-800">
                {attendanceDelta > 0 ? `+${attendanceDelta}%` : `${attendanceDelta}%`}
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              step="5"
              value={attendanceDelta}
              onChange={e => setAttendanceDelta(Number(e.target.value))}
              className="w-full accent-emerald-800 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 3. Forecast Results Metrics */}
      {forecastResult && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Recommended Prep Target</span>
            <div className="text-2xl font-bold text-emerald-800 font-['Plus_Jakarta_Sans'] mt-1">
              {forecastResult.summary.totalRecommendedPrep.toLocaleString()}{' '}
              <span className="text-sm font-normal text-slate-500">portions</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Expected Diner Turnout</span>
            <div className="text-2xl font-bold text-slate-900 font-['Plus_Jakarta_Sans'] mt-1">
              {forecastResult.summary.totalPredictedDemand.toLocaleString()}{' '}
              <span className="text-sm font-normal text-slate-500">diners</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Predicted Waste Avoidance</span>
            <div className="text-2xl font-bold text-teal-800 font-['Plus_Jakarta_Sans'] mt-1">
              ~{Math.round(forecastResult.summary.totalRecommendedPrep * 0.045 * 0.4)} <span className="text-sm font-normal text-slate-500">kg</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Model Validation Score</span>
            <div className="text-2xl font-bold text-slate-900 font-['Plus_Jakarta_Sans'] mt-1">
              R² = {forecastResult.metrics.r2Score.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* 4. Visual Forecast Chart & Schedule Commitment */}
      {forecastResult && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              Forecast & Production Schedule
            </h3>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSaveModalOpen(true)}
                className="px-3 py-1.5 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Save Run</span>
              </button>

              <button
                onClick={handleCommitScheduleToLine}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-2 ${
                  scheduleCommitted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-800 hover:bg-emerald-900 text-white cursor-pointer'
                }`}
              >
                {scheduleCommitted ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Applied to Kitchen Schedule</span>
                  </>
                ) : (
                  <>
                    <Utensils className="w-3.5 h-3.5" />
                    <span>Commit to Kitchen Schedule</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Visual Chart */}
          <div className="pt-2">
            <DemandActualForecastChart
              data={forecastResult.actualVsPredictedHistory}
              mae={forecastResult.metrics.mae}
              r2Score={forecastResult.metrics.r2Score}
              isTrained={forecastResult.metrics.isTrained}
            />
          </div>

          {/* Day-by-Day Table */}
          <div className="mt-4 overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Day</th>
                  <th className="py-2.5 px-3">Expected Diners</th>
                  <th className="py-2.5 px-3">Recommended Prep</th>
                  <th className="py-2.5 px-3">Buffer</th>
                  <th className="py-2.5 px-3">Conditions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {forecastResult.sevenDayForecast.slice(0, forecastDays).map((day: DayForecastItem) => (
                  <tr key={day.date} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-800">{day.date}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">{day.dayOfWeek}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{day.expectedAttendance.toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-800">{day.recommendedPrep.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-slate-500">+{day.bufferPercent}%</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {day.weather === 'Rain / Storm' ? '🌧️ Rain expected' : '☀️ Standard'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Collapsible Model Diagnostics (Keeps Main View Clean & Uncluttered) */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <button
          onClick={() => setShowAdvancedDiagnostics(!showAdvancedDiagnostics)}
          className="w-full p-4 flex items-center justify-between text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Model Diagnostics</span>
          </div>
          {showAdvancedDiagnostics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvancedDiagnostics && forecastResult && (
          <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Regression Equation</span>
                <p className="font-mono text-[11px] text-slate-800 mt-1">
                  Demand = β₀ + β₁(Attendance) + β₂(Rain) + β₃(DayOfWeek)
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Holdout Partition</span>
                <p className="text-slate-700 mt-1">
                  {forecastResult.metrics.trainingSetSize} training days · {forecastResult.metrics.holdoutSetSize} validation days
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Prediction Accuracy</span>
                <p className="text-slate-700 mt-1">
                  MAE: {forecastResult.metrics.mae} meals · RMSE: {forecastResult.metrics.rmse}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ManualMealRecordModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onAddRecord={handleAddManualRecord}
      />

      <SaveForecastModal
        isOpen={isSaveModalOpen}
        forecastResult={forecastResult}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={run => {
          saveForecastRun(run);
          setIsSaveModalOpen(false);
        }}
      />

      <DatasetPreviewModal
        isOpen={isPreviewModalOpen}
        records={historicalData}
        onClose={() => setIsPreviewModalOpen(false)}
      />
    </div>
  );
};
