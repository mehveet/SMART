import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Building2,
  MapPin,
  Clock,
  Truck,
  ShieldCheck,
  Scale,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SurplusBatch } from '../../types';
import { useApp } from '../../context/AppContext';
import { calculateMatchRecommendations, MatchRecommendation } from '../../utils/matchingEngine';

interface SurplusMatchingModalProps {
  isOpen: boolean;
  batch: SurplusBatch | null;
  onClose: () => void;
  onMatchApproved?: () => void;
}

export const SurplusMatchingModal: React.FC<SurplusMatchingModalProps> = ({
  isOpen,
  batch,
  onClose,
  onMatchApproved,
}) => {
  const { partners, assignBatchToRecipient } = useApp();
  const [expandedPartnerId, setExpandedPartnerId] = useState<string | null>(null);
  const [allocatedQuantities, setAllocatedQuantities] = useState<Record<string, number>>({});
  const [allocationError, setAllocationError] = useState<string | null>(null);

  const recommendations = useMemo(() => {
    if (!batch) return [];
    return calculateMatchRecommendations(batch, partners);
  }, [batch, partners]);

  if (!isOpen || !batch) return null;

  const batchWeight = batch.weightKg || batch.quantity || 15;

  const handleApproveMatch = (rec: MatchRecommendation) => {
    setAllocationError(null);
    const assignedQty = allocatedQuantities[rec.partner.id] || batchWeight;

    // Prevent multiple assignments exceeding available surplus quantity!
    if (assignedQty <= 0) {
      setAllocationError('Assigned quantity must be greater than 0 kg.');
      return;
    }
    if (assignedQty > batchWeight) {
      setAllocationError(
        `Assigned quantity (${assignedQty} kg) cannot exceed the available surplus quantity (${batchWeight} kg).`
      );
      return;
    }

    const success = assignBatchToRecipient(batch.id, rec.partner.id, assignedQty);
    if (success) {
      if (onMatchApproved) onMatchApproved();
      onClose();
    } else {
      setAllocationError('Unable to allocate: batch capacity exceeded or partner unavailable.');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedPartnerId(prev => (prev === id ? null : id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#0b2b20] to-[#123e30] text-white flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold font-['Plus_Jakarta_Sans'] text-white">
                Transparent Redistribution Matching Engine
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              Ranked institutional recipient recommendations evaluated against 5 weighted food-safety & logistics criteria.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Institutional & Simulation Notice Banner */}
        <div className="bg-amber-50/80 border-b border-amber-200 px-5 py-2.5 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>
              <strong>Simulated Match Engine:</strong> Internal institutional directory & mock partners. Recipients do not have portal access or logins; matches are authorized solely by culinary officers.
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 ml-2 flex-shrink-0">
            Internal Desk
          </span>
        </div>

        {/* Safety Hold Banner if batch is expired or not passed */}
        {(batch.status === 'Expired' ||
          batch.status === 'Cancelled' ||
          batch.qualityReviewStatus === 'Failed / Rejected' ||
          batch.qualityReviewStatus === 'Pending Temperature Check' ||
          batch.qualityReviewStatus === 'Conditional (Rapid Chilling Required)') && (
          <div className="bg-rose-50 border-b border-rose-200 px-5 py-3 flex items-start gap-2.5 text-xs text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">
                MANDATORY FOOD SAFETY HOLD: Redistribution Blocked
              </span>
              <span className="text-[11px] text-rose-800">
                This batch is currently marked as <strong>{batch.status}</strong> with quality review status <strong>{batch.qualityReviewStatus}</strong>. Food awaiting mandatory review, flagged as unsafe, or expired cannot be recommended for human consumption redistribution.
              </span>
            </div>
          </div>
        )}

        {/* Selected Batch Summary Card */}
        <div className="p-5 bg-slate-50 border-b border-slate-200/80 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900 text-xs">{batch.batchNumber}</span>
                <span className="text-slate-400">·</span>
                <span className="font-semibold text-emerald-800">{batch.category}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">{batch.location}</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-1">
                {batch.foodName || batch.dishName}
              </h4>
            </div>

            <div className="flex items-center gap-4 bg-white p-2.5 rounded-xl border border-slate-200">
              <div className="text-center px-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Available Weight</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{batchWeight} kg</span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div className="text-center px-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Estimated Portions</span>
                <span className="font-mono font-bold text-slate-900 text-sm">~{batch.portions}</span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div className="text-center px-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Safe Deadline</span>
                <span className="font-mono font-bold text-amber-700 text-sm">
                  {batch.collectionDeadline ? batch.collectionDeadline.slice(11) : '17:30'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert if any */}
        {allocationError && (
          <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{allocationError}</span>
          </div>
        )}

        {/* Ranked Recommendations List */}
        <div className="p-5 max-h-[58vh] overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ranked Partner Recommendations ({recommendations.length} Evaluated)
            </h5>
            <span className="text-[11px] text-slate-400">
              Ranked by combined 5-factor algorithm
            </span>
          </div>

          {recommendations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
              No active recipients found in internal directory. Please add partners in the directory tab.
            </div>
          ) : (
            recommendations.map(rec => {
              const isExpanded = expandedPartnerId === rec.partner.id;
              const isCurrentlyAssigned = batch.assignedRecipientId === rec.partner.id;
              const userQty = allocatedQuantities[rec.partner.id] ?? batchWeight;

              const gradeColor =
                rec.overallScore >= 85
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : rec.overallScore >= 70
                  ? 'bg-sky-100 text-sky-800 border-sky-300'
                  : rec.overallScore >= 50
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-slate-100 text-slate-700 border-slate-300';

              return (
                <div
                  key={rec.partner.id}
                  className={`rounded-xl border transition-all ${
                    isCurrentlyAssigned
                      ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                      : rec.rank === 1
                      ? 'border-emerald-300/80 bg-white shadow-xs'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {/* Summary Bar */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Rank Indicator */}
                      <div className="w-8 h-8 rounded-lg bg-[#0b2b20] text-emerald-300 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                        #{rec.rank}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">
                            {rec.partner.name}
                          </h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${gradeColor}`}
                          >
                            {rec.overallScore}% · {rec.recommendationGrade}
                          </span>
                          {isCurrentlyAssigned && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Currently Matched
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {rec.partner.type}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {rec.partner.distanceKm} km away
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Scale className="w-3.5 h-3.5 text-slate-400" />
                            Cap: {rec.partner.serviceCapacity} kg/day ({(rec.partner.serviceCapacity - (rec.partner.allocatedTodayKg || 0)).toFixed(1)} kg free)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action & Score */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <button
                        type="button"
                        onClick={() => toggleExpand(rec.partner.id)}
                        className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors flex items-center gap-1"
                      >
                        <span>Algorithm Audit</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApproveMatch(rec)}
                        disabled={isCurrentlyAssigned || !rec.isEligible}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 ${
                          isCurrentlyAssigned || !rec.isEligible
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {isCurrentlyAssigned
                            ? 'Matched'
                            : !rec.isEligible
                            ? 'Safety Hold'
                            : 'Approve Match'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Quantity Allocation Input Bar */}
                  <div className="px-4 pb-3 pt-1 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 font-medium">Surplus Quantity to Allocate:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          max={batchWeight}
                          value={userQty}
                          onChange={e =>
                            setAllocatedQuantities({
                              ...allocatedQuantities,
                              [rec.partner.id]: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                        <span className="font-mono text-slate-500 font-medium">kg</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        (Max available: {batchWeight} kg)
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      Transport: <strong>{rec.partner.pickupAvailability}</strong>
                    </div>
                  </div>

                  {/* Expanded Transparent Algorithm Breakdown */}
                  {isExpanded && (
                    <div className="p-4 border-t border-slate-200/80 bg-slate-50/90 text-xs space-y-3">
                      <div className="font-bold text-slate-800 text-xs flex items-center justify-between">
                        <span>Transparent 5-Factor Scoring Breakdown</span>
                        <span className="font-mono text-emerald-800 font-bold">
                          Total Score: {rec.overallScore}/100
                        </span>
                      </div>

                      {/* 5 Criteria Sliders / Badges */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* 1. Food Type Suitability */}
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between font-semibold text-slate-800">
                            <span>1. Food Type Suitability (25%)</span>
                            <span className="font-mono text-emerald-700">
                              {rec.breakdown.foodTypeSuitability.score}/100
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {rec.breakdown.foodTypeSuitability.reason}
                          </p>
                        </div>

                        {/* 2. Recipient Capacity */}
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between font-semibold text-slate-800">
                            <span>2. Recipient Capacity (25%)</span>
                            <span className="font-mono text-emerald-700">
                              {rec.breakdown.recipientCapacity.score}/100
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {rec.breakdown.recipientCapacity.reason}
                          </p>
                        </div>

                        {/* 3. Geographic Distance */}
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between font-semibold text-slate-800">
                            <span>3. Geographic Distance (20%)</span>
                            <span className="font-mono text-emerald-700">
                              {rec.breakdown.geographicDistance.score}/100
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {rec.breakdown.geographicDistance.reason}
                          </p>
                        </div>

                        {/* 4. Pickup Availability */}
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between font-semibold text-slate-800">
                            <span>4. Pickup Availability (15%)</span>
                            <span className="font-mono text-emerald-700">
                              {rec.breakdown.pickupAvailability.score}/100
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {rec.breakdown.pickupAvailability.reason}
                          </p>
                        </div>
                      </div>

                      {/* 5. Collection Deadline & Urgency */}
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between font-semibold text-slate-800">
                          <span>5. Collection Deadline & Urgency (15%)</span>
                          <span className="font-mono text-emerald-700">
                            {rec.breakdown.collectionUrgency.score}/100
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {rec.breakdown.collectionUrgency.reason}
                        </p>
                      </div>

                      {/* Reasons & Warnings */}
                      <div className="pt-2 space-y-1">
                        {rec.reasons.map((r, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-emerald-800 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600 mt-0.5" />
                            <span>{r}</span>
                          </div>
                        ))}
                        {rec.warnings.map((w, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-amber-800 text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600 mt-0.5" />
                            <span>{w}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Selected batch: <strong>{batch.foodName || batch.dishName}</strong> ({batchWeight} kg)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
