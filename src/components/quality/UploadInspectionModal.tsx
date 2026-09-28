import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
  ShieldAlert,
  Loader2,
  FileText,
  Info,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { QualityInspectionRecord, QualityInspectionReviewStatus } from '../../types';

interface UploadInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInspectionCreated?: (record: QualityInspectionRecord) => void;
}

const PRESET_SAMPLES = [
  {
    name: 'Steamed Basmati Rice',
    category: 'Cooked Grains',
    location: 'Hot Holding Station 1',
    storageCondition: 'Hot Holding 65°C+',
    notes: 'Standard steam tray sample at lunch handover.',
    svgColor: '#e2e8f0',
    accentColor: '#cbd5e1',
    description: 'Clean uniform white grains, good steam luster, no discoloration.',
  },
  {
    name: 'Braised Vegetable Medley',
    category: 'Cooked Vegetable',
    location: 'Cook Chill Storage B',
    storageCondition: 'Chilled 2-4°C',
    notes: 'Broccoli, carrots, and peppers post blast-chilling.',
    svgColor: '#86efac',
    accentColor: '#22c55e',
    description: 'Vibrant green and orange pigment, light oil emulsion, crisp structure.',
  },
  {
    name: 'Roasted Salmon Fillets (Sample B)',
    category: 'Cooked Protein',
    location: 'Holding Station 3',
    storageCondition: 'Hot Holding 65°C+',
    notes: 'Slight browning observed at edge of pan.',
    svgColor: '#fca5a5',
    accentColor: '#f87171',
    description: 'Even roast coloration, white albumin protein droplets visible, no surface slime.',
  },
  {
    name: 'Diced Honeydew Melon',
    category: 'Raw Prepared Produce',
    location: 'Pantry Walk-in Chiller',
    storageCondition: 'Chilled 2-4°C',
    notes: 'Breakfast fruit bar remainder under investigation.',
    svgColor: '#fef08a',
    accentColor: '#eab308',
    description: 'Translucent edge softening, minor weeping liquid pooling at bottom of pan.',
  },
];

