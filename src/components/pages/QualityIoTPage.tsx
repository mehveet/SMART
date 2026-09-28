import React, { useState, useMemo } from 'react';
import {
  Camera,
  Activity,
  Zap,
  Scale,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  Thermometer,
  Droplets,
  Plus,
  RefreshCw,
  Eye,
  ChevronRight,
  ExternalLink,
  Layers,
  Wrench,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Cpu,
  Radio,
  FileText,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  QualityInspectionRecord,
  QualityInspectionReviewStatus,
  IoTSensor,
  ProcessingEquipment,
  RawMaterialLossRecord,
} from '../../types';
import { UploadInspectionModal } from '../quality/UploadInspectionModal';
import { ReviewInspectionModal } from '../quality/ReviewInspectionModal';
import { ManualSensorReadingModal } from '../quality/ManualSensorReadingModal';
import { LogMaterialLossModal } from '../quality/LogMaterialLossModal';

type ActiveModuleTab = 'unified' | 'inspections' | 'sensors' | 'processing';

export const QualityIoTPage: React.FC = () => {
  const {
    qualityInspections,
    deleteQualityInspection,
    sensors,
    simulateSensorAnomaly,
    simulateSensorReadingUpdate,
    resetSensorsToNormal,
    processingEquipment,
    updateEquipmentStatus,
    rawMaterialLosses,
    efficiencySummary,
    surplusBatches,
    setActiveTab,
  } = useApp();

  // Navigation tab state
  const [activeModuleTab, setActiveModuleTab] = useState<ActiveModuleTab>('unified');

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [reviewModalInspection, setReviewModalInspection] = useState<QualityInspectionRecord | null>(null);
  const [isManualReadingModalOpen, setIsManualReadingModalOpen] = useState(false);
  const [manualReadingSensorId, setManualReadingSensorId] = useState<string | undefined>(undefined);
  const [isLogLossModalOpen, setIsLogLossModalOpen] = useState(false);

  // Filters & Search for Inspections
  const [inspectionSearch, setInspectionSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | QualityInspectionReviewStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Selected Sensor for Interactive Detail / Live Sparkline
  const [selectedSensorId, setSelectedSensorId] = useState<string>(sensors[0]?.id || 'sensor-01');
  const selectedSensor = sensors.find(s => s.id === selectedSensorId) || sensors[0];

  // Filtering Quality Inspections
  const filteredInspections = useMemo(() => {
    return qualityInspections.filter(item => {
      const matchesSearch =
        item.itemName.toLowerCase().includes(inspectionSearch.toLowerCase()) ||
        item.location.toLowerCase().includes(inspectionSearch.toLowerCase()) ||
        (item.batchCode && item.batchCode.toLowerCase().includes(inspectionSearch.toLowerCase())) ||
        item.detectedObservations.overallObservationSummary
          .toLowerCase()
          .includes(inspectionSearch.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || item.reviewStatus === statusFilter;
      const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [qualityInspections, inspectionSearch, statusFilter, categoryFilter]);

  // Inspection Counts
  const inspectionCounts = useMemo(() => {
    const total = qualityInspections.length;
    const pending = qualityInspections.filter(q => q.reviewStatus === 'Pending').length;
    const reviewed = qualityInspections.filter(q => q.reviewStatus === 'Reviewed').length;
    const flagged = qualityInspections.filter(q => q.reviewStatus === 'Flagged').length;
    const rejected = qualityInspections.filter(q => q.reviewStatus === 'Rejected').length;
    return { total, pending, reviewed, flagged, rejected };
  }, [qualityInspections]);

  // Sensor Alert Counts
  const sensorCounts = useMemo(() => {
    const critical = sensors.filter(s => s.status === 'critical').length;
    const warning = sensors.filter(s => s.status === 'warning').length;
    const optimal = sensors.filter(s => s.status === 'optimal').length;
    return { critical, warning, optimal, total: sensors.length };
  }, [sensors]);

  const renderReviewStatusBadge = (status: QualityInspectionReviewStatus) => {
    switch (status) {
      case 'Reviewed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Reviewed
          </span>
        );
      case 'Flagged':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            <AlertTriangle className="h-3 w-3 text-amber-600" />
            Flagged
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
            <XCircle className="h-3 w-3 text-rose-600" />
            Rejected
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
            <Clock className="h-3 w-3 text-blue-600" />
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-700" />
          <h2 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
            Quality & Cold Chain Monitoring
          </h2>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Visual Inspection</span>
          </button>
          <button
            onClick={() => {
              setManualReadingSensorId(undefined);
              setIsManualReadingModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shadow-xs"
          >
            <Sliders className="h-3.5 w-3.5 text-slate-500" />
            <span>Manual Probe Entry</span>
          </button>
          <button
            onClick={() => setIsLogLossModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shadow-xs"
          >
            <Scale className="h-3.5 w-3.5 text-slate-500" />
            <span>Log Material Loss</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/70 text-xs w-fit">
        <button
          onClick={() => setActiveModuleTab('unified')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
            activeModuleTab === 'unified'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Live Status
        </button>
        <button
          onClick={() => setActiveModuleTab('inspections')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
            activeModuleTab === 'inspections'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Visual Inspections {inspectionCounts.flagged > 0 && `(${inspectionCounts.flagged})`}
        </button>
        <button
          onClick={() => setActiveModuleTab('sensors')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
            activeModuleTab === 'sensors'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          IoT Sensors {sensorCounts.critical > 0 && `(${sensorCounts.critical} Alert)`}
        </button>
        <button
          onClick={() => setActiveModuleTab('processing')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
            activeModuleTab === 'processing'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Processing Yield
        </button>
      </div>

      {/* 2. Top KPI Operational Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Visual Inspections */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Visual Quality Scans</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
              <Camera className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-['Plus_Jakarta_Sans']">{inspectionCounts.total}</span>
            <span className="text-xs text-slate-500">scans</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] border-t border-slate-100 pt-2">
            <span className="text-amber-700 font-medium">
              {inspectionCounts.flagged} Flagged · {inspectionCounts.pending} Pending
            </span>
            <span className="text-emerald-700 font-medium">{inspectionCounts.reviewed} Cleared</span>
          </div>
        </div>

        {/* Card 2: IoT Sensors & Thermal Mesh */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Cold Chain Sensors</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-800">
              <Thermometer className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              {sensorCounts.optimal} / {sensorCounts.total}
            </span>
            <span className="text-xs text-slate-500">optimal</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] border-t border-slate-100 pt-2">
            {sensorCounts.critical > 0 ? (
              <span className="text-rose-600 font-semibold">
                {sensorCounts.critical} Alert
              </span>
            ) : (
              <span className="text-emerald-700 font-medium">All Compliant</span>
            )}
            <span className="text-slate-400 font-mono text-[10px]">Mesh Active</span>
          </div>
        </div>

        {/* Card 3: Processing OEE Score */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Line Efficiency (OEE)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-800">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              {efficiencySummary.overallOeePercent}%
            </span>
            <span className="text-xs text-emerald-700 font-medium">
              {efficiencySummary.efficiencyTrend}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] border-t border-slate-100 pt-2">
            <span className="text-slate-500">
              Downtime: {efficiencySummary.activeMachineDowntimeMinutes}m
            </span>
            <span className="text-slate-600 font-mono text-[10px]">
              {efficiencySummary.dailyEnergyConsumptionKwh} kWh
            </span>
          </div>
        </div>

        {/* Card 4: Raw Material Loss */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Prep Yield Loss</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              {efficiencySummary.totalRawMaterialLossKg} kg
            </span>
            <span className="text-xs text-amber-700 font-mono">
              ({efficiencySummary.averageLossPercentage}%)
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] border-t border-slate-100 pt-2">
            <span className="text-slate-500">
              {rawMaterialLosses.length} records
            </span>
            <span className="text-emerald-700 font-medium">Within Target</span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: UNIFIED LIVE DECK                             */}
      {/* ---------------------------------------------------- */}
      {activeModuleTab === 'unified' && (
        <div className="space-y-6">
          {/* Active Operational Alerts Strip */}
          {efficiencySummary.operationalAlerts.length > 0 && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs uppercase tracking-wider">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <span>Real-Time Kitchen Operational Alerts</span>
                </div>
                <span className="text-[11px] text-rose-700 font-medium">Action Required</span>
              </div>
              <div className="space-y-1.5">
                {efficiencySummary.operationalAlerts.map((alert, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-rose-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                    <span>{alert}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unified Split Grid: Visual Inspections + Live Probes + Equipment Lines */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Recent Visual Inspections */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Camera className="h-4 w-4 text-emerald-600" />
                    <span>Recent Visual Inspections</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Defect and surface condition quality records
                  </p>
                </div>
                <button
                  onClick={() => setActiveModuleTab('inspections')}
                  className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-medium"
                >
                  <span>View All ({qualityInspections.length})</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {qualityInspections.slice(0, 4).map(item => (
                  <div
                    key={item.id}
                    className="group rounded-2xl border border-slate-200/90 bg-white p-3.5 transition-all hover:border-slate-300 hover:shadow-sm shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                          <img
                            src={item.imageUrl}
                            alt={item.itemName}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-400">
                              {item.batchCode || item.id}
                            </span>
                            {renderReviewStatusBadge(item.reviewStatus)}
                          </div>
                          <h4 className="text-sm font-semibold text-slate-900 truncate mt-0.5">
                            {item.itemName}
                          </h4>
                          <span className="text-[11px] text-slate-500 block truncate">
                            {item.location}
                          </span>
                        </div>
                      </div>

                      <p className="mt-2.5 text-xs text-slate-600 line-clamp-2 italic">
                        "{item.detectedObservations.overallObservationSummary}"
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px]">
                      <span className="text-slate-400">{item.inspectionTimestamp}</span>
                      <button
                        onClick={() => setReviewModalInspection(item)}
                        className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold"
                      >
                        <span>Audit / Review</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Prompt to Upload */}
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-center">
                <p className="text-xs text-slate-500">
                  Perform visual QA before buffets, meal redistributions, or post-shift cooling.
                </p>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="mt-2 inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
                >
                  <Camera className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Upload or Capture Food Specimen</span>
                </button>
              </div>
            </div>

            {/* Right 1 Col: IoT Probes & Simulator Quick Panel */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Radio className="h-4 w-4 text-cyan-600" />
                    <span>Sensor Network</span>
                  </h3>
                  <p className="text-xs text-slate-500">Live storage & holding temperatures</p>
                </div>
                <button
                  onClick={() => setActiveModuleTab('sensors')}
                  className="inline-flex items-center gap-1 text-xs text-cyan-700 hover:text-cyan-800 font-medium"
                >
                  <span>Simulator</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {sensors.map(s => {
                  const isCrit = s.status === 'critical';
                  const isWarn = s.status === 'warning';
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedSensorId(s.id);
                        setActiveModuleTab('sensors');
                      }}
                      className={`cursor-pointer rounded-xl border p-3 transition-all ${
                        isCrit
                          ? 'border-rose-300 bg-rose-50/70 hover:bg-rose-50'
                          : isWarn
                          ? 'border-amber-300 bg-amber-50/70 hover:bg-amber-50'
                          : 'border-slate-200/90 bg-white hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800 truncate">
                          {s.name}
                        </span>
                        <span
                          className={`font-mono text-sm font-bold ${
                            isCrit ? 'text-rose-600' : isWarn ? 'text-amber-600' : 'text-emerald-700'
                          }`}
                        >
                          {s.currentValue}
                          {s.unit}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{s.location}</span>
                        <span className="font-mono text-[10px] text-slate-400">
                          Target: {s.targetRange}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Anomaly Testing Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <span>Hardware Simulator</span>
                  <span className="text-[10px] text-cyan-700 font-mono font-medium">SIMULATION</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Trigger kitchen anomalies to verify automatic alerts and redistribution quarantines.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => simulateSensorAnomaly('sensor-01', 'door_ajar')}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left text-[11px] font-medium text-amber-800 hover:bg-amber-50 hover:border-amber-300 transition-colors"
                  >
                    Chiller Door Ajar
                  </button>
                  <button
                    onClick={() => simulateSensorAnomaly('sensor-04', 'heat_loss')}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left text-[11px] font-medium text-rose-800 hover:bg-rose-50 hover:border-rose-300 transition-colors"
                  >
                    Holding Heat Loss
                  </button>
                </div>
                <button
                  onClick={resetSensorsToNormal}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                >
                  <RotateCcw className="h-3 w-3 text-slate-500" />
                  <span>Restore Safe Baseline</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Summary: Processing Equipment Line Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-purple-600" />
                  <span>Equipment & Production Line Operational Health</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time machine uptime, electrical load, and scheduled servicing
                </p>
              </div>
              <button
                onClick={() => setActiveModuleTab('processing')}
                className="inline-flex items-center gap-1 text-xs text-purple-700 hover:text-purple-800 font-medium"
              >
                <span>Processing Yield Studio</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {processingEquipment.map(eq => (
                <div
                  key={eq.id}
                  className="rounded-xl border border-slate-200 bg-white p-3.5 flex flex-col justify-between space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{eq.name}</h4>
                      <span className="text-xs text-slate-500">{eq.line}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        eq.status === 'Running'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : eq.status === 'Idle'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : eq.status === 'Maintenance'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {eq.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-2 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Load</span>
                      <span className="font-mono text-slate-800 font-medium">{eq.powerDrawKw} kW</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">OEE</span>
                      <span className="font-mono text-emerald-700 font-semibold">{eq.efficiencyScore}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Downtime</span>
                      <span className="font-mono text-slate-700">{eq.downtimeMinutesToday}m</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: VISUAL QUALITY INSPECTIONS                   */}
      {/* ---------------------------------------------------- */}
      {activeModuleTab === 'inspections' && (
        <div className="space-y-6">
          {/* Controls Bar: Search, Filters, Add Button */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={inspectionSearch}
                  onChange={e => setInspectionSearch(e.target.value)}
                  placeholder="Search by food name, location, batch..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
              >
                <option value="ALL">All Statuses ({inspectionCounts.total})</option>
                <option value="Pending">Pending Review ({inspectionCounts.pending})</option>
                <option value="Reviewed">Reviewed / Cleared ({inspectionCounts.reviewed})</option>
                <option value="Flagged">Flagged for Testing ({inspectionCounts.flagged})</option>
                <option value="Rejected">Rejected / Discarded ({inspectionCounts.rejected})</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="Cooked Main Meals">Cooked Main Meals</option>
                <option value="Cooked Grains">Cooked Grains</option>
                <option value="Cooked Vegetable">Cooked Vegetables</option>
                <option value="Cooked Protein">Cooked Protein</option>
                <option value="Raw Prepared Produce">Raw Prepared Produce</option>
              </select>
            </div>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 transition-all shrink-0"
            >
              <Camera className="h-4 w-4" />
              <span>New Visual Inspection</span>
            </button>
          </div>

          {/* Inspections Grid / Cards */}
          {filteredInspections.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
              <Camera className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-3 text-base font-semibold text-slate-800">No Visual Inspections Found</h3>
              <p className="mt-1 text-xs text-slate-500">
                Try adjusting your search query or filter, or upload a new food photograph.
              </p>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white border border-slate-300 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-slate-50 shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Upload New Image
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredInspections.map(inspection => {
                const isFlaggedOrRejected =
                  inspection.reviewStatus === 'Flagged' || inspection.reviewStatus === 'Rejected';

                return (
                  <div
                    key={inspection.id}
                    className={`rounded-2xl border bg-white p-4 transition-all flex flex-col justify-between shadow-xs ${
                      isFlaggedOrRejected
                        ? 'border-rose-300 bg-rose-50/20'
                        : 'border-slate-200/90 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">
                            {inspection.batchCode || inspection.id}
                          </span>
                          <span className="text-xs text-slate-300">•</span>
                          <span className="text-xs text-slate-500 truncate">{inspection.category}</span>
                        </div>
                        {renderReviewStatusBadge(inspection.reviewStatus)}
                      </div>

                      {/* Image & Main Info */}
                      <div className="flex items-start gap-4">
                        <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center">
                          <img
                            src={inspection.imageUrl}
                            alt={inspection.itemName}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <h4 className="text-base font-bold text-slate-900 truncate">
                            {inspection.itemName}
                          </h4>
                          <p className="text-xs text-slate-500">
                            Location: <span className="text-slate-700 font-medium">{inspection.location}</span>
                          </p>
                          <p className="text-xs text-slate-500">
                            Storage: <span className="text-slate-700 font-medium">{inspection.storageCondition}</span>
                          </p>
                          <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-400">
                            <Clock className="h-3 w-3" />
                            <span>{inspection.inspectionTimestamp}</span>
                          </div>
                        </div>
                      </div>

                      {/* Detected Observations Quote */}
                      <div className="mt-3.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                          <span>Visual Observations:</span>
                          <span className="text-emerald-700 font-mono font-medium">
                            Confidence {inspection.aiConfidence}%
                          </span>
                        </div>
                        <p className="text-slate-700 italic">
                          "{inspection.detectedObservations.overallObservationSummary}"
                        </p>

                        {/* Visual Defects Tag */}
                        {inspection.detectedObservations.visualDefectsDetected?.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1 pt-1">
                            {inspection.detectedObservations.visualDefectsDetected.map((defect, i) => (
                              <span
                                key={i}
                                className="rounded bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 text-[10px] font-medium"
                              >
                                ⚠ {defect}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Reviewer Note / Decision Strip */}
                      {inspection.reviewerNotes && (
                        <div className="mt-2.5 rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 text-xs">
                          <span className="font-semibold text-slate-700 block text-[11px]">
                            Reviewer Action ({inspection.reviewedBy || 'Lead Auditor'}):
                          </span>
                          <p className="text-slate-600 mt-0.5 text-xs">{inspection.reviewerNotes}</p>
                        </div>
                      )}

                      {/* Linked Surplus Batch Badge */}
                      {inspection.linkedSurplusBatchId && (
                        <div className="mt-2.5 flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs text-emerald-800">
                          <span>Linked to Surplus Batch #{inspection.linkedSurplusBatchId}</span>
                          <button
                            onClick={() => setActiveTab('surplus')}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline"
                          >
                            <span>Open in Surplus</span>
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Card Footer Actions */}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <button
                        onClick={() => deleteQualityInspection(inspection.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors"
                        title="Delete Inspection"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => setReviewModalInspection(inspection)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Sign / Review Decision</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 3: SENSOR TELEMETRY & HARDWARE SIMULATOR        */}
      {/* ---------------------------------------------------- */}
      {activeModuleTab === 'sensors' && (
        <div className="space-y-6">
          {/* Hardware simulator notification banner */}
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-3">
                <Radio className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                <div className="text-xs text-cyan-900">
                  <span className="font-semibold text-cyan-950 uppercase tracking-wider block">
                    Sensor Telemetry Simulation
                  </span>
                  Data displayed in this module simulates kitchen cold chain and holding nodes. You can trigger simulated temperature spikes, door ajar alerts, and log manual probe calibrations below.
                </div>
              </div>

              <button
                onClick={resetSensorsToNormal}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-cyan-300 px-3 py-1.5 text-xs font-semibold text-cyan-800 hover:bg-cyan-50 shrink-0 shadow-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset All to Baseline</span>
              </button>
            </div>
          </div>

          {/* Interactive Anomaly Trigger Deck */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-cyan-600" />
                  <span>Preset Failure Modes & Sensor Anomaly Simulator</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Test alert dispatching and quarantine triggers under adverse conditions
                </p>
              </div>
              <button
                onClick={() => {
                  setManualReadingSensorId(selectedSensor.id);
                  setIsManualReadingModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-cyan-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Log Manual Probe Entry</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Preset 1 */}
              <button
                onClick={() => simulateSensorAnomaly('sensor-01', 'door_ajar')}
                className="flex flex-col items-start rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-left transition-all hover:border-amber-400 hover:bg-amber-50/40"
              >
                <span className="text-xs font-semibold text-amber-800">Walk-in Chiller Door Ajar</span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Temp warms to 8.8°C (above 4°C safe limit)
                </span>
                <span className="mt-2 text-[10px] font-mono font-medium text-amber-700">Simulate Warning</span>
              </button>

              {/* Preset 2 */}
              <button
                onClick={() => simulateSensorAnomaly('sensor-04', 'heat_loss')}
                className="flex flex-col items-start rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-left transition-all hover:border-rose-400 hover:bg-rose-50/40"
              >
                <span className="text-xs font-semibold text-rose-800">Holding Heat Loss</span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Hot holding drops to 52.5°C (bacterial danger zone)
                </span>
                <span className="mt-2 text-[10px] font-mono font-medium text-rose-700">Simulate Critical</span>
              </button>

              {/* Preset 3 */}
              <button
                onClick={() => simulateSensorAnomaly('sensor-03', 'high_humidity')}
                className="flex flex-col items-start rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-left transition-all hover:border-purple-400 hover:bg-purple-50/40"
              >
                <span className="text-xs font-semibold text-purple-800">Dry Pantry Humidity Surge</span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Humidity rises to 82% (mold risk elevated)
                </span>
                <span className="mt-2 text-[10px] font-mono font-medium text-purple-700">Simulate High RH</span>
              </button>

              {/* Preset 4 */}
              <button
                onClick={() => simulateSensorAnomaly('sensor-02', 'power_trip')}
                className="flex flex-col items-start rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-left transition-all hover:border-cyan-400 hover:bg-cyan-50/40"
              >
                <span className="text-xs font-semibold text-cyan-800">Deep Freeze Breaker Trip</span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Freezer warms to -8.0°C (thermal loss)
                </span>
                <span className="mt-2 text-[10px] font-mono font-medium text-cyan-700">Simulate Thermal Deficit</span>
              </button>
            </div>
          </div>

          {/* Sensor List & Detail Sparkline Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Sensor List */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900">Installed Probe Nodes</h4>
              <div className="space-y-2.5">
                {sensors.map(sensor => {
                  const isSelected = sensor.id === selectedSensor.id;
                  const isCrit = sensor.status === 'critical';
                  const isWarn = sensor.status === 'warning';

                  return (
                    <div
                      key={sensor.id}
                      onClick={() => setSelectedSensorId(sensor.id)}
                      className={`cursor-pointer rounded-2xl border p-4 transition-all shadow-xs ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-50/60 ring-1 ring-cyan-500'
                          : isCrit
                          ? 'border-rose-300 bg-rose-50/70 hover:bg-rose-50'
                          : isWarn
                          ? 'border-amber-300 bg-amber-50/70 hover:bg-amber-50'
                          : 'border-slate-200/90 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900">{sensor.name}</span>
                        <span
                          className={`font-mono text-base font-bold ${
                            isCrit ? 'text-rose-600' : isWarn ? 'text-amber-600' : 'text-emerald-700'
                          }`}
                        >
                          {sensor.currentValue}
                          {sensor.unit}
                        </span>
                      </div>

                      <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
                        <span>{sensor.location}</span>
                        <span className="text-[11px] font-mono text-slate-400">
                          Target: {sensor.targetRange}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] border-t border-slate-100 pt-2">
                        <span className="text-slate-400">{sensor.lastPing}</span>
                        <span
                          className={`uppercase font-bold text-[10px] px-2 py-0.5 rounded ${
                            isCrit
                              ? 'bg-rose-100 text-rose-800'
                              : isWarn
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {sensor.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Selected Sensor Detailed Telemetry & Trend */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 space-y-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{selectedSensor.name}</h3>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-mono">
                        {selectedSensor.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Monitored Location: <strong className="text-slate-700">{selectedSensor.location}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-2xl font-bold font-mono text-emerald-700">
                        {selectedSensor.currentValue}
                        {selectedSensor.unit}
                      </span>
                      <span className="block text-[11px] text-slate-400">Current Reading</span>
                    </div>
                  </div>
                </div>

                {/* Safe Threshold Bands */}
                <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 border border-slate-200 p-3 text-center text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Min Safe Limit</span>
                    <span className="font-mono font-bold text-slate-700">
                      {selectedSensor.minSafe}
                      {selectedSensor.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Target Optimal</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {selectedSensor.targetRange}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Max Safe Limit</span>
                    <span className="font-mono font-bold text-slate-700">
                      {selectedSensor.maxSafe}
                      {selectedSensor.unit}
                    </span>
                  </div>
                </div>

                {/* Historical Sparkline Chart */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Historical Trend Readings (Last 24 Hours)
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Safe Band: {selectedSensor.minSafe} to {selectedSensor.maxSafe}
                      {selectedSensor.unit}
                    </span>
                  </div>

                  {/* SVG Line / Bar Chart */}
                  <div className="relative h-44 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 flex flex-col justify-end">
                    <div className="flex h-32 items-end justify-between gap-1">
                      {selectedSensor.history.map((pt, idx) => {
                        const min = selectedSensor.minSafe - 4;
                        const max = selectedSensor.maxSafe + 4;
                        const range = max - min || 10;
                        const heightPct = Math.min(100, Math.max(10, ((pt.value - min) / range) * 100));
                        const isOutOfRange =
                          pt.value < selectedSensor.minSafe || pt.value > selectedSensor.maxSafe;

                        return (
                          <div
                            key={idx}
                            className="group relative flex flex-1 flex-col items-center h-full justify-end"
                          >
                            {/* Hover tooltip */}
                            <div className="absolute -top-7 z-10 hidden rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-mono text-white shadow group-hover:block whitespace-nowrap">
                              {pt.time}: {pt.value}
                              {selectedSensor.unit}
                            </div>

                            <div
                              style={{ height: `${heightPct}%` }}
                              className={`w-full max-w-[18px] rounded-t transition-all ${
                                isOutOfRange
                                  ? 'bg-rose-500 hover:bg-rose-600'
                                  : 'bg-cyan-600 hover:bg-cyan-700'
                              }`}
                            />
                            <span className="mt-1 text-[9px] text-slate-400 truncate w-full text-center">
                              {pt.time}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Manual Slider Adjuster for Live Simulation */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">
                      Live Telemetry Value Stepper (Interactive Simulation)
                    </span>
                    <span className="font-mono text-cyan-700 font-bold">
                      {selectedSensor.currentValue}
                      {selectedSensor.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={selectedSensor.minSafe - 6}
                    max={selectedSensor.maxSafe + 10}
                    step="0.2"
                    value={selectedSensor.currentValue}
                    onChange={e =>
                      simulateSensorReadingUpdate(
                        selectedSensor.id,
                        parseFloat(e.target.value),
                        `Adjusted ${selectedSensor.name} telemetry to ${e.target.value}${selectedSensor.unit}`
                      )
                    }
                    className="w-full accent-cyan-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Low ({(selectedSensor.minSafe - 6).toFixed(1)})</span>
                    <span>Safe Target ({selectedSensor.targetRange})</span>
                    <span>High ({(selectedSensor.maxSafe + 10).toFixed(1)})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 4: PROCESSING EFFICIENCY & EQUIPMENT            */}
      {/* ---------------------------------------------------- */}
      {activeModuleTab === 'processing' && (
        <div className="space-y-6">
          {/* Action Row */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 font-['Plus_Jakarta_Sans']">Kitchen Processing Yield</h3>
              <p className="text-xs text-slate-500">
                Track peeling loss, trimming scraps, machine uptime, and energy demand
              </p>
            </div>
            <button
              onClick={() => setIsLogLossModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-amber-700 transition-all"
            >
              <Scale className="h-4 w-4" />
              <span>Log Raw Material Loss</span>
            </button>
          </div>

          {/* Machine Line Status Table */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 space-y-4 shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-purple-600" />
              <span>Processing Equipment & Production Lines</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                    <th className="pb-3 font-semibold">Equipment / Asset</th>
                    <th className="pb-3 font-semibold">Line</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Power Draw</th>
                    <th className="pb-3 font-semibold text-right">Today Energy</th>
                    <th className="pb-3 font-semibold text-right">Downtime</th>
                    <th className="pb-3 font-semibold text-right">OEE Score</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {processingEquipment.map(eq => (
                    <tr key={eq.id} className="hover:bg-slate-50/70">
                      <td className="py-3 font-medium text-slate-900">{eq.name}</td>
                      <td className="py-3 text-slate-500">{eq.line}</td>
                      <td className="py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            eq.status === 'Running'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : eq.status === 'Idle'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : eq.status === 'Maintenance'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {eq.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono text-slate-800">{eq.powerDrawKw} kW</td>
                      <td className="py-3 text-right font-mono text-slate-700">{eq.energyTodayKwh} kWh</td>
                      <td className="py-3 text-right font-mono text-slate-700">
                        {eq.downtimeMinutesToday} min
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-emerald-700">
                        {eq.efficiencyScore}%
                      </td>
                      <td className="py-3 text-right">
                        <select
                          value={eq.status}
                          onChange={e =>
                            updateEquipmentStatus(eq.id, {
                              status: e.target.value as any,
                            })
                          }
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="Running">Running</option>
                          <option value="Idle">Idle</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Fault">Fault</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Raw Material Loss Logs */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Scale className="h-4 w-4 text-amber-600" />
                  <span>Raw Material Scrap & Prep Trimming Yield Log</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Logged ingredients, production steps, peeling peel loss, and variance against 10% standard
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Total Tracked Loss: <strong className="text-slate-800">{efficiencySummary.totalRawMaterialLossKg} kg</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                    <th className="pb-3 font-semibold">Timestamp</th>
                    <th className="pb-3 font-semibold">Ingredient</th>
                    <th className="pb-3 font-semibold">Production Line</th>
                    <th className="pb-3 font-semibold">Step</th>
                    <th className="pb-3 font-semibold text-right">Input Weight</th>
                    <th className="pb-3 font-semibold text-right">Loss (kg)</th>
                    <th className="pb-3 font-semibold text-right">Yield Loss %</th>
                    <th className="pb-3 font-semibold">Logged By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {rawMaterialLosses.map(loss => (
                    <tr key={loss.id} className="hover:bg-slate-50/70">
                      <td className="py-3 text-slate-400 font-mono text-[11px]">{loss.timestamp}</td>
                      <td className="py-3 font-semibold text-slate-900">{loss.ingredient}</td>
                      <td className="py-3 text-slate-600">{loss.productionLine}</td>
                      <td className="py-3">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
                          {loss.processStep}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono text-slate-700">{loss.inputWeightKg.toFixed(1)} kg</td>
                      <td className="py-3 text-right font-mono font-bold text-amber-700">
                        {loss.lossKg.toFixed(1)} kg
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                            loss.lossPercentage > 12
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : loss.lossPercentage > 8
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {loss.lossPercentage}%
                        </span>
                      </td>
                      <td className="py-3 text-slate-500 text-[11px]">{loss.loggedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODALS                                               */}
      {/* ---------------------------------------------------- */}
      <UploadInspectionModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onInspectionCreated={record => {
          setReviewModalInspection(record);
        }}
      />

      <ReviewInspectionModal
        isOpen={Boolean(reviewModalInspection)}
        inspection={reviewModalInspection}
        onClose={() => setReviewModalInspection(null)}
      />

      <ManualSensorReadingModal
        isOpen={isManualReadingModalOpen}
        defaultSensorId={manualReadingSensorId}
        onClose={() => setIsManualReadingModalOpen(false)}
      />

      <LogMaterialLossModal
        isOpen={isLogLossModalOpen}
        onClose={() => setIsLogLossModalOpen(false)}
      />
    </div>
  );
};
