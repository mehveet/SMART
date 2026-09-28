import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Save,
  Clock,
  MapPin,
  ShieldCheck,
  Thermometer,
  Boxes,
  Calendar,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { QualityReviewStatus, SurplusBatch, SurplusStatus } from '../../types';
import { useApp } from '../../context/AppContext';

interface CreateSurplusModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchToEdit?: SurplusBatch | null;
}

export const CreateSurplusModal: React.FC<CreateSurplusModalProps> = ({
  isOpen,
  onClose,
  batchToEdit,
}) => {
  const { createSurplusBatch, updateSurplusBatch } = useApp();

  const [foodName, setFoodName] = useState('');
  const [category, setCategory] = useState<SurplusBatch['category']>('Cooked Main');
  const [quantity, setQuantity] = useState('');
  const [portions, setPortions] = useState('');
  const [preparationTime, setPreparationTime] = useState('');
  const [storageConditions, setStorageConditions] = useState<SurplusBatch['storageConditions']>('Hot Holding (>65°C)');
  const [collectionDeadline, setCollectionDeadline] = useState('');
  const [location, setLocation] = useState('Main Kitchen Service Bay 1');
  const [qualityReviewStatus, setQualityReviewStatus] = useState<QualityReviewStatus>('Passed HACCP Inspection');
  const [status, setStatus] = useState<SurplusStatus>('Available');
  const [tempLogged, setTempLogged] = useState('68.5');
  const [inspector, setInspector] = useState('Food Safety Lead P. Iyer (Cert #HACCP-441)');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const now = new Date();
    const todayDate = now.toISOString().slice(0, 10);
    const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const deadlineHours = String(Math.min(23, now.getHours() + 4)).padStart(2, '0');
    const deadlineTime = `${deadlineHours}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (batchToEdit) {
      setFoodName(batchToEdit.foodName || batchToEdit.dishName || '');
      setCategory(batchToEdit.category || 'Cooked Main');
      setQuantity(String(batchToEdit.quantity || batchToEdit.weightKg || ''));
      setPortions(String(batchToEdit.portions || ''));
      setPreparationTime(batchToEdit.preparationTime || `${todayDate} ${nowTime}`);
      setStorageConditions(batchToEdit.storageConditions || 'Hot Holding (>65°C)');
      setCollectionDeadline(batchToEdit.collectionDeadline || `${todayDate} ${deadlineTime}`);
      setLocation(batchToEdit.location || 'Main Kitchen Service Bay 1');
      setQualityReviewStatus(batchToEdit.qualityReviewStatus || 'Passed HACCP Inspection');
      setStatus(batchToEdit.status || 'Available');
      setTempLogged(String(batchToEdit.haccpClearance?.temperatureLogged || '68.5'));
      setInspector(batchToEdit.haccpClearance?.inspectedBy || 'Food Safety Lead P. Iyer (Cert #HACCP-441)');
      setNotes(batchToEdit.notes || '');
    } else {
      setFoodName('');
      setCategory('Cooked Main');
      setQuantity('');
      setPortions('');
      setPreparationTime(`${todayDate} ${nowTime}`);
      setStorageConditions('Hot Holding (>65°C)');
      setCollectionDeadline(`${todayDate} ${deadlineTime}`);
      setLocation('Main Kitchen Service Bay 1');
      setQualityReviewStatus('Passed HACCP Inspection');
      setStatus('Available');
      setTempLogged('68.5');
      setInspector('Food Safety Lead P. Iyer (Cert #HACCP-441)');
      setNotes('');
    }
    setErrors({});
  }, [batchToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!foodName.trim()) errs.foodName = 'Food item name is required';
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) errs.quantity = 'Quantity must be a positive number';
    if (!preparationTime.trim()) errs.preparationTime = 'Preparation time is required';
    if (!collectionDeadline.trim()) errs.collectionDeadline = 'Collection deadline is required';
    if (!location.trim()) errs.location = 'Storage/service location is required';

    const temp = parseFloat(tempLogged);
    if (isNaN(temp)) errs.tempLogged = 'Logged temperature is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const qty = parseFloat(quantity);
    const parsedPortions = parseInt(portions, 10) || Math.round(qty * 3.5);
    const temp = parseFloat(tempLogged) || 68.0;

    if (batchToEdit) {
      updateSurplusBatch(batchToEdit.id, {
        foodName,
        dishName: foodName,
        category,
        quantity: qty,
        unit: 'kg',
        weightKg: qty,
        portions: parsedPortions,
        preparationTime,
        preparedAt: preparationTime,
        storageConditions,
        collectionDeadline,
        safeConsumptionWindow: `Safe until ${collectionDeadline.slice(11) || 'deadline'}`,
        location,
        qualityReviewStatus,
        status,
        haccpClearance: {
          temperatureLogged: temp,
          passed: qualityReviewStatus === 'Passed HACCP Inspection',
          inspectedBy: inspector,
        },
        notes,
      });
    } else {
      createSurplusBatch({
        foodName,
        dishName: foodName,
        category,
        quantity: qty,
        unit: 'kg',
        weightKg: qty,
        portions: parsedPortions,
        preparationTime,
        preparedAt: preparationTime,
        storageConditions,
        collectionDeadline,
        safeConsumptionWindow: `Safe until ${collectionDeadline.slice(11) || 'deadline'} (4-hr HACCP window)`,
        location,
        qualityReviewStatus,
        status: 'Available',
        haccpClearance: {
          temperatureLogged: temp,
          passed: qualityReviewStatus === 'Passed HACCP Inspection',
          inspectedBy: inspector,
        },
        notes,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#0b2b20] to-[#123e30] text-white flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold font-['Plus_Jakarta_Sans'] text-white">
              {batchToEdit ? 'Edit Surplus Food Listing' : 'Register & Stage Institutional Surplus'}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Internal institutional tracking with strict HACCP quality review and chain-of-custody safeguards.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Item Name */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Food Item / Dish Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Kashmiri Dum Aloo & Peas Pulao"
              value={foodName}
              onChange={e => setFoodName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
            {errors.foodName && <p className="text-rose-600 text-[11px] mt-0.5">{errors.foodName}</p>}
          </div>

          {/* Category & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Food Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Cooked Main">Cooked Main</option>
                <option value="Steamed Rice & Breads">Steamed Rice & Breads</option>
                <option value="Soups & Gravies">Soups & Gravies</option>
                <option value="Baked Goods">Baked Goods</option>
                <option value="Fresh Cut Produce">Fresh Cut Produce</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Net Weight (kg) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                placeholder="e.g. 24.5"
                value={quantity}
                onChange={e => {
                  setQuantity(e.target.value);
                  const w = parseFloat(e.target.value);
                  if (!isNaN(w)) setPortions(String(Math.round(w * 3.5)));
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              {errors.quantity && <p className="text-rose-600 text-[11px] mt-0.5">{errors.quantity}</p>}
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Est. Portions</label>
              <input
                type="number"
                placeholder="e.g. 85"
                value={portions}
                onChange={e => setPortions(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Times & Deadlines */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Preparation Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="YYYY-MM-DD HH:mm (e.g. 2026-09-24 12:45)"
                value={preparationTime}
                onChange={e => setPreparationTime(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              {errors.preparationTime && (
                <p className="text-rose-600 text-[11px] mt-0.5">{errors.preparationTime}</p>
              )}
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Collection Deadline <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="YYYY-MM-DD HH:mm (e.g. 2026-09-24 17:30)"
                value={collectionDeadline}
                onChange={e => setCollectionDeadline(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              {errors.collectionDeadline && (
                <p className="text-rose-600 text-[11px] mt-0.5">{errors.collectionDeadline}</p>
              )}
            </div>
          </div>

          {/* Storage Conditions & Kitchen Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Storage Conditions</label>
              <select
                value={storageConditions}
                onChange={e => setStorageConditions(e.target.value as SurplusBatch['storageConditions'])}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Hot Holding (>65°C)">Hot Holding (&gt;65°C)</option>
                <option value="Chilled (2-4°C)">Chilled (2-4°C)</option>
                <option value="Deep Freezer (-18°C)">Deep Freezer (-18°C)</option>
                <option value="Ambient Dry">Ambient Dry</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Kitchen Staging Location <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Main Kitchen Service Bay 1"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              {errors.location && <p className="text-rose-600 text-[11px] mt-0.5">{errors.location}</p>}
            </div>
          </div>

          {/* HACCP & Quality Review Status */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-emerald-950 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>HACCP Quality & Food Safety Verification</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="font-semibold text-emerald-900 block mb-1">
                  Quality Review Status
                </label>
                <select
                  value={qualityReviewStatus}
                  onChange={e => setQualityReviewStatus(e.target.value as QualityReviewStatus)}
                  className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Passed HACCP Inspection">Passed HACCP Inspection</option>
                  <option value="Pending Temperature Check">Pending Temperature Check</option>
                  <option value="Conditional (Rapid Chilling Required)">Conditional (Rapid Chilling Required)</option>
                  <option value="Failed / Rejected">Failed / Rejected</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-emerald-900 block mb-1">
                  Core Temp (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={tempLogged}
                  onChange={e => setTempLogged(e.target.value)}
                  className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-slate-900 font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-emerald-900 block mb-1">
                Inspecting Food Safety Officer
              </label>
              <input
                type="text"
                value={inspector}
                onChange={e => setInspector(e.target.value)}
                className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* If editing, allow updating status */}
          {batchToEdit && (
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Surplus Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as SurplusStatus)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Available">Available</option>
                <option value="Matched">Matched</option>
                <option value="Pickup Scheduled">Pickup Scheduled</option>
                <option value="Collected">Collected</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Culinary & Handling Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Prepared in bulk kettle 2; clean hot-holding pan with sealed lid."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              {batchToEdit ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{batchToEdit ? 'Save Listing Changes' : 'Stage Surplus Batch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
