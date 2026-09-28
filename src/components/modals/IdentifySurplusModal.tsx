import React, { useMemo } from 'react';
import {
  X,
  Sparkles,
  Boxes,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InventoryItem } from '../../types';

interface IdentifySurplusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStageCandidate: (candidate: {
    foodName: string;
    category: string;
    quantity: number;
    unit: string;
    storageConditions: string;
    collectionDeadline: string;
    location: string;
    source: 'Expiring Inventory' | 'Overproduction' | 'Manual Kitchen Entry';
    sourceRefId: string;
    notes: string;
  }) => void;
}

export const IdentifySurplusModal: React.FC<IdentifySurplusModalProps> = ({
  isOpen,
  onClose,
  onStageCandidate,
}) => {
  const { inventory, demandPoints, surplusBatches } = useApp();

  // 1. Identify from Inventory: near-term, critical, or excess perishable lots
  const inventoryCandidates = useMemo(() => {
    return inventory.filter(item => {
      // Exclude items already staged in active surplus
      const alreadyStaged = surplusBatches.some(
        b => b.sourceRefId === item.id && b.status !== 'Delivered' && b.status !== 'Cancelled'
      );
      if (alreadyStaged) return false;

      return (
        item.shelfLifeStatus === 'near-term' ||
        item.shelfLifeStatus === 'critical' ||
        (item.quantity > 15 && (item.category === 'Produce' || item.category === 'Dairy & Poultry'))
      );
    });
  }, [inventory, surplusBatches]);

  // 2. Identify from Production & Consumption Data: unserved buffers from recent meal sessions
  const productionCandidates = useMemo(() => {
    // Look at demand points where prepRecommendation > actualConsumption
    return demandPoints
      .filter(d => d.prepRecommendation > d.actualConsumption && d.prepRecommendation - d.actualConsumption >= 15)
      .slice(0, 3)
      .map(d => ({
        id: `prod-${d.date}`,
        title: `Overproduction Buffer: Dining Hall Service (${d.day})`,
        dishCategory: 'Cooked Main',
        estimatedKg: Number(((d.prepRecommendation - d.actualConsumption) * 0.38).toFixed(1)),
        excessPortions: d.prepRecommendation - d.actualConsumption,
        serviceDate: d.date,
        reason: `Production recommendation (${d.prepRecommendation}) exceeded actual consumption (${d.actualConsumption}) by ${d.prepRecommendation - d.actualConsumption} portions.`,
      }));
  }, [demandPoints]);

  if (!isOpen) return null;

  const now = new Date();
  const defaultDeadline = `${now.toISOString().slice(0, 10)} ${String(Math.min(23, now.getHours() + 4)).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const handleStageInventory = (item: InventoryItem) => {
    onStageCandidate({
      foodName: item.name,
      category:
        item.category === 'Produce'
          ? 'Fresh Cut Produce'
          : item.category === 'Bakery'
          ? 'Baked Goods'
          : 'Cooked Main',
      quantity: item.quantity,
      unit: item.unit,
      storageConditions: item.storageLocation.includes('Chiller') ? 'Chilled (2-4°C)' : 'Ambient Dry',
      collectionDeadline: `${item.expiryDate} 18:00`,
      location: item.storageLocation,
      source: 'Expiring Inventory',
      sourceRefId: item.id,
      notes: `Identified from FEFO inventory alert. Expiring ${item.expiryDate}. Original supplier: ${item.supplier}.`,
    });
    onClose();
  };

  const handleStageProduction = (prod: (typeof productionCandidates)[0]) => {
    onStageCandidate({
      foodName: `Prepared Unserved Buffet Mains (${prod.title})`,
      category: 'Cooked Main',
      quantity: prod.estimatedKg,
      unit: 'kg',
      storageConditions: 'Hot Holding (>65°C)',
      collectionDeadline: defaultDeadline,
      location: 'Central Kitchen Service Bay 1',
      source: 'Overproduction',
      sourceRefId: prod.id,
      notes: `Identified from post-service production buffer. ${prod.reason}`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#0b2b20] to-[#123e30] text-white flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <h3 className="text-base font-bold font-['Plus_Jakarta_Sans'] text-white">
                Identify Surplus from Kitchen Data
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              Automatically detect surplus batches from near-expiry FEFO inventory and recorded production variances.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6 text-xs max-h-[72vh] overflow-y-auto">
          {/* Section 1: Near-Expiry Inventory Opportunities */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-amber-600" />
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Near-Expiry Inventory Batches ({inventoryCandidates.length})
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">
                FEFO priority routing candidates
              </span>
            </div>

            {inventoryCandidates.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400">
                No near-expiry inventory lots detected. Stock turnover is currently optimal!
              </div>
            ) : (
              <div className="space-y-2">
                {inventoryCandidates.map(item => (
                  <div
                    key={item.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl hover:border-amber-300 hover:bg-amber-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{item.batchCode}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-600">{item.category}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-amber-800 font-medium">{item.storageLocation}</span>
                      </div>
                      <h5 className="font-bold text-slate-900 text-xs mt-0.5">{item.name}</h5>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                        <span>Stock: <strong>{item.quantity} {item.unit}</strong></span>
                        <span>·</span>
                        <span className="text-amber-700 font-medium">Expires: {item.expiryDate}</span>
                        <span>·</span>
                        <span>{item.supplier}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStageInventory(item)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
                    >
                      <span>Stage as Surplus</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Production / Consumption Variances */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-emerald-700" />
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Unserved Production Buffers ({productionCandidates.length})
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">
                Service overproduction records
              </span>
            </div>

            {productionCandidates.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400">
                No unserved overproduction buffers detected in recent meal records.
              </div>
            ) : (
              <div className="space-y-2">
                {productionCandidates.map(prod => (
                  <div
                    key={prod.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-900">{prod.dishCategory}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500 font-mono">{prod.serviceDate}</span>
                      </div>
                      <h5 className="font-bold text-slate-900 text-xs mt-0.5">{prod.title}</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">{prod.reason}</p>
                      <div className="flex items-center gap-3 text-[11px] text-emerald-800 font-semibold mt-1">
                        <span>Net Surplus: ~{prod.estimatedKg} kg</span>
                        <span>·</span>
                        <span>~{prod.excessPortions} portions unserved</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStageProduction(prod)}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
                    >
                      <span>Stage as Surplus</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Staged surplus will be added to active internal redistribution desk.
          </span>
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
  );
};
