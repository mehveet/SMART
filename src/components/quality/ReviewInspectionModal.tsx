import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Calendar,
  Layers,
  Thermometer,
  Eye,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { QualityInspectionRecord, QualityInspectionReviewStatus } from '../../types';

interface ReviewInspectionModalProps {
  inspection: QualityInspectionRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReviewInspectionModal: React.FC<ReviewInspectionModalProps> = ({
  inspection,
  isOpen,
  onClose,
}) => {
  const { updateQualityInspectionReview } = useApp();

  if (!isOpen || !inspection) return null;

  const [selectedStatus, setSelectedStatus] = useState<QualityInspectionReviewStatus>(
    inspection.reviewStatus
  );
  const [reviewerNotes, setReviewerNotes] = useState(
    inspection.reviewerNotes || ''
  );
  const [reviewerName, setReviewerName] = useState(
    inspection.reviewedBy || 'P. Iyer (Lead HACCP Food Safety Auditor)'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    updateQualityInspectionReview(
      inspection.id,
      selectedStatus,
      reviewerNotes.trim(),
      reviewerName.trim()
    );
    setIsSubmitting(false);
    onClose();
  };

  const getStatusBadge = (status: QualityInspectionReviewStatus) => {
    switch (status) {
      case 'Reviewed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Human Reviewed
          </span>
        );
      case 'Flagged':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            Flagged for Testing
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-300">
            <XCircle className="h-3.5 w-3.5 text-rose-400" />
            Rejected (Quarantined)
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
            <Clock className="h-3.5 w-3.5 text-blue-400" />
            Pending Human Review
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
              <UserCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-['Plus_Jakarta_Sans']">Quality Inspection Review</h2>
                {getStatusBadge(inspection.reviewStatus)}
              </div>
              <p className="text-xs text-slate-500">
                Log supervisor examination, food safety clearance, or quarantine hold
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-3">
          <div className="flex items-start gap-3 text-amber-900">
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-semibold text-amber-800 uppercase tracking-wider block">
                Mandatory Food Safety Review Notice
              </span>
              Visual inspection cannot certify food safety or detect all contamination. Food flagged as unsafe, expired, or awaiting mandatory review must not be recommended for redistribution. Human verification of organoleptic traits and core temperatures is mandatory.
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Specimen Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="h-44 w-full overflow-hidden rounded-xl border border-slate-200 bg-white flex items-center justify-center">
              <img
                src={inspection.imageUrl}
                alt={inspection.itemName}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="md:col-span-2 flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    {inspection.batchCode || inspection.id}
                  </span>
                  <span className="text-xs text-slate-400">{inspection.inspectionTimestamp}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">{inspection.itemName}</h3>
                <p className="text-xs text-slate-500">
                  Category: <span className="text-slate-700 font-medium">{inspection.category}</span> • Location:{' '}
                  <span className="text-slate-700 font-medium">{inspection.location}</span>
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 shadow-xs">
                  <Thermometer className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Storage: {inspection.storageCondition}</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-2.5 text-xs">
                <span className="font-semibold text-slate-700 block mb-1">Detected Visual Observations:</span>
                <p className="text-slate-600 italic">
                  "{inspection.detectedObservations.overallObservationSummary}"
                </p>
              </div>
            </div>
          </div>

          {/* Observations Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Color & Appearance
              </span>
              <p className="mt-1 text-xs text-slate-700">
                {inspection.detectedObservations.colorAnalysis}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Texture & Moisture
              </span>
              <p className="mt-1 text-xs text-slate-700">
                {inspection.detectedObservations.textureAndMoisture}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Foreign Object Risk
              </span>
              <span
                className={`mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded ${
                  inspection.detectedObservations.foreignObjectRisk === 'High'
                    ? 'bg-rose-100 text-rose-800'
                    : inspection.detectedObservations.foreignObjectRisk === 'Moderate'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {inspection.detectedObservations.foreignObjectRisk} Risk
              </span>
            </div>
          </div>

          {/* Review Decision Selector */}
          <form onSubmit={handleSaveReview} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Human Review Status Decision
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Pending */}
                <button
                  type="button"
                  onClick={() => setSelectedStatus('Pending')}
                  className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                    selectedStatus === 'Pending'
                      ? 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="h-5 w-5 mb-1.5" />
                  <span className="text-xs font-bold">Pending</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Awaiting Test</span>
                </button>

                {/* Reviewed */}
                <button
                  type="button"
                  onClick={() => setSelectedStatus('Reviewed')}
                  className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                    selectedStatus === 'Reviewed'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="h-5 w-5 mb-1.5 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-800">Reviewed</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Physical Check OK</span>
                </button>

                {/* Flagged */}
                <button
                  type="button"
                  onClick={() => setSelectedStatus('Flagged')}
                  className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                    selectedStatus === 'Flagged'
                      ? 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <AlertTriangle className="h-5 w-5 mb-1.5 text-amber-600" />
                  <span className="text-xs font-bold text-amber-800">Flagged</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Safety Hold</span>
                </button>

                {/* Rejected */}
                <button
                  type="button"
                  onClick={() => setSelectedStatus('Rejected')}
                  className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                    selectedStatus === 'Rejected'
                      ? 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <XCircle className="h-5 w-5 mb-1.5 text-rose-600" />
                  <span className="text-xs font-bold text-rose-800">Rejected</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Quarantine / Dispose</span>
                </button>
              </div>
            </div>

            {/* Quarantine alert if Flagged or Rejected */}
            {(selectedStatus === 'Flagged' || selectedStatus === 'Rejected') && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <span className="font-semibold text-rose-900 block">
                    Redistribution Quarantine Active
                  </span>
                  Marking this inspection as <strong>{selectedStatus}</strong> blocks the item and its associated surplus batch from redistribution algorithms. Unsafe food cannot be dispatched to human recipients.
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Auditor Review Notes & Action Items
              </label>
              <textarea
                rows={3}
                required
                value={reviewerNotes}
                onChange={e => setReviewerNotes(e.target.value)}
                placeholder="e.g. Conducted calibrated probe temperature check: 68.2°C logged. Visual examination revealed zero foreign objects or off-odors. Approved for human redistribution."
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Reviewer Name & Role
                </label>
                <input
                  type="text"
                  required
                  value={reviewerName}
                  onChange={e => setReviewerName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex flex-col justify-end">
                <span className="text-xs text-slate-500">
                  Timestamp: <strong className="text-slate-700">Current Session (Live)</strong>
                </span>
                <span className="text-[11px] text-slate-400">
                  Status decisions are recorded to the kitchen audit log.
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !reviewerNotes.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Save Review Decision</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
