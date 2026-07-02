import React, { useState } from 'react';
import { Keyboard, X, Sparkles } from 'lucide-react';

export default function ShortcutGuide() {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { key: 'F1', desc: 'Buka Mesin Kasir / Terminal POS' },
    { key: 'F3', desc: 'Buka Database / Kelola Stok Barang' },
    { key: 'F8', desc: 'Buka Analisis & Laporan Keuangan' },
    { key: 'F9', desc: 'Fokus Cepat ke kolom Scanner Barcode' },
    { key: 'F2', desc: 'Proses Bayar Sekarang (Checkout)' },
    { key: 'F4', desc: 'Kosongkan Keranjang Belanjaan' },
  ];

  return (
    <div className="fixed bottom-5 right-5 z-40 select-none">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-slate-900 text-white p-3 rounded-full hover:bg-slate-800 transition-all shadow-xl hover:scale-105 active:scale-95 border border-slate-700 flex items-center space-x-2"
          title="Tampilkan Panduan Tombol Cepat [Hotkeys]"
        >
          <Keyboard className="w-5 h-5 text-indigo-400" />
          <span className="text-xs font-bold pr-1">Tombol Cepat</span>
        </button>
      ) : (
        <div className="bg-slate-900 border border-slate-700 text-white rounded-xl shadow-2xl p-4 w-72 animate-slide-up">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-2.5">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-200">
              <Keyboard className="w-4 h-4 text-indigo-400" />
              <span>Panduan Tombol Pintar (Hotkeys)</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5">
            {shortcuts.map((s) => (
              <div key={s.key} className="flex items-start space-x-3 text-xs">
                <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-600 rounded font-bold font-mono text-[10px] text-indigo-300 shadow-sm shrink-0">
                  {s.key}
                </kbd>
                <span className="text-slate-300 leading-tight">{s.desc}</span>
              </div>
            ))}
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-slate-800 text-[9px] text-slate-500 font-bold uppercase text-center flex items-center justify-center space-x-1">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            <span>KASIR.OS - Offline Engine Ready</span>
          </div>
        </div>
      )}
    </div>
  );
}

