import React, { useState, useMemo } from 'react';
import {
  Utensils,
  Trash2,
  Share2,
  HeartHandshake,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  Clock,
  Truck,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Activity,
  ChevronRight,
  Boxes,
  Thermometer,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../common/StatCard';
import { DemandVsActualChart } from '../common/DemandVsActualChart';
import { WasteTrendChart } from '../common/WasteTrendChart';
import { ActivityDetailModal } from '../modals/ActivityDetailModal';
import { ActivityLogItem, DateRange } from '../../types';

interface OverviewPageProps {
  onOpenLogWasteModal: () => void;
  onOpenSurplusModal: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onOpenLogWasteModal,
  onOpenSurplusModal,
}) => {
  const {
    kpis,
    demandPoints,
    wasteTrends,
    inventory,
    surplusBatches,
    dispatches,
    activities,
    redistributionSummary,
    sensors,
    dateRange,
    setDateRange,
    isLoadingData,
    setActiveTab,
    navigateToInventoryItem,
  } = useApp();

  const [selectedActivity, setSelectedActivity] = useState<ActivityLogItem | null>(null);

  // Perishable items needing attention (closest to expiry)
  const expiringItems = useMemo(() => {
    return inventory
      .filter(i => i.shelfLifeStatus === 'critical' || i.shelfLifeStatus === 'near-term')
      .slice(0, 3);
  }, [inventory]);

  // Active surplus waiting to be matched or dispatched
  const activeSurplus = useMemo(() => {
    return surplusBatches
      .filter(b => b.status === 'Available' || b.status === 'Matched' || b.status === 'Collected')
      .slice(0, 3);
  }, [surplusBatches]);

  // Optimal sensor count
  const optimalSensorCount = useMemo(() => {
    return sensors.filter(s => s.status === 'optimal').length;
  }, [sensors]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Date Range & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Quick Date Range Toggle */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs w-fit">
          {(['today', '7d', '30d'] as DateRange[]).map(r => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 font-semibold rounded-md transition-all cursor-pointer ${
                dateRange === r
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r === 'today' ? 'Today' : r === '7d' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenLogWasteModal}
            className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Log Waste</span>
          </button>

          <button
            onClick={onOpenSurplusModal}
            className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Stage Surplus</span>
          </button>
        </div>
      </div>

      {/* 2. Primary 4 Key Metrics */}
      <div className="relative">
        {isLoadingData && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-2xs z-10 rounded-xl flex items-center justify-center">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-white px-3 py-1.5 rounded-lg shadow border border-emerald-200">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              <span>Updating data...</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Meals Prepared"
            value={kpis.mealsPrepared.toLocaleString()}
            unit="meals"
            change={kpis.mealsPreparedChange}
            changeLabel="vs target"
            icon={Utensils}
            onClick={() => setActiveTab('demand')}
          />
          <StatCard
            label="Food Waste"
            value={kpis.foodWasteKg}
            unit="kg"
            change={kpis.foodWasteKgChange}
            changeLabel="reduction"
            inverseChange={true}
            icon={Trash2}
            onClick={() => setActiveTab('waste')}
          />
          <StatCard
            label="Surplus Available"
            value={kpis.surplusAvailableKg}
            unit="kg"
            subtitle={`${kpis.surplusAvailableCount} batches ready`}
            icon={Share2}
            onClick={() => setActiveTab('surplus')}
          />
          <StatCard
            label="Food Recovered"
            value={kpis.foodRecoveredKg.toLocaleString()}
            unit="kg"
            change={kpis.foodRecoveredChange}
            changeLabel="delivered"
            icon={HeartHandshake}
            onClick={() => setActiveTab('sustainability')}
          />
        </div>
      </div>

      {/* 3. Core Visualizations Grid: Production vs Forecast & Waste Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              Production vs. Actual Meals
            </h3>
            <button
              onClick={() => setActiveTab('demand')}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
            >
              <span>Forecasts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="pt-3">
            <DemandVsActualChart data={demandPoints} />
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              Waste by Category
            </h3>
            <button
              onClick={() => setActiveTab('waste')}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
            >
              <span>All Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="pt-3">
            <WasteTrendChart data={wasteTrends} />
          </div>
        </div>
      </div>

      {/* 4. Action Center: Expiring Items & Surplus Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Expiring Ingredients (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                  Expiring Inventory (Use First)
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('inventory')}
                className="text-xs font-semibold text-emerald-800 hover:underline"
              >
                Inventory →
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {expiringItems.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                  All stock items within safe shelf life.
                </div>
              ) : (
                expiringItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => navigateToInventoryItem(item.id)}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-emerald-50/40 hover:border-emerald-300 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span className="font-bold text-slate-700">{item.currentStockKg} kg left</span>
                        <span>·</span>
                        <span className="text-rose-600 font-medium">Expires {item.expiryDate}</span>
                      </div>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        navigateToInventoryItem(item.id);
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-white border border-slate-200 rounded-md hover:bg-emerald-50 transition-colors"
                    >
                      Prioritize
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Active Surplus Pipeline (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                  Surplus Pipeline
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('surplus')}
                className="text-xs font-semibold text-emerald-800 hover:underline"
              >
                Dispatches →
              </button>
            </div>

            {/* Quick 4-Step Pipeline Summary */}
            <div className="grid grid-cols-4 gap-2 text-center my-3">
              <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80">
                <div className="text-[10px] uppercase font-bold text-amber-800">Available</div>
                <div className="text-base font-bold text-amber-950 font-mono mt-0.5">
                  {redistributionSummary.availableKg} <span className="text-[10px] font-normal">kg</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-200/80">
                <div className="text-[10px] uppercase font-bold text-indigo-800">Matched</div>
                <div className="text-base font-bold text-indigo-950 font-mono mt-0.5">
                  {redistributionSummary.matchedKg} <span className="text-[10px] font-normal">kg</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-sky-50/70 border border-sky-200/80">
                <div className="text-[10px] uppercase font-bold text-sky-800">In Transit</div>
                <div className="text-base font-bold text-sky-950 font-mono mt-0.5">
                  {redistributionSummary.collectedKg} <span className="text-[10px] font-normal">kg</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80">
                <div className="text-[10px] uppercase font-bold text-emerald-800">Delivered</div>
                <div className="text-base font-bold text-emerald-950 font-mono mt-0.5">
                  {redistributionSummary.deliveredKg} <span className="text-[10px] font-normal">kg</span>
                </div>
              </div>
            </div>

            {/* Active Batches List */}
            <div className="space-y-2 mt-3">
              {activeSurplus.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  No surplus batches currently active.
                </div>
              ) : (
                activeSurplus.map(batch => (
                  <div
                    key={batch.id}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">{batch.foodName}</span>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span className="font-bold text-slate-700">{batch.weightKg || batch.quantity} kg</span>
                        <span>·</span>
                        <span>{batch.portions || 40} portions</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('surplus')}
                      className="px-3 py-1 text-[11px] font-semibold text-emerald-800 bg-white border border-emerald-200 rounded-md hover:bg-emerald-50 transition-colors"
                    >
                      {batch.status === 'Available' ? 'Match' : 'Track'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Clean Recent Operations Log */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              Recent Activity
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-cyan-600" />
              <span>Sensors: {optimalSensorCount}/{sensors.length} Safe</span>
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100 mt-2">
          {activities.slice(0, 4).map(act => (
            <div
              key={act.id}
              onClick={() => setSelectedActivity(act)}
              className="py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/70 px-2 rounded-lg cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 flex-shrink-0" />
                <span className="font-semibold text-slate-900 truncate">{act.event}</span>
                <span className="text-slate-400 hidden sm:inline">·</span>
                <span className="text-slate-500 hidden sm:inline truncate">{act.stationOrPartner}</span>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-shrink-0">
                <span>{act.timestamp}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Details Modal */}
      {selectedActivity && (
        <ActivityDetailModal
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
          onNavigateToTab={tab => {
            setActiveTab(tab);
            setSelectedActivity(null);
          }}
        />
      )}
    </div>
  );
};
