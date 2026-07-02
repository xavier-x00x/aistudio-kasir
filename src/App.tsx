import React, { useState, useEffect } from 'react';
import { Product, CartItem, Transaction, AppNotification } from './types';
import { DEFAULT_PRODUCTS, generateSeedTransactions } from './data';
import DesktopHeader from './components/DesktopHeader';
import POSView from './components/POSView';
import InventoryView from './components/InventoryView';
import ReportsView from './components/ReportsView';
import PaymentModal from './components/PaymentModal';
import ShortcutGuide from './shortcut_guide';
import { 
  Database, 
  Printer, 
  Bell, 
  ShieldCheck, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';

export default function App() {
  
  // 1. Core States with LocalStorage Sync
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('kasir_products');
    return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('kasir_transactions');
    return saved ? JSON.parse(saved) : generateSeedTransactions();
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'reports'>('pos');
  const [cashierName, setCashierName] = useState<string>('Budi Santoso');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // 2. Payment Modal parameters
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paySubtotal, setPaySubtotal] = useState(0);
  const [payDiscountPercent, setPayDiscountPercent] = useState(0);
  const [payDiscountNominal, setPayDiscountNominal] = useState(0);
  const [payTaxPercent, setPayTaxPercent] = useState(11);
  const [payGrandTotal, setPayGrandTotal] = useState(0);
  const [payCustomerName, setPayCustomerName] = useState('Pelanggan Umum');

  // Save changes back to LocalStorage
  useEffect(() => {
    localStorage.setItem('kasir_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('kasir_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // 3. Hotkey navigation intercepts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('pos');
        triggerNotification('info', 'Beralih ke Mesin Kasir [POS]');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setActiveTab('inventory');
        triggerNotification('info', 'Beralih ke database Kelola Stok');
      } else if (e.key === 'F8') {
        e.preventDefault();
        setActiveTab('reports');
        triggerNotification('info', 'Beralih ke Laporan Keuangan');
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // 4. Notification Handler (Toasts drawer)
  const triggerNotification = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const newNotif: AppNotification = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      message
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 4)); // max 4 notifications at once

    // auto dismiss
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
    }, 4500);
  };

  // 5. Payment Modal triggers
  const openPaymentModal = (
    subtotal: number,
    discountPercent: number,
    discountNominal: number,
    taxPercent: number,
    grandTotal: number,
    customerName: string
  ) => {
    setPaySubtotal(subtotal);
    setPayDiscountPercent(discountPercent);
    setPayDiscountNominal(discountNominal);
    setPayTaxPercent(taxPercent);
    setPayGrandTotal(grandTotal);
    setPayCustomerName(customerName);
    setIsPayModalOpen(true);
  };

  const handlePaymentSuccess = (newTx: Transaction) => {
    // 1. Add transaction to ledger
    setTransactions(prev => [newTx, ...prev]);

    // 2. Reduce products stock
    setProducts(prevProducts => {
      return prevProducts.map(prod => {
        const cartItem = cart.find(item => item.product.id === prod.id);
        if (cartItem) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - cartItem.quantity)
          };
        }
        return prod;
      });
    });

    // 3. Reset Cart
    setCart([]);
  };

  // Count total stock items remaining
  const totalStockItems = products.reduce((sum, p) => sum + p.stock, 0);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans select-none antialiased">
      
      {/* Simulation Window Title Bar (Mac/Windows GUI look) */}
      <div className="bg-slate-950 text-slate-400 text-[10px] px-6 py-1.5 flex items-center justify-between border-b border-slate-900 font-bold tracking-wider select-none">
        <div className="flex items-center space-x-2">
          {/* Mock Red-Yellow-Green OS dots */}
          <div className="flex space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="text-slate-400 pl-1.5">POS DESKTOP TERMINAL - TOKO MODERN JAYA SEJAHTERA</span>
        </div>
        <div className="flex items-center space-x-3 text-[9px] uppercase">
          <span className="text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded flex items-center">
            <ShieldCheck className="w-3 h-3 mr-1" /> SQLITE SECURE
          </span>
          <span>IP: 127.0.0.1 (LOCAL)</span>
        </div>
      </div>

      {/* Main Work Header */}
      <DesktopHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cashierName={cashierName}
        setCashierName={setCashierName}
        openNotification={triggerNotification}
      />

      {/* Main Client Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'pos' && (
          <POSView
            products={products}
            cart={cart}
            setCart={setCart}
            openPaymentModal={openPaymentModal}
            openNotification={triggerNotification}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            products={products}
            setProducts={setProducts}
            openNotification={triggerNotification}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            transactions={transactions}
            products={products}
            setTransactions={setTransactions}
            setProducts={setProducts}
            openNotification={triggerNotification}
          />
        )}
      </main>

      {/* Bottom Status diagnostic Bar */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-[10px] px-6 py-2 select-none flex flex-col sm:flex-row justify-between items-center font-semibold">
        <div className="flex flex-wrap gap-4 items-center mb-1.5 sm:mb-0">
          <div className="flex items-center text-slate-300">
            <Database className="w-3.5 h-3.5 text-sky-400 mr-1.5" />
            <span>Database Status: <span className="text-emerald-400 font-bold">TERKONEKSI (Local)</span></span>
          </div>
          <div className="flex items-center text-slate-300">
            <Printer className="w-3.5 h-3.5 text-blue-400 mr-1.5" />
            <span>Printer Driver: <span className="text-emerald-400 font-bold">SIAP (Ready)</span></span>
          </div>
          <div className="text-slate-300">
            <span>Sisa Stok Toko: <span className="font-bold text-slate-200">{totalStockItems} pcs</span></span>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <span>Sistem Kasir Modern v2.4.0 • Built with</span>
          <span className="text-emerald-400 font-bold">Vite & Tailwind CSS</span>
        </div>
      </footer>

      {/* Floating Hotkeys Helper */}
      <ShortcutGuide />

      {/* Floating Application Notifications (Toasts stack) */}
      <div className="fixed bottom-5 left-5 space-y-2 z-50 max-w-sm pointer-events-none select-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-start space-x-3 p-3.5 rounded-xl border shadow-xl bg-white/95 backdrop-blur-xs transition-all duration-300 transform translate-y-0 scale-100 pointer-events-auto ${
              n.type === 'success' ? 'border-emerald-200 text-slate-800' :
              n.type === 'error' ? 'border-rose-200 text-slate-800' :
              n.type === 'warning' ? 'border-amber-200 text-slate-800' :
              'border-slate-200 text-slate-800'
            }`}
          >
            {n.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
            {n.type === 'error' && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
            {n.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />}
            {n.type === 'info' && <Info className="w-5 h-5 text-blue-500 shrink-0" />}

            <div className="flex-1">
              <p className="text-xs font-bold leading-relaxed">{n.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Checkout Payment overlay */}
      <PaymentModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        subtotal={paySubtotal}
        discountPercent={payDiscountPercent}
        discountNominal={payDiscountNominal}
        taxPercent={payTaxPercent}
        grandTotal={payGrandTotal}
        customerName={payCustomerName}
        cashierName={cashierName}
        cart={cart}
        onPaymentSuccess={handlePaymentSuccess}
        openNotification={triggerNotification}
      />

    </div>
  );
}
