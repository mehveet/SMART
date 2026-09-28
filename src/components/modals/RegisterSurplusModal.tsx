import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { SurplusBatch } from '../../types';

interface RegisterSurplusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegisterSurplusModal: React.FC<RegisterSurplusModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { registerSurplusBatch, createSurplusBatch } = useApp();

  const [dishName, setDishName] = useState('');
  const [category, setCategory] = useState<SurplusBatch['category']>('Cooked Main');
  const [portions, setPortions] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [tempLogged, setTempLogged] = useState('68.5');
  const [safeWindow, setSafeWindow] = useState('Consume within 4 hours (Safe until 17:30)');
  const [inspector, setInspector] = useState('Food Safety Lead P. Iyer (Cert #HACCP-441)');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weight = parseFloat(weightKg);
    const portionCount = parseInt(portions, 10);
    const temp = parseFloat(tempLogged);

    if (!dishName || isNaN(weight) || weight <= 0) return;

    const now = new Date();
    const timeStr = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    const deadlineTime = `${now.toISOString().slice(0, 10)} ${String(Math.min(23, now.getHours() + 4)).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    createSurplusBatch({
      foodName: dishName,
      dishName,
      category,
      quantity: weight,
      unit: 'kg',
      portions: portionCount || Math.round(weight * 3.5),
      weightKg: weight,
      preparationTime: timeStr,
      storageConditions: 'Hot Holding (>65°C)',
      collectionDeadline: deadlineTime,
      location: 'Main Kitchen Service Bay 1',
      qualityReviewStatus: 'Passed HACCP Inspection',
      status: 'Available',
      safeConsumptionWindow: safeWindow,
      haccpClearance: {
        temperatureLogged: temp || 68.0,
        passed: true,
        inspectedBy: inspector,
      },
    });

    setDishName('');
    setWeightKg('');
    setPortions('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Stage Safe Surplus Food for Redistribution"
      subtitle="Register verified unserved culinary surplus with mandatory HACCP temperature verification"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="font-semibold text-slate-700 block mb-1">Cooked Dish / Food Item</label>
          <input
            type="text"
            required
            placeholder="e.g. Saffron Peas Pulao & Mixed Veg Curry"
            value={dishName}
            onChange={e => setDishName(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as SurplusBatch['category'])}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="Cooked Main">Cooked Main</option>
              <option value="Steamed Rice & Breads">Steamed Rice & Breads</option>
              <option value="Soups & Gravies">Soups & Gravies</option>
              <option value="Baked Goods">Baked Goods</option>
              <option value="Fresh Cut Produce">Fresh Cut Produce</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Net Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              required
              placeholder="e.g. 24.5"
              value={weightKg}
              onChange={e => setWeightKg(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Estimated Portions</label>
            <input
              type="number"
              placeholder="e.g. 85"
              value={portions}
              onChange={e => setPortions(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Core Temperature Logged (°C)
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={tempLogged}
              onChange={e => setTempLogged(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
            <p className="text-[10px] text-emerald-700 mt-0.5">Hot hold &gt;60°C or Chilled &lt;4°C</p>
          </div>
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Safe Consumption Window</label>
          <input
            type="text"
            required
            value={safeWindow}
            onChange={e => setSafeWindow(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">HACCP Inspection Officer</label>
          <input
            type="text"
            required
            value={inspector}
            onChange={e => setInspector(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors"
          >
            Clear & Stage Surplus
          </button>
        </div>
      </form>
    </Modal>
  );
};
