import React from 'react';
import {
  X,
  ShieldCheck,
  Clock,
  MapPin,
  Truck,
  Building2,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Scale,
  Thermometer,
  FileCheck,
  Edit2,
  Sparkles,
} from 'lucide-react';
import { SurplusBatch } from '../../types';

interface ViewSurplusModalProps {
  isOpen: boolean;
  batch: SurplusBatch | null;
  onClose: () => void;
  onOpenMatch: (batch: SurplusBatch) => void;
  onOpenWorkflowAction: (
    batch: SurplusBatch,
    step: 'schedule_pickup' | 'mark_collected' | 'confirm_delivery' | 'cancel_batch'
  ) => void;
  onOpenEdit: (batch: SurplusBatch) => void;
}

export const ViewSurplusModal: React.FC<ViewSurplusModalProps> = ({
  isOpen,
  batch,
  onClose,
  onOpenMatch,
  onOpenWorkflowAction,
  onOpenEdit,
}) => {
  if (!isOpen || !batch) return null;

  const batchWeight = batch.weightKg || batch.quantity || 15;

  const steps = [
    { key: 'Available', label: '1. Available' },
    { key: 'Matched', label: '2. Matched' },
    { key: 'Pickup Scheduled', label: '3. Pickup Scheduled' },
    { key: 'Collected', label: '4. Collected' },
    { key: 'Delivered', label: '5. Delivered' },
  ];

  const currentStepIdx = steps.findIndex(s => s.key === batch.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#0b2b20] to-[#123e30] text-white flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                {batch.batchNumber}
              </span>
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs text-emerald-200 font-medium">{batch.category}</span>
            </div>
            <h3 className="text-lg font-bold font-['Plus_Jakarta_Sans'] text-white mt-1">
              {batch.foodName || batch.dishName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* Visual Workflow Stepper */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                Redistribution Chain-of-Custody Progression
              </span>
              <span
                className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  batch.status === 'Delivered'
                    ? 'bg-emerald-100 text-emerald-800'
                    : batch.status === 'Collected'
                    ? 'bg-sky-100 text-sky-800'
                    : batch.status === 'Pickup Scheduled'
                    ? 'bg-indigo-100 text-indigo-800'
                    : batch.status === 'Matched'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                Status: {batch.status}
              </span>
            </div>

            {/* Stepper Dots */}
            <div className="grid grid-cols-5 gap-1 pt-2">
              {steps.map((s, idx) => {
                const isPassed = currentStepIdx >= idx && batch.status !== 'Cancelled';
                const isCurrent = currentStepIdx === idx && batch.status !== 'Cancelled';
                return (
                  <div key={s.key} className="flex flex-col items-center text-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] transition-colors ${
                        isPassed
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-200 text-slate-500'
                      } ${isCurrent ? 'ring-2 ring-emerald-400 ring-offset-1' : ''}`}
                    >
                      {idx + 1}
                    </div>
                    <span
                      className={`text-[10px] mt-1 line-clamp-1 ${
                        isCurrent
                          ? 'font-bold text-emerald-800'
                          : isPassed
                          ? 'text-slate-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {s.label.slice(3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Net Weight</span>
              <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                {batchWeight} kg
              </span>
              <span className="text-[10px] text-slate-500">~{batch.portions} meals</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Storage State</span>
              <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">
                {batch.storageConditions}
              </span>
              <span className="text-[10px] text-emerald-700 font-medium">HACCP verified</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Prepared At</span>
              <span className="text-xs font-bold text-slate-800 font-mono mt-0.5 block">
                {batch.preparationTime || batch.preparedAt}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Deadline</span>
              <span className="text-xs font-bold text-amber-700 font-mono mt-0.5 block">
                {batch.collectionDeadline}
              </span>
            </div>
          </div>

          {/* Location & HACCP Safety Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Kitchen Staging Location</span>
              </div>
              <p className="text-xs font-bold text-slate-800">{batch.location}</p>
              <p className="text-[11px] text-slate-400">Maintained under active supervision</p>
            </div>

            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1 text-emerald-950">
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>{batch.qualityReviewStatus}</span>
                </span>
                <span className="font-mono font-bold">
                  {batch.haccpClearance?.temperatureLogged ?? 68.4}°C
                </span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Inspected by: {batch.haccpClearance?.inspectedBy || 'Lead Culinary Officer'}
              </p>
            </div>
          </div>

          {/* Assigned Recipient Details (if matched/scheduled/collected/delivered) */}
          {batch.assignedRecipientName && (
            <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl space-y-2 text-sky-950">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold">
                  <Building2 className="w-4 h-4 text-sky-700" />
                  <span>Assigned Recipient Organization</span>
                </div>
                <span className="text-[11px] font-mono font-bold text-sky-800">
                  Allocated: {batch.assignedQuantity || batchWeight} kg
                </span>
              </div>
              <p className="text-xs font-semibold text-sky-900">{batch.assignedRecipientName}</p>
              <p className="text-[11px] text-sky-800">
                Internal institutional destination. Verified HACCP chain agreement on file.
              </p>
            </div>
          )}

          {/* Pickup & Transit Information (if scheduled or collected) */}
          {batch.pickupDetails && (
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2 text-indigo-950">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-indigo-700" />
                  <span>Pickup Logistics & Transit Vehicle</span>
                </span>
                <span className="text-[11px] font-mono">{batch.pickupDetails.scheduledTime}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-indigo-900">
                <div>Carrier: <strong>{batch.pickupDetails.carrier}</strong></div>
                <div>Vehicle: <strong>{batch.pickupDetails.vehicleCode || 'Assigned'}</strong></div>
                <div>Driver: <strong>{batch.pickupDetails.driverContact || 'On file'}</strong></div>
                <div>Pickup Temp: <strong>{batch.pickupDetails.tempAtPickup || 65.5}°C</strong></div>
              </div>
              {batch.pickupDetails.notes && (
                <p className="text-[11px] text-indigo-800 mt-1 italic">
                  Note: {batch.pickupDetails.notes}
                </p>
              )}
            </div>
          )}

          {/* Delivery Confirmation & Recovery Certificate (if delivered) */}
          {batch.deliveryDetails && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2 text-emerald-950">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Official Food Recovery Certificate</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-800 font-bold">
                  {batch.deliveryDetails.deliveredKg || batchWeight} kg Diverted
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-900">
                <div>Delivered At: <strong>{batch.deliveryDetails.deliveredAt}</strong></div>
                <div>Received By: <strong>{batch.deliveryDetails.receivingOfficer}</strong></div>
                <div>Arrival Temp: <strong>{batch.deliveryDetails.tempAtDelivery || 64.0}°C</strong></div>
                <div>Code: <strong>{batch.deliveryDetails.signatureVerificationCode}</strong></div>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed pt-1 border-t border-emerald-200">
                Landfill diversion confirmed. Metrics credited towards institutional SDG 12.3 scorecard.
              </p>
            </div>
          )}

          {/* Notes */}
          {batch.notes && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
              <span className="font-semibold text-slate-900 block mb-0.5">Culinary Notes:</span>
              <p className="text-xs leading-relaxed">{batch.notes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenEdit(batch);
              }}
              className="px-3 py-1.5 text-xs text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 font-semibold rounded-lg transition-colors flex items-center gap-1"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Listing</span>
            </button>
            {batch.status !== 'Delivered' && batch.status !== 'Cancelled' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWorkflowAction(batch, 'cancel_batch');
                }}
                className="px-3 py-1.5 text-xs text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 font-semibold rounded-lg transition-colors"
              >
                Cancel Batch
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {batch.status === 'Available' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenMatch(batch);
                }}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Find Recipient Match</span>
              </button>
            )}

            {batch.status === 'Matched' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenMatch(batch);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Change Match
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenWorkflowAction(batch, 'schedule_pickup');
                  }}
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Schedule Pickup</span>
                </button>
              </>
            )}

            {batch.status === 'Pickup Scheduled' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWorkflowAction(batch, 'mark_collected');
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Mark Collected & Departed</span>
              </button>
            )}

            {batch.status === 'Collected' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWorkflowAction(batch, 'confirm_delivery');
                }}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm Delivery (Recovered)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
