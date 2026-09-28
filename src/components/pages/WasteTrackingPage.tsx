import React, { useState, useMemo } from 'react';
import {
  Trash2,
  Plus,
  TrendingDown,
  AlertCircle,
  FileSpreadsheet,
  Info,
  DollarSign,
  UtensilsCrossed,
  Calendar,
  Filter,
  Search,
  Eye,
  RotateCcw,
  Sparkles,
  Download,
  Flame,
  CheckCircle2,
  Clock,
  PieChart,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MealSession, WasteCategory, WasteLog } from '../../types';
import { WasteTrendChart } from '../common/WasteTrendChart';
import { ViewWasteModal } from '../modals/ViewWasteModal';
import { ConfirmDeleteModal } from '../modals/ConfirmDeleteModal';
import { formatMultiUnitSummary, groupQuantitiesByUnit } from '../../utils/unitUtils';

interface WasteTrackingPageProps {
  onOpenLogWasteModal: () => void;
}

type TimeHorizon = 'daily' | 'weekly';

export const WasteTrackingPage: React.FC<WasteTrackingPageProps> = ({ onOpenLogWasteModal }) => {
  const { wasteLogs, wasteTrends, deleteWasteLog, resetDemoData } = useApp();

  // Time horizon for analytics
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('weekly');

  // Table filters & search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [selectedStation, setSelectedStation] = useState<string>('all');

  // Modals
  const [viewingLog, setViewingLog] = useState<WasteLog | null>(null);
  const [logToDelete, setLogToDelete] = useState<WasteLog | null>(null);

  // Filtered waste logs for audit ledger
  const filteredLogs = useMemo(() => {
    return wasteLogs.filter(log => {
      const food = (log.foodItem || log.itemName || '').toLowerCase();
      const reason = (log.reason || log.rootCause || '').toLowerCase();
      const station = (log.kitchenStation || '').toLowerCase();
      const logged = (log.loggedBy || '').toLowerCase();
      const q = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !q ||
        food.includes(q) ||
        reason.includes(q) ||
        station.includes(q) ||
        logged.includes(q);

      const cat = log.category || 'Preparation Waste';
      const matchesCategory =
        selectedCategory === 'all' || cat.toLowerCase() === selectedCategory.toLowerCase();

      const matchesSession =
        selectedSession === 'all' ||
        (log.mealSession && log.mealSession.toLowerCase() === selectedSession.toLowerCase());

      const matchesStation =
        selectedStation === 'all' || (log.kitchenStation && log.kitchenStation === selectedStation);

      return matchesSearch && matchesCategory && matchesSession && matchesStation;
    });
  }, [wasteLogs, searchTerm, selectedCategory, selectedSession, selectedStation]);

  // Total metrics
  const totalLoggedKg = useMemo(() => {
    return wasteLogs.reduce((acc, curr) => acc + (curr.weightKg ?? curr.quantity ?? 0), 0);
  }, [wasteLogs]);

  const totalCostLoss = useMemo(() => {
    return wasteLogs.reduce((acc, curr) => acc + (curr.costLoss || 0), 0);
  }, [wasteLogs]);

  // Native units breakdown (ensures incompatible units are distinct and not blindly summed)
  const nativeUnitSummary = useMemo(() => {
    return groupQuantitiesByUnit(wasteLogs.map(l => ({ quantity: l.quantity, unit: l.unit || 'kg' })));
  }, [wasteLogs]);

  // Waste breakdown by 5 required categories
  const categoryBreakdown = useMemo(() => {
    const categories: WasteCategory[] = [
      'Preparation Waste',
      'Plate Waste',
      'Overproduction',
      'Spoilage',
      'Processing Loss',
    ];

    return categories.map(cat => {
      const items = wasteLogs.filter(l => (l.category || 'Preparation Waste') === cat);
      const totalKg = items.reduce((s, l) => s + (l.weightKg ?? l.quantity ?? 0), 0);
      const cost = items.reduce((s, l) => s + (l.costLoss || 0), 0);
      const percentage = totalLoggedKg > 0 ? (totalKg / totalLoggedKg) * 100 : 0;

      return {
        category: cat,
        count: items.length,
        totalKg: Number(totalKg.toFixed(1)),
        cost,
        percentage: Number(percentage.toFixed(1)),
      };
    });
  }, [wasteLogs, totalLoggedKg]);

  // Daily shift analytics (today: 2026-09-24)
  const todayLogs = useMemo(() => {
    return wasteLogs.filter(l => l.date === '2026-09-24' || l.timestamp?.startsWith('2026-09-24'));
  }, [wasteLogs]);

  const todayKg = useMemo(() => {
    return todayLogs.reduce((s, l) => s + (l.weightKg ?? l.quantity ?? 0), 0);
  }, [todayLogs]);

  const todayCost = useMemo(() => {
    return todayLogs.reduce((s, l) => s + (l.costLoss || 0), 0);
  }, [todayLogs]);

  // Download CSV export of logs
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Date',
      'Meal Session',
      'Food Item',
      'Quantity',
      'Unit',
      'Weight (kg)',
      'Waste Category',
      'Root Cause / Reason',
      'Kitchen Station',
      'Cost Loss (INR)',
      'Logged By',
    ];

    const rows = filteredLogs.map(l => [
      l.id,
      l.date || l.timestamp?.slice(0, 10),
      l.mealSession || 'General',
      `"${(l.foodItem || l.itemName || '').replace(/"/g, '""')}"`,
      l.quantity,
      l.unit || 'kg',
      l.weightKg ?? l.quantity,
      `"${l.category || 'Preparation Waste'}"`,
      `"${(l.reason || l.rootCause || '').replace(/"/g, '""')}"`,
      `"${(l.kitchenStation || '').replace(/"/g, '""')}"`,
      l.costLoss || 0,
      `"${(l.loggedBy || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `smart-waste-audit-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedSession('all');
    setSelectedStation('all');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Time Horizon Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-emerald-800" />
          <h2 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
            Waste Tracking
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time horizon toggle */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setTimeHorizon('daily')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                timeHorizon === 'daily'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setTimeHorizon('weekly')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                timeHorizon === 'weekly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Weekly
            </button>
          </div>

          <button
            onClick={onOpenLogWasteModal}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Food Waste</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Row based on selected Time Horizon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">
            {timeHorizon === 'daily' ? "Today's Waste" : 'Weekly Waste'}
          </span>
          <div className="text-2xl font-bold text-slate-900 font-['Plus_Jakarta_Sans'] mt-1">
            {timeHorizon === 'daily' ? todayKg.toFixed(1) : totalLoggedKg.toFixed(1)}{' '}
            <span className="text-sm font-normal text-slate-500">kg</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">
            {timeHorizon === 'daily' ? "Today's Cost Loss" : 'Weekly Cost Loss'}
          </span>
          <div className="text-2xl font-bold text-rose-600 font-['Plus_Jakarta_Sans'] mt-1">
            ₹{timeHorizon === 'daily' ? todayCost.toLocaleString() : totalCostLoss.toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Native Units</span>
          <div className="text-sm font-bold text-slate-900 mt-1 truncate" title={formatMultiUnitSummary(nativeUnitSummary)}>
            {formatMultiUnitSummary(nativeUnitSummary)}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Waste per Meal</span>
          <div className="text-2xl font-bold text-emerald-800 font-['Plus_Jakarta_Sans'] mt-1">
            11.3 <span className="text-sm font-normal text-slate-500">g / meal</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown Cards */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
            Waste by Category
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            {wasteLogs.length} entries
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {categoryBreakdown.map(item => {
            const getCatColor = (cat: WasteCategory) => {
              if (cat === 'Plate Waste') return 'bg-amber-500 text-amber-900 border-amber-200';
              if (cat === 'Preparation Waste') return 'bg-emerald-500 text-emerald-900 border-emerald-200';
              if (cat === 'Overproduction') return 'bg-purple-500 text-purple-900 border-purple-200';
              if (cat === 'Spoilage') return 'bg-rose-500 text-rose-900 border-rose-200';
              return 'bg-blue-500 text-blue-900 border-blue-200';
            };

            return (
              <div
                key={item.category}
                onClick={() =>
                  setSelectedCategory(selectedCategory === item.category ? 'all' : item.category)
                }
                className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:shadow-xs ${
                  selectedCategory === item.category
                    ? 'border-emerald-600 ring-2 ring-emerald-200 bg-emerald-50/20'
                    : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="truncate" title={item.category}>
                    {item.category}
                  </span>
                  <span className="text-slate-500 font-semibold">{item.percentage}%</span>
                </div>

                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full ${getCatColor(item.category).split(' ')[0]}`}
                    style={{ width: `${Math.min(100, Math.max(5, item.percentage))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between mt-2.5 text-[11px]">
                  <span className="font-bold text-slate-900">{item.totalKg} kg</span>
                  <span className="text-rose-600 font-semibold">₹{item.cost.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Waste Trend Visualization */}
      <div className="space-y-2">
        <WasteTrendChart data={wasteTrends} />
      </div>

      {/* Granular Logs Audit Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
            Waste Logs
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Audit CSV
            </button>
            <button
              type="button"
              onClick={onOpenLogWasteModal}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New Entry
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by food item, station, reason, or staff..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Waste Categories</option>
              <option value="Preparation Waste">Preparation Waste</option>
              <option value="Plate Waste">Plate Waste</option>
              <option value="Overproduction">Overproduction</option>
              <option value="Spoilage">Spoilage</option>
              <option value="Processing Loss">Processing Loss</option>
            </select>

            {/* Meal Session Filter */}
            <select
              value={selectedSession}
              onChange={e => setSelectedSession(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Meal Sessions</option>
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
              <option value="Snacks">Snacks</option>
              <option value="All-Day Prep">All-Day Prep</option>
            </select>

            {/* Station Filter */}
            <select
              value={selectedStation}
              onChange={e => setSelectedStation(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Kitchen Stations</option>
              <option value="Main Prep & Chop">Main Prep & Chop</option>
              <option value="Dishwashing & Scraping">Dishwashing & Scraping</option>
              <option value="Hot Line & Curry">Hot Line & Curry</option>
              <option value="Cold Larder">Cold Larder</option>
              <option value="Bakery & Dessert">Bakery & Dessert</option>
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800">{filteredLogs.length}</strong> of{' '}
            <strong className="text-slate-800">{wasteLogs.length}</strong> recorded waste batches
          </div>
          {(searchTerm || selectedCategory !== 'all' || selectedSession !== 'all' || selectedStation !== 'all') && (
            <button
              onClick={resetFilters}
              className="text-emerald-800 hover:text-emerald-950 font-semibold underline cursor-pointer text-xs"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Waste Logs Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3.5">Date & Session</th>
                <th className="py-3 px-3.5">Food Item</th>
                <th className="py-3 px-3.5">Measured Quantity</th>
                <th className="py-3 px-3.5">Category</th>
                <th className="py-3 px-3.5">Root Cause / Reason</th>
                <th className="py-3 px-3.5">Station & Logged By</th>
                <th className="py-3 px-3.5 text-right">Cost Loss</th>
                <th className="py-3 px-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Trash2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-700">No matching waste logs found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or log a new kitchen waste entry.</p>
                    <button
                      onClick={resetFilters}
                      className="mt-3 px-3.5 py-1.5 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      Clear All Filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const foodTitle = log.foodItem || log.itemName;
                  const categoryName = log.category || 'Preparation Waste';

                  const getBadgeStyle = (cat: WasteCategory) => {
                    if (cat === 'Plate Waste') return 'bg-amber-100 text-amber-800 border-amber-200';
                    if (cat === 'Preparation Waste') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
                    if (cat === 'Overproduction') return 'bg-purple-100 text-purple-800 border-purple-200';
                    if (cat === 'Spoilage') return 'bg-rose-100 text-rose-800 border-rose-200';
                    return 'bg-blue-100 text-blue-800 border-blue-200';
                  };

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Date & Session */}
                      <td className="py-3.5 px-3.5">
                        <div className="font-semibold text-slate-900">
                          {log.date || log.timestamp?.slice(0, 10)}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{log.mealSession || 'General Shift'}</span>
                        </div>
                      </td>

                      {/* Food Item */}
                      <td className="py-3.5 px-3.5">
                        <div className="font-bold text-slate-900 max-w-[200px] truncate" title={foodTitle}>
                          {foodTitle}
                        </div>
                        {log.actionRecommended && (
                          <div className="text-[10px] text-emerald-800 line-clamp-1 mt-0.5" title={log.actionRecommended}>
                            Action: {log.actionRecommended}
                          </div>
                        )}
                      </td>

                      {/* Measured Quantity */}
                      <td className="py-3.5 px-3.5">
                        <div className="font-bold text-slate-900 text-xs">
                          {log.quantity} <span className="font-normal text-slate-500">{log.unit || 'kg'}</span>
                        </div>
                        {log.unit !== 'kg' && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            ≈ {log.weightKg?.toFixed(2)} kg
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeStyle(categoryName)}`}>
                          {categoryName}
                        </span>
                      </td>

                      {/* Root Cause / Reason */}
                      <td className="py-3.5 px-3.5">
                        <div className="text-slate-700 max-w-[220px] line-clamp-2" title={log.reason || log.rootCause}>
                          {log.reason || log.rootCause}
                        </div>
                      </td>

                      {/* Station & Logged By */}
                      <td className="py-3.5 px-3.5">
                        <div className="text-slate-800 font-medium">{log.kitchenStation || 'Main Prep'}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{log.loggedBy || 'Duty Staff'}</div>
                      </td>

                      {/* Cost Loss */}
                      <td className="py-3.5 px-3.5 text-right font-mono font-bold text-rose-600">
                        ₹{(log.costLoss || 0).toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingLog(log)}
                            title="View Waste Entry Details"
                            className="p-1.5 text-slate-400 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setLogToDelete(log)}
                            title="Delete Waste Entry"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ViewWasteModal
        isOpen={!!viewingLog}
        onClose={() => setViewingLog(null)}
        log={viewingLog}
        onDelete={log => {
          setViewingLog(null);
          setLogToDelete(log);
        }}
      />

      <ConfirmDeleteModal
        isOpen={!!logToDelete}
        onClose={() => setLogToDelete(null)}
        title="Delete Waste Audit Record"
        message="Are you sure you want to remove this logged food waste entry? This will void the weighing record from your audit history and reverse its contribution to station telemetry."
        itemName={logToDelete ? `${logToDelete.foodItem || logToDelete.itemName} (${logToDelete.quantity} ${logToDelete.unit})` : undefined}
        confirmButtonText="Yes, Void Entry"
        onConfirm={() => {
          if (logToDelete) {
            deleteWasteLog(logToDelete.id);
            setLogToDelete(null);
          }
        }}
      />
    </div>
  );
};
