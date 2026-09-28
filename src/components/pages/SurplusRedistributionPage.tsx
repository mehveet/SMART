import React, { useState, useMemo } from 'react';
import {
  Share2,
  Plus,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Building2,
  FileCheck,
  ArrowRight,
  AlertCircle,
  Thermometer,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Sparkles,
  Scale,
  MapPin,
  Calendar,
  Layers,
  AlertTriangle,
  RotateCcw,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  QualityReviewStatus,
  RedistributionDispatch,
  RedistributionPartner,
  SurplusBatch,
  SurplusStatus,
} from '../../types';
import { SurplusMatchingModal } from '../modals/SurplusMatchingModal';
import { CreateSurplusModal } from '../modals/CreateSurplusModal';
import { ViewSurplusModal } from '../modals/ViewSurplusModal';
import { WorkflowActionModal } from '../modals/WorkflowActionModal';
import { AddRecipientModal } from '../modals/AddRecipientModal';
import { ViewRecipientModal } from '../modals/ViewRecipientModal';
import { IdentifySurplusModal } from '../modals/IdentifySurplusModal';
import { ConfirmDeleteModal } from '../modals/ConfirmDeleteModal';
import { RedistributionMapDashboard } from '../maps/RedistributionMapDashboard';

interface SurplusRedistributionPageProps {
  onOpenSurplusModal: () => void;
  onOpenDispatchModal: (batchId?: string, partnerId?: string) => void;
}

