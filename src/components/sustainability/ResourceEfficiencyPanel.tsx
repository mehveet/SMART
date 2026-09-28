import React from 'react';
import { ResourceEfficiencyMetrics } from '../../types/sustainability';
import { Zap, Scale, Sprout, Gauge, Droplets, ArrowUpRight, Flame } from 'lucide-react';

interface ResourceEfficiencyPanelProps {
  metrics: ResourceEfficiencyMetrics;
}

export const ResourceEfficiencyPanel: React.FC<ResourceEfficiencyPanelProps> = ({ metrics }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              Resource Efficiency & Circular Processing Metrics
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200/60">
              ISO 14001 Standards
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational energy, raw material preparation yield, and internal bio-composting recovery
          </p>
        </div>
      </div>

      {/* Grid of 4 Key Resource Efficiency Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Tile 1: Raw Material Prep Yield */}
        <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
              +{(metrics.prepScrapYieldPercent - metrics.benchmarkYieldPercent).toFixed(1)}% vs Base
            </span>
          </div>
          <div className="mt-3">
            <span className="text-[11px] text-slate-500 font-medium block">Raw Prep Scrap Yield</span>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">
              {metrics.prepScrapYieldPercent}%
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500">
            Institutional benchmark: {metrics.benchmarkYieldPercent}% (FSSAI Kitchen Efficiency Standard)
          </div>
        </div>

        {/* Tile 2: Avoided Thermal Energy */}
        <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold">
              {metrics.avoidedEnergyEmissionsCo2Kg} kg CO2e
            </span>
          </div>
          <div className="mt-3">
            <span className="text-[11px] text-slate-500 font-medium block">Avoided Cooking Energy</span>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">
              {metrics.avoidedCookingEnergyKwh} <span className="text-xs font-normal text-slate-500">kWh</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500">
            Energy conserved via split-batching &amp; dynamic forecast cut-offs
          </div>
        </div>

        {/* Tile 3: Composting Bio-Diversion */}
        <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <Sprout className="w-4 h-4" />
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-bold">
              100% In-house
            </span>
          </div>
          <div className="mt-3">
            <span className="text-[11px] text-slate-500 font-medium block">Organic Composting Diversion</span>
            <div className="text-2xl font-bold text-emerald-800 font-mono mt-0.5">
              {metrics.organicCompostedKg} <span className="text-xs font-normal text-slate-500">kg</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500">
            Unavoidable fibrous scraps routed to campus bio-enzyme synthesizer
          </div>
        </div>

        {/* Tile 4: Kitchen OEE Score */}
        <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
              <Gauge className="w-4 h-4" />
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold">
              High Availability
            </span>
          </div>
          <div className="mt-3">
            <span className="text-[11px] text-slate-500 font-medium block">Kitchen Equipment OEE</span>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">
              {metrics.kitchenOeePercent}%
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500">
            Combines machine availability, thermal line uptime, and batch quality rate
          </div>
        </div>
      </div>
    </div>
  );
};
