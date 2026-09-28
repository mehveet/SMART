import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Thermometer,
  ShieldCheck,
  FileCheck,
  Building2,
  Calendar,
} from 'lucide-react';
import { SurplusBatch } from '../../types';
import { useApp } from '../../context/AppContext';

interface WorkflowActionModalProps {
  isOpen: boolean;
  batch: SurplusBatch | null;
  targetStep: 'schedule_pickup' | 'mark_collected' | 'confirm_delivery' | 'cancel_batch';
  onClose: () => void;
}

export const WorkflowActionModal: React.FC<WorkflowActionModalProps> = ({
  isOpen,
  batch,
  targetStep,
  onClose,
}) => {
  const {
    partners,
    schedulePickup,
    markBatchCollected,
    confirmBatchDelivery,
    cancelBatch,
  } = useApp();

  // Schedule Pickup state
  const [scheduledTime, setScheduledTime] = useState('');
  const [carrier, setCarrier] = useState('Insulated Thermal Box (Van A)');
  const [vehicleCode, setVehicleCode] = useState('KA-04-TH-1190');
  const [driverContact, setDriverContact] = useState('Sunil Verma (+91 98450 99881)');
  const [pickupNotes, setPickupNotes] = useState('');

  // Mark Collected state
  const [pickupTemp, setPickupTemp] = useState('65.5');
  const [securitySeal, setSecuritySeal] = useState(`SEAL-${Math.floor(10000 + Math.random() * 90000)}`);

  // Confirm Delivery state
  const [deliveredAt, setDeliveredAt] = useState('');
  const [receivingOfficer, setReceivingOfficer] = useState('');
  const [tempAtDelivery, setTempAtDelivery] = useState('64.2');
  const [deliveredKg, setDeliveredKg] = useState('');
  const [verificationCode, setVerificationCode] = useState(`VERIF-REC-${Math.floor(1000 + Math.random() * 9000)}`);
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Cancel Batch state
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    const now = new Date();
    const timeStr = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    const laterTimeStr = `${now.toISOString().slice(0, 10)} ${String((now.getHours() + 1) % 24).padStart(
      2,
      '0'
    )}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (batch) {
      setScheduledTime(laterTimeStr);
      setDeliveredAt(timeStr);
      setDeliveredKg(String(batch.assignedQuantity || batch.weightKg || batch.quantity || 15));
      const partner = partners.find(p => p.id === batch.assignedRecipientId);
      setReceivingOfficer(partner?.contactPerson || 'Authorized Receiving Supervisor');
    }
  }, [batch, targetStep, isOpen, partners]);

  if (!isOpen || !batch) return null;

  const batchWeight = batch.weightKg || batch.quantity || 15;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (targetStep === 'schedule_pickup') {
      schedulePickup(batch.id, {
        scheduledTime,
        carrier,
        vehicleCode,
        driverContact,
        tempAtPickup: parseFloat(pickupTemp) || 66.0,
        notes: pickupNotes,
      });
    } else if (targetStep === 'mark_collected') {
      markBatchCollected(batch.id, parseFloat(pickupTemp) || 66.0);
    } else if (targetStep === 'confirm_delivery') {
      const deliveredWeight = parseFloat(deliveredKg) || batchWeight;
      confirmBatchDelivery(batch.id, {
        deliveredAt,
        receivingOfficer,
        tempAtDelivery: parseFloat(tempAtDelivery) || 64.0,
        deliveredKg: deliveredWeight,
        signatureVerificationCode: verificationCode,
        notes: deliveryNotes || 'Delivered and verified at recipient dining facility.',
      });
    } else if (targetStep === 'cancel_batch') {
      cancelBatch(batch.id, cancelReason || 'Internal operational adjustment');
    }

    onClose();
  };

  const getModalTitle = () => {
    switch (targetStep) {
      case 'schedule_pickup':
        return 'Schedule Redistribution Pickup';
      case 'mark_collected':
        return 'Confirm Handover & Departure (Mark Collected)';
      case 'confirm_delivery':
        return 'Confirm Delivery & Food Recovery Certificate';
      case 'cancel_batch':
        return 'Cancel Surplus Batch Listing';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#0b2b20] to-[#123e30] text-white flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base font-bold font-['Plus_Jakarta_Sans'] text-white">
                {getModalTitle()}
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Batch: <strong>{batch.batchNumber}</strong> · {batch.foodName || batch.dishName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Schedule Pickup Form */}
          {targetStep === 'schedule_pickup' && (
            <>
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                <div className="flex justify-between font-semibold text-emerald-950">
                  <span>Assigned Recipient:</span>
                  <span>{batch.assignedRecipientName || 'Institutional Partner'}</span>
                </div>
                <div className="flex justify-between text-emerald-900 text-[11px]">
                  <span>Allocated Quantity:</span>
                  <span className="font-mono font-bold">
                    {batch.assignedQuantity || batchWeight} kg
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Scheduled Pickup Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  placeholder="YYYY-MM-DD HH:mm (e.g. 2026-09-24 15:30)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Transit Logistics Carrier
                </label>
                <select
                  value={carrier}
                  onChange={e => setCarrier(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Insulated Thermal Box (Van A)">Insulated Thermal Box (Van A) - Hot Chain</option>
                  <option value="Refrigerated Shuttle B">Refrigerated Shuttle B - Chilled Active</option>
                  <option value="On-site Thermal Cart">On-site Thermal Cart - Campus Internal</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Vehicle License / Code</label>
                  <input
                    type="text"
                    value={vehicleCode}
                    onChange={e => setVehicleCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Assigned Driver & POC</label>
                  <input
                    type="text"
                    value={driverContact}
                    onChange={e => setDriverContact(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Logistics Notes</label>
                <textarea
                  rows={2}
                  value={pickupNotes}
                  onChange={e => setPickupNotes(e.target.value)}
                  placeholder="e.g. Loading through West Service Gate 2 with heated cambro carriers."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* Mark Collected Form */}
          {targetStep === 'mark_collected' && (
            <>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-amber-900">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Departure Handover & Temperature Verification</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Verify food core temperature before container seal is locked for transit.
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Verified Core Temperature at Pickup (°C) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={pickupTemp}
                  onChange={e => setPickupTemp(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Hot Holding safe standard: &gt;60.0°C · Cold storage safe standard: &lt;4.0°C
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Chain-of-Custody Tamper Seal Code
                </label>
                <input
                  type="text"
                  required
                  value={securitySeal}
                  onChange={e => setSecuritySeal(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* Confirm Delivery Form */}
          {targetStep === 'confirm_delivery' && (
            <>
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-emerald-950">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Mandatory Delivery Confirmation for Sustainability Credit</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Food is officially counted as <strong>recovered</strong> in dashboard and sustainability metrics only after verified delivery confirmation by the receiving institution.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Delivery Timestamp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveredAt}
                    onChange={e => setDeliveredAt(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Delivered Net Weight (kg) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={deliveredKg}
                    onChange={e => setDeliveredKg(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Receiving Officer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={receivingOfficer}
                    onChange={e => setReceivingOfficer(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Core Temp at Delivery (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={tempAtDelivery}
                    onChange={e => setTempAtDelivery(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Recipient Signature Verification Code
                </label>
                <input
                  type="text"
                  required
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Receipt Notes</label>
                <textarea
                  rows={2}
                  value={deliveryNotes}
                  onChange={e => setDeliveryNotes(e.target.value)}
                  placeholder="e.g. All portions received intact and served at community study center."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* Cancel Batch Form */}
          {targetStep === 'cancel_batch' && (
            <>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-rose-900">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-700" />
                  <span>Cancel Surplus Batch</span>
                </div>
                <p className="text-[11px] text-rose-800">
                  This will de-allocate the batch, release partner capacity, and mark the listing as Cancelled.
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Reason for Cancellation <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="e.g. Batch consumed on-site for late unscheduled evening symposium."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 text-white ${
                targetStep === 'cancel_batch'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {targetStep === 'schedule_pickup' && 'Confirm Pickup Schedule'}
                {targetStep === 'mark_collected' && 'Confirm Handover & Departure'}
                {targetStep === 'confirm_delivery' && 'Confirm Delivery & Record Recovery'}
                {targetStep === 'cancel_batch' && 'Confirm Cancellation'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