export const SurplusRedistributionPage: React.FC<SurplusRedistributionPageProps> = ({
  onOpenSurplusModal,
  onOpenDispatchModal,
}) => {
  const {
    surplusBatches,
    partners,
    dispatches,
    updateDispatchStatus,
    deleteSurplusBatch,
    deleteRecipient,
    createSurplusBatch,
  } = useApp();

  // Tab State - default to interactive redistribution map
  const [activeTabSub, setActiveTabSub] = useState<'map' | 'surplus' | 'directory' | 'manifests'>('map');

  // Search & Filter States for Surplus Listings
  const [surplusSearch, setSurplusSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [qualityFilter, setQualityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'quantity' | 'prepTime'>('deadline');

  // Search & Filter States for Recipient Directory
  const [directorySearch, setDirectorySearch] = useState('');
  const [partnerTypeFilter, setPartnerTypeFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');

  // Modals Management
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [batchToEdit, setBatchToEdit] = useState<SurplusBatch | null>(null);

  const [matchingBatch, setMatchingBatch] = useState<SurplusBatch | null>(null);
  const [viewingBatch, setViewingBatch] = useState<SurplusBatch | null>(null);

  const [workflowActionState, setWorkflowActionState] = useState<{
    isOpen: boolean;
    batch: SurplusBatch | null;
    targetStep: 'schedule_pickup' | 'mark_collected' | 'confirm_delivery' | 'cancel_batch';
  }>({
    isOpen: false,
    batch: null,
    targetStep: 'schedule_pickup',
  });

  const [isIdentifyModalOpen, setIsIdentifyModalOpen] = useState(false);

  // Recipient Directory Modals
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [partnerToEdit, setPartnerToEdit] = useState<RedistributionPartner | null>(null);
  const [viewingPartner, setViewingPartner] = useState<RedistributionPartner | null>(null);

  // Delete Confirmation State
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    type: 'batch' | 'partner';
    id: string;
    name: string;
  }>({
    isOpen: false,
    type: 'batch',
    id: '',
    name: '',
  });

  // Selected manifest for slip viewing
  const [selectedManifest, setSelectedManifest] = useState<RedistributionDispatch | null>(null);

  // Filtered & Sorted Surplus Batches
  const filteredBatches = useMemo(() => {
    return surplusBatches
      .filter(b => {
        const matchesSearch =
          surplusSearch === '' ||
          (b.foodName || b.dishName || '').toLowerCase().includes(surplusSearch.toLowerCase()) ||
          b.batchNumber.toLowerCase().includes(surplusSearch.toLowerCase()) ||
          b.location.toLowerCase().includes(surplusSearch.toLowerCase()) ||
          (b.assignedRecipientName || '').toLowerCase().includes(surplusSearch.toLowerCase());

        const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
        const matchesCategory = categoryFilter === 'all' || b.category === categoryFilter;
        const matchesQuality = qualityFilter === 'all' || b.qualityReviewStatus === qualityFilter;

        return matchesSearch && matchesStatus && matchesCategory && matchesQuality;
      })
      .sort((a, b) => {
        if (sortBy === 'deadline') {
          return (a.collectionDeadline || '').localeCompare(b.collectionDeadline || '');
        }
        if (sortBy === 'quantity') {
          return (b.weightKg || b.quantity || 0) - (a.weightKg || a.quantity || 0);
        }
        return (b.preparationTime || b.preparedAt || '').localeCompare(
          a.preparationTime || a.preparedAt || ''
        );
      });
  }, [surplusBatches, surplusSearch, statusFilter, categoryFilter, qualityFilter, sortBy]);

  // Filtered Recipient Directory
  const filteredPartners = useMemo(() => {
    return partners.filter(p => {
      const matchesSearch =
        directorySearch === '' ||
        p.name.toLowerCase().includes(directorySearch.toLowerCase()) ||
        p.location.toLowerCase().includes(directorySearch.toLowerCase()) ||
        p.contactPerson.toLowerCase().includes(directorySearch.toLowerCase()) ||
        p.acceptedFoodTypes.some(t => t.toLowerCase().includes(directorySearch.toLowerCase()));

      const matchesType = partnerTypeFilter === 'all' || p.type === partnerTypeFilter;
      const matchesVerification =
        verificationFilter === 'all' || p.verificationStatus === verificationFilter;

      return matchesSearch && matchesType && matchesVerification;
    });
  }, [partners, directorySearch, partnerTypeFilter, verificationFilter]);

  // Counts & Summaries
  const availableBatches = surplusBatches.filter(b => b.status === 'Available');
  const matchedBatches = surplusBatches.filter(b => b.status === 'Matched');
  const scheduledBatches = surplusBatches.filter(b => b.status === 'Pickup Scheduled');
  const inTransitBatches = surplusBatches.filter(b => b.status === 'Collected');
  const deliveredBatches = surplusBatches.filter(b => b.status === 'Delivered');

  const availableKg = availableBatches.reduce((acc, curr) => acc + (curr.weightKg || curr.quantity || 0), 0);
  const inTransitKg = inTransitBatches.reduce((acc, curr) => acc + (curr.weightKg || curr.quantity || 0), 0);
  // CRITICAL: Only count food as recovered after delivery confirmation
  const recoveredDeliveredKg = deliveredBatches.reduce((acc, curr) => {
    const delivered = curr.deliveryDetails?.deliveredKg || curr.weightKg || curr.quantity || 0;
    return acc + delivered;
  }, 0);

  const handleDeleteConfirm = () => {
    if (deleteConfirmState.type === 'batch') {
      deleteSurplusBatch(deleteConfirmState.id);
    } else {
      deleteRecipient(deleteConfirmState.id);
    }
    setDeleteConfirmState({ isOpen: false, type: 'batch', id: '', name: '' });
  };

  const getStatusBadge = (status: SurplusStatus) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Matched':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'Pickup Scheduled':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'Collected':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Delivered':
        return 'bg-teal-100 text-teal-800 border-teal-300 font-bold';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'Expired':
        return 'bg-slate-200 text-slate-800 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Clean Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-emerald-800" />
          <h2 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
            Surplus Redistribution
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsIdentifyModalOpen(true)}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Identify Surplus</span>
          </button>

          <button
            onClick={() => {
              setBatchToEdit(null);
              setIsCreateModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Stage Surplus Batch</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Available Surplus</span>
          <div className="text-2xl font-bold text-slate-900 font-['Plus_Jakarta_Sans'] mt-1">
            {availableKg.toFixed(1)} <span className="text-sm font-normal text-slate-500">kg</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {availableBatches.length} batches ready
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Allocated</span>
          <div className="text-2xl font-bold text-sky-700 font-['Plus_Jakarta_Sans'] mt-1">
            {matchedBatches.length + scheduledBatches.length}{' '}
            <span className="text-sm font-normal text-slate-500">batches</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Matched to recipients</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">In Transit</span>
          <div className="text-2xl font-bold text-amber-700 font-['Plus_Jakarta_Sans'] mt-1">
            {inTransitKg.toFixed(1)} <span className="text-sm font-normal text-slate-500">kg</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {inTransitBatches.length} active dispatches
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Food Recovered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-800 font-['Plus_Jakarta_Sans'] mt-1">
            {recoveredDeliveredKg.toFixed(1)} <span className="text-sm font-normal text-slate-500">kg</span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">
            Delivered successfully
          </p>
        </div>
      </div>

      {/* Main Tabbed Container */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTabSub('map')}
              className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTabSub === 'map'
                  ? 'border-emerald-600 text-emerald-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span>Redistribution Map</span>
              <span className="ml-1 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-bold">
                Live
              </span>
            </button>

            <button
              onClick={() => setActiveTabSub('surplus')}
              className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTabSub === 'surplus'
                  ? 'border-emerald-600 text-emerald-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Surplus Batches ({surplusBatches.length})</span>
            </button>

            <button
              onClick={() => setActiveTabSub('directory')}
              className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTabSub === 'directory'
                  ? 'border-emerald-600 text-emerald-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Recipients & NGOs ({partners.length})</span>
            </button>

            <button
              onClick={() => setActiveTabSub('manifests')}
              className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTabSub === 'manifests'
                  ? 'border-emerald-600 text-emerald-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Manifests ({dispatches.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTabSub === 'map' && (
              <button
                onClick={() => onOpenDispatchModal()}
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Create Dispatch</span>
              </button>
            )}

            {activeTabSub === 'surplus' && (
              <button
                onClick={() => {
                  setBatchToEdit(null);
                  setIsCreateModalOpen(true);
                }}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Surplus Batch</span>
              </button>
            )}

            {activeTabSub === 'directory' && (
              <button
                onClick={() => {
                  setPartnerToEdit(null);
                  setIsAddPartnerOpen(true);
                }}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Enroll Partner</span>
              </button>
            )}

            {activeTabSub === 'manifests' && (
              <button
                onClick={() => onOpenDispatchModal()}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>New Manifest</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 0: INTERACTIVE GOOGLE MAP DASHBOARD */}
        {activeTabSub === 'map' && (
          <div className="pt-4">
            <RedistributionMapDashboard
              onOpenDispatchModal={onOpenDispatchModal}
              onSelectPartnerForDispatch={(partner) => onOpenDispatchModal(undefined, partner.id)}
              onOpenSurplusModal={() => {
                setBatchToEdit(null);
                setIsCreateModalOpen(true);
              }}
            />
          </div>
        )}

        {/* TAB 1: SURPLUS FOOD LISTINGS */}
        {activeTabSub === 'surplus' && (
          <div className="pt-4 space-y-4">
            {/* Search & Filter Toolbar */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center gap-3 text-xs">
              {/* Search */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search surplus batches, items, or locations..."
                  value={surplusSearch}
                  onChange={e => setSurplusSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              {/* Status Segmented Control */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                {['all', 'Available', 'Matched', 'Delivered'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                      statusFilter === st
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    {st === 'all' ? 'All Batches' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Surplus Listing Table */}
            {filteredBatches.length === 0 ? (
              <div className="py-14 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-600">No surplus food listings match your filters.</p>
                <p className="mt-1">Stage a new batch or identify surplus from recorded production & inventory data.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3">Batch & Food Item</th>
                      <th className="py-3 px-3 text-right">Quantity / Meals</th>
                      <th className="py-3 px-3">Prep Time & Storage</th>
                      <th className="py-3 px-3">Collection Deadline</th>
                      <th className="py-3 px-3">Location & HACCP</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Assigned Recipient</th>
                      <th className="py-3 px-3 text-right">Internal Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                    {filteredBatches.map(batch => {
                      const weight = batch.weightKg || batch.quantity || 15;
                      return (
                        <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Batch & Item */}
                          <td className="py-3 px-3">
                            <div className="font-mono text-[11px] font-bold text-slate-500">
                              {batch.batchNumber}
                            </div>
                            <div className="font-bold text-slate-900 text-xs mt-0.5 max-w-[200px] truncate">
                              {batch.foodName || batch.dishName}
                            </div>
                            <span className="text-[10px] text-slate-400">{batch.category}</span>
                          </td>

                          {/* Quantity */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <span className="font-mono font-bold text-slate-900 text-xs">
                              {weight.toFixed(1)} kg
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              ~{batch.portions} meals
                            </span>
                          </td>

                          {/* Prep Time & Storage */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="text-slate-800 font-mono text-[11px]">
                              {batch.preparationTime || batch.preparedAt}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Thermometer className="w-3 h-3 text-slate-400" />
                              <span>{batch.storageConditions}</span>
                            </div>
                          </td>

                          {/* Deadline */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-mono font-semibold text-amber-800 text-[11px] flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>{batch.collectionDeadline}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[140px]">
                              {batch.safeConsumptionWindow}
                            </span>
                          </td>

                          {/* Location & HACCP */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="text-slate-800 flex items-center gap-1 font-medium">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[120px]">{batch.location}</span>
                            </div>
                            <div className="mt-0.5">
                              <span
                                className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                  batch.qualityReviewStatus === 'Passed HACCP Inspection'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {batch.haccpClearance?.temperatureLogged ?? 68.4}°C ·{' '}
                                {batch.qualityReviewStatus === 'Passed HACCP Inspection'
                                  ? 'Clear'
                                  : 'Check'}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(
                                batch.status
                              )}`}
                            >
                              {batch.status}
                            </span>
                          </td>

                          {/* Assigned Recipient */}
                          <td className="py-3 px-3">
                            {batch.assignedRecipientName ? (
                              <div>
                                <div className="font-semibold text-slate-900 truncate max-w-[150px]">
                                  {batch.assignedRecipientName}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  Allocated: {batch.assignedQuantity || weight} kg
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                            )}
                          </td>

                          {/* Internal Actions */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Match button for Available / Matched */}
                              {(batch.status === 'Available' || batch.status === 'Matched') && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => onOpenDispatchModal(batch.id, batch.assignedRecipientId)}
                                    className="px-2 py-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded text-[11px] transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                                    title="Issue manifest and dispatch surplus"
                                  >
                                    <Truck className="w-3 h-3" />
                                    <span>Dispatch</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setMatchingBatch(batch)}
                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded text-[11px] border border-emerald-200 transition-colors flex items-center gap-1"
                                  >
                                    <Sparkles className="w-3 h-3 text-emerald-600" />
                                    <span>{batch.status === 'Available' ? 'Match' : 'Re-Match'}</span>
                                  </button>
                                </>
                              )}

                              {/* Workflow Step Transitions */}
                              {batch.status === 'Matched' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setWorkflowActionState({
                                      isOpen: true,
                                      batch,
                                      targetStep: 'schedule_pickup',
                                    })
                                  }
                                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold rounded text-[11px] border border-indigo-200 transition-colors flex items-center gap-1"
                                >
                                  <Truck className="w-3 h-3 text-indigo-600" />
                                  <span>Schedule</span>
                                </button>
                              )}

                              {batch.status === 'Pickup Scheduled' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setWorkflowActionState({
                                      isOpen: true,
                                      batch,
                                      targetStep: 'mark_collected',
                                    })
                                  }
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded text-[11px] border border-amber-200 transition-colors flex items-center gap-1"
                                >
                                  <Truck className="w-3 h-3 text-amber-600" />
                                  <span>Collect</span>
                                </button>
                              )}

                              {batch.status === 'Collected' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setWorkflowActionState({
                                      isOpen: true,
                                      batch,
                                      targetStep: 'confirm_delivery',
                                    })
                                  }
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px] transition-colors flex items-center gap-1 shadow-xs"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Confirm Delivery</span>
                                </button>
                              )}

                              {/* View Details */}
                              <button
                                type="button"
                                onClick={() => setViewingBatch(batch)}
                                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                                title="View Record & Audit Trail"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                onClick={() => {
                                  setBatchToEdit(batch);
                                  setIsCreateModalOpen(true);
                                }}
                                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                                title="Edit Listing"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete / Cancel */}
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteConfirmState({
                                    isOpen: true,
                                    type: 'batch',
                                    id: batch.id,
                                    name: `${batch.batchNumber} - ${batch.foodName || batch.dishName}`,
                                  })
                                }
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                                title="Delete Listing"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INTERNAL RECIPIENT DIRECTORY */}
        {activeTabSub === 'directory' && (
          <div className="pt-4 space-y-4">
            {/* Notice */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>
                  <strong>Internal Recipient Directory:</strong> Maintained solely by institutional staff for automated match scoring and chain-of-custody routing. Recipients do not log in or interact with the app.
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                Strict Internal Desk
              </span>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 text-xs">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search recipient directory by organization, location, contact, or food type..."
                  value={directorySearch}
                  onChange={e => setDirectorySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-slate-500 whitespace-nowrap">Type:</span>
                <select
                  value={partnerTypeFilter}
                  onChange={e => setPartnerTypeFilter(e.target.value)}
                  className="p-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="all">All Types</option>
                  <option value="Campus Student Pantry">Campus Student Pantry</option>
                  <option value="Community Kitchen">Community Kitchen</option>
                  <option value="Elder Care Home">Elder Care Home</option>
                  <option value="Shelter / Welfare Center">Shelter / Welfare Center</option>
                  <option value="Partner Health Center">Partner Health Center</option>
                  <option value="Sister Facility Dining">Sister Facility Dining</option>
                  <option value="Municipal Community Center">Municipal Community Center</option>
                  <option value="Eco-Compost Facility">Eco-Compost Facility</option>
                </select>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-slate-500 whitespace-nowrap">Verification:</span>
                <select
                  value={verificationFilter}
                  onChange={e => setVerificationFilter(e.target.value)}
                  className="p-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="Verified Institutional Partner">Verified</option>
                  <option value="Pending Annual Audit">Pending Audit</option>
                  <option value="Conditional Clearance">Conditional</option>
                </select>
              </div>
            </div>

            {/* Recipient Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPartners.map(partner => {
                const capacity = partner.serviceCapacity || partner.typicalCapacityKg || 50;
                const allocated = partner.allocatedTodayKg || 0;
                const percent = Math.min(100, Math.round((allocated / capacity) * 100));

                return (
                  <div
                    key={partner.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all flex flex-col justify-between text-xs"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {partner.distanceKm} km transit radius
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 mt-2 line-clamp-1">
                        {partner.name}
                      </h4>
                      <div className="text-[11px] text-slate-500 mt-0.5">{partner.type}</div>

                      {/* Location & Contact */}
                      <div className="mt-3 space-y-1 text-slate-600 text-[11px]">
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{partner.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{partner.operatingHours}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <Truck className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{partner.pickupAvailability}</span>
                        </div>
                      </div>

                      {/* Capacity Bar */}
                      <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                        <div className="flex justify-between font-medium text-slate-700">
                          <span>Daily Intake Capacity:</span>
                          <span className="font-mono font-bold text-slate-900">
                            {allocated.toFixed(1)} / {capacity} kg
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              percent > 85 ? 'bg-amber-500' : 'bg-emerald-600'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Accepted Food Types Badges */}
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {partner.acceptedFoodTypes.slice(0, 3).map(ft => (
                          <span
                            key={ft}
                            className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]"
                          >
                            {ft}
                          </span>
                        ))}
                        {partner.acceptedFoodTypes.length > 3 && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px]">
                            +{partner.acceptedFoodTypes.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-emerald-700 font-medium flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>HACCP Agreement On File</span>
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setActiveTabSub('map')}
                          className="px-2 py-1 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded font-semibold text-[11px] transition-colors flex items-center gap-1 border border-emerald-200"
                          title="View on Interactive Map"
                        >
                          <MapPin className="w-3 h-3 text-emerald-700" />
                          <span>Map</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewingPartner(partner)}
                          className="px-2 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-[11px] transition-colors"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPartnerToEdit(partner);
                            setIsAddPartnerOpen(true);
                          }}
                          className="p-1 text-slate-500 hover:text-slate-800 rounded transition-colors"
                          title="Edit Partner"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteConfirmState({
                              isOpen: true,
                              type: 'partner',
                              id: partner.id,
                              name: partner.name,
                            })
                          }
                          className="p-1 text-rose-500 hover:text-rose-700 rounded transition-colors"
                          title="Delete Partner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: CHAIN-OF-CUSTODY MANIFESTS */}
        {activeTabSub === 'manifests' && (
          <div className="pt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="py-3 px-2">Manifest #</th>
                  <th className="py-3 px-2">Destination Recipient</th>
                  <th className="py-3 px-2">Dispatched Items</th>
                  <th className="py-3 px-2 text-right">Net Weight</th>
                  <th className="py-3 px-2">Carrier & Departure</th>
                  <th className="py-3 px-2">Custody Status</th>
                  <th className="py-3 px-2 text-right">Officer Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {dispatches.map(disp => (
                  <tr key={disp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-2 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {disp.manifestCode}
                    </td>
                    <td className="py-3 px-2">
                      <div className="font-semibold text-slate-900">{disp.destinationPartner}</div>
                      <div className="text-[10px] text-slate-400">{disp.destinationType}</div>
                    </td>
                    <td className="py-3 px-2 max-w-xs truncate text-slate-700">
                      {disp.dishSummary}
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {disp.totalKg} kg
                    </td>
                    <td className="py-3 px-2 whitespace-nowrap">
                      <div className="text-slate-800">{disp.transitCarrier}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Dep: {disp.dispatchTime} · Core: {disp.tempAtDispatch}°C
                      </div>
                    </td>
                    <td className="py-3 px-2 whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          disp.status === 'Received & Verified'
                            ? 'text-emerald-700 font-bold'
                            : disp.status === 'In-Transit'
                            ? 'text-sky-700 font-bold'
                            : 'text-amber-700'
                        }`}
                      >
                        {disp.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right whitespace-nowrap">
                      {disp.status === 'In-Transit' ? (
                        <button
                          onClick={() => updateDispatchStatus(disp.id, 'Received & Verified')}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-semibold rounded text-[11px] transition-colors"
                        >
                          Confirm Handover
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedManifest(disp)}
                          className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:underline"
                        >
                          View Slip
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODALS */}
      {/* 1. Transparent Matching Modal */}
      <SurplusMatchingModal
        isOpen={Boolean(matchingBatch)}
        batch={matchingBatch}
        onClose={() => setMatchingBatch(null)}
        onMatchApproved={() => {
          setMatchingBatch(null);
        }}
      />

      {/* 2. Create / Edit Surplus Modal */}
      <CreateSurplusModal
        isOpen={isCreateModalOpen}
        batchToEdit={batchToEdit}
        onClose={() => {
          setIsCreateModalOpen(false);
          setBatchToEdit(null);
        }}
      />

      {/* 3. View Surplus Modal */}
      <ViewSurplusModal
        isOpen={Boolean(viewingBatch)}
        batch={viewingBatch}
        onClose={() => setViewingBatch(null)}
        onOpenMatch={b => setMatchingBatch(b)}
        onOpenWorkflowAction={(b, step) =>
          setWorkflowActionState({
            isOpen: true,
            batch: b,
            targetStep: step,
          })
        }
        onOpenEdit={b => {
          setBatchToEdit(b);
          setIsCreateModalOpen(true);
        }}
      />

      {/* 4. Workflow Action Modal */}
      <WorkflowActionModal
        isOpen={workflowActionState.isOpen}
        batch={workflowActionState.batch}
        targetStep={workflowActionState.targetStep}
        onClose={() =>
          setWorkflowActionState({
            isOpen: false,
            batch: null,
            targetStep: 'schedule_pickup',
          })
        }
      />

      {/* 5. Add / Edit Recipient Partner Modal */}
      <AddRecipientModal
        isOpen={isAddPartnerOpen}
        partnerToEdit={partnerToEdit}
        onClose={() => {
          setIsAddPartnerOpen(false);
          setPartnerToEdit(null);
        }}
      />

      {/* 6. View Recipient Modal */}
      <ViewRecipientModal
        isOpen={Boolean(viewingPartner)}
        partner={viewingPartner}
        surplusBatches={surplusBatches}
        onClose={() => setViewingPartner(null)}
        onEdit={p => {
          setPartnerToEdit(p);
          setIsAddPartnerOpen(true);
        }}
        onDelete={(id, name) =>
          setDeleteConfirmState({
            isOpen: true,
            type: 'partner',
            id,
            name,
          })
        }
      />

      {/* 7. Identify Surplus Modal */}
      <IdentifySurplusModal
        isOpen={isIdentifyModalOpen}
        onClose={() => setIsIdentifyModalOpen(false)}
        onStageCandidate={candidate => {
          createSurplusBatch({
            foodName: candidate.foodName,
            dishName: candidate.foodName,
            category: candidate.category,
            quantity: candidate.quantity,
            unit: candidate.unit,
            weightKg: candidate.quantity,
            portions: Math.round(candidate.quantity * 3.5),
            storageConditions: candidate.storageConditions as any,
            collectionDeadline: candidate.collectionDeadline,
            location: candidate.location,
            source: candidate.source,
            sourceRefId: candidate.sourceRefId,
            qualityReviewStatus: 'Passed HACCP Inspection',
            status: 'Available',
            notes: candidate.notes,
          });
        }}
      />

      {/* 8. Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteConfirmState.isOpen}
        title={deleteConfirmState.type === 'batch' ? 'Delete Surplus Batch Listing' : 'Remove Recipient Partner'}
        message={
          deleteConfirmState.type === 'batch'
            ? 'Are you sure you want to delete this surplus batch listing? This action cannot be undone.'
            : 'Are you sure you want to remove this partner from the internal directory? Active allocations will be unassigned.'
        }
        itemName={deleteConfirmState.name}
        confirmButtonText={deleteConfirmState.type === 'batch' ? 'Delete Listing' : 'Remove Partner'}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteConfirmState({ isOpen: false, type: 'batch', id: '', name: '' })}
      />

      {/* 9. Manifest Details Modal */}
      {selectedManifest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900 font-mono">
                  CHAIN-OF-CUSTODY MANIFEST {selectedManifest.manifestCode}
                </h4>
                <p className="text-xs text-slate-500">Internal Redistribution Logistical Audit</p>
              </div>
              <button
                onClick={() => setSelectedManifest(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Origin Facility:</span>
                  <span className="font-semibold text-slate-800">Kitchen Facility 1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Authorized Recipient:</span>
                  <span className="font-semibold text-slate-800">{selectedManifest.destinationPartner}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Net Weight Dispatched:</span>
                  <span className="font-mono font-bold text-emerald-800">{selectedManifest.totalKg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thermal Vehicle Carrier:</span>
                  <span className="text-slate-800">{selectedManifest.transitCarrier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Core Temp at Dispatch:</span>
                  <span className="font-mono text-slate-800">{selectedManifest.tempAtDispatch}°C (Safe &gt;60°C)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Authorizing Officer:</span>
                  <span className="text-slate-800">{selectedManifest.authorizedOfficer}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Certified compliant with Food Safety and Standards Authority Guidelines for surplus institutional redistribution and thermal chain preservation.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setSelectedManifest(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Close Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