export const UploadInspectionModal: React.FC<UploadInspectionModalProps> = ({
  isOpen,
  onClose,
  onInspectionCreated,
}) => {
  const { addQualityInspection, surplusBatches } = useApp();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Cooked Main Meals');
  const [location, setLocation] = useState('Hot Holding Station 1');
  const [storageCondition, setStorageCondition] = useState('Hot Holding 65°C+');
  const [notes, setNotes] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [linkedSurplusId, setLinkedSurplusId] = useState('');
  const [inspectedBy, setInspectedBy] = useState('Culinary QA Officer');

  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle local file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAnalysisError('Please select a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    setImageFileName(file.name);
    setAnalysisError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageDataUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // Preset generator creates clean visual sample data URI
  const handleSelectPreset = (preset: (typeof PRESET_SAMPLES)[0]) => {
    setItemName(preset.name);
    setCategory(preset.category);
    setLocation(preset.location);
    setStorageCondition(preset.storageCondition);
    setNotes(preset.notes);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="600" height="400" fill="#0f172a"/>
      <rect x="20" y="20" width="560" height="360" rx="16" fill="#1e293b" stroke="#334155" stroke-width="2"/>
      <circle cx="300" cy="180" r="110" fill="${preset.svgColor}" opacity="0.85"/>
      <circle cx="300" cy="180" r="95" fill="none" stroke="${preset.accentColor}" stroke-width="4" stroke-dasharray="8 6"/>
      <text x="300" y="320" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" text-anchor="middle">${preset.name}</text>
      <text x="300" y="348" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="14" text-anchor="middle">${preset.storageCondition} • ${preset.location}</text>
    </svg>`;
    const dataUri = `data:image/svg+xml;base64,${btoa(svg)}`;
    setImageDataUrl(dataUri);
    setImageFileName(`${preset.name.toLowerCase().replace(/\s+/g, '_')}_specimen.svg`);
  };

  const handleRunInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageDataUrl) {
      setAnalysisError('Please provide or upload a food specimen image.');
      return;
    }
    if (!itemName.trim()) {
      setAnalysisError('Please enter the food item name.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/quality/inspect-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: imageDataUrl,
          itemName: itemName.trim(),
          category,
          storageCondition,
          location,
          notes: notes.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const result = await response.json();
      const detected = result.analysis;

      // Determine preliminary review status
      // As per policy: AI cannot certify safe, but can flag concerns or leave pending human review
      let initialStatus: QualityInspectionReviewStatus = 'Pending';
      if (
        detected.safetyClearance === 'Blocked / Unsafe' ||
        detected.visualDefectsDetected?.length > 0 ||
        detected.foreignObjectRisk === 'High'
      ) {
        initialStatus = 'Flagged';
      }

      const newRecord = addQualityInspection({
        itemName: itemName.trim(),
        category,
        batchCode: batchCode.trim() || undefined,
        linkedSurplusBatchId: linkedSurplusId || undefined,
        imageUrl: imageDataUrl,
        storageCondition,
        location,
        inspectedBy,
        reviewStatus: initialStatus,
        aiConfidence: detected.confidencePercent || 88,
        detectedObservations: {
          colorAnalysis: detected.colorAnalysis || 'Color characteristics consistent with normal prep.',
          textureAndMoisture: detected.textureAndMoisture || 'Normal moisture sheen observed.',
          foreignObjectRisk: detected.foreignObjectRisk || 'Low',
          spoilageRiskRating: detected.spoilageRiskRating || 'Low',
          thermalHoldingSuitability: detected.thermalHoldingSuitability || 'Acceptable within current parameters.',
          overallObservationSummary: detected.overallObservationSummary || 'Visual examination completed without obvious gross defects.',
          visualDefectsDetected: detected.visualDefectsDetected || [],
          suggestedAction: detected.suggestedAction || 'Proceed with mandatory physical core temperature probe verification.',
          safetyClearance: detected.safetyClearance || 'Manual Review Required',
        },
      });

      if (onInspectionCreated) {
        onInspectionCreated(newRecord);
      }

      onClose();
    } catch (err: any) {
      console.error('Inspection analysis error:', err);
      setAnalysisError(
        'AI Visual Inspection encountered an error contacting Gemini API. A fallback deterministic visual scan will be used if retried.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-['Plus_Jakarta_Sans']">Visual Quality Inspection</h2>
              <p className="text-xs text-slate-500">
                Optical scan for visible defects, discoloration, and foreign objects
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mandatory Safety Notice Banner */}
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-3">
          <div className="flex items-start gap-3 text-amber-900">
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-semibold text-amber-800 uppercase tracking-wider block">
                Food Safety Disclaimer & Human Review Policy
              </span>
              Visual inspection assists kitchen staff by detecting visible anomalies. It cannot certify food safety, verify core cooking temperatures, or detect microbial/chemical pathogens. Human review and standard testing remain mandatory prior to redistribution.
            </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleRunInspection} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {analysisError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{analysisError}</span>
            </div>
          )}

          {/* Quick Preset Specimens */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Quick Preset Kitchen Specimens
              </label>
              <span className="text-[11px] text-slate-500">Click to autofill sample</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_SAMPLES.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleSelectPreset(preset)}
                  className="group flex flex-col items-start rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-left transition-all hover:border-emerald-400 hover:bg-emerald-50/40"
                >
                  <span className="text-xs font-medium text-slate-700 group-hover:text-emerald-900 line-clamp-1">
                    {preset.name}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{preset.category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload / Capture Section */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Food Image / Photo Capture
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {imageDataUrl ? (
              <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-3 overflow-hidden flex flex-col sm:flex-row items-center gap-4">
                <div className="relative h-40 w-48 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white flex items-center justify-center">
                  <img
                    src={imageDataUrl}
                    alt="Food Specimen"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 text-left space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Specimen Image Loaded</span>
                  </div>
                  <p className="text-xs text-slate-700 font-mono break-all">{imageFileName || 'Uploaded Photo'}</p>
                  <p className="text-[11px] text-slate-500">
                    Image ready for visual inspection analysis.
                  </p>
                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                    >
                      Replace Image
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageDataUrl(null);
                        setImageFileName('');
                      }}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-100 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/20 transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 group-hover:scale-110 group-hover:border-emerald-300 group-hover:text-emerald-700 transition-all shadow-xs">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-700">
                  Upload food image or capture camera photo
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Supports JPEG, PNG, WebP (under 5MB). Optical examination of cooked dishes, raw cuts, and storage trays.
                </p>
                <button
                  type="button"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 shadow-xs group-hover:border-emerald-400 group-hover:text-emerald-800"
                >
                  <Camera className="h-3.5 w-3.5" />
                  Choose File or Photo
                </button>
              </div>
            )}
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Food Item Name <span className="text-emerald-600">*</span>
              </label>
              <input
                type="text"
                required
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                placeholder="e.g. Steamed Basmati Rice"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Food Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Cooked Main Meals">Cooked Main Meals</option>
                <option value="Cooked Grains">Cooked Grains / Rice / Pasta</option>
                <option value="Cooked Vegetable">Cooked Vegetables</option>
                <option value="Cooked Protein">Cooked Protein (Poultry/Fish/Meat)</option>
                <option value="Soups & Curries">Soups & Curries</option>
                <option value="Raw Prepared Produce">Raw Prepared Produce (Salad/Fruit)</option>
                <option value="Bakery & Bread">Bakery & Breads</option>
                <option value="Dairy & Chilled">Dairy & Chilled Items</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Kitchen / Storage Location
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Hot Holding Station 1, Walk-in Chiller"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Storage Conditions
              </label>
              <select
                value={storageCondition}
                onChange={e => setStorageCondition(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Hot Holding 65°C+">Hot Holding (65°C+ Bain-Marie)</option>
                <option value="Chilled 2-4°C">Chilled (2-4°C Walk-in Chiller)</option>
                <option value="Frozen -18°C">Frozen (-18°C Deep Freeze)</option>
                <option value="Ambient 18-22°C">Ambient (18-22°C Dry Pantry)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Batch Code / Production ID (Optional)
              </label>
              <input
                type="text"
                value={batchCode}
                onChange={e => setBatchCode(e.target.value)}
                placeholder="e.g. BATCH-20260924-01"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Link to Registered Surplus Batch (Optional)
              </label>
              <select
                value={linkedSurplusId}
                onChange={e => setLinkedSurplusId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">None (Independent Quality Scan)</option>
                {surplusBatches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.batchNumber} - {b.foodName} ({b.weightKg} kg, {b.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Context Notes & Visual Observations
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Inspected at 14:00 post lunchtime service. Pan covered with foil wrap. Looking for discoloration or moisture separation."
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <Info className="h-4 w-4 text-emerald-600" />
              Inspector: <strong className="text-slate-800">{inspectedBy}</strong>
            </span>
            <span className="text-slate-500">Quality Inspection Engine</span>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isAnalyzing}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRunInspection}
            disabled={isAnalyzing || !imageDataUrl || !itemName.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Running Quality Inspection...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Run Quality Inspection</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
