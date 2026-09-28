import React, { useState, useMemo } from 'react';
import { InstitutionPerformanceRecord } from '../../types/sustainability';
import { Building2, Utensils, Award, ShieldCheck, CheckCircle2, ArrowUpDown, Search } from 'lucide-react';

interface InstitutionPerformanceGridProps {
  records: InstitutionPerformanceRecord[];
}

export const InstitutionPerformanceGrid: React.FC<InstitutionPerformanceGridProps> = ({ records }) => {
  const [filterType, setFilterType] = useState<'all' | 'stations' | 'partners'>('all');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'wasteKg' | 'recoveredDeliveredKg' | 'diversionRatePercent' | 'mealsPreparedOrServed'>('diversionRatePercent');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    return records
      .filter(r => {
        if (filterType === 'stations') {
          return r.type === 'kitchen_station' || r.type === 'service_hall';
        }
        if (filterType === 'partners') {
          return r.type === 'recipient_partner';
        }
        return true;
      })
      .filter(r => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.location.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [records, filterType, search, sortField, sortAsc]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              Institution & Station Performance Trends
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-medium">
              {filtered.length} Units Monitored
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational efficiency, diversion rates, and hygiene scores across kitchen lines and verified recipient pantries
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search station or pantry..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                filterType === 'all'
                  ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Units
            </button>
            <button
              type="button"
              onClick={() => setFilterType('stations')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                filterType === 'stations'
                  ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kitchen Lines
            </button>
            <button
              type="button"
              onClick={() => setFilterType('partners')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                filterType === 'partners'
                  ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Recipient Pantries
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-semibold select-none">
              <th className="py-2.5 px-3">Unit / Station Name</th>
              <th className="py-2.5 px-2">Type</th>
              <th
                className="py-2.5 px-2 text-right cursor-pointer hover:text-slate-600"
                onClick={() => handleSort('mealsPreparedOrServed')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Meals Handled</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="py-2.5 px-2 text-right cursor-pointer hover:text-slate-600"
                onClick={() => handleSort('wasteKg')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Waste (kg)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-2 text-right">Waste / 100 Meals</th>
              <th
                className="py-2.5 px-2 text-right cursor-pointer hover:text-slate-600"
                onClick={() => handleSort('recoveredDeliveredKg')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Recovered (kg)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="py-2.5 px-2 text-right cursor-pointer hover:text-slate-600"
                onClick={() => handleSort('diversionRatePercent')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Diversion %</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-2 text-center">HACCP Safety</th>
              <th className="py-2.5 px-3">Operational Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filtered.map(rec => {
              const isPartner = rec.type === 'recipient_partner';

              return (
                <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      {isPartner ? (
                        <div className="w-6 h-6 rounded-md bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                          <Utensils className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div>
                        <span>{rec.name}</span>
                        <span className="text-[10px] text-slate-400 block font-normal">{rec.location}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                        isPartner
                          ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isPartner ? 'Partner Pantry' : 'Kitchen Station'}
                    </span>
                  </td>

                  <td className="py-3 px-2 text-right font-mono font-medium text-slate-800">
                    {rec.mealsPreparedOrServed.toLocaleString()}
                  </td>

                  <td className="py-3 px-2 text-right font-mono font-medium text-slate-900">
                    {rec.wasteKg > 0 ? `${rec.wasteKg} kg` : '—'}
                  </td>

                  <td className="py-3 px-2 text-right font-mono text-slate-600">
                    {rec.wastePer100MealsKg > 0 ? `${rec.wastePer100MealsKg} kg` : '0.00 kg'}
                  </td>

                  <td className="py-3 px-2 text-right font-mono font-bold text-emerald-800">
                    {rec.recoveredDeliveredKg > 0 ? `${rec.recoveredDeliveredKg} kg` : '—'}
                  </td>

                  <td className="py-3 px-2 text-right font-mono">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded font-bold ${
                        rec.diversionRatePercent >= 95
                          ? 'bg-emerald-100 text-emerald-800'
                          : rec.diversionRatePercent >= 90
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {rec.diversionRatePercent}%
                    </span>
                  </td>

                  <td className="py-3 px-2 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-700 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {rec.haccpSafetyScorePercent}%
                    </span>
                  </td>

                  <td className="py-3 px-3 text-[11px] text-slate-500 max-w-xs truncate" title={rec.statusNotes}>
                    {rec.statusNotes}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
