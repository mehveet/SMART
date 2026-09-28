import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { RedistributionDispatch } from '../../types';

interface DispatchManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedBatchId?: string;
  preselectedPartnerId?: string;
}

export const DispatchManifestModal: React.FC<DispatchManifestModalProps> = ({
  isOpen,
  onClose,
  preselectedBatchId,
  preselectedPartnerId,
}) => {
  const { surplusBatches, partners, createDispatchManifest } = useApp();

  const stagedBatches = surplusBatches.filter(
    b =>
      (b.redistributionStatus === 'staged' ||
        b.redistributionStatus === 'allocated' ||
        b.status === 'Available' ||
        b.status === 'Matched') &&
      b.status !== 'Collected' &&
      b.status !== 'Delivered' &&
      b.status !== 'Cancelled'
  );

  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [partnerId, setPartnerId] = useState<string>(
    preselectedPartnerId || partners[0]?.id || ''
  );
  const [carrier, setCarrier] = useState<RedistributionDispatch['transitCarrier']>(
    'Insulated Thermal Box (Van A)'
  );

  useEffect(() => {
    if (preselectedBatchId && stagedBatches.some(b => b.id === preselectedBatchId)) {
      setSelectedBatchIds([preselectedBatchId]);
    } else if (stagedBatches.length > 0) {
      setSelectedBatchIds([stagedBatches[0].id]);
    } else {
      setSelectedBatchIds([]);
    }
  }, [preselectedBatchId, isOpen, surplusBatches]);

  useEffect(() => {
    if (preselectedPartnerId) {
      setPartnerId(preselectedPartnerId);
    }
  }, [preselectedPartnerId, isOpen]);

  const toggleBatch = (id: string) => {
    setSelectedBatchIds(prev =>
      prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]
    );
  };

  const selectedBatches = surplusBatches.filter(b => selectedBatchIds.includes(b.id));
  const totalWeight = selectedBatches.reduce((acc, curr) => acc + curr.weightKg, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBatchIds.length === 0 || !partnerId) return;

    createDispatchManifest(selectedBatchIds, partnerId, carrier);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Internal Chain-of-Custody Manifest"
      subtitle="Authorized internal redistribution routing to verified partner facilities"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="font-semibold text-slate-700 block mb-1.5">
            Select Surplus Food Batches to Dispatch ({selectedBatchIds.length} selected, {totalWeight.toFixed(1)} kg)
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50">
            {stagedBatches.length === 0 ? (
              <div className="py-4 px-2 text-center text-slate-500 text-xs italic">
                No surplus batches currently waiting for dispatch. All staged food has already been dispatched.
              </div>
            ) : (
              stagedBatches.map(batch => (
                <label
                  key={batch.id}
                  className="flex items-center gap-2.5 p-1.5 rounded hover:bg-white cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedBatchIds.includes(batch.id)}
                    onChange={() => toggleBatch(batch.id)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="flex-1 flex items-center justify-between text-slate-800">
                    <span className="font-medium">{batch.dishName}</span>
                    <span className="font-mono text-slate-500 font-bold">{batch.weightKg} kg</span>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">
            Authorized Institutional Recipient
          </label>
          <select
            value={partnerId}
            onChange={e => setPartnerId(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          >
            {partners.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.type} · {p.distanceKm} km away)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">
            Thermal Transit Logistics Vehicle
          </label>
          <select
            value={carrier}
            onChange={e =>
              setCarrier(e.target.value as RedistributionDispatch['transitCarrier'])
            }
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="Insulated Thermal Box (Van A)">
              Insulated Thermal Box (Van A) - Hot/Cold Pack Certified
            </option>
            <option value="Refrigerated Shuttle B">
              Refrigerated Shuttle B - Chilled Active Core
            </option>
            <option value="On-site Thermal Cart">
              On-site Thermal Cart - Campus Internal Transfer
            </option>
          </select>
        </div>

        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-slate-700">
          <div className="font-semibold text-emerald-900 mb-1">Chain-of-Custody Security</div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Dispatch manifest assigns serialized security tamper seal and logs departure time. Recipient officer must verify core temperature on arrival.
          </p>
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
            disabled={selectedBatchIds.length === 0}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
          >
            Issue Manifest & Dispatch
          </button>
        </div>
      </form>
    </Modal>
  );
};
