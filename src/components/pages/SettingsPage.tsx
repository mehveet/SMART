import React, { useState } from 'react';
import {
  Settings,
  Building,
  Sliders,
  Bell,
  Shield,
  Save,
  CheckCircle2,
  Lock,
  Cpu,
  Database,
  Cloud,
  Check,
  RefreshCw,
  LogIn,
  KeyRound,
  FileCode,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SettingsPage: React.FC = () => {
  const {
    currentUser,
    userProfile,
    isFirebaseConnected,
    isSeedingDatabase,
    seedDatabase,
    signInWithGoogle,
  } = useApp();

  const [facilityName, setFacilityName] = useState('Kitchen Facility 1');
  const [capacity, setCapacity] = useState('5000');
  const [safetyBuffer, setSafetyBuffer] = useState('2.5');
  const [chillerThreshold, setChillerThreshold] = useState('4.0');
  const [hotHoldThreshold, setHotHoldThreshold] = useState('65.0');
  const [cutoffMins, setCutoffMins] = useState('45');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {savedSuccess && (
        <div className="bg-emerald-800 text-white text-xs px-4 py-3 rounded-xl shadow-lg flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>Settings saved successfully.</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Facility Information */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              Facility Profile
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Facility Name</label>
              <input
                type="text"
                value={facilityName}
                onChange={e => setFacilityName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Daily Capacity (Meals/Day)</label>
              <input
                type="number"
                value={capacity}
                onChange={e => setCapacity(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* AI Demand Forecasting Parameters */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              Demand Calibration
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 text-xs">
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="font-semibold text-slate-700">Safety Buffer</label>
                <span className="font-mono font-bold text-emerald-800">+{safetyBuffer}%</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.5"
                value={safetyBuffer}
                onChange={e => setSafetyBuffer(e.target.value)}
                className="w-full accent-emerald-600"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="font-semibold text-slate-700">Service Cook Cut-Off</label>
                <span className="font-mono font-bold text-emerald-800">{cutoffMins} min before close</span>
              </div>
              <input
                type="range"
                min="30"
                max="60"
                step="5"
                value={cutoffMins}
                onChange={e => setCutoffMins(e.target.value)}
                className="w-full accent-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* HACCP & IoT Safety Thresholds */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Shield className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              Temperature Thresholds
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Chiller Alarm Ceiling (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={chillerThreshold}
                onChange={e => setChillerThreshold(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Hot Holding Minimum Core Temp (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={hotHoldThreshold}
                onChange={e => setHotHoldThreshold(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Cloud Persistence & Benchmark Sync */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                Database &amp; Data Sync
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{currentUser ? 'Cloud Synced' : 'Ready'}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <div className="font-semibold text-slate-900">Demo Data Reset</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Restore sample inventory, waste logs, and surplus dispatches.
              </p>
            </div>
            <button
              type="button"
              onClick={() => seedDatabase(true)}
              disabled={isSeedingDatabase}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors flex-shrink-0 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSeedingDatabase ? 'animate-spin' : ''}`} />
              <span>{isSeedingDatabase ? 'Resetting...' : 'Reset Sample Data'}</span>
            </button>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
