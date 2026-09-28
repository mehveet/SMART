import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Thermometer,
  Droplets,
  X,
  Radio,
  Sliders,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ManualSensorReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSensorId?: string;
}

export const ManualSensorReadingModal: React.FC<ManualSensorReadingModalProps> = ({
  isOpen,
  onClose,
  defaultSensorId,
}) => {
  const { sensors, submitManualSensorReading } = useApp();

  const [sensorId, setSensorId] = useState(defaultSensorId || sensors[0]?.id || 'sensor-01');
  const [readingValue, setReadingValue] = useState<string>('');
  const [calibratedBy, setCalibratedBy] = useState('HACCP Kitchen Technician');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const selectedSensor = sensors.find(s => s.id === sensorId) || sensors[0];

  const numVal = parseFloat(readingValue);
  const isValueValid = !isNaN(numVal);
  const isOutOfSafe =
    isValueValid && selectedSensor && (numVal < selectedSensor.minSafe || numVal > selectedSensor.maxSafe);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValueValid || !selectedSensor) return;

    setIsSubmitting(true);
    submitManualSensorReading({
      sensorId,
      value: numVal,
      calibratedBy: calibratedBy.trim(),
      notes: notes.trim() || undefined,
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-['Plus_Jakarta_Sans']">Manual Sensor Reading Entry</h2>
              <p className="text-xs text-slate-500">
                Log calibrated physical probe measurement or verified test reading
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

        {/* Notice */}
        <div className="border-b border-cyan-100 bg-cyan-50/60 px-6 py-2.5 text-xs text-cyan-800 flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0 text-cyan-600" />
          <span>
            Manual readings update live device telemetry and are verified against safe food handling thresholds.
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Select IoT Sensor / Monitoring Node
            </label>
            <select
              value={sensorId}
              onChange={e => {
                setSensorId(e.target.value);
                setReadingValue('');
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              {sensors.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.location}) — Current: {s.currentValue}
                  {s.unit} [{s.status.toUpperCase()}]
                </option>
              ))}
            </select>
          </div>

          {selectedSensor && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Sensor Type:</span>
                <span className="font-semibold text-slate-700 capitalize">
                  {selectedSensor.type} Probe ({selectedSensor.unit})
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Target Operating Range:</span>
                <span className="font-mono text-emerald-700 font-semibold">{selectedSensor.targetRange}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Safe Compliance Range:</span>
                <span className="font-mono text-slate-700">
                  {selectedSensor.minSafe}
                  {selectedSensor.unit} to {selectedSensor.maxSafe}
                  {selectedSensor.unit}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Measured Value ({selectedSensor?.unit}) <span className="text-cyan-600">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                required
                value={readingValue}
                onChange={e => setReadingValue(e.target.value)}
                placeholder={selectedSensor ? `${selectedSensor.currentValue}` : '0.0'}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono text-lg"
              />
              <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">
                {selectedSensor?.unit}
              </span>
            </div>
          </div>

          {/* Warning if out of range */}
          {isOutOfSafe && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <strong className="text-rose-900 block">Out-of-Bounds Threshold Alert</strong>
                This reading ({numVal}
                {selectedSensor.unit}) violates safe storage compliance ({selectedSensor.minSafe} -{' '}
                {selectedSensor.maxSafe}
                {selectedSensor.unit}). Saving this reading will trigger immediate kitchen supervisor alerts and quarantine affected items.
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Calibrator / Technician Name
            </label>
            <input
              type="text"
              required
              value={calibratedBy}
              onChange={e => setCalibratedBy(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Calibration / Verification Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Verified with digital penetration thermometer (probe #S-14). Thermostat adjusted."
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValueValid}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Submit Sensor Reading</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
