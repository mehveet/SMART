import React, { useState } from 'react';
import {
  Bell,
  Search,
  CheckCheck,
  AlertTriangle,
  Info,
  ChevronDown,
  Database,
  LogOut,
  Cloud,
  ShieldCheck,
  RefreshCw,
  UserCheck,
  Menu,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DateRange, NavigationTab } from '../../types';

interface TopNavbarProps {
  onOpenLogWasteModal?: () => void;
  onOpenSurplusModal?: () => void;
  onOpenInventoryModal?: () => void;
}

const pageTitles: Record<NavigationTab, string> = {
  overview: 'Overview',
  demand: 'Demand Forecasting',
  inventory: 'Inventory',
  waste: 'Waste Tracking',
  surplus: 'Surplus Redistribution',
  iot: 'Quality & Cold Chain',
  quality: 'Quality & Cold Chain',
  sustainability: 'Sustainability',
  settings: 'Settings',
};

export const TopNavbar: React.FC<TopNavbarProps> = () => {
  const {
    activeTab,
    dateRange,
    setDateRange,
    searchQuery,
    setSearchQuery,
    notifications,
    markNotificationRead,
    clearAllNotifications,
    setActiveTab,
    currentUser,
    userProfile,
    authLoading,
    isFirebaseConnected,
    isSeedingDatabase,
    signOut,
    seedDatabase,
    toggleSidebar,
  } = useApp();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const title = pageTitles[activeTab];
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between transition-all">
      {/* Mobile Menu & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
          className="p-1.5 -ml-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page Title */}
        <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans'] truncate">
          {title}
        </h1>
      </div>

      {/* Center/Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search items, batches, logs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-52 lg:w-60 pl-9 pr-3 py-1.5 text-xs bg-slate-50/80 border border-slate-200/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Date Filter Segmented Control */}
        <div className="hidden lg:flex items-center bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/70 text-xs">
          {(['today', '7d', '30d', '90d'] as DateRange[]).map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                dateRange === range
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {range === 'today' ? 'Today' : range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifs(prev => !prev);
            }}
            aria-label="View notifications"
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-40">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900">Alerts</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-mono font-medium text-emerald-700">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-[11px] text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No active alerts. All systems nominal.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.navTarget) {
                          setActiveTab(n.navTarget);
                          setShowNotifs(false);
                        }
                      }}
                      className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                        !n.read ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {n.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        ) : n.type === 'critical' ? (
                          <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="font-semibold text-slate-800 flex items-center justify-between">
                            <span>{n.title}</span>
                            <span className="text-[10px] text-slate-400 font-normal">{n.time}</span>
                          </div>
                          <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">{n.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Staff User Portal / Authentication */}
        {authLoading ? (
          <div className="w-8 h-8 rounded-lg bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-400">
            ...
          </div>
        ) : currentUser ? (
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(prev => !prev);
                setShowNotifs(false);
              }}
              className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:opacity-90 transition-opacity"
            >
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Staff'}
                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 shadow-xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-semibold flex items-center justify-center text-xs shadow-xs">
                  {currentUser.displayName
                    ? currentUser.displayName.slice(0, 2).toUpperCase()
                    : 'ST'}
                </div>
              )}
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 leading-tight">
                  {currentUser.displayName || 'Operations Staff'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {userProfile?.role || 'Kitchen Supervisor'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden xl:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2.5 z-50 text-xs">
                {/* User Header */}
                <div className="px-4 py-2 border-b border-slate-100">
                  <div className="font-semibold text-slate-900 truncate">
                    {currentUser.displayName || 'Operations Staff'}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>{userProfile?.role || 'Kitchen Supervisor'}</span>
                  </div>
                </div>

                {/* Facility Context */}
                <div className="px-4 py-2 bg-slate-50/70 border-b border-slate-100">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Assigned Facility
                  </div>
                  <div className="text-xs text-slate-700 font-medium">
                    Kitchen Facility 1
                  </div>
                </div>

                {/* Database Management Action */}
                <div className="px-2 py-1.5 border-b border-slate-100">
                  <button
                    onClick={() => {
                      seedDatabase(false);
                      setShowUserMenu(false);
                    }}
                    disabled={isSeedingDatabase}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSeedingDatabase ? 'animate-spin' : ''}`} />
                    <div className="flex-1">
                      <div className="font-medium text-[11px]">
                        {isSeedingDatabase ? 'Seeding...' : 'Sync Benchmark Data'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Reset or restore default records
                      </div>
                    </div>
                  </button>
                </div>

                {/* Sign Out Action */}
                <div className="px-2 pt-1">
                  <button
                    onClick={() => {
                      signOut();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-rose-50 text-rose-600 hover:text-rose-700 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="font-medium text-[11px]">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
};
