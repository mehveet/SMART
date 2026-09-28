import React from 'react';
import {
  X,
  Boxes,
  Calendar,
  DollarSign,
  MapPin,
  Truck,
  AlertTriangle,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { InventoryItem } from '../../types';
import { evaluateShelfLife, normalizeToKg } from '../../utils/unitUtils';

interface ViewInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
}

export const ViewInventoryModal: React.FC<ViewInventoryModalProps> = ({
  isOpen,
  onClose,
  item,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !item) return null;

  const { status, daysRemaining, label: shelfLifeLabel } = evaluateShelfLife(item.expiryDate);
  const totalValuation = (item.cost ?? item.unitCost ?? 0) * (item.quantity ?? item.currentStockKg ?? 0);
  const isLowStock = (item.quantity ?? item.currentStockKg ?? 0) <= (item.reorderLevelKg ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                {item.category}
              </span>
              <h2 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans'] leading-tight">
                {item.name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Urgency & Expiry Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              status === 'expired'
                ? 'bg-rose-50/80 border-rose-200 text-rose-800'
                : status === 'critical'
                ? 'bg-amber-50/80 border-amber-200 text-amber-800'
                : status === 'near-term'
                ? 'bg-orange-50/80 border-orange-200 text-orange-800'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
            }`}
          >
            <div className="flex items-center gap-3">
              {status === 'expired' || status === 'critical' ? (
                <AlertTriangle className="w-5 h-5 shrink-0" />
              ) : (
                <Clock className="w-5 h-5 shrink-0" />
              )}
              <div>
                <span className="font-bold text-xs block">
                  FEFO Status: {shelfLifeLabel}
                </span>
                <span className="text-[11px] opacity-90 block mt-0.5">
                  {item.fefoRecommendation || (
                    status === 'expired'
                      ? 'EXPIRED: Segregate lot for return or discard.'
                      : status === 'critical'
                      ? 'First Expired, First Out: Use in today’s preparation immediately.'
                      : 'Rotate stock using FEFO queue.'
                  )}
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/80 border shadow-2xs">
              {status}
            </span>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[11px] text-slate-500 font-medium block">Current Stock</span>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {item.quantity ?? item.currentStockKg} <span className="text-xs font-normal text-slate-500">{item.unit || 'kg'}</span>
              </div>
              {isLowStock && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 mt-1">
                  <AlertTriangle className="w-3 h-3" /> Low Stock
                </span>
              )}
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[11px] text-slate-500 font-medium block">Unit Cost</span>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                ₹{(item.cost ?? item.unitCost ?? 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">/{item.unit || 'kg'}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Procured rate</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl col-span-2 sm:col-span-1">
              <span className="text-[11px] text-slate-500 font-medium block">Total Value</span>
              <div className="text-base font-bold text-emerald-800 mt-0.5">
                ₹{totalValuation.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Active inventory value</span>
            </div>
          </div>

          {/* Detailed Info Rows */}
          <div className="border border-slate-200/80 rounded-xl divide-y divide-slate-100 overflow-hidden">
            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-slate-400" /> Batch Code
              </span>
              <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                {item.batchCode}
              </span>
            </div>

            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Storage Location
              </span>
              <span className="font-semibold text-slate-800">
                {item.storageLocation || item.storageZone}
              </span>
            </div>

            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-slate-400" /> Supplier
              </span>
              <span className="font-semibold text-slate-800">
                {item.supplier || 'Internal Commissary'}
              </span>
            </div>

            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Purchase Date
              </span>
              <span className="font-medium text-slate-700">
                {item.purchaseDate || item.receivedDate || 'N/A'}
              </span>
            </div>

            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-500" /> Expiry Date
              </span>
              <span className="font-bold text-slate-900">
                {item.expiryDate}
              </span>
            </div>

            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Reorder Alert Level</span>
              <span className="text-slate-700">
                {item.reorderLevelKg || 0} {item.unit || 'kg'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(item);
            }}
            className="px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Lot
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-200/80 hover:bg-slate-300 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
