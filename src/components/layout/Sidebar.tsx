import React, { useState } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Boxes,
  Trash2,
  Share2,
  Cpu,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Leaf,
  Plus,
  ChevronDown,
  PackagePlus,
  LogIn,
  LogOut,
} from 'lucide-react';
import { NavigationTab } from '../../types';
import { useApp } from '../../context/AppContext';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

interface SidebarProps {
  onOpenLogWasteModal?: () => void;
  onOpenSurplusModal?: () => void;
  onOpenInventoryModal?: () => void;
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'demand', label: 'Demand Forecasting', icon: TrendingUp },
  { id: 'inventory', label: 'Inventory & FIFO', icon: Boxes },
  { id: 'waste', label: 'Waste Tracking', icon: Trash2 },
  { id: 'surplus', label: 'Surplus & Redistribution', icon: Share2 },
  { id: 'iot', label: 'Quality & IoT Monitoring', icon: Cpu },
  { id: 'sustainability', label: 'Sustainability Reports', icon: Leaf },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenLogWasteModal,
  onOpenSurplusModal,
  onOpenInventoryModal,
}) => {
  const {
    activeTab,
    setActiveTab,
    sidebarCollapsed,
    toggleSidebar,
    surplusBatches,
    inventory,
    currentUser,
    userProfile,
    signInWithGoogle,
    signOut,
    authLoading,
  } = useApp();
  const [isActionOpen, setIsActionOpen] = useState(false);

  const activeSurplusCount = surplusBatches.filter(b => b.redistributionStatus === 'staged').length;
  const criticalExpiryCount = inventory.filter(i => i.shelfLifeStatus === 'critical').length;

  const handleNavClick = (id: NavigationTab) => {
    setActiveTab(id);
    if (window.innerWidth < 768 && !sidebarCollapsed) {
      toggleSidebar();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {!sidebarCollapsed && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-25 bg-slate-950/60 backdrop-blur-xs md:hidden"
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-30 flex flex-col bg-white text-slate-700 border-r border-slate-200/90 transition-all duration-300 ease-in-out ${
          sidebarCollapsed
            ? '-translate-x-full md:translate-x-0 md:w-20'
            : 'translate-x-0 w-68 shadow-xl md:shadow-none'
        }`}
      >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-600 text-white shadow-xs flex-shrink-0">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-base tracking-tight text-slate-900 font-['Plus_Jakarta_Sans'] leading-tight">
                SMART
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-tight truncate leading-tight" title="Surplus Management And Redistribution Technology">
                Surplus Management &amp; Redistribution
              </span>
            </div>
          )}
        </div>

        <button
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Top Action Button in Green (Collapsible) */}
      <div className="px-3 pt-3 pb-2 border-b border-slate-100">
        {!sidebarCollapsed ? (
          <div>
            <button
              onClick={() => setIsActionOpen(prev => !prev)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl font-semibold text-xs shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-lg bg-emerald-500/90 flex items-center justify-center flex-shrink-0">
                  <Plus className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold font-['Plus_Jakarta_Sans'] tracking-tight">New Action</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-emerald-100 transition-transform duration-200 ${
                  isActionOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Collapsible Action Sub-Menu */}
            {isActionOpen && (
              <div className="mt-2 p-1.5 bg-emerald-50/80 border border-emerald-200/90 rounded-xl space-y-1 animate-in fade-in duration-150">
                <button
                  onClick={() => {
                    if (onOpenLogWasteModal) onOpenLogWasteModal();
                  }}
                  className="w-full text-left px-2.5 py-2 flex items-center gap-2 rounded-lg hover:bg-white text-slate-700 hover:text-slate-900 transition-colors text-xs cursor-pointer group/btn"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 text-[11px]">Log Waste Batch</div>
                    <div className="text-[10px] text-slate-400 truncate">Record scrap, spoilage, leftovers</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    if (onOpenSurplusModal) onOpenSurplusModal();
                  }}
                  className="w-full text-left px-2.5 py-2 flex items-center gap-2 rounded-lg hover:bg-white text-slate-700 hover:text-slate-900 transition-colors text-xs cursor-pointer group/btn"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 text-[11px]">Register Surplus Food</div>
                    <div className="text-[10px] text-slate-400 truncate">Stage safe food for donation</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    if (onOpenInventoryModal) onOpenInventoryModal();
                  }}
                  className="w-full text-left px-2.5 py-2 flex items-center gap-2 rounded-lg hover:bg-white text-slate-700 hover:text-slate-900 transition-colors text-xs cursor-pointer group/btn"
                >
                  <PackagePlus className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 text-[11px]">Receive Inventory Lot</div>
                    <div className="text-[10px] text-slate-400 truncate">Log new stock & expiry date</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center relative">
            <button
              onClick={() => setIsActionOpen(prev => !prev)}
              title="New Action"
              className="w-10 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-5 h-5" />
            </button>
            {isActionOpen && (
              <div className="absolute left-14 top-0 w-52 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-50 space-y-1 animate-in fade-in">
                <button
                  onClick={() => {
                    setIsActionOpen(false);
                    if (onOpenLogWasteModal) onOpenLogWasteModal();
                  }}
                  className="w-full text-left px-2.5 py-2 flex items-center gap-2 rounded-lg hover:bg-slate-50 text-slate-700 text-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span className="font-medium text-slate-800">Log Waste Batch</span>
                </button>
                <button
                  onClick={() => {
                    setIsActionOpen(false);
                    if (onOpenSurplusModal) onOpenSurplusModal();
                  }}
                  className="w-full text-left px-2.5 py-2 flex items-center gap-2 rounded-lg hover:bg-slate-50 text-slate-700 text-xs cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-medium text-slate-800">Register Surplus</span>
                </button>
                <button
                  onClick={() => {
                    setIsActionOpen(false);
                    if (onOpenInventoryModal) onOpenInventoryModal();
                  }}
                  className="w-full text-left px-2.5 py-2 flex items-center gap-2 rounded-lg hover:bg-slate-50 text-slate-700 text-xs cursor-pointer"
                >
                  <PackagePlus className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-medium text-slate-800">Receive Inventory</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          let alertCount: number | null = null;
          if (item.id === 'surplus' && activeSurplusCount > 0) alertCount = activeSurplusCount;
          if (item.id === 'inventory' && criticalExpiryCount > 0) alertCount = criticalExpiryCount;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              title={sidebarCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 transition-colors ${
                  isActive ? 'text-emerald-600' : 'text-slate-400'
                }`}
              />
              {!sidebarCollapsed && (
                <div className="flex-1 flex items-center justify-between truncate">
                  <span className="truncate">{item.label}</span>
                  {alertCount !== null && (
                    <span
                      className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-emerald-100/90 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {alertCount}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Bottom: Sign In / User Profile */}
      <div className="border-t border-slate-200/90 bg-slate-50/70 p-3">
        {currentUser ? (
          !sidebarCollapsed ? (
            <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Staff'}
                    className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                    {currentUser.displayName ? currentUser.displayName.slice(0, 2).toUpperCase() : 'OP'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-slate-800 truncate">
                    {currentUser.displayName || 'Operations Staff'}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold truncate flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                    <span className="truncate">{userProfile?.role || 'Kitchen Supervisor'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex-shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={() => signOut()}
                title={`Signed in as ${currentUser.displayName || 'Staff'}. Click to Sign Out.`}
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-colors shadow-xs cursor-pointer group"
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="Staff"
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                ) : (
                  <LogOut className="w-4 h-4 text-slate-500 group-hover:text-rose-600" />
                )}
              </button>
            </div>
          )
        ) : (
          !sidebarCollapsed ? (
            <div className="space-y-1.5">
              <button
                onClick={() => signInWithGoogle()}
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer group disabled:opacity-75"
              >
                <LogIn className="w-4 h-4 text-emerald-100 group-hover:translate-x-0.5 transition-transform" />
                <span className="font-['Plus_Jakarta_Sans']">
                  {authLoading ? 'Signing In...' : 'Sign In with Google'}
                </span>
              </button>
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Cloud Firestore Auth</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={() => signInWithGoogle()}
                disabled={authLoading}
                title="Sign In with Google"
                className="w-10 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center shadow-xs transition-colors cursor-pointer disabled:opacity-75"
              >
                <LogIn className="w-4 h-4" />
              </button>
            </div>
          )
        )}
      </div>
    </aside>
  </>
  );
};
