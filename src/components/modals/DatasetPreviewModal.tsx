import React, { useState } from 'react';
import { X, Table, Download, AlertTriangle, CheckCircle2, Search, Filter } from 'lucide-react';
import { HistoricalMealRecord } from '../../types/forecasting';
import { generateCSVFromRecords } from '../../data/historicalMealData';

interface DatasetPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: HistoricalMealRecord[];
  warnings?: string[];
}

export const DatasetPreviewModal: React.FC<DatasetPreviewModalProps> = ({
  isOpen,
  onClose,
  records,
  warnings = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  if (!isOpen) return null;

  const filtered = records.filter(r => {
    const matchesSearch =
      r.date.includes(searchTerm) ||
      r.dayOfWeek.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.menuName && r.menuName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.specialEvent.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === 'All' || r.mealCategory.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const totalPrepared = records.reduce((s, r) => s + r.mealsPrepared, 0);
  const totalServed = records.reduce((s, r) => s + r.mealsServed, 0);
  const totalSurplus = records.reduce((s, r) => s + r.surplusMeals, 0);
  const totalWaste = records.reduce((s, r) => s + r.wasteKg, 0);

  const handleDownloadCSV = () => {
    const csvContent = generateCSVFromRecords(records);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `smart-historical-dataset-${records.length}-records.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                  Historical Meal Dataset Explorer
                </h3>
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded font-semibold">
                  {records.length} RECORDS LOADED
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Full chronological ledger of institutional kitchen production and consumption records
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCSV}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dataset Summary Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50/50 border-b border-slate-200 text-xs">
          <div className="p-2.5 bg-white rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500">Date Coverage</div>
            <div className="font-mono font-bold text-slate-800 mt-0.5 truncate">
              {records[0]?.date || 'N/A'} → {records[records.length - 1]?.date || 'N/A'}
            </div>
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500">Avg Meals Served</div>
            <div className="font-mono font-bold text-emerald-800 mt-0.5">
              {records.length ? Math.round(totalServed / records.length).toLocaleString() : 0} / day
            </div>
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500">Historical Surplus Ratio</div>
            <div className="font-mono font-bold text-amber-800 mt-0.5">
              {totalPrepared ? ((totalSurplus / totalPrepared) * 100).toFixed(1) : 0}% ({totalSurplus.toLocaleString()} meals)
            </div>
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500">Cumulative Food Waste</div>
            <div className="font-mono font-bold text-rose-800 mt-0.5">
              {totalWaste.toFixed(1)} kg
            </div>
          </div>
        </div>

        {/* Validation Warnings if any */}
        {warnings.length > 0 && (
          <div className="p-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 space-y-1 max-h-24 overflow-y-auto">
            <div className="font-bold flex items-center gap-1.5 text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Data Diagnostics ({warnings.length} flags):</span>
            </div>
            {warnings.map((w, idx) => (
              <div key={idx} className="text-[11px] text-amber-800">
                · {w}
              </div>
            ))}
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="p-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-white">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search by date, day, dish, event..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Meal:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
            >
              <option value="All">All Services</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
              <option value="Breakfast">Breakfast</option>
            </select>
          </div>
        </div>

        {/* Records Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-100 text-slate-500 border-b border-slate-200 z-10">
              <tr>
                <th className="py-2.5 px-3">Date & Day</th>
                <th className="py-2.5 px-3">Service</th>
                <th className="py-2.5 px-3">Menu Name</th>
                <th className="py-2.5 px-2 text-right">Attendance</th>
                <th className="py-2.5 px-2 text-right">Prepared</th>
                <th className="py-2.5 px-2 text-right">Served</th>
                <th className="py-2.5 px-2 text-right">Surplus</th>
                <th className="py-2.5 px-2 text-right">Waste (kg)</th>
                <th className="py-2.5 px-3">Context / Weather</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    No historical records match the search filter.
                  </td>
                </tr>
              ) : (
                filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 font-mono text-[11px]">{r.date}</div>
                      <div className="text-[10px] text-slate-400">{r.dayOfWeek}</div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-800">
                      {r.mealCategory}
                    </td>
                    <td className="py-2.5 px-3 max-w-[180px] truncate text-slate-600" title={r.menuName}>
                      {r.menuName || 'Standard Menu'}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-500">
                      {r.attendance.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-semibold text-slate-800">
                      {r.mealsPrepared.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-emerald-800">
                      {r.mealsServed.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-amber-800">
                      {r.surplusMeals > 0 ? `+${r.surplusMeals}` : 0}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-rose-700">
                      {r.wasteKg}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                      {r.specialEvent !== 'None' ? (
                        <span className="font-semibold text-indigo-700 mr-1.5">[{r.specialEvent}]</span>
                      ) : null}
                      <span>{r.weather}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filtered.length} of {records.length} records</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
