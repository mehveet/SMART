import React from 'react';
import {
  X,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  Scale,
  Truck,
  Phone,
  User,
  ShieldCheck,
  Edit2,
  Trash2,
  Boxes,
} from 'lucide-react';
import { RedistributionPartner, SurplusBatch } from '../../types';

interface ViewRecipientModalProps {
  isOpen: boolean;
  partner: RedistributionPartner | null;
  onClose: () => void;
  onEdit: (partner: RedistributionPartner) => void;
  onDelete: (partnerId: string, partnerName: string) => void;
  surplusBatches: SurplusBatch[];
}

export const ViewRecipientModal: React.FC<ViewRecipientModalProps> = ({
  isOpen,
  partner,
  onClose,
  onEdit,
  onDelete,
  surplusBatches,
}) => {
  if (!isOpen || !partner) return null;

  const allocatedToday = partner.allocatedTodayKg || 0;
  const capacity = partner.serviceCapacity || partner.typicalCapacityKg || 50;
  const remaining = Math.max(0, capacity - allocatedToday);
  const percentUsed = Math.min(100, Math.round((allocatedToday / capacity) * 100));

  const partnerBatches = surplusBatches.filter(
    b => b.assignedRecipientId === partner.id || b.assignedPartnerId === partner.id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#0b2b20] to-[#123e30] text-white flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                {partner.type}
              </span>
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs text-slate-300">{partner.distanceKm} km transit</span>
            </div>
            <h3 className="text-base font-bold font-['Plus_Jakarta_Sans'] text-white mt-1">
              {partner.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs max-h-[72vh] overflow-y-auto">
          {/* Capacity Progress Bar */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Daily Intake Capacity Utilization</span>
              <span className="font-mono font-bold text-slate-900">
                {allocatedToday.toFixed(1)} / {capacity} kg ({percentUsed}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  percentUsed > 85 ? 'bg-amber-500' : 'bg-emerald-600'
                }`}
                style={{ width: `${percentUsed}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Open Headroom: <strong>{remaining.toFixed(1)} kg</strong></span>
              <span className="text-emerald-700 font-medium">HACCP Logistics Agreement Active</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Facility Location</span>
              </div>
              <p className="text-xs font-bold text-slate-800">{partner.location}</p>
              <p className="text-[11px] text-slate-400">{partner.distanceKm} km from central kitchen</p>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Operating Intake Window</span>
              </div>
              <p className="text-xs font-bold text-slate-800">{partner.operatingHours}</p>
              <p className="text-[11px] text-slate-400">Preferred: {partner.preferredPickupWindow || partner.operatingHours}</p>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Authorized POC</span>
              </div>
              <p className="text-xs font-bold text-slate-800">{partner.contactPerson}</p>
              <p className="text-[11px] text-slate-500 font-mono">{partner.phone || 'Phone on file'}</p>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                <Truck className="w-3.5 h-3.5 text-slate-400" />
                <span>Pickup Transport Mode</span>
              </div>
              <p className="text-xs font-bold text-slate-800">{partner.pickupAvailability}</p>
              <p className="text-[11px] text-emerald-700 font-medium">Chain-of-Custody Verified</p>
            </div>
          </div>

          {/* Verification Badge */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <div>
                <span className="font-bold text-emerald-950 block">
                  {partner.verificationStatus}
                </span>
                <span className="text-[11px] text-emerald-800">
                  Compliant with institutional redistribution food safety protocols
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded">
              Active
            </span>
          </div>

          {/* Accepted Food Categories */}
          <div>
            <span className="font-semibold text-slate-700 block mb-1.5">
              Accepted Food Types
            </span>
            <div className="flex flex-wrap gap-1.5">
              {partner.acceptedFoodTypes.map(ft => (
                <span
                  key={ft}
                  className="px-2.5 py-1 bg-slate-100 text-slate-800 font-medium text-[11px] rounded-lg border border-slate-200"
                >
                  {ft}
                </span>
              ))}
            </div>
          </div>

          {/* Batches routed to this partner */}
          <div>
            <span className="font-semibold text-slate-700 block mb-1.5">
              Active Allocations & Dispatches ({partnerBatches.length})
            </span>
            {partnerBatches.length === 0 ? (
              <p className="text-slate-400 text-xs italic">No surplus batches currently assigned to this recipient.</p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {partnerBatches.map(b => (
                  <div
                    key={b.id}
                    className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-900">{b.batchNumber}</span>
                      <span className="text-slate-400 mx-1.5">·</span>
                      <span className="text-slate-700 font-medium">{b.foodName || b.dishName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">
                        {b.assignedQuantity || b.weightKg} kg
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          b.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Routing Notes */}
          {partner.notes && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs">
              <span className="font-semibold text-slate-900 block mb-0.5">Routing & Access Notes:</span>
              <p className="leading-relaxed">{partner.notes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(partner.id, partner.name);
            }}
            className="px-3 py-1.5 text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 font-semibold rounded-lg transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove Partner</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(partner);
              }}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition-colors flex items-center gap-1"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Profile</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
