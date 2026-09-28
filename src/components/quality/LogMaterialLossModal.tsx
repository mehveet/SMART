import React, { useState } from 'react';
import {
  Scale,
  TrendingDown,
  X,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Layers,
  Wrench,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface LogMaterialLossModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogMaterialLossModal: React.FC<LogMaterialLossModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addRawMaterialLoss, processingEquipment } = useApp();

  const [ingredient, setIngredient] = useState('');
  const [productionLine, setProductionLine] = useState('Prep Line 1 (Vegetables)');
  const [processStep, setProcessStep] = useState<
    'Peeling' | 'Trimming' | 'Cooking Shrinkage' | 'Portioning' | 'Slicing' | 'Packaging'
  >('Peeling');
  const [inputWeightKg, setInputWeightKg] = useState('');
  const [lossKg, setLossKg] = useState('');
  const [equipmentUsed, setEquipmentUsed] = useState(
    processingEquipment[0]?.name || 'Industrial Vegetable Dicer & Peeler'
  );
  const [notes, setNotes] = useState('');
  const [loggedBy, setLoggedBy] = useState('Prep Line Supervisor');

  if (!isOpen) return null;

  const inputNum = parseFloat(inputWeightKg) || 0;
  const lossNum = parseFloat(lossKg) || 0;
  const calculatedLossPercent =
    inputNum > 0 ? Number(((lossNum / inputNum) * 100).toFixed(1)) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputNum <= 0 || lossNum <= 0) return;

    addRawMaterialLoss({
      productionLine,
      processStep,
      ingredient: ingredient.trim(),
      inputWeightKg: inputNum,
      lossKg: lossNum,
      lossPercentage: calculatedLossPercent,
      equipmentUsed,
      notes: notes.trim() || undefined,
      loggedBy: loggedBy.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-['Plus_Jakarta_Sans']">Log Raw Material Loss</h2>
              <p className="text-xs text-slate-500">
                Track prep trimming, peeling yield, cooking shrink, and machine loss
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Ingredient / Raw Material <span className="text-amber-600">*</span>
            </label>
            <input
              type="text"
              required
              value={ingredient}
              onChange={e => setIngredient(e.target.value)}
              placeholder="e.g. Yellow Onions, Russet Potatoes, Chicken Thighs"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Production Line
              </label>
              <select
                value={productionLine}
                onChange={e => setProductionLine(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="Prep Line 1 (Vegetables)">Prep Line 1 (Vegetables)</option>
                <option value="Prep Line 2 (Proteins)">Prep Line 2 (Proteins)</option>
                <option value="Thermal Cook Line A">Thermal Cook Line A</option>
                <option value="Thermal Cook Line B">Thermal Cook Line B</option>
                <option value="Bakery Prep">Bakery Prep</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Processing Step
              </label>
              <select
                value={processStep}
                onChange={e => setProcessStep(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="Peeling">Peeling</option>
                <option value="Trimming">Trimming</option>
                <option value="Slicing">Slicing / Dicing</option>
                <option value="Cooking Shrinkage">Cooking Shrinkage</option>
                <option value="Portioning">Portioning</option>
                <option value="Packaging">Packaging</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Input Weight (kg) <span className="text-amber-600">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={inputWeightKg}
                onChange={e => setInputWeightKg(e.target.value)}
                placeholder="e.g. 150.0"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Loss / Trim Weight (kg) <span className="text-amber-600">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.05"
                required
                value={lossKg}
                onChange={e => setLossKg(e.target.value)}
                placeholder="e.g. 12.5"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Real-time calculated loss badge */}
          {inputNum > 0 && lossNum > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between text-xs">
              <span className="text-slate-500">Calculated Yield Loss:</span>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded ${
                  calculatedLossPercent > 12
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : calculatedLossPercent > 8
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {calculatedLossPercent}% ({lossNum.toFixed(1)} kg loss of {inputNum.toFixed(1)} kg)
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Equipment Utilized
            </label>
            <select
              value={equipmentUsed}
              onChange={e => setEquipmentUsed(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {processingEquipment.map(eq => (
                <option key={eq.id} value={eq.name}>
                  {eq.name} ({eq.line})
                </option>
              ))}
              <option value="Manual Knife Work">Manual Knife Workstation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Observations / Root Cause
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Skin bruising required deeper peeling; blade sharpness calibrated."
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Logged By
            </label>
            <input
              type="text"
              required
              value={loggedBy}
              onChange={e => setLoggedBy(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inputNum <= 0 || lossNum <= 0}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Record Loss Entry</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
