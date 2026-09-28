import React from 'react';
import { SustainabilityReportAuditSummary } from '../../types/sustainability';
import { Award, ShieldCheck, Printer, ArrowLeft, CheckCircle2, FileText, Scale, Calculator } from 'lucide-react';

interface PrintableSustainabilityReportProps {
  report: SustainabilityReportAuditSummary;
  onBackToDashboard: () => void;
}

export const PrintableSustainabilityReport: React.FC<PrintableSustainabilityReportProps> = ({
  report,
  onBackToDashboard,
}) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Action Header (Hidden during browser print) */}
      <div className="print:hidden flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Interactive Dashboard</span>
          </button>
          <span className="text-slate-400">|</span>
          <span className="text-xs text-emerald-300 font-mono">
            Print-Ready Executive ESG Audit Mode
          </span>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Printable Document Paper Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm text-slate-900 print:border-none print:shadow-none print:p-0 print:m-0 space-y-8">
        {/* Certificate Header Banner */}
        <div className="border-b-2 border-emerald-800 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 font-mono tracking-wider uppercase">
              <Award className="w-4 h-4 text-emerald-700" />
              <span>ESG &amp; SUSTAINABILITY AUDIT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-['Plus_Jakarta_Sans'] tracking-tight">
              Executive ESG Sustainability Audit Report
            </h1>
            <p className="text-xs text-slate-500">
              Circular Economy, Food Waste Prevention &amp; Community Redistribution Ledger
            </p>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-600 font-mono space-y-1">
            <div>Report Ref: <strong className="text-slate-900">{report.reportId}</strong></div>
            <div>Audit Window: <span className="font-semibold text-emerald-800">{report.dateRangeLabel}</span></div>
            <div>Generated: {new Date(report.generatedAt).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Facility Metadata & Accreditations Block */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Facility Identification</span>
            <div className="font-bold text-slate-900 text-sm">{report.facilityName}</div>
            <div className="text-slate-600">{report.facilityLocation}</div>
            <div className="text-slate-500 font-mono pt-1">Total Meals Prepared: {report.totalMealsPrepared.toLocaleString()}</div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Accreditation Standards</span>
            <ul className="space-y-0.5 text-slate-700 text-[11px]">
              {report.accreditations.map((acc, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>{acc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Section 1: Executive KPI Scorecard */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              1. Executive Scorecard &amp; Resource Diversion Summary
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">Certified Values</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Food Waste */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>TOTAL WASTE</span>
                <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold">MEASURED</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono mt-1">
                {report.totalFoodWasteKg.toLocaleString()} <span className="text-xs font-normal text-slate-500">kg</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">Direct scale receipts</span>
            </div>

            {/* Food Recovered & Delivered */}
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
              <div className="flex items-center justify-between text-[10px] text-emerald-700 font-mono">
                <span>RECOVERED &amp; DELIVERED</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">MEASURED</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-800 font-mono mt-1">
                {report.foodRecoveredDeliveredKg.toLocaleString()} <span className="text-xs font-normal text-emerald-700">kg</span>
              </div>
              <span className="text-[10px] text-emerald-700 block mt-1">Confirmed handoff verified</span>
            </div>

            {/* Food Waste Prevented */}
            <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/40">
              <div className="flex items-center justify-between text-[10px] text-sky-700 font-mono">
                <span>WASTE PREVENTED</span>
                <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 font-bold">ESTIMATE</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-sky-900 font-mono mt-1">
                {report.foodWastePreventedKg !== null ? (
                  <>
                    {report.foodWastePreventedKg.toLocaleString()}{' '}
                    <span className="text-xs font-normal text-sky-700">kg</span>
                  </>
                ) : (
                  <span className="text-sm font-semibold text-slate-500">Not enough data</span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">vs. 84.5g audited baseline</span>
            </div>

            {/* Landfill Diversion Rate */}
            <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40">
              <div className="flex items-center justify-between text-[10px] text-purple-700 font-mono">
                <span>DIVERSION RATE</span>
                <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-bold">MEASURED</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-purple-900 font-mono mt-1">
                {report.landfillDiversionRatePercent}%
              </div>
              <span className="text-[10px] text-purple-700 block mt-1">Zero landfill target milestone</span>
            </div>
          </div>

          {/* Environmental Impact Secondary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-600">Avoided Lifecycle CO2e:</span>
              <span className="font-bold font-mono text-slate-900">{report.estimatedCo2eAvoidedKg.toLocaleString()} kg CO2e</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-600">Estimated Water Conserved:</span>
              <span className="font-bold font-mono text-slate-900">{report.estimatedWaterSavedLitres.toLocaleString()} Litres</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-600">Conserved Financial Value:</span>
              <span className="font-bold font-mono text-emerald-800">₹{report.estimatedCostSavingsInr.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Defensible Baseline Audit Notes */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Defensible Baseline Methodology Disclosure</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            {report.baselineDefensibilityNote}
          </p>
        </div>

        {/* Section 3: Food Category Environmental Breakdown Ledger */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              2. Stream &amp; Category Breakdown Ledger
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">UNEP / FAO Factors</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-semibold bg-slate-50/80">
                  <th className="py-2.5 px-3">Food Stream Category</th>
                  <th className="py-2.5 px-2 text-right">Waste (kg)</th>
                  <th className="py-2.5 px-2 text-right">Recovered &amp; Delivered</th>
                  <th className="py-2.5 px-2 text-right">CO2e Offset</th>
                  <th className="py-2.5 px-2 text-right">Water Saved</th>
                  <th className="py-2.5 px-2 text-right">Factor Used</th>
                  <th className="py-2.5 px-3">Scientific Authority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {report.categoryBreakdown.map((cat, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{cat.category}</td>
                    <td className="py-2.5 px-2 text-right font-mono">{cat.wasteKg} kg</td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-emerald-800">
                      {cat.recoveredDeliveredKg} kg
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono">{cat.co2eAvoidedKg} kg</td>
                    <td className="py-2.5 px-2 text-right font-mono">{cat.waterSavedLitres.toLocaleString()} L</td>
                    <td className="py-2.5 px-2 text-right font-mono text-[11px] text-slate-500">
                      {cat.carbonFactor} kg CO2e/kg
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">{cat.carbonFactorSource}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Institutional Unit Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              3. Institutional Unit &amp; Recipient Performance
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">Station Compliance</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-semibold bg-slate-50/80">
                  <th className="py-2.5 px-3">Unit / Station Name</th>
                  <th className="py-2.5 px-2">Type</th>
                  <th className="py-2.5 px-2 text-right">Meals Handled</th>
                  <th className="py-2.5 px-2 text-right">Waste (kg)</th>
                  <th className="py-2.5 px-2 text-right">Recovered (kg)</th>
                  <th className="py-2.5 px-2 text-right">Diversion %</th>
                  <th className="py-2.5 px-2 text-center">HACCP Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {report.institutionPerformance.map((inst, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-3 font-medium text-slate-900">{inst.name}</td>
                    <td className="py-2 px-2 text-slate-500 capitalize">{inst.type.replace('_', ' ')}</td>
                    <td className="py-2 px-2 text-right font-mono">{inst.mealsPreparedOrServed.toLocaleString()}</td>
                    <td className="py-2 px-2 text-right font-mono">{inst.wasteKg > 0 ? `${inst.wasteKg} kg` : '—'}</td>
                    <td className="py-2 px-2 text-right font-mono text-emerald-800 font-bold">
                      {inst.recoveredDeliveredKg > 0 ? `${inst.recoveredDeliveredKg} kg` : '—'}
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                      {inst.diversionRatePercent}%
                    </td>
                    <td className="py-2 px-2 text-center font-mono">{inst.haccpSafetyScorePercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5: Auditor Signoff & Official Seal Block */}
        <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2 text-xs text-slate-600">
            <span className="font-bold text-slate-900 uppercase tracking-wider block">
              Methodology Certification &amp; Compliance Statement
            </span>
            <p className="text-[11px] leading-relaxed">
              This audit certifies that all reported waste prevention, surplus recovery, and carbon/water estimates
              adhere to the Food Loss and Waste Protocol standards. Recovered food is counted strictly post-delivery confirmation.
              No values have been double-counted across categories.
            </p>
          </div>

          <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <span className="font-bold text-slate-900 text-xs">OFFICIAL VERIFIED AUDITOR</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                DIGITALLY VERIFIED
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="font-bold text-slate-950">{report.auditorSignoff.auditorName}</div>
              <div className="text-slate-600 text-[11px]">{report.auditorSignoff.auditorTitle}</div>
              <div className="text-slate-500 font-mono text-[10px]">License: {report.auditorSignoff.licenseNumber}</div>
              <div className="text-slate-500 font-mono text-[10px]">Signoff Date: {report.auditorSignoff.signoffDate}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
