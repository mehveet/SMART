import React, { useState } from 'react';
import { CategorySustainabilityMetric } from '../../types/sustainability';
import { PieChart, DollarSign, CloudOff, Droplets, Info } from 'lucide-react';

interface WasteByCategoryDonutProps {
  categories: CategorySustainabilityMetric[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const WasteByCategoryDonut: React.FC<WasteByCategoryDonutProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const totalWaste = categories.reduce((sum, c) => sum + c.wasteKg, 0) || 1;

  // Colors for donut segments
  const colors: Record<string, { fill: string; hover: string; text: string; bg: string }> = {
    'Cooked Main Meals': { fill: '#10b981', hover: '#059669', text: 'text-emerald-700', bg: 'bg-emerald-50' },
    'Grains & Pulses': { fill: '#3b82f6', hover: '#2563eb', text: 'text-blue-700', bg: 'bg-blue-50' },
    'Soups & Gravies': { fill: '#f59e0b', hover: '#d97706', text: 'text-amber-700', bg: 'bg-amber-50' },
    'Fresh Cut Produce': { fill: '#14b8a6', hover: '#0d9488', text: 'text-teal-700', bg: 'bg-teal-50' },
    'Dairy & Poultry': { fill: '#8b5cf6', hover: '#7c3aed', text: 'text-purple-700', bg: 'bg-purple-50' },
    'Bakery Goods': { fill: '#ec4899', hover: '#db2777', text: 'text-pink-700', bg: 'bg-pink-50' },
  };

  // Build SVG Donut Segments
  const radius = 64;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  const activeCatObj = categories.find(
    c => c.category === (hoveredCategory || (selectedCategory !== 'all' ? selectedCategory : categories[0]?.category))
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
            Waste Generation by Food Category
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Volumetric share and lifecycle environmental impact per stream
          </p>
        </div>
        {selectedCategory !== 'all' && (
          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold underline"
          >
            Reset to All
          </button>
        )}
      </div>

      {/* Donut & Stats Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center my-3">
        {/* Donut graphic */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center relative">
          <svg width="170" height="170" viewBox="0 0 170 170" className="transform -rotate-90">
            {categories.map((c, idx) => {
              const share = c.wasteKg / totalWaste;
              const strokeDasharray = `${share * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedPercent * circumference;
              accumulatedPercent += share;

              const style = colors[c.category] || { fill: '#94a3b8', hover: '#64748b' };
              const isSelected = selectedCategory === c.category || hoveredCategory === c.category;

              return (
                <circle
                  key={idx}
                  cx="85"
                  cy="85"
                  r={radius}
                  fill="transparent"
                  stroke={isSelected ? style.hover : style.fill}
                  strokeWidth={isSelected ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredCategory(c.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  onClick={() => onSelectCategory(selectedCategory === c.category ? 'all' : c.category)}
                />
              );
            })}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[11px] text-slate-400 font-medium">Total Waste</span>
            <span className="text-lg font-bold text-slate-900 font-mono">
              {totalWaste.toLocaleString()} <span className="text-xs font-normal">kg</span>
            </span>
          </div>
        </div>

        {/* Selected Category Highlight Detail Card */}
        <div className="sm:col-span-7 bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60 text-xs space-y-2">
          {activeCatObj ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                <div>
                  <span className="font-bold text-slate-900 text-sm">{activeCatObj.category}</span>
                  <span className="text-[11px] text-slate-500 block">
                    {Math.round((activeCatObj.wasteKg / totalWaste) * 100)}% of facility waste volume
                  </span>
                </div>
                <span className="text-base font-bold font-mono text-slate-900">
                  {activeCatObj.wasteKg} kg
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <CloudOff className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Factor: <strong>{activeCatObj.carbonFactor}</strong> kg CO2e/kg</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Droplets className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                  <span>Water: <strong>{activeCatObj.waterFactor}</strong> L/kg</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <DollarSign className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>Cost Impact: <strong>₹{activeCatObj.costImpactInr.toLocaleString()}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-3 h-3 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px]">
                    ✓
                  </span>
                  <span>Recovered: <strong>{activeCatObj.recoveredDeliveredKg} kg</strong></span>
                </div>
              </div>

              <div className="pt-1.5 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                <span>Source: {activeCatObj.carbonFactorSource} & {activeCatObj.waterFactorSource}</span>
                <span className="text-emerald-700 font-semibold cursor-pointer" onClick={() => onSelectCategory(activeCatObj.category)}>
                  Filter by Category →
                </span>
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-slate-400">
              Hover over or click a category slice to inspect conversion metrics
            </div>
          )}
        </div>
      </div>

      {/* Category Pills Breakdown List */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-xs">
        {categories.map((c, idx) => {
          const style = colors[c.category] || { fill: '#94a3b8', hover: '#64748b', text: 'text-slate-700', bg: 'bg-slate-50' };
          const isSelected = selectedCategory === c.category;

          return (
            <button
              type="button"
              key={idx}
              onClick={() => onSelectCategory(isSelected ? 'all' : c.category)}
              className={`p-2 rounded-lg text-left transition-all border flex items-center justify-between gap-1.5 ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                  : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-xs flex-shrink-0"
                  style={{ backgroundColor: style.fill }}
                ></span>
                <span className="font-medium text-slate-800 truncate">{c.category}</span>
              </div>
              <span className="font-mono text-slate-500 font-semibold flex-shrink-0">
                {c.wasteKg}kg
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
