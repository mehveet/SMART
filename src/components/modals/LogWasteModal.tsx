import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { MealSession, WasteCategory } from '../../types';
import { normalizeToKg } from '../../utils/unitUtils';
import { AlertCircle, Calendar, Trash2, Utensils } from 'lucide-react';

interface LogWasteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogWasteModal: React.FC<LogWasteModalProps> = ({ isOpen, onClose }) => {
  const { addWasteLog, inventory } = useApp();

  const [foodItem, setFoodItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [category, setCategory] = useState<WasteCategory>('Preparation Waste');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [mealSession, setMealSession] = useState<MealSession>('Lunch');
  const [reason, setReason] = useState('Prep Trim Margin - outer skin and fibrous stalk removal');
  const [station, setStation] = useState<'Main Prep & Chop' | 'Bakery & Dessert' | 'Hot Line & Curry' | 'Dishwashing & Scraping' | 'Cold Larder'>('Main Prep & Chop');
  const [loggedBy, setLoggedBy] = useState('Chef R. Kulkarni (Line 2)');
  const [actionRecommended, setActionRecommended] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const COMMON_REASONS: Record<WasteCategory, string[]> = {
    'Preparation Waste': [
      'Prep Trim Margin - outer skin and fibrous stalk removal',
      'Defective cut specifications / trimming excess',
      'Over-peeling loss during automated vegetable prep',
    ],
    'Spoilage': [
      'Cold Chain Fluctuation - walk-in temperature spike',
      'Passed Best-Before date prior to batch scheduling',
      'Moisture condensation damage in cold room rack',
    ],
    'Overproduction': [
      'Attendance Variance - lower campus attendance than forecast',
      'Over-catered secondary buffer batch unserved',
      'Weather-induced dining drop (heavy rain)',
    ],
    'Plate Waste': [
      'Oversized initial ladle portioning on service line',
      'Recipe seasoning feedback (spice level adjustment)',
      'Student tray plate scrape leftovers',
    ],
    'Processing Loss': [
      'Burnt bottom crust during steam kettle simmering',
      'Spillage during bulk transfer to hot transport pans',
      'Over-reduction cooking moisture loss',
    ],
  };

  const handleCategoryChange = (cat: WasteCategory) => {
    setCategory(cat);
    if (COMMON_REASONS[cat] && COMMON_REASONS[cat].length > 0) {
      setReason(COMMON_REASONS[cat][0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseFloat(quantity);

    if (!foodItem.trim()) {
      setErrorMsg('Food item description is required.');
      return;
    }
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setErrorMsg('Please enter a valid measured quantity greater than 0.');
      return;
    }
    if (!date) {
      setErrorMsg('Date is required.');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('Please state a reason for this waste event.');
      return;
    }

    const normalizedWeightKg = normalizeToKg(qtyNum, unit);
    const estimatedCost = Math.round(normalizedWeightKg * 45); // ~₹45/kg average raw cost

    addWasteLog({
      foodItem: foodItem.trim(),
      itemName: foodItem.trim(),
      quantity: qtyNum,
      unit,
      weightKg: normalizedWeightKg,
      category,
      wasteStream:
        category === 'Plate Waste'
          ? 'Post-consumer Plate Return'
          : category === 'Spoilage'
          ? 'Storage Spoilage'
          : category === 'Overproduction'
          ? 'Overproduction / Unserved'
          : 'Pre-consumer Prep Waste',
      date,
      reason: reason.trim(),
      rootCause:
        category === 'Plate Waste'
          ? 'Plate Leftovers'
          : category === 'Spoilage'
          ? 'Cold Chain Fluctuation'
          : category === 'Overproduction'
          ? 'Forecast Variance'
          : 'Prep Trim Margin',
      mealSession,
      kitchenStation: station,
      costLoss: estimatedCost,
      loggedBy: loggedBy.trim() || 'Duty Chef',
      actionRecommended: actionRecommended.trim() || 'Logged into shift audit log for station review',
    });

    // Reset
    setFoodItem('');
    setQuantity('');
    setActionRecommended('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Kitchen Food Waste"
      subtitle="Log weighed prep trim, spoilage, unserved overproduction, plate scraps, or processing loss"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Food Item with Quick Auto-fill from inventory */}
        <div>
          <label className="font-semibold text-slate-700 block mb-1">Food Item *</label>
          <input
            type="text"
            required
            placeholder="e.g. Cauliflower leaves, stalks & outer peelings"
            value={foodItem}
            onChange={e => setFoodItem(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          />
          {/* Quick suggestions from active inventory */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-slate-400">Quick select from inventory:</span>
            {inventory.slice(0, 4).map(inv => (
              <button
                key={inv.id}
                type="button"
                onClick={() => setFoodItem(inv.name)}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-[10px] transition-colors cursor-pointer"
              >
                {inv.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Waste Category & Meal Session */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Waste Category *</label>
            <select
              value={category}
              onChange={e => handleCategoryChange(e.target.value as WasteCategory)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="Preparation Waste">Preparation Waste (Prep Trim)</option>
              <option value="Spoilage">Spoilage (Storage/Quality Defect)</option>
              <option value="Overproduction">Overproduction (Unserved Leftover)</option>
              <option value="Plate Waste">Plate Waste (Table Scrape)</option>
              <option value="Processing Loss">Processing Loss (Burnt/Spill/Equipment)</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Meal Session *</label>
            <select
              value={mealSession}
              onChange={e => setMealSession(e.target.value as MealSession)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="Breakfast">Breakfast Shift</option>
              <option value="Lunch">Lunch Service</option>
              <option value="Dinner">Dinner Service</option>
              <option value="Snacks">Evening Snacks / Tea</option>
              <option value="All-Day Prep">All-Day Bulk Prep</option>
            </select>
          </div>
        </div>

        {/* Measured Quantity & Unit */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="font-semibold text-slate-700 block mb-1">Quantity Measured *</label>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              placeholder="e.g. 8.4"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Unit *</label>
            <select
              value={unit}
              onChange={e => setUnit(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="kg">Kilograms (kg)</option>
              <option value="g">Grams (g)</option>
              <option value="L">Liters (L)</option>
              <option value="portions">Portions (~350g)</option>
            </select>
          </div>
        </div>

        {/* Date, Station & Logged By */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Kitchen Station *</label>
            <select
              value={station}
              onChange={e => setStation(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="Main Prep & Chop">Main Prep & Chop</option>
              <option value="Hot Line & Curry">Hot Line & Curry</option>
              <option value="Dishwashing & Scraping">Dishwashing & Scraping</option>
              <option value="Cold Larder">Cold Larder</option>
              <option value="Bakery & Dessert">Bakery & Dessert</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Logged By</label>
            <input
              type="text"
              value={loggedBy}
              onChange={e => setLoggedBy(e.target.value)}
              placeholder="e.g. Chef R. Kulkarni"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="font-semibold text-slate-700 block mb-1">Root Cause / Reason *</label>
          <input
            type="text"
            required
            placeholder="e.g. Prep Trim Margin - outer stalks removed during chopping"
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          />
          {/* Quick reason suggestions based on category */}
          {COMMON_REASONS[category] && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {COMMON_REASONS[category].slice(0, 2).map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setReason(r)}
                  className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors truncate max-w-xs cursor-pointer"
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Corrective Action */}
        <div>
          <label className="font-semibold text-slate-700 block mb-1">
            Corrective Action Recommendation (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Route stalks to stock & soup broth extraction line"
            value={actionRecommended}
            onChange={e => setActionRecommended(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Record Waste Entry
          </button>
        </div>
      </form>
    </Modal>
  );
};
