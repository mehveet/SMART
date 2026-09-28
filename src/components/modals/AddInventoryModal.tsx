import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { InventoryCategory, InventoryItem, InventoryUnit } from '../../types';
import { evaluateShelfLife, normalizeToKg } from '../../utils/unitUtils';
import { AlertCircle, Calendar, MapPin, Truck } from 'lucide-react';

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddInventoryModal: React.FC<AddInventoryModalProps> = ({ isOpen, onClose }) => {
  const { addInventoryItem } = useApp();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryCategory>('Produce');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<InventoryUnit>('kg');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState('');
  const [storageLocation, setStorageLocation] = useState('Walk-in Chiller (2-4°C)');
  const [supplier, setSupplier] = useState('');
  const [cost, setCost] = useState('');
  const [reorderLevelKg, setReorderLevelKg] = useState('');
  const [fefoAdvice, setFefoAdvice] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseFloat(quantity);
    const costNum = parseFloat(cost) || 50;

    if (!name.trim()) {
      setErrorMsg('Item name is required.');
      return;
    }
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setErrorMsg('Please enter a valid positive quantity.');
      return;
    }
    if (!expiryDate) {
      setErrorMsg('Expiry date is mandatory for FEFO inventory tracking.');
      return;
    }

    const { status, label } = evaluateShelfLife(expiryDate);
    const normalizedStockKg = normalizeToKg(qtyNum, unit);
    const reorder = parseFloat(reorderLevelKg) || Math.round(normalizedStockKg * 0.3);

    const batchCode = `LOT-${name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')}-${Date.now().toString().slice(-5)}`;

    addInventoryItem({
      name: name.trim(),
      category,
      quantity: qtyNum,
      unit,
      currentStockKg: normalizedStockKg,
      reorderLevelKg: reorder,
      cost: costNum,
      unitCost: costNum,
      purchaseDate,
      receivedDate: purchaseDate,
      expiryDate,
      storageLocation,
      storageZone: storageLocation,
      supplier: supplier.trim() || 'Internal Commissary',
      batchCode,
      shelfLifeStatus: status,
      fefoRecommendation: fefoAdvice.trim() || `FEFO ${label}: Process through standard rotation.`,
    });

    // Reset
    setName('');
    setQuantity('');
    setCost('');
    setReorderLevelKg('');
    setExpiryDate('');
    setSupplier('');
    setFefoAdvice('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Receive Inventory Lot"
      subtitle="Register incoming food supplies with batch traceability, supplier details, and FEFO shelf-life tags"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Item Name & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="font-semibold text-slate-700 block mb-1">Item Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Farm Fresh Organic Spinach & Greens"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Category *</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as InventoryCategory)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
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

        {/* Quantity, Unit & Cost */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Stock Quantity *</label>
            <input
              type="number"
              step="any"
              min="0.1"
              required
              placeholder="e.g. 50"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Unit of Measure *</label>
            <select
              value={unit}
              onChange={e => setUnit(e.target.value as InventoryUnit)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="kg">Kilograms (kg)</option>
              <option value="g">Grams (g)</option>
              <option value="L">Liters (L)</option>
              <option value="crates">Crates (~20kg)</option>
              <option value="packs">Packs</option>
              <option value="units">Units / Pieces</option>
              <option value="bags">Bags (~25kg)</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Cost per Unit (₹) *</label>
            <input
              type="number"
              step="any"
              min="0"
              required
              placeholder="e.g. 65"
              value={cost}
              onChange={e => setCost(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Purchase Date & Expiry Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Purchase Date *
            </label>
            <input
              type="date"
              required
              value={purchaseDate}
              onChange={e => setPurchaseDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              Expiry Date * (FEFO Anchor)
            </label>
            <input
              type="date"
              required
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Storage Location & Supplier */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Storage Location *
            </label>
            <select
              value={storageLocation}
              onChange={e => setStorageLocation(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
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
              placeholder="e.g. Sahyadri Organic Agro FPO"
              value={supplier}
              onChange={e => setSupplier(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Reorder Level & FEFO Recommendation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Reorder Warning Threshold (kg)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="Optional (defaults to 30% of lot)"
              value={reorderLevelKg}
              onChange={e => setReorderLevelKg(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              FEFO Rotation Instructions
            </label>
            <input
              type="text"
              placeholder="e.g. Priority #1 FEFO: Stage for today's lunch"
              value={fefoAdvice}
              onChange={e => setFefoAdvice(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
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
            className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs transition-colors font-medium cursor-pointer"
          >
            Receive & Register Lot
          </button>
        </div>
      </form>
    </Modal>
  );
};
