import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Wifi, 
  Printer, 
  Database, 
  User, 
  Clock, 
  SlidersHorizontal,
  ChevronDown,
  LogOut,
  Sparkles
} from 'lucide-react';

interface DesktopHeaderProps {
  activeTab: 'pos' | 'inventory' | 'reports';
  setActiveTab: (tab: 'pos' | 'inventory' | 'reports') => void;
  cashierName: string;
  setCashierName: (name: string) => void;
  openNotification: (type: 'success' | 'error' | 'warning' | 'info', msg: string) => void;
}

export default function DesktopHeader({
  activeTab,
  setActiveTab,
  cashierName,
  setCashierName,
  openNotification
}: DesktopHeaderProps) {
  const [time, setTime] = useState(new Date());
  const [isCashierMenuOpen, setIsCashierMenuOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleCashierChange = (name: string) => {
    setCashierName(name);
    setIsCashierMenuOpen(false);
    openNotification('success', `Shift berhasil dialihkan ke: ${name}`);
  };

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between px-6 py-3 select-none">
      {/* Brand Title & Status indicators */}
      <div className="flex items-center space-x-4 mb-3 md:mb-0">
        <div className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-3 py-1.5 rounded-lg font-bold tracking-wider text-sm shadow">
          <Monitor className="w-4.5 h-4.5 animate-pulse" />
          <span>KASIR.OS v2.4</span>
        </div>
        
        {/* Hardware Status lights */}
        <div className="hidden lg:flex items-center space-x-4 text-xs text-slate-400 border-l border-slate-800 pl-4">
          <div className="flex items-center space-x-1.5" title="Koneksi Sistem">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300">Sistem Online</span>
          </div>
          <div className="flex items-center space-x-1.5" title="Printer Kasir">
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300">EPSON T-88v Ready</span>
          </div>
          <div className="flex items-center space-x-1.5" title="Penyimpanan Database">
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-300">SQLite Local</span>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <nav className="flex space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-center">
        <button
          onClick={() => setActiveTab('pos')}
          className={`px-4 py-2 text-xs md:text-sm font-medium rounded-md transition-all duration-150 flex items-center space-x-2 ${
            activeTab === 'pos'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <span>🛒 Mesin Kasir</span>
          <span className="hidden sm:inline bg-slate-900/50 text-[10px] px-1.5 py-0.5 rounded text-slate-300 ml-1">F1</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 text-xs md:text-sm font-medium rounded-md transition-all duration-150 flex items-center space-x-2 ${
            activeTab === 'inventory'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <span>📦 Kelola Stok</span>
          <span className="hidden sm:inline bg-slate-900/50 text-[10px] px-1.5 py-0.5 rounded text-slate-300 ml-1">F3</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 text-xs md:text-sm font-medium rounded-md transition-all duration-150 flex items-center space-x-2 ${
            activeTab === 'reports'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <span>📈 Laporan Keuangan</span>
          <span className="hidden sm:inline bg-slate-900/50 text-[10px] px-1.5 py-0.5 rounded text-slate-300 ml-1">F8</span>
        </button>
      </nav>

      {/* Date-Time & Active Cashier Shift */}
      <div className="flex items-center space-x-4 mt-3 md:mt-0 justify-end">
        {/* Clock element */}
        <div className="hidden sm:flex flex-col items-end border-r border-slate-800 pr-4 text-xs">
          <div className="flex items-center text-slate-300 space-x-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono text-sm tracking-wider">{formatTime(time)}</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">{formatDate(time)}</span>
        </div>

        {/* Cashier selection dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsCashierMenuOpen(!isCashierMenuOpen)}
            className="flex items-center space-x-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-slate-200 px-3 py-1.5 rounded-lg text-xs md:text-sm transition-all focus:outline-none"
          >
            <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm">
              {cashierName.charAt(0)}
            </div>
            <div className="text-left leading-none">
              <div className="font-semibold text-slate-200">{cashierName}</div>
              <div className="text-[9px] text-indigo-300 font-medium tracking-wide uppercase mt-0.5">Role: Admin</div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {isCashierMenuOpen && (
            <>
              {/* Back-drop to close menu */}
              <div className="fixed inset-0 z-10" onClick={() => setIsCashierMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-52 bg-slate-900 rounded-lg border border-slate-700 shadow-xl overflow-hidden z-20 animate-fade-in">
                <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  PILIH KASIR SHIFT
                </div>
                <div className="py-1">
                  {['Budi Santoso', 'Siti Rahma', 'Ahmad Syarif'].map((name) => (
                    <button
                      key={name}
                      onClick={() => handleCashierChange(name)}
                      className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between ${
                        cashierName === name 
                          ? 'bg-indigo-600/20 text-indigo-300 font-bold' 
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{name}</span>
                      {cashierName === name && <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
