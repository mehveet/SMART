import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { OverviewPage } from './components/pages/OverviewPage';
import { DemandForecastingPage } from './components/pages/DemandForecastingPage';
import { InventoryPage } from './components/pages/InventoryPage';
import { WasteTrackingPage } from './components/pages/WasteTrackingPage';
import { SurplusRedistributionPage } from './components/pages/SurplusRedistributionPage';
import { QualityIoTPage } from './components/pages/QualityIoTPage';
import { SustainabilityPage } from './components/pages/SustainabilityPage';
import { SettingsPage } from './components/pages/SettingsPage';
import { LogWasteModal } from './components/modals/LogWasteModal';
import { RegisterSurplusModal } from './components/modals/RegisterSurplusModal';
import { DispatchManifestModal } from './components/modals/DispatchManifestModal';
import { AddInventoryModal } from './components/modals/AddInventoryModal';
import { FoodWiseChatbot } from './components/chat/FoodWiseChatbot';

const AppContent: React.FC = () => {
  const { activeTab, sidebarCollapsed } = useApp();

  const [isLogWasteOpen, setIsLogWasteOpen] = useState(false);
  const [isSurplusOpen, setIsSurplusOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [dispatchModalState, setDispatchModalState] = useState<{
    isOpen: boolean;
    batchId?: string;
    partnerId?: string;
  }>({ isOpen: false });

  // Listen for Google Maps Platform quota exhaustion
  useEffect(() => {
    const handleQuotaExceeded = () => {
      setQuotaExceeded(true);
    };
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewPage
            onOpenLogWasteModal={() => setIsLogWasteOpen(true)}
            onOpenSurplusModal={() => setIsSurplusOpen(true)}
          />
        );
      case 'demand':
        return <DemandForecastingPage />;
      case 'inventory':
        return <InventoryPage onOpenAddModal={() => setIsInventoryOpen(true)} />;
      case 'waste':
        return <WasteTrackingPage onOpenLogWasteModal={() => setIsLogWasteOpen(true)} />;
      case 'surplus':
        return (
          <SurplusRedistributionPage
            onOpenSurplusModal={() => setIsSurplusOpen(true)}
            onOpenDispatchModal={(batchId?: string, partnerId?: string) =>
              setDispatchModalState({ isOpen: true, batchId, partnerId })
            }
          />
        );
      case 'iot':
      case 'quality':
        return <QualityIoTPage />;
      case 'sustainability':
        return <SustainabilityPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <OverviewPage
            onOpenLogWasteModal={() => setIsLogWasteOpen(true)}
            onOpenSurplusModal={() => setIsSurplusOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] text-slate-800 flex flex-col font-['Inter',sans-serif]">
      {/* Google Maps Platform Quota Exceeded Sticky Banner */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm flex items-center justify-between">
          <div className="flex-1 text-center">
            <span>
              Google Maps Platform quota reached. If you are the app owner, visit{' '}
              <a
                href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-950 hover:text-amber-800"
              >
                maps developer site
              </a>{' '}
              for instructions to update your account.
            </span>
          </div>
          <button
            onClick={() => setQuotaExceeded(false)}
            className="text-amber-700 hover:text-amber-900 font-bold ml-2 text-xs cursor-pointer p-1"
            title="Dismiss notice"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex-1 flex min-w-0">
        {/* Fixed Collapsible Left Sidebar */}
        <Sidebar
          onOpenLogWasteModal={() => setIsLogWasteOpen(true)}
          onOpenSurplusModal={() => setIsSurplusOpen(true)}
          onOpenInventoryModal={() => setIsInventoryOpen(true)}
        />

        {/* Main Content Area Offset by Sidebar */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
            sidebarCollapsed ? 'md:pl-20' : 'md:pl-68'
          } pl-0`}
        >
        {/* Top Navbar */}
        <TopNavbar
          onOpenLogWasteModal={() => setIsLogWasteOpen(true)}
          onOpenSurplusModal={() => setIsSurplusOpen(true)}
          onOpenInventoryModal={() => setIsInventoryOpen(true)}
        />

        {/* Dynamic Page Body */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {renderActivePage()}
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-slate-200/80 bg-white/60 py-3 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">SMART</span>
            <span>·</span>
            <span className="text-slate-400">Surplus Management And Redistribution Technology</span>
          </div>
          <div className="text-[11px] text-slate-400">
            <span>All systems operational</span>
          </div>
        </footer>
      </div>
      </div>

      {/* Global Modals */}
      <LogWasteModal
        isOpen={isLogWasteOpen}
        onClose={() => setIsLogWasteOpen(false)}
      />

      <RegisterSurplusModal
        isOpen={isSurplusOpen}
        onClose={() => setIsSurplusOpen(false)}
      />

      <DispatchManifestModal
        isOpen={dispatchModalState.isOpen}
        preselectedBatchId={dispatchModalState.batchId}
        preselectedPartnerId={dispatchModalState.partnerId}
        onClose={() => setDispatchModalState({ isOpen: false })}
      />

      <AddInventoryModal
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
      />

      {/* Floating Operations Intelligence Chatbot */}
      <FoodWiseChatbot />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
