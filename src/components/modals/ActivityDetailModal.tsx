import React from 'react';
import { Modal } from '../common/Modal';
import { ActivityLogItem, NavigationTab } from '../../types';
import {
  Trash2,
  Share2,
  Truck,
  Boxes,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Thermometer,
  Clock,
  User,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

interface ActivityDetailModalProps {
  activity: ActivityLogItem | null;
  onClose: () => void;
  onNavigateToTab: (tab: NavigationTab) => void;
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  activity,
  onClose,
  onNavigateToTab,
}) => {
  if (!activity) return null;

  const getCategoryIcon = () => {
    switch (activity.category) {
      case 'waste':
        return <Trash2 className="w-5 h-5 text-rose-600" />;
      case 'surplus':
        return <Share2 className="w-5 h-5 text-emerald-600" />;
      case 'dispatch':
        return <Truck className="w-5 h-5 text-sky-600" />;
      case 'inventory':
        return <Boxes className="w-5 h-5 text-indigo-600" />;
      case 'iot':
        return <Cpu className="w-5 h-5 text-amber-600" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-slate-600" />;
    }
  };

  const getStatusColor = () => {
    switch (activity.status) {
      case 'Verified':
      case 'Completed':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'In-Transit':
        return 'text-sky-700 bg-sky-50 border-sky-200';
      case 'Staged':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Logged':
        return 'text-slate-700 bg-slate-100 border-slate-200';
      case 'Attention':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      default:
        return 'text-slate-700 bg-slate-100 border-slate-200';
    }
  };

  const handleJumpToModule = () => {
    if (activity.relatedTab) {
      onNavigateToTab(activity.relatedTab);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={!!activity}
      onClose={onClose}
      title="Operational Activity Details"
      subtitle="Chain-of-custody audit record for institutional kitchen workflow"
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs">
        {/* Header Summary */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs flex-shrink-0">
            {getCategoryIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Ref ID: {activity.id}
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${getStatusColor()}`}>
                {activity.status}
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 mt-0.5 font-['Plus_Jakarta_Sans']">
              {activity.event}
            </h4>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{activity.timestamp}</span>
              <span>·</span>
              <span>Category: {activity.category.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Quantities & Parameters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border border-slate-200/90 bg-white">
            <span className="text-slate-400 text-[10px] block font-medium">Recorded Quantity</span>
            <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
              {activity.quantity}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-slate-200/90 bg-white">
            <span className="text-slate-400 text-[10px] block font-medium">Station / Destination</span>
            <span className="text-xs font-semibold text-slate-800 mt-0.5 block truncate">
              {activity.stationOrPartner}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-slate-200/90 bg-white col-span-2 sm:col-span-1">
            <span className="text-slate-400 text-[10px] block font-medium">Logged By</span>
            <span className="text-xs font-medium text-slate-800 mt-0.5 block truncate">
              {activity.loggedBy}
            </span>
          </div>
        </div>

        {/* Temperature Verification if applicable */}
        {activity.temperature !== undefined && (
          <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-900 font-medium">
              <Thermometer className="w-4 h-4 text-emerald-700" />
              <span>HACCP Core Temperature Verified</span>
            </div>
            <span className="font-mono font-bold text-emerald-900 text-sm">
              {activity.temperature}°C
            </span>
          </div>
        )}

        {/* Audit Notes */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-1">
          <span className="font-semibold text-slate-700 block text-xs">Operational Context & Notes:</span>
          <p className="text-slate-600 leading-relaxed text-[11px]">{activity.notes}</p>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close Details
          </button>

          {activity.relatedTab && (
            <button
              type="button"
              onClick={handleJumpToModule}
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Open in {activity.relatedTab.toUpperCase()}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
