import React, { useState } from 'react';
import { X, Bookmark, CheckCircle2, Calendar, TrendingUp } from 'lucide-react';
import { ForecastResult, SavedForecastRun } from '../../types/forecasting';

interface SaveForecastModalProps {
  isOpen: boolean;
  onClose: () => void;
  forecastResult: ForecastResult | null;
  onSave: (run: SavedForecastRun) => void;
}

export const SaveForecastModal: React.FC<SaveForecastModalProps> = ({
  isOpen,
  onClose,
  forecastResult,
  onSave,
}) => {
  if (!isOpen || !forecastResult) return null;

  const defaultName = `Forecast Run (${forecastResult.forecastDateRange.startDate} to ${forecastResult.forecastDateRange.endDate})`;
  const [name, setName] = useState<string>(defaultName);
  const [notes, setNotes] = useState<string>('Calibrated with chronological holdout regression. Lean buffer applied.');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const timeStr = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newRun: SavedForecastRun = {
      id: `saved-${Date.now()}`,
      name: name.trim() || defaultName,
      savedAt: timeStr,
      forecastDateRange: `${forecastResult.forecastDateRange.startDate} to ${forecastResult.forecastDateRange.endDate}`,
      mealCategory: forecastResult.targetMealCategory,
      modelType: forecastResult.metrics.modelType,
      recordsCount: forecastResult.metrics.trainingSetSize + forecastResult.metrics.holdoutSetSize,
      totalPredictedMeals: forecastResult.summary.totalPredictedDemand,
      recommendedPrepMeals: forecastResult.summary.totalRecommendedPrep,
      mae: forecastResult.metrics.mae,
      r2Score: forecastResult.metrics.r2Score,
      notes: notes.trim(),
      result: forecastResult,
    };

    onSave(newRun);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                Save Forecast Run
              </h3>
              <p className="text-xs text-slate-500">
                Archive model predictions and evaluation metrics for audit and comparison
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Summary Preview Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Forecast Horizon:</span>
              <span className="font-semibold text-slate-900 font-mono">
                {forecastResult.forecastDateRange.startDate} → {forecastResult.forecastDateRange.endDate}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Model Architecture:</span>
              <span className="font-semibold text-emerald-800">
                {forecastResult.metrics.modelType}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Holdout Test Performance:</span>
              <span className="font-mono font-bold text-slate-900">
                MAE {forecastResult.metrics.mae} meals · R² {forecastResult.metrics.r2Score}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200">
              <span>Total Projected Demand:</span>
              <span className="font-mono font-bold text-emerald-800 text-sm">
                {forecastResult.summary.totalPredictedDemand.toLocaleString()} meals
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Forecast Run Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Operational Notes & Supervisor Sign-off
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Accounting for tech symposium on day 3; lean buffer applied to dinner prep."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Bookmark className="w-3.5 h-3.5 fill-current" />
              <span>Save to Forecast History</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
