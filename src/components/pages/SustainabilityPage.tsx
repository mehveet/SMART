import React, { useState, useMemo } from 'react';
import {
  Award,
  Download,
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  FileText,
  HelpCircle,
  TrendingDown,
  CloudOff,
  Droplets,
  Scale,
  Calculator,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronRight,
  Info,
  Leaf,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DateRange } from '../../types';
import {
  calculateSustainabilityAudit,
  downloadCsvReport,
  OFFICIAL_CONVERSION_FACTORS,
  DEFENSIBLE_BASELINE_CONFIG,
} from '../../utils/sustainabilityEngine';
import { WasteTrendMultiResolutionChart } from '../sustainability/WasteTrendMultiResolutionChart';
import { RecoveredVsWastedChart } from '../sustainability/RecoveredVsWastedChart';
import { WasteByCategoryDonut } from '../sustainability/WasteByCategoryDonut';
import { InstitutionPerformanceGrid } from '../sustainability/InstitutionPerformanceGrid';
import { ResourceEfficiencyPanel } from '../sustainability/ResourceEfficiencyPanel';
import { MethodologyModal } from '../sustainability/MethodologyModal';
import { PrintableSustainabilityReport } from '../sustainability/PrintableSustainabilityReport';

export const SustainabilityPage: React.FC = () => {
  const {
    wasteLogs,
    surplusBatches,
    dispatches,
    demandPoints,
    wasteTrends,
    inventory,
    partners,
    dateRange: globalDateRange,
    setDateRange: setGlobalDateRange,
  } = useApp();

  // Local state
  const [selectedRange, setSelectedRange] = useState<DateRange | 'custom'>('30d');
  const [customStart, setCustomStart] = useState<string>('2026-09-01');
  const [customEnd, setCustomEnd] = useState<string>('2026-09-24');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'dashboard' | 'print'>('dashboard');
  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Compute live sustainability audit data based on active filters
  const auditReport = useMemo(() => {
    const rangeForEngine: DateRange = selectedRange === 'custom' ? '30d' : selectedRange;
    return calculateSustainabilityAudit({
      dateRange: rangeForEngine,
      customStartDate: selectedRange === 'custom' ? customStart : undefined,
      customEndDate: selectedRange === 'custom' ? customEnd : undefined,
      categoryFilter: selectedCategory,
      wasteLogs,
      surplusBatches,
      dispatches,
      demandPoints,
      wasteTrends,
      inventory,
      partners,
    });
  }, [
    selectedRange,
    customStart,
    customEnd,
    selectedCategory,
    wasteLogs,
    surplusBatches,
    dispatches,
    demandPoints,
    wasteTrends,
    inventory,
    partners,
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDownloadCsv = () => {
    downloadCsvReport(auditReport);
    showToast(`Exported CSV Audit Report (${auditReport.reportId}) to downloads`);
  };

  const handleOpenPrintView = () => {
    setViewMode('print');
    showToast('Loaded print-optimized Executive ESG Audit Report');
  };

  if (viewMode === 'print') {
    return (
      <PrintableSustainabilityReport
        report={auditReport}
        onBackToDashboard={() => setViewMode('dashboard')}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 border border-emerald-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-emerald-800" />
          <h2 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
            Sustainability Reports
          </h2>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMethodologyOpen(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Methodology</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenPrintView}
            className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Date Range Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Audit Period:</span>
          </span>

          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/70 text-xs">
            {(['today', '7d', '30d', '90d'] as DateRange[]).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setSelectedRange(r);
                  setGlobalDateRange(r);
                }}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  selectedRange === r
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === 'today' ? 'Today' : r === '7d' ? 'Last 7d' : r === '30d' ? 'Last 30d' : 'Fiscal Q3 (90d)'}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedRange('custom')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                selectedRange === 'custom'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Custom Range
            </button>
          </div>

          {/* Custom Date Inputs if active */}
          {selectedRange === 'custom' && (
            <div className="flex items-center gap-1.5 text-xs bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 animate-in fade-in">
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="bg-transparent text-slate-800 font-mono text-[11px] focus:outline-none"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="bg-transparent text-slate-800 font-mono text-[11px] focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Food Category:</span>
          </span>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Categories (Composite)</option>
            <option value="Cooked Main Meals">Cooked Main Meals</option>
            <option value="Grains & Pulses">Grains &amp; Pulses (Rice, Wheat)</option>
            <option value="Soups & Gravies">Soups &amp; Gravies (Dal, Broth)</option>
            <option value="Fresh Cut Produce">Fresh Cut Produce (Salad, Fruits)</option>
            <option value="Dairy & Poultry">Dairy &amp; Poultry (Paneer, Curd)</option>
            <option value="Bakery Goods">Bakery Goods (Breads, Rolls)</option>
          </select>

          {selectedCategory !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className="text-[11px] text-slate-400 hover:text-slate-700"
              title="Reset Category"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* KEY METRICS SCORECARD (Direct Measured vs Model Estimates) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Food Waste (kg) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold flex items-center gap-1">
                <Scale className="w-3 h-3 text-slate-500" /> DIRECT MEASURED
              </span>
              <span className="text-[11px] text-slate-400 font-mono">{auditReport.dateRangeLabel.split('(')[0]}</span>
            </div>
            <span className="text-xs text-slate-500 font-medium block mt-3">Total Food Waste</span>
            <div className="text-2xl lg:text-3xl font-bold text-slate-950 font-['Plus_Jakarta_Sans'] mt-1">
              {auditReport.totalFoodWasteKg.toLocaleString()} <span className="text-sm font-normal text-slate-500">kg</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Kitchen prep &amp; plate discards</span>
            <span className="font-mono text-slate-400">Scale verified</span>
          </div>
        </div>

        {/* KPI 2: Food Recovered and Delivered (kg) */}
        <div className="bg-white rounded-xl border border-emerald-200/80 p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-emerald-300 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold flex items-center gap-1">
                <Scale className="w-3 h-3 text-emerald-600" /> DIRECT MEASURED
              </span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">
                Delivery Confirmed
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium block mt-3">Food Recovered &amp; Delivered</span>
            <div className="text-2xl lg:text-3xl font-bold text-emerald-800 font-['Plus_Jakarta_Sans'] mt-1">
              {auditReport.foodRecoveredDeliveredKg.toLocaleString()} <span className="text-sm font-normal text-emerald-600">kg</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-emerald-100/70 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Diverted to partner pantries</span>
            <span className="font-mono text-emerald-700 font-semibold">100% Signoff</span>
          </div>
        </div>

        {/* KPI 3: Food Waste Prevented (kg) */}
        <div className="bg-white rounded-xl border border-sky-200/80 p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-sky-300 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-mono font-bold flex items-center gap-1">
                <Calculator className="w-3 h-3 text-sky-600" /> MODEL ESTIMATE
              </span>
              <span className="text-[10px] text-sky-700 font-mono font-medium">
                84.5g Baseline
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium block mt-3">Food Waste Prevented</span>
            <div className="text-2xl lg:text-3xl font-bold text-sky-950 font-['Plus_Jakarta_Sans'] mt-1">
              {auditReport.foodWastePreventedKg !== null ? (
                <>
                  {auditReport.foodWastePreventedKg.toLocaleString()}{' '}
                  <span className="text-sm font-normal text-sky-600">kg</span>
                </>
              ) : (
                <span className="text-base font-semibold text-slate-400 italic">Not enough data</span>
              )}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-sky-100/70 text-[11px] text-slate-500">
            {auditReport.foodWastePreventedKg !== null
              ? 'Source reduction vs. audited baseline'
              : 'Requires ≥ 3-day baseline audit window'}
          </div>
        </div>

        {/* KPI 4: Redistribution Completion Rate */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold flex items-center gap-1">
                <Scale className="w-3 h-3 text-slate-500" /> DIRECT MEASURED
              </span>
              <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-1.5 py-0.2 rounded">
                HACCP Cleared
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium block mt-3">Redistribution Completion Rate</span>
            <div className="text-2xl lg:text-3xl font-bold text-slate-900 font-['Plus_Jakarta_Sans'] mt-1">
              {auditReport.redistributionCompletionRatePercent}%
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Delivered vs. staged surplus</span>
            <span className="font-mono text-emerald-700 font-semibold">94.2% Target</span>
          </div>
        </div>
      </div>

      {/* SECONDARY IMPACT ROW (Carbon, Water, Cost, Landfill Diversion) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Estimated Carbon Emissions Avoided */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CloudOff className="w-4 h-4" />
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
              ESTIMATE (UNEP/FAO)
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs text-slate-500 font-medium block">Est. Carbon Averted</span>
            <div className="text-xl lg:text-2xl font-bold text-slate-900 font-['Plus_Jakarta_Sans'] mt-0.5">
              {auditReport.estimatedCo2eAvoidedKg.toLocaleString()} <span className="text-xs font-normal text-slate-500">kg CO2e</span>
            </div>
          </div>
          <p className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
            Avoided landfill methane &amp; agricultural upstream lifecycle impact
          </p>
        </div>

        {/* Estimated Water Savings */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-mono font-bold">
              ESTIMATE (WFN)
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs text-slate-500 font-medium block">Est. Water Saved</span>
            <div className="text-xl lg:text-2xl font-bold text-slate-900 font-['Plus_Jakarta_Sans'] mt-0.5">
              {(auditReport.estimatedWaterSavedLitres / 1000).toFixed(0)}k <span className="text-xs font-normal text-slate-500">Litres</span>
            </div>
          </div>
          <p className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
            Embedded irrigation &amp; culinary processing water footprint conserved
          </p>
        </div>

        {/* Estimated Cost Savings */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono font-bold">
              ESTIMATED VALUE
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs text-slate-500 font-medium block">Conserved Resource Value</span>
            <div className="text-xl lg:text-2xl font-bold text-slate-900 font-mono mt-0.5">
              ₹{auditReport.estimatedCostSavingsInr.toLocaleString()}
            </div>
          </div>
          <p className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
            Valued at ₹135/kg prepared meals + avoided recipe overproduction
          </p>
        </div>

        {/* Landfill Diversion Rate */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-mono font-bold">
              SDG 12.3 LEADER
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs text-slate-500 font-medium block">Landfill Diversion Rate</span>
            <div className="text-xl lg:text-2xl font-bold text-emerald-800 font-['Plus_Jakarta_Sans'] mt-0.5">
              {auditReport.landfillDiversionRatePercent}%
            </div>
          </div>
          <p className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
            Remainder routed to on-site bio-enzyme composting facility
          </p>
        </div>
      </div>

      {/* Defensible Baseline Methodology Callout Banner */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900">Audited Baseline Transparency Notice:</span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              {auditReport.baselineDefensibilityNote}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMethodologyOpen(true)}
          className="self-start sm:self-auto text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 text-[11px] flex-shrink-0"
        >
          <span>View Calculation Logic</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* VISUALIZATIONS SECTION */}
      {/* 1. Multi-Resolution Waste Trends & Defensible Baseline Chart */}
      <WasteTrendMultiResolutionChart timeSeriesData={auditReport.timeSeriesData} />

      {/* 2. Side-by-Side: Recovered vs Wasted Chart & Category Breakdown Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecoveredVsWastedChart dataPoints={auditReport.timeSeriesData.week} />
        <WasteByCategoryDonut
          categories={auditReport.categoryBreakdown}
          selectedCategory={selectedCategory}
          onSelectCategory={cat => setSelectedCategory(cat)}
        />
      </div>

      {/* 3. Resource Efficiency & Circular Processing Metrics */}
      <ResourceEfficiencyPanel metrics={auditReport.resourceEfficiency} />

      {/* 4. Institution-Level Performance Trends */}
      <InstitutionPerformanceGrid records={auditReport.institutionPerformance} />

      {/* Methodology Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />
    </div>
  );
};
