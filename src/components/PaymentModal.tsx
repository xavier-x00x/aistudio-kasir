import React, { useState, useEffect } from 'react';
import { Transaction, CartItem, Product, TransactionItem } from '../types';
import { 
  X, 
  Wallet, 
  CreditCard, 
  QrCode, 
  CheckCircle, 
  Coins, 
  Printer, 
  Smartphone,
  Sparkles,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  discountPercent: number;
  discountNominal: number;
  taxPercent: number;
  grandTotal: number;
  customerName: string;
  cashierName: string;
  cart: CartItem[];
  onPaymentSuccess: (newTx: Transaction) => void;
  openNotification: (type: 'success' | 'error' | 'warning' | 'info', msg: string) => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  subtotal,
  discountPercent,
  discountNominal,
  taxPercent,
  grandTotal,
  customerName,
  cashierName,
  cart,
  onPaymentSuccess,
  openNotification
}: PaymentModalProps) {
  
  // State
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS' | 'Debit' | 'Transfer'>('Tunai');
  const [amountPaid, setAmountPaid] = useState<number | string>('');
  const [amountChange, setAmountChange] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [createdTransaction, setCreatedTransaction] = useState<Transaction | null>(null);
  
  // Quick cash recommendations
  const [quickCashOptions, setQuickCashOptions] = useState<number[]>([]);

  // Calculate quick cash options once grandTotal is loaded
  useEffect(() => {
    if (grandTotal <= 0) return;
    
    const exact = grandTotal;
    const options: number[] = [exact];
    
    const commonBills = [10000, 20000, 50000, 100000, 200000];
    commonBills.forEach(bill => {
      if (bill > grandTotal && !options.includes(bill)) {
        options.push(bill);
      }
    });

    // Add another custom rounded option e.g. next 50,000 bill
    const nextFifty = Math.ceil(grandTotal / 50000) * 50000;
    if (!options.includes(nextFifty) && nextFifty > grandTotal) {
      options.push(nextFifty);
    }
    
    setQuickCashOptions(options.sort((a, b) => a - b).slice(0, 5));
    
    // Set default paid amount
    if (paymentMethod === 'Tunai') {
      setAmountPaid('');
    } else {
      setAmountPaid(grandTotal);
    }
  }, [grandTotal, paymentMethod]);

  // Recalculate change amount
  useEffect(() => {
    const paidNum = Number(amountPaid) || 0;
    if (paidNum >= grandTotal) {
      setAmountChange(paidNum - grandTotal);
    } else {
      setAmountChange(0);
    }
  }, [amountPaid, grandTotal]);

  if (!isOpen) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  const handleQuickCash = (val: number) => {
    setAmountPaid(val);
    openNotification('info', `Pilih Pembayaran Tunai: ${formatCurrency(val)}`);
  };

  const playSuccessSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Ring chime
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      
      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 0.5);
      osc2.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      // Audio not permitted
    }
  };

  const handleProcessPayment = () => {
    const paidNum = Number(amountPaid) || 0;
    if (paymentMethod === 'Tunai' && paidNum < grandTotal) {
      openNotification('error', `Pembayaran gagal! Uang tunai kurang sebesar ${formatCurrency(grandTotal - paidNum)}`);
      return;
    }

    // 1. Compile Transaction Items
    const txItems: TransactionItem[] = cart.map(item => {
      const itemPrice = item.product.sellPrice;
      const discountPercent = item.discountPercent || 0;
      const finalPrice = itemPrice * (1 - discountPercent / 100);
      
      return {
        productId: item.product.id,
        sku: item.product.sku,
        name: item.product.name,
        category: item.product.category,
        buyPrice: item.product.buyPrice,
        sellPrice: item.product.sellPrice,
        quantity: item.quantity,
        discountPercent,
        totalPrice: finalPrice * item.quantity
      };
    });

    // 2. Build Invoice String
    const date = new Date();
    const pad = (num: number) => num.toString().padStart(2, '0');
    const invoiceNum = `INV-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(Math.floor(Math.random() * 900) + 100)}`;

    const newTx: Transaction = {
      id: `tx-${Math.random().toString(36).substring(2, 9)}`,
      invoiceNumber: invoiceNum,
      date: date.toISOString(),
      items: txItems,
      subtotal,
      discountPercent,
      discountNominal,
      taxPercent,
      taxNominal: Math.round(((subtotal - (Math.round((subtotal * discountPercent) / 100) + discountNominal)) * taxPercent) / 100),
      total: grandTotal,
      paymentMethod,
      amountPaid: paidNum,
      amountChange: paymentMethod === 'Tunai' ? paidNum - grandTotal : 0,
      cashierName,
      customerName,
      status: 'BERHASIL'
    };

    setCreatedTransaction(newTx);
    setIsCompleted(true);
    playSuccessSound();
    onPaymentSuccess(newTx);
    openNotification('success', `Pembayaran ${paymentMethod} sebesar ${formatCurrency(grandTotal)} Berhasil!`);
  };

  const handlePrintReceipt = () => {
    // Attempt standard browser print logic or mock print notification
    openNotification('info', 'Menyiapkan dokumen printer kasir...');
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-fade-in">
      
      {/* Container Card */}
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Coins className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-base md:text-lg">
              {isCompleted ? 'Pembayaran Berhasil! (Cetak Struk)' : 'Proses Penyelesaian Pembayaran'}
            </h2>
          </div>
          {!isCompleted && (
            <button 
              onClick={onClose}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Double Panel split view */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* LEFT PANEL: Input Options / Printing thermal screen */}
          <div className="flex-1 p-6 overflow-y-auto border-r border-slate-100 flex flex-col justify-between">
            {!isCompleted ? (
              <div className="space-y-6">
                
                {/* Grand Total Highlight */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tagihan Pembayaran</span>
                  <span className="text-3xl font-black text-slate-900 tracking-tight mt-1 block">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>

                {/* Choose Method */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Metode Pembayaran</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {/* Tunai */}
                    <button
                      onClick={() => setPaymentMethod('Tunai')}
                      className={`py-3.5 px-2.5 rounded-xl border-2 font-bold text-xs flex flex-col items-center space-y-1.5 transition-all ${
                        paymentMethod === 'Tunai'
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:border-slate-350 bg-white'
                      }`}
                    >
                      <Wallet className="w-5 h-5" />
                      <span>TUNAI (CASH)</span>
                    </button>

                    {/* QRIS */}
                    <button
                      onClick={() => setPaymentMethod('QRIS')}
                      className={`py-3.5 px-2.5 rounded-xl border-2 font-bold text-xs flex flex-col items-center space-y-1.5 transition-all ${
                        paymentMethod === 'QRIS'
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:border-slate-350 bg-white'
                      }`}
                    >
                      <QrCode className="w-5 h-5" />
                      <span>QRIS DINAMIS</span>
                    </button>

                    {/* Debit */}
                    <button
                      onClick={() => setPaymentMethod('Debit')}
                      className={`py-3.5 px-2.5 rounded-xl border-2 font-bold text-xs flex flex-col items-center space-y-1.5 transition-all ${
                        paymentMethod === 'Debit'
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:border-slate-350 bg-white'
                      }`}
                    >
                      <CreditCard className="w-5 h-5" />
                      <span>KARTU DEBIT</span>
                    </button>

                    {/* Transfer */}
                    <button
                      onClick={() => setPaymentMethod('Transfer')}
                      className={`py-3.5 px-2.5 rounded-xl border-2 font-bold text-xs flex flex-col items-center space-y-1.5 transition-all ${
                        paymentMethod === 'Transfer'
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:border-slate-350 bg-white'
                      }`}
                    >
                      <Smartphone className="w-5 h-5" />
                      <span>BANK TRANSFER</span>
                    </button>
                  </div>
                </div>

                {/* Method Specific Inputs */}
                {paymentMethod === 'Tunai' ? (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Uang Tunai Diterima (Rp)</label>
                        <span className="text-[10px] font-bold text-blue-600 uppercase">Input manual / klik shortcut</span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-base font-bold text-slate-400">Rp</span>
                        <input
                          type="number"
                          autoFocus
                          placeholder="Masukkan nilai rupiah..."
                          value={amountPaid}
                          onChange={(e) => setAmountPaid(e.target.value)}
                          className="pl-10 pr-4 py-2.5 w-full text-base font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      </div>
                    </div>

                    {/* Quick Cash recommendations */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Rekomendasi Uang Pecahan</span>
                      <div className="flex flex-wrap gap-1.5">
                        {quickCashOptions.map(val => (
                          <button
                            key={val}
                            onClick={() => handleQuickCash(val)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white border border-slate-200 hover:border-blue-600 rounded-lg text-xs font-bold font-mono transition-colors"
                          >
                            {val === grandTotal ? 'UANG PAS' : formatCurrency(val)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Real-time Change calculation */}
                    {Number(amountPaid) > 0 && (
                      <div className={`p-4 rounded-xl border ${
                        Number(amountPaid) >= grandTotal 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold uppercase tracking-wider">
                            {Number(amountPaid) >= grandTotal ? 'UANG KEMBALIAN (CHANGE)' : 'SISA TAGIHAN KURANG'}
                          </span>
                          <span className="text-lg font-black font-mono">
                            {Number(amountPaid) >= grandTotal 
                              ? formatCurrency(amountChange) 
                              : formatCurrency(grandTotal - Number(amountPaid))
                            }
                          </span>
                        </div>
                        {Number(amountPaid) < grandTotal && (
                          <div className="text-[10px] mt-1.5 font-semibold flex items-center">
                            <AlertCircle className="w-3.5 h-3.5 mr-1" /> Uang pembayaran belum mencukupi nilai tagihan belanja.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : paymentMethod === 'QRIS' ? (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center text-center space-y-3 animate-fade-in">
                    {/* Mock QRIS graphic */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-inner relative flex flex-col items-center">
                      <div className="bg-rose-600 text-white text-[10px] font-black px-4 py-0.5 rounded-sm tracking-widest uppercase mb-2 shadow-xs">
                        QRIS
                      </div>
                      
                      {/* Fake QR barcode patterns using beautiful responsive vectors */}
                      <svg className="w-40 h-40" viewBox="0 0 100 100">
                        <rect width="100" height="100" fill="white" />
                        {/* Anchor square Top Left */}
                        <rect x="5" y="5" width="22" height="22" fill="#1e293b" />
                        <rect x="9" y="9" width="14" height="14" fill="white" />
                        <rect x="12" y="12" width="8" height="8" fill="#1e293b" />
                        
                        {/* Anchor square Top Right */}
                        <rect x="73" y="5" width="22" height="22" fill="#1e293b" />
                        <rect x="77" y="9" width="14" height="14" fill="white" />
                        <rect x="80" y="12" width="8" height="8" fill="#1e293b" />

                        {/* Anchor square Bottom Left */}
                        <rect x="5" y="73" width="22" height="22" fill="#1e293b" />
                        <rect x="9" y="77" width="14" height="14" fill="white" />
                        <rect x="12" y="80" width="8" height="8" fill="#1e293b" />

                        {/* Central stamp mock */}
                        <rect x="42" y="42" width="16" height="16" rx="2" fill="#e11d48" />
                        <circle cx="50" cy="50" r="4" fill="white" />

                        {/* Random barcode grids */}
                        <rect x="34" y="10" width="5" height="5" fill="#1e293b" />
                        <rect x="45" y="6" width="12" height="4" fill="#1e293b" />
                        <rect x="62" y="14" width="6" height="6" fill="#1e293b" />
                        <rect x="12" y="34" width="8" height="5" fill="#1e293b" />
                        <rect x="22" y="45" width="4" height="10" fill="#1e293b" />
                        <rect x="10" y="62" width="14" height="4" fill="#1e293b" />
                        <rect x="34" y="65" width="8" height="8" fill="#1e293b" />
                        <rect x="45" y="80" width="15" height="4" fill="#1e293b" />
                        <rect x="68" y="45" width="6" height="12" fill="#1e293b" />
                        <rect x="80" y="34" width="10" height="5" fill="#1e293b" />
                        <rect x="75" y="75" width="15" height="15" fill="#1e293b" />
                        <rect x="79" y="79" width="7" height="7" fill="white" />
                      </svg>
                      
                      <span className="text-[9px] font-mono font-bold text-slate-500 mt-2">
                        NMID: ID1020453309900
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-800">Simulasikan Pemindaian QRIS</h4>
                      <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed">
                        Tunjukkan QR Code di atas pada customer. Klik tombol simulasi di bawah untuk merekam dana otomatis.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3 animate-fade-in">
                    <div className="flex items-center space-x-3 text-slate-700">
                      <CreditCard className="w-8 h-8 text-blue-600 stroke-1.5" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase">Mesin EDC / Transfer Bank</h4>
                        <p className="text-[10px] text-slate-400">Silakan gesek kartu pada terminal EDC bank yang sesuai.</p>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border border-slate-200 text-xs font-mono space-y-1">
                      <div><span className="text-slate-400">Bank Partner:</span> <span className="font-semibold">MANDIRI / BCA / BRI</span></div>
                      <div><span className="text-slate-400">Merchant ID:</span> <span className="font-semibold">MID-9921445-POS</span></div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Print Receipts Success Screen
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-5 animate-fade-in">
                <CheckCircle className="w-16 h-16 text-emerald-500 animate-scale-up" />
                
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-800">Transaksi Tersimpan!</h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Data transaksi telah berhasil diinput ke database lokal dan stok produk telah dipotong otomatis.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-sm pt-2">
                  <button
                    onClick={handlePrintReceipt}
                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md hover:shadow-lg transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    <span>CETAK STRUK (PRINT)</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center transition-all border border-slate-800"
                  >
                    <span>TRANSAKSI BARU</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bottom calculation status */}
            {!isCompleted && (
              <div className="border-t border-slate-150 pt-4 mt-6">
                <button
                  onClick={handleProcessPayment}
                  disabled={paymentMethod === 'Tunai' && (Number(amountPaid) || 0) < grandTotal}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all shadow-md flex items-center justify-center space-x-2 ${
                    paymentMethod === 'Tunai' && (Number(amountPaid) || 0) < grandTotal
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg'
                  }`}
                >
                  <CheckCircle className="w-4.5 h-4.5" />
                  <span>SIMPAN & SELESAIKAN TRANSAKSI</span>
                </button>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Thermal Printed Receipt Emulator */}
          <div className="w-full md:w-[320px] bg-slate-100 p-5 overflow-y-auto flex flex-col items-center">
            
            <div className="w-full text-slate-400 text-[10px] font-bold tracking-wider mb-2.5 text-center uppercase flex items-center justify-center space-x-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>Pratinjau Struk Kasir</span>
            </div>

            {/* Simulated Paper roll */}
            <div className="w-full bg-white border border-slate-250 shadow-md p-4 flex flex-col font-mono text-slate-800 text-[11px] leading-relaxed relative rounded-sm min-h-[420px]">
              
              {/* Paper jagged top border design */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-b from-slate-200/50 to-transparent" />
              
              <div className="text-center space-y-0.5 pb-2.5 border-b border-dashed border-slate-400">
                <span className="font-bold text-xs tracking-wide text-slate-900">TOKO KASIR MODERN</span>
                <span className="text-[10px] text-slate-500 block">Kec. Sudirman, Jakarta Pusat</span>
                <span className="text-[10px] text-slate-500 block">Telp: 021-8894532</span>
              </div>

              {/* Bill Meta */}
              <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-slate-600 text-[10px]">
                <div className="flex justify-between">
                  <span>No. Struk:</span>
                  <span className="font-bold text-slate-800">
                    {isCompleted && createdTransaction ? createdTransaction.invoiceNumber : 'INV-YYYYMMDD-MOCK'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>{new Date().toLocaleDateString('id-ID')} {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span className="uppercase">{cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span className="uppercase text-slate-700 font-semibold">{customerName}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="py-2.5 border-b border-dashed border-slate-400 flex-1 space-y-2">
                {cart.map((item) => {
                  const qty = item.quantity;
                  const itemPrice = item.product.sellPrice;
                  const discountPercent = item.discountPercent || 0;
                  const priceAfterDiscount = itemPrice * (1 - discountPercent / 100);
                  const total = priceAfterDiscount * qty;

                  return (
                    <div key={item.product.id} className="space-y-0.5">
                      <div className="text-slate-800 font-semibold">{item.product.name}</div>
                      <div className="flex justify-between text-slate-500 text-[10px]">
                        <span>{qty} x {formatCurrency(priceAfterDiscount)}</span>
                        <span className="font-bold text-slate-800">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Financial Totals */}
              <div className="py-2.5 space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                
                {discountPercent > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Diskon {discountPercent}%:</span>
                    <span>-{formatCurrency(Math.round((subtotal * discountPercent) / 100))}</span>
                  </div>
                )}

                {discountNominal > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Potongan Harga:</span>
                    <span>-{formatCurrency(discountNominal)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Pajak (PPN {taxPercent}%):</span>
                  <span>{formatCurrency(Math.round(((subtotal - (Math.round((subtotal * discountPercent) / 100) + discountNominal)) * taxPercent) / 100))}</span>
                </div>

                <div className="flex justify-between border-t border-dashed border-slate-300 pt-2 text-slate-900 font-extrabold text-xs">
                  <span>TOTAL BELANJA:</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                  <span>Pembayaran {paymentMethod}:</span>
                  <span className="font-bold text-slate-700">
                    {isCompleted && createdTransaction 
                      ? formatCurrency(createdTransaction.amountPaid) 
                      : (Number(amountPaid) > 0 ? formatCurrency(Number(amountPaid)) : formatCurrency(grandTotal))
                    }
                  </span>
                </div>

                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Uang Kembali:</span>
                  <span className="font-bold text-slate-700">
                    {isCompleted && createdTransaction 
                      ? formatCurrency(createdTransaction.amountChange) 
                      : (paymentMethod === 'Tunai' ? formatCurrency(amountChange) : 'Rp0')
                    }
                  </span>
                </div>
              </div>

              {/* Footer barcode visual */}
              <div className="text-center pt-4 border-t border-dashed border-slate-400 mt-auto space-y-1.5">
                <span className="text-[9px] text-slate-400 block uppercase font-medium">Terima Kasih Atas Kunjungan Anda</span>
                
                {/* Fake Code 128 barcode bars using inline SVG */}
                <svg className="w-4/5 h-6 mx-auto opacity-70" viewBox="0 0 100 15" preserveAspectRatio="none">
                  <rect x="0" y="0" width="100" height="15" fill="white" />
                  <rect x="5" y="0" width="2" height="15" fill="black" />
                  <rect x="8" y="0" width="1" height="15" fill="black" />
                  <rect x="11" y="0" width="3" height="15" fill="black" />
                  <rect x="15" y="0" width="1" height="15" fill="black" />
                  <rect x="18" y="0" width="2" height="15" fill="black" />
                  <rect x="22" y="0" width="4" height="15" fill="black" />
                  <rect x="28" y="0" width="1" height="15" fill="black" />
                  <rect x="31" y="0" width="2" height="15" fill="black" />
                  <rect x="35" y="0" width="3" height="15" fill="black" />
                  <rect x="40" y="0" width="1" height="15" fill="black" />
                  <rect x="44" y="0" width="4" height="15" fill="black" />
                  <rect x="50" y="0" width="2" height="15" fill="black" />
                  <rect x="54" y="0" width="1" height="15" fill="black" />
                  <rect x="57" y="0" width="3" height="15" fill="black" />
                  <rect x="62" y="0" width="2" height="15" fill="black" />
                  <rect x="66" y="0" width="1" height="15" fill="black" />
                  <rect x="70" y="0" width="4" height="15" fill="black" />
                  <rect x="76" y="0" width="2" height="15" fill="black" />
                  <rect x="80" y="0" width="3" height="15" fill="black" />
                  <rect x="85" y="0" width="1" height="15" fill="black" />
                  <rect x="88" y="0" width="2" height="15" fill="black" />
                  <rect x="92" y="0" width="3" height="15" fill="black" />
                </svg>
                <span className="text-[8px] text-slate-400 block font-mono">
                  {isCompleted && createdTransaction ? createdTransaction.id : 'MOCK-TXID-1090'}
                </span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
