import React, { useState } from 'react';
import { X, Plus, Calendar, Utensils, Users, AlertCircle, Sparkles } from 'lucide-react';
import { HistoricalMealRecord } from '../../types/forecasting';

interface ManualMealRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRecord: (record: HistoricalMealRecord) => void;
}

export const ManualMealRecordModal: React.FC<ManualMealRecordModalProps> = ({
  isOpen,
  onClose,
  onAddRecord,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(todayStr);
  const [mealCategory, setMealCategory] = useState<HistoricalMealRecord['mealCategory']>('Lunch');
  const [menuName, setMenuName] = useState<string>('Standard Institutional Lunch Thali');
  const [attendance, setAttendance] = useState<number>(2450);
  const [mealsPrepared, setMealsPrepared] = useState<number>(2520);
  const [mealsServed, setMealsServed] = useState<number>(2410);
  const [specialEvent, setSpecialEvent] = useState<HistoricalMealRecord['specialEvent']>('None');
  const [weather, setWeather] = useState<HistoricalMealRecord['weather']>('Clear');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!date) {
      setFormError('Please select a valid date.');
      return;
    }
    if (mealsPrepared <= 0) {
      setFormError('Meals prepared must be greater than 0.');
      return;
    }
    if (mealsServed < 0) {
      setFormError('Meals served cannot be negative.');
      return;
    }

    const d = new Date(date);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[d.getDay()] || 'Monday';

    const surplusMeals = Math.max(0, mealsPrepared - mealsServed);
    const wasteKg = Number((surplusMeals * 0.16).toFixed(1));

    const newRecord: HistoricalMealRecord = {
      id: `manual-${Date.now()}`,
      date,
      dayOfWeek,
      mealCategory,
      menuName,
      attendance: attendance || mealsPrepared,
      mealsPrepared,
      mealsServed,
      surplusMeals,
      wasteKg,
      specialEvent,
      weather,
    };

    onAddRecord(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                Add Historical Kitchen Record
              </h3>
              <p className="text-xs text-slate-500">
                Record actual meal count and surplus to train the regression demand model
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Meal Category *
              </label>
              <select
                value={mealCategory}
                onChange={e => setMealCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white"
              >
                <option value="Lunch">Lunch Service</option>
                <option value="Dinner">Dinner Service</option>
                <option value="Breakfast">Breakfast Service</option>
                <option value="Snacks">Snacks / Refreshments</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Menu / Dish Description
            </label>
            <input
              type="text"
              value={menuName}
              onChange={e => setMenuName(e.target.value)}
              placeholder="e.g., Paneer Butter Masala, Dal Makhani & Rice"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Attendance
              </label>
              <input
                type="number"
                min="0"
                value={attendance}
                onChange={e => setAttendance(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Meals Prepared *
              </label>
              <input
                type="number"
                min="1"
                value={mealsPrepared}
                onChange={e => setMealsPrepared(Number(e.target.value))}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Meals Served *
              </label>
              <input
                type="number"
                min="0"
                value={mealsServed}
                onChange={e => setMealsServed(Number(e.target.value))}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
            <span className="text-slate-600">Calculated Surplus:</span>
            <span className="font-mono font-bold text-slate-900">
              {Math.max(0, mealsPrepared - mealsServed)} meals (~{(Math.max(0, mealsPrepared - mealsServed) * 0.16).toFixed(1)} kg)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Special Event / Context
              </label>
              <select
                value={specialEvent}
                onChange={e => setSpecialEvent(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white"
              >
                <option value="None">None (Standard Academic Day)</option>
                <option value="Exam Week">Exam Week (-10% footfall)</option>
                <option value="Cultural Fest">Cultural Fest (+15% surge)</option>
                <option value="Tech Expo">Tech Expo / Placement Drive</option>
                <option value="Alumni Meet">Alumni Meet</option>
                <option value="Sports Day">Sports Day</option>
                <option value="Holiday">Institutional Holiday</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Weather Condition
              </label>
              <select
                value={weather}
                onChange={e => setWeather(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white"
              >
                <option value="Clear">Clear & Sunny</option>
                <option value="Rain / Storm">Rain / Storm (-4.5% footfall)</option>
                <option value="Overcast">Overcast</option>
                <option value="Extreme Heat">Extreme Heat</option>
              </select>
            </div>
          </div>

          {/* Footer Buttons */}
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
              <Plus className="w-3.5 h-3.5" />
              <span>Save Record & Retrain</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
