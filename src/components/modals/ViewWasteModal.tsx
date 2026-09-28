import React from 'react';
import {
  X,
  Trash2,
  Calendar,
  DollarSign,
  Utensils,
  AlertCircle,
  Clock,
  Sparkles,
  MapPin,
  User,
} from 'lucide-react';
import { WasteLog } from '../../types';

interface ViewWasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: WasteLog | null;
  onDelete: (log: WasteLog) => void;
}

export const ViewWasteModal: React.FC<ViewWasteModalProps> = ({
  isOpen,
  onClose,
  log,
  onDelete,
}) => {
  if (!isOpen || !log) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
                {log.category || 'Kitchen Waste'}
              </span>
              <h2 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans'] leading-tight">
                {log.foodItem || log.itemName}
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
        <div className="p-6 space-y-4 text-xs">
          {/* Key Metric Blocks */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[11px] text-slate-500 font-medium block">Measured Quantity</span>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {log.quantity} <span className="text-xs font-normal text-slate-500">{log.unit || 'kg'}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Normalized: {log.weightKg?.toFixed(2) ?? log.quantity} kg
              </span>
            </div>

            <div className="p-3 bg-rose-50/60 border border-rose-200/80 rounded-xl">
              <span className="text-[11px] text-rose-700 font-medium block">Financial Loss</span>
              <div className="text-lg font-bold text-rose-600 mt-0.5">
                ₹{(log.costLoss || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-rose-600/80 mt-0.5 block">
                Ingredient cost valuation
              </span>
            </div>
          </div>

          {/* Details Table */}
          <div className="border border-slate-200/80 rounded-xl divide-y divide-slate-100 overflow-hidden">
            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Log Date & Session
              </span>
              <span className="font-semibold text-slate-800">
                {log.date || log.timestamp?.slice(0, 10)} · {log.mealSession || 'General Shift'}
              </span>
            </div>

            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Kitchen Station
              </span>
              <span className="font-semibold text-slate-800">
                {log.kitchenStation || 'Main Prep'}
              </span>
            </div>

            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Logged By
              </span>
              <span className="font-medium text-slate-700">
                {log.loggedBy || 'Duty Staff'}
              </span>
            </div>

            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Timestamp
              </span>
              <span className="font-mono text-slate-700">
                {log.timestamp}
              </span>
            </div>
          </div>

          {/* Root Cause & Reason */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Root Cause & Audit Reason:
            </span>
            <p className="text-xs text-slate-800 leading-relaxed font-medium">
              {log.reason || log.rootCause || 'Routine kitchen preparation trim margin.'}
            </p>
          </div>

          {/* Corrective Action */}
          {log.actionRecommended && (
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Corrective Action Recommended:
              </span>
              <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                {log.actionRecommended}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(log);
            }}
            className="px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Entry
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 bg-slate-200/80 hover:bg-slate-300 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
