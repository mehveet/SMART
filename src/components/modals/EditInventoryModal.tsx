import React, { useState, useEffect } from 'react';
import { X, Boxes, Calendar, DollarSign, MapPin, Truck, AlertCircle, Save } from 'lucide-react';
import { InventoryCategory, InventoryItem, InventoryUnit } from '../../types';
import { evaluateShelfLife, normalizeToKg } from '../../utils/unitUtils';

interface EditInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onSave: (id: string, updates: Partial<InventoryItem>) => void;
}

export const EditInventoryModal: React.FC<EditInventoryModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryCategory>('Produce');
  const [quantity, setQuantity] = useState<string>('');
  const [unit, setUnit] = useState<InventoryUnit>('kg');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [supplier, setSupplier] = useState('');
  const [cost, setCost] = useState<string>('');
  const [reorderLevelKg, setReorderLevelKg] = useState<string>('');
  const [fefoRecommendation, setFefoRecommendation] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setCategory(item.category || 'Produce');
      setQuantity(String(item.quantity ?? item.currentStockKg ?? ''));
      setUnit(item.unit || 'kg');
      setPurchaseDate(item.purchaseDate || item.receivedDate || '');
      setExpiryDate(item.expiryDate || '');
      setStorageLocation(item.storageLocation || item.storageZone || 'Walk-in Chiller (2-4°C)');
      setSupplier(item.supplier || '');
      setCost(String(item.cost ?? item.unitCost ?? ''));
      setReorderLevelKg(String(item.reorderLevelKg ?? ''));
      setFefoRecommendation(item.fefoRecommendation || '');
      setErrorMsg(null);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseFloat(quantity);
    const costNum = parseFloat(cost);
    const reorderNum = parseFloat(reorderLevelKg);

    if (!name.trim()) {
      setErrorMsg('Item name is required.');
      return;
    }
    if (isNaN(qtyNum) || qtyNum < 0) {
      setErrorMsg('Please enter a valid non-negative quantity.');
      return;
    }
    if (!expiryDate) {
      setErrorMsg('Expiry date is required for FEFO compliance.');
      return;
    }
    if (isNaN(costNum) || costNum < 0) {
      setErrorMsg('Unit cost must be a non-negative number.');
      return;
    }

    const { status } = evaluateShelfLife(expiryDate);
    const normalizedStockKg = normalizeToKg(qtyNum, unit);

    onSave(item.id, {
      name: name.trim(),
      category,
      quantity: qtyNum,
      unit,
      currentStockKg: normalizedStockKg,
      purchaseDate,
      receivedDate: purchaseDate,
      expiryDate,
      storageLocation: storageLocation.trim(),
      storageZone: storageLocation.trim(),
      supplier: supplier.trim() || 'Internal Commissary',
      cost: costNum,
      unitCost: costNum,
      reorderLevelKg: isNaN(reorderNum) ? Math.round(normalizedStockKg * 0.3) : reorderNum,
      shelfLifeStatus: status,
      fefoRecommendation: fefoRecommendation.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                Edit Inventory Lot
              </h2>
              <p className="text-xs text-slate-500">
                Batch code: <span className="font-mono font-medium text-slate-700">{item.batchCode}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Item Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Item Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Aged Basmati Rice (Dehradun Grade-A)"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Category *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as InventoryCategory)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
              >
                <option value="Produce">Produce</option>
                <option value="Dairy & Poultry">Dairy & Poultry</option>
                <option value="Grains & Pulses">Grains & Pulses</option>
                <option value="Proteins">Proteins</option>
                <option value="Prepared Bases">Prepared Bases</option>
                <option value="Dry Goods">Dry Goods</option>
                <option value="Bakery">Bakery</option>
                <option value="Condiments & Spices">Condiments & Spices</option>
              </select>
            </div>
          </div>

          {/* Quantity, Unit & Unit Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Stock Quantity *</label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="e.g. 50"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Unit of Measure *</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value as InventoryUnit)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="g">Grams (g)</option>
                <option value="L">Liters (L)</option>
                <option value="crates">Crates</option>
                <option value="packs">Packs</option>
                <option value="units">Units / Pieces</option>
                <option value="bags">Bags</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Unit Cost (₹) *</label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={cost}
                onChange={e => setCost(e.target.value)}
                placeholder="e.g. 85"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Purchase / Received Date
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                Expiry Date * (FEFO Benchmark)
              </label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Storage Location & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Storage Location *
              </label>
              <select
                value={storageLocation}
                onChange={e => setStorageLocation(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
              >
                <option value="Walk-in Chiller (2-4°C)">Walk-in Chiller (2-4°C)</option>
                <option value="Deep Freezer (-18°C)">Deep Freezer (-18°C)</option>
                <option value="Dry Pantry Zone">Dry Pantry Zone</option>
                <option value="Dry Pantry Zone - Bay 1">Dry Pantry Zone - Bay 1</option>
                <option value="Dry Pantry Zone - Bay 2">Dry Pantry Zone - Bay 2</option>
                <option value="Dry Pantry Zone - Bay 3">Dry Pantry Zone - Bay 3</option>
                <option value="Cooked Hot-Hold Area">Cooked Hot-Hold Area</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-slate-400" />
                Supplier Name
              </label>
              <input
                type="text"
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                placeholder="e.g. Sahyadri Organic Agro FPO"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Reorder Level & FEFO Recommendation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Reorder Threshold (kg)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={reorderLevelKg}
                onChange={e => setReorderLevelKg(e.target.value)}
                placeholder="e.g. 25"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">Triggers low-stock warning when below this level</p>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                FEFO Stock Rotation Advice
              </label>
              <input
                type="text"
                value={fefoRecommendation}
                onChange={e => setFefoRecommendation(e.target.value)}
                placeholder="e.g. Priority #1 FEFO: Stage for today's dinner"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">Kitchen staff instructions for First Expired First Out</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
