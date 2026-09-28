import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  ArrowUpDown,
  CheckCircle,
  ThermometerSnowflake,
  ShieldAlert,
  Eye,
  Edit2,
  Trash2,
  RotateCcw,
  Sparkles,
  Info,
  Calendar,
  DollarSign,
  Truck,
  MapPin,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InventoryCategory, InventoryItem, InventoryUnit } from '../../types';
import { applyFEFORotation, evaluateShelfLife, groupQuantitiesByUnit, normalizeToKg } from '../../utils/unitUtils';
import { ViewInventoryModal } from '../modals/ViewInventoryModal';
import { EditInventoryModal } from '../modals/EditInventoryModal';
import { ConfirmDeleteModal } from '../modals/ConfirmDeleteModal';

interface InventoryPageProps {
  onOpenAddModal: () => void;
}

type SortOption =
  | 'fefo'
  | 'expiry-desc'
  | 'stock-asc'
  | 'stock-desc'
  | 'name-asc'
  | 'date-desc'
  | 'value-desc';

export const InventoryPage: React.FC<InventoryPageProps> = ({ onOpenAddModal }) => {
  const {
    inventory,
    updateInventoryItem,
    deleteInventoryItem,
    resetDemoData,
    highlightedInventoryId,
    setHighlightedInventoryId,
  } = useApp();

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedExpiryStatus, setSelectedExpiryStatus] = useState<string>('all');
  const [selectedStockLevel, setSelectedStockLevel] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('fefo');

  // Modal states
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  // Apply FEFO rotation logic
  const fefoItems = useMemo(() => {
    return applyFEFORotation(inventory);
  }, [inventory]);

  // Derived alert metrics
  const expiredCount = fefoItems.filter(i => i.shelfLifeStatus === 'expired').length;
  const criticalCount = fefoItems.filter(i => i.shelfLifeStatus === 'critical').length;
  const nearTermCount = fefoItems.filter(i => i.shelfLifeStatus === 'near-term').length;
  const lowStockCount = fefoItems.filter(
    i => (i.quantity ?? i.currentStockKg) <= (i.reorderLevelKg || 0)
  ).length;

  const totalValuation = useMemo(() => {
    return fefoItems.reduce(
      (sum, i) => sum + (i.cost ?? i.unitCost ?? 0) * (i.quantity ?? i.currentStockKg ?? 0),
      0
    );
  }, [fefoItems]);

  const unitSummary = useMemo(() => {
    return groupQuantitiesByUnit(fefoItems.map(i => ({ quantity: i.quantity ?? i.currentStockKg, unit: i.unit || 'kg' })));
  }, [fefoItems]);

  // Filtered and Sorted list
  const filteredAndSortedItems = useMemo(() => {
    let list = fefoItems.filter(item => {
      // Highlighted target match priority
      if (highlightedInventoryId && item.id === highlightedInventoryId) {
        return true;
      }

      // Search match
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.batchCode.toLowerCase().includes(query) ||
        (item.supplier && item.supplier.toLowerCase().includes(query)) ||
        (item.storageLocation && item.storageLocation.toLowerCase().includes(query)) ||
        item.category.toLowerCase().includes(query);

      // Category match
      const matchesCategory =
        selectedCategory === 'all' || item.category.toLowerCase() === selectedCategory.toLowerCase();

      // Expiry status match
      const matchesExpiry =
        selectedExpiryStatus === 'all' || item.shelfLifeStatus === selectedExpiryStatus;

      // Stock level match
      const isLow = (item.quantity ?? item.currentStockKg) <= (item.reorderLevelKg || 0);
      const matchesStock =
        selectedStockLevel === 'all' ||
        (selectedStockLevel === 'low' && isLow) ||
        (selectedStockLevel === 'adequate' && !isLow);

      // Location match
      const loc = (item.storageLocation || item.storageZone || '').toLowerCase();
      const matchesLocation =
        selectedLocation === 'all' || loc.includes(selectedLocation.toLowerCase());

      return matchesSearch && matchesCategory && matchesExpiry && matchesStock && matchesLocation;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      if (sortBy === 'fefo') {
        // Expiry soonest first
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      }
      if (sortBy === 'expiry-desc') {
        return new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime();
      }
      if (sortBy === 'stock-asc') {
        return (a.quantity ?? a.currentStockKg) - (b.quantity ?? b.currentStockKg);
      }
      if (sortBy === 'stock-desc') {
        return (b.quantity ?? b.currentStockKg) - (a.quantity ?? a.currentStockKg);
      }
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'date-desc') {
        const dateA = new Date(a.purchaseDate || a.receivedDate || 0).getTime();
        const dateB = new Date(b.purchaseDate || b.receivedDate || 0).getTime();
        return dateB - dateA;
      }
      if (sortBy === 'value-desc') {
        const valA = (a.cost ?? a.unitCost ?? 0) * (a.quantity ?? a.currentStockKg ?? 0);
        const valB = (b.cost ?? b.unitCost ?? 0) * (b.quantity ?? b.currentStockKg ?? 0);
        return valB - valA;
      }
      return 0;
    });

    return list;
  }, [
    fefoItems,
    searchTerm,
    selectedCategory,
    selectedExpiryStatus,
    selectedStockLevel,
    selectedLocation,
    sortBy,
    highlightedInventoryId,
  ]);

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedExpiryStatus('all');
    setSelectedStockLevel('all');
    setSelectedLocation('all');
    setSortBy('fefo');
    setHighlightedInventoryId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Boxes className="w-5 h-5 text-emerald-800" />
          <h2 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
            Inventory
          </h2>
        </div>

        <button
          onClick={onOpenAddModal}
          className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer w-fit"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Stock Item</span>
        </button>
      </div>

      {/* Highlighted Banner if navigated from alerts */}
      {highlightedInventoryId && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Focusing on item lot <strong className="font-mono">{highlightedInventoryId}</strong>
            </span>
          </div>
          <button
            onClick={() => setHighlightedInventoryId(null)}
            className="text-amber-800 hover:text-amber-950 underline font-semibold cursor-pointer text-[11px]"
          >
            Show All Items
          </button>
        </div>
      )}

      {/* Expiry Risk & Operational Alert Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Expired alert */}
        <div
          onClick={() => setSelectedExpiryStatus(selectedExpiryStatus === 'expired' ? 'all' : 'expired')}
          className={`bg-white rounded-xl border p-4 shadow-xs transition-all cursor-pointer hover:shadow-md ${
            selectedExpiryStatus === 'expired'
              ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/20'
              : 'border-slate-200/80 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Expired</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${expiredCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-400'}`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 font-['Plus_Jakarta_Sans'] mt-1">
            {expiredCount} <span className="text-xs font-normal text-slate-500">lots</span>
          </div>
        </div>

        {/* Critical FIFO (<24h) */}
        <div
          onClick={() => setSelectedExpiryStatus(selectedExpiryStatus === 'critical' ? 'all' : 'critical')}
          className={`bg-white rounded-xl border p-4 shadow-xs transition-all cursor-pointer hover:shadow-md ${
            selectedExpiryStatus === 'critical'
              ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/20'
              : 'border-slate-200/80 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Critical (&lt;24h)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-700 font-['Plus_Jakarta_Sans'] mt-1">
            {criticalCount} <span className="text-xs font-normal text-slate-500">lots</span>
          </div>
        </div>

        {/* Near-term expiry (1-3d) */}
        <div
          onClick={() => setSelectedExpiryStatus(selectedExpiryStatus === 'near-term' ? 'all' : 'near-term')}
          className={`bg-white rounded-xl border p-4 shadow-xs transition-all cursor-pointer hover:shadow-md ${
            selectedExpiryStatus === 'near-term'
              ? 'border-amber-500 ring-2 ring-amber-200 bg-amber-50/20'
              : 'border-slate-200/80 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Near-Expiry (1-3 Days)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 font-['Plus_Jakarta_Sans'] mt-1">
            {nearTermCount} <span className="text-xs font-normal text-slate-500">lots</span>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div
          onClick={() => setSelectedStockLevel(selectedStockLevel === 'low' ? 'all' : 'low')}
          className={`bg-white rounded-xl border p-4 shadow-xs transition-all cursor-pointer hover:shadow-md ${
            selectedStockLevel === 'low'
              ? 'border-orange-500 ring-2 ring-orange-200 bg-orange-50/20'
              : 'border-slate-200/80 hover:border-orange-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Low Stock</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-orange-600 font-['Plus_Jakarta_Sans'] mt-1">
            {lowStockCount} <span className="text-xs font-normal text-slate-500">items</span>
          </div>
        </div>
      </div>

      {/* FEFO Rotation Priority */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                FEFO Rotation Priority
              </h3>
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-600">
            Total Inventory Valuation:{' '}
            <span className="text-slate-900 font-bold font-mono">₹{totalValuation.toLocaleString()}</span>
          </div>
        </div>

        {/* Top 3 FEFO Pick List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          {fefoItems
            .filter(i => i.shelfLifeStatus !== 'expired')
            .slice(0, 3)
            .map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setViewingItem(item)}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      FEFO Pick #{idx + 1}
                    </span>
                    <span className={`text-[10px] font-bold ${item.shelfLifeStatus === 'critical' ? 'text-rose-600' : 'text-amber-700'}`}>
                      Expires {item.expiryDate}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{item.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {item.quantity ?? item.currentStockKg} {item.unit || 'kg'} · {item.storageLocation || item.storageZone}
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-800 font-medium">View Lot Details</span>
                  <span className="font-mono text-slate-700 font-semibold">{item.batchCode}</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Main Inventory Ledger & Controls */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        {/* Controls Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by item, batch, supplier, or location..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Receive New Inventory Lot
            </button>
          </div>
        </div>

        {/* Filter & Sort Bar */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Category:</span>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Categories</option>
                <option value="Produce">Produce</option>
                <option value="Dairy & Poultry">Dairy & Poultry</option>
                <option value="Grains & Pulses">Grains & Pulses</option>
                <option value="Proteins">Proteins</option>
                <option value="Prepared Bases">Prepared Bases</option>
                <option value="Dry Goods">Dry Goods</option>
                <option value="Bakery">Bakery</option>
                <option value="Condiments & Spices">Condiments & Spices</option>
              </select>
            </div>

            {/* Expiry Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Expiry:</span>
              <select
                value={selectedExpiryStatus}
                onChange={e => setSelectedExpiryStatus(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Shelf Life</option>
                <option value="expired">Expired ({expiredCount})</option>
                <option value="critical">Critical &lt;24h ({criticalCount})</option>
                <option value="near-term">Near-Term 1-3d ({nearTermCount})</option>
                <option value="safe">Safe &gt;3d</option>
              </select>
            </div>

            {/* Stock Level Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Stock Level:</span>
              <select
                value={selectedStockLevel}
                onChange={e => setSelectedStockLevel(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Stock Levels</option>
                <option value="low">Low Stock (Reorder Needed)</option>
                <option value="adequate">Adequate Stock</option>
              </select>
            </div>

            {/* Storage Location Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Location:</span>
              <select
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Locations</option>
                <option value="Chiller">Walk-in Chiller</option>
                <option value="Freezer">Deep Freezer</option>
                <option value="Pantry">Dry Pantry</option>
                <option value="Hot-Hold">Hot-Hold</option>
              </select>
            </div>
          </div>

          {/* Sort Option */}
          <div className="flex items-center gap-1.5 ml-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Sort By:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="fefo">FEFO: Expiry Soonest (Default)</option>
              <option value="expiry-desc">Expiry: Latest First</option>
              <option value="stock-asc">Stock: Lowest First</option>
              <option value="stock-desc">Stock: Highest First</option>
              <option value="name-asc">Item Name (A - Z)</option>
              <option value="date-desc">Purchase: Newest First</option>
              <option value="value-desc">Total Value: Highest First</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips & Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800">{filteredAndSortedItems.length}</strong> of{' '}
            <strong className="text-slate-800">{inventory.length}</strong> items in inventory ledger
          </div>
          {(searchTerm || selectedCategory !== 'all' || selectedExpiryStatus !== 'all' || selectedStockLevel !== 'all' || selectedLocation !== 'all' || sortBy !== 'fefo') && (
            <button
              onClick={resetAllFilters}
              className="text-emerald-800 hover:text-emerald-950 font-semibold underline cursor-pointer text-xs"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Inventory Items Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3.5">FEFO Order & Item Name</th>
                <th className="py-3 px-3.5">Category</th>
                <th className="py-3 px-3.5">Stock Quantity</th>
                <th className="py-3 px-3.5">Expiry Date & Status</th>
                <th className="py-3 px-3.5">Storage Location</th>
                <th className="py-3 px-3.5">Supplier</th>
                <th className="py-3 px-3.5 text-right">Unit Cost / Total</th>
                <th className="py-3 px-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Boxes className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-700">No matching inventory items found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search terms or filter criteria.</p>
                    <button
                      onClick={resetAllFilters}
                      className="mt-3 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 font-semibold rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      Clear All Filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredAndSortedItems.map((item, index) => {
                  const isHighlighted = highlightedInventoryId === item.id;
                  const isLowStock = (item.quantity ?? item.currentStockKg) <= (item.reorderLevelKg || 0);
                  const valuation = (item.cost ?? item.unitCost ?? 0) * (item.quantity ?? item.currentStockKg ?? 0);
                  const { status, label: shelfLabel } = evaluateShelfLife(item.expiryDate);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isHighlighted ? 'bg-amber-50/60 ring-1 ring-amber-300' : ''
                      }`}
                    >
                      {/* Item Name & FEFO indicator */}
                      <td className="py-3.5 px-3.5">
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <span>{item.name}</span>
                              {status === 'expired' && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700 uppercase">
                                  Expired
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {item.batchCode} · Recv: {item.purchaseDate || item.receivedDate || 'N/A'}
                            </div>
                            {item.fefoRecommendation && (
                              <div className="text-[10px] text-emerald-800 font-medium mt-0.5 line-clamp-1">
                                {item.fefoRecommendation}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                          {item.category}
                        </span>
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3.5 px-3.5">
                        <div className="font-bold text-slate-900 text-xs">
                          {item.quantity ?? item.currentStockKg}{' '}
                          <span className="font-normal text-slate-500">{item.unit || 'kg'}</span>
                        </div>
                        {isLowStock && (
                          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 mt-0.5">
                            <AlertTriangle className="w-3 h-3" /> Reorder (&lt;{item.reorderLevelKg || 0})
                          </div>
                        )}
                      </td>

                      {/* Expiry Date & Urgency */}
                      <td className="py-3.5 px-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            status === 'expired'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : status === 'critical'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : status === 'near-term'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {status === 'critical' || status === 'expired' ? (
                            <AlertTriangle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {shelfLabel}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {item.expiryDate}
                        </div>
                      </td>

                      {/* Storage Location */}
                      <td className="py-3.5 px-3.5">
                        <div className="flex items-center gap-1 text-slate-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[130px]" title={item.storageLocation || item.storageZone}>
                            {item.storageLocation || item.storageZone}
                          </span>
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="py-3.5 px-3.5">
                        <div className="flex items-center gap-1 text-slate-700">
                          <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[120px]" title={item.supplier || 'Internal'}>
                            {item.supplier || 'Internal'}
                          </span>
                        </div>
                      </td>

                      {/* Unit Cost / Valuation */}
                      <td className="py-3.5 px-3.5 text-right">
                        <div className="font-mono text-slate-900 font-bold">
                          ₹{valuation.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          ₹{(item.cost ?? item.unitCost ?? 0).toLocaleString()} / {item.unit || 'kg'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingItem(item)}
                            title="View Full Item Details"
                            className="p-1.5 text-slate-400 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingItem(item)}
                            title="Edit Item Details"
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            title="Delete Item Lot"
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
      <ViewInventoryModal
        isOpen={!!viewingItem}
        onClose={() => setViewingItem(null)}
        item={viewingItem}
        onEdit={item => {
          setViewingItem(null);
          setEditingItem(item);
        }}
        onDelete={item => {
          setViewingItem(null);
          setItemToDelete(item);
        }}
      />

      <EditInventoryModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        onSave={(id, updates) => {
          updateInventoryItem(id, updates);
        }}
      />

      <ConfirmDeleteModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        title="Delete Inventory Lot"
        message="Are you sure you want to delete this inventory record? This will adjust your operational stock and remove the lot from the FEFO queue."
        itemName={itemToDelete ? `${itemToDelete.name} (${itemToDelete.batchCode})` : undefined}
        confirmButtonText="Yes, Delete Lot"
        onConfirm={() => {
          if (itemToDelete) {
            deleteInventoryItem(itemToDelete.id);
            setItemToDelete(null);
          }
        }}
      />
    </div>
  );
};
