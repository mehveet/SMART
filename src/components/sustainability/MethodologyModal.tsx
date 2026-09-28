import React, { useState } from 'react';
import { X, BookOpen, ShieldCheck, Scale, Calculator, ExternalLink, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { OFFICIAL_CONVERSION_FACTORS, DEFENSIBLE_BASELINE_CONFIG } from '../../utils/sustainabilityEngine';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'standards' | 'factors' | 'rules'>('standards');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-[#0b2b20] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold font-['Plus_Jakarta_Sans']">
                Sustainability Metrics Methodology & Audit Standards
              </h3>
              <p className="text-xs text-emerald-300/80">
                UN SDG 12.3, FSSAI Green Campus & WRI Food Loss Standard
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6">
          <button
            type="button"
            onClick={() => setActiveTab('standards')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'standards'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Metric Definitions & Nature
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('factors')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'factors'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Conversion Factors & Sources ({OFFICIAL_CONVERSION_FACTORS.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'rules'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Defensible Baseline & Accounting Rules
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* TAB 1: Metric Definitions */}
          {activeTab === 'standards' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-950 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Distinction Between Direct Measured Values and Model Estimates</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  In compliance with ISO 14064 and greenhouse gas reporting protocols, SMART rigorously separates
                  physically measured data (scale readings, electronic delivery receipts) from estimated model values (lifecycle emissions, embedded water).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Total Food Waste (kg)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-white font-mono font-medium flex items-center gap-1">
                      <Scale className="w-3 h-3 text-emerald-400" /> DIRECT MEASURED
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Physical scrap mass captured across prep stations, trim bins, plate returns, and spoilage logs via verified digital kitchen scales.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Food Recovered &amp; Delivered (kg)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-white font-mono font-medium flex items-center gap-1">
                      <Scale className="w-3 h-3 text-emerald-400" /> DIRECT MEASURED
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Surplus cooked batches delivered to certified institutional partner pantries. Only batches with completed delivery officer verification signatures are tallied.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Food Waste Prevented (kg)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold flex items-center gap-1 border border-emerald-300">
                      <Calculator className="w-3 h-3 text-emerald-600" /> MODEL ESTIMATE
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Calculated strictly against the facility audited baseline (84.5 g/meal). Prevented waste is source reduction, and is NEVER conflated with recovered surplus.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Carbon &amp; Water Avoidance</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold flex items-center gap-1 border border-emerald-300">
                      <Calculator className="w-3 h-3 text-emerald-600" /> MODEL ESTIMATE
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Embodied upstream agricultural and preparation impact calculated using published FAO, UNEP, and Water Footprint Network lifecycle coefficients.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Conversion Factors */}
          {activeTab === 'factors' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Official Conversion Factors Registry</span>
                <span className="text-[11px] text-slate-500">Zero Fabricated Values · Fully Cited</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Stream / Category</th>
                      <th className="py-2.5 px-2">Type</th>
                      <th className="py-2.5 px-2 text-right">Factor Value</th>
                      <th className="py-2.5 px-2">Unit</th>
                      <th className="py-2.5 px-2">Authority</th>
                      <th className="py-2.5 px-3">Citation &amp; Methodology</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {OFFICIAL_CONVERSION_FACTORS.map((f, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 font-semibold text-slate-900">{f.category}</td>
                        <td className="py-2 px-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              f.type === 'carbon' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {f.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                          {f.factorValue}
                        </td>
                        <td className="py-2 px-2 font-mono text-slate-500 text-[10px]">{f.unit}</td>
                        <td className="py-2 px-2 font-medium text-slate-700">{f.sourceAuthority}</td>
                        <td className="py-2 px-3 text-[10px] text-slate-500 max-w-xs">{f.sourceCitation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Defensible Baseline & Accounting Rules */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="border border-amber-200 bg-amber-50/70 p-4 rounded-xl space-y-2 text-amber-950">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>Defensible Baseline Configuration (FY 2026 Q1 Audit)</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900">
                  {DEFENSIBLE_BASELINE_CONFIG.methodologyDescription}
                </p>
                <div className="pt-2 border-t border-amber-200/70 flex flex-wrap gap-4 text-[11px] font-mono text-amber-800">
                  <span>Baseline Rate: <strong>84.5 grams / meal</strong></span>
                  <span>Audit Window: Jan 1 - Mar 31, 2026</span>
                  <span>Minimum Window: ≥ 3 Days</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="font-bold text-slate-900">Non-Negotiable Accounting Safeguards</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">Delivery Confirmation Prerequisite:</span>
                      <p className="text-slate-600 mt-0.5">
                        Surplus food staged in kitchen chillers or hot cabinets is NOT counted as recovered until physical handoff and receipt verification is recorded by recipient pantries.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">Non-Double Counting:</span>
                      <p className="text-slate-600 mt-0.5">
                        Recovered edible meals and organic compost scraps are accounted in mutually exclusive waste streams. Prevented waste (avoided overproduction) is tracked separately from surplus distribution.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">Data Sufficiency Mandate:</span>
                      <p className="text-slate-600 mt-0.5">
                        Where date filters span less than 3 days or where meals prepared is unavailable, SMART displays &quot;Not enough data&quot; instead of fabricating baseline prevention numbers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono">
            Auditor Code: {DEFENSIBLE_BASELINE_CONFIG.auditedBy.split('(')[1]?.replace(')', '') || 'FSSAI-ESG-2026'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
