import React, { useState } from 'react';
import { Transaction, Product } from '../types';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Receipt, 
  RotateCcw, 
  Printer, 
  Search, 
  Filter, 
  X, 
  FileSpreadsheet,
  HeartHandshake,
  CheckCircle2,
  Undo2
} from 'lucide-react';

interface ReportsViewProps {
  transactions: Transaction[];
  products: Product[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  openNotification: (type: 'success' | 'error' | 'warning' | 'info', msg: string) => void;
}

export default function ReportsView({
  transactions,
  products,
  setTransactions,
  setProducts,
  openNotification
}: ReportsViewProps) {
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'Semua' | 'Tunai' | 'QRIS' | 'Debit' | 'Transfer'>('Semua');
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<Transaction | null>(null);

  // Filter transactions
  const filteredTx = transactions.filter(tx => {
    const matchesSearch = tx.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (tx.customerName && tx.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesMethod = selectedMethod === 'Semua' || tx.paymentMethod === selectedMethod;
    return matchesSearch && matchesMethod;
  });

  // Calculate Metrics based on active non-refunded transactions
  const activeTx = transactions.filter(tx => tx.status === 'BERHASIL');

  const calculateTotalRevenue = () => {
    return activeTx.reduce((sum, tx) => sum + tx.total, 0);
  };

  const calculateTotalProfit = () => {
    return activeTx.reduce((sum, tx) => {
      const txProfit = tx.items.reduce((itemSum, item) => {
        const itemProfit = item.sellPrice * (1 - item.discountPercent / 100) - item.buyPrice;
        return itemSum + (itemProfit * item.quantity);
      }, 0);
      
      // Deduct transaction level discounts proportional to items profit or simple subtotal subtraction
      const transactionDiscount = tx.discountPercent ? (tx.subtotal * tx.discountPercent) / 100 : 0;
      const totalDisc = transactionDiscount + tx.discountNominal;
      
      // Net Profit = (Sales Price - Cost Price) - Cart Discount
      return sum + Math.max(0, txProfit - totalDisc);
    }, 0);
  };

  const calculateTotalItemsSold = () => {
    return activeTx.reduce((sum, tx) => {
      return sum + tx.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  // Aggregated Leaderboard products (Top 5)
  const getTopProducts = () => {
    const counts: { [name: string]: { qty: number, revenue: number } } = {};
    activeTx.forEach(tx => {
      tx.items.forEach(item => {
        if (!counts[item.name]) {
          counts[item.name] = { qty: 0, revenue: 0 };
        }
        counts[item.name].qty += item.quantity;
        counts[item.name].revenue += item.totalPrice;
      });
    });

    return Object.entries(counts)
      .map(([name, data]) => ({ name, qty: data.qty, revenue: data.revenue }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  };

  // Aggregated Category shares
  const getCategoryShares = () => {
    const shares: { [cat: string]: number } = {
      'Makanan': 0,
      'Minuman': 0,
      'Sembako': 0,
      'Snack': 0,
      'Lainnya': 0
    };
    let totalQty = 0;

    activeTx.forEach(tx => {
      tx.items.forEach(item => {
        const cat = item.category || 'Lainnya';
        if (shares[cat] !== undefined) {
          shares[cat] += item.quantity;
          totalQty += item.quantity;
        }
      });
    });

    return Object.entries(shares).map(([category, qty]) => ({
      category,
      qty,
      percentage: totalQty > 0 ? Math.round((qty / totalQty) * 100) : 0
    }));
  };

  const handleRefundTransaction = (tx: Transaction) => {
    if (tx.status === 'DIREFUND') return;
    
    if (confirm(`Apakah Anda yakin ingin me-REFUND Transaksi ${tx.invoiceNumber}?\n\nTindakan ini akan mengembalikan stok barang ke inventaris dan membatalkan pendapatan.`)) {
      // 1. Mark transaction as DIREFUND
      setTransactions(prev => prev.map(t => 
        t.id === tx.id ? { ...t, status: 'DIREFUND' } : t
      ));

      // 2. Add stock back to Products state
      setProducts(prevProducts => {
        return prevProducts.map(prod => {
          const matchingTxItem = tx.items.find(item => item.productId === prod.id);
          if (matchingTxItem) {
            return {
              ...prod,
              stock: prod.stock + matchingTxItem.quantity
            };
          }
          return prod;
        });
      });

      openNotification('warning', `Transaksi ${tx.invoiceNumber} berhasil direfund. Stok barang dikembalikan.`);
    }
  };

  const handleExportCSVReport = () => {
    openNotification('info', 'Menyiapkan berkas ekspor laporan penjualan...');
    setTimeout(() => {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "No. Invoice,Tanggal,Pelanggan,Kasir,Metode Pembayaran,Subtotal,Diskon,Pajak,Grand Total,Status\n";
      
      transactions.forEach(tx => {
        const row = [
          tx.invoiceNumber,
          tx.date.split('T')[0],
          tx.customerName || 'Umum',
          tx.cashierName,
          tx.paymentMethod,
          tx.subtotal,
          tx.discountNominal + (tx.subtotal * tx.discountPercent / 100),
          tx.taxNominal,
          tx.total,
          tx.status
        ].join(",");
        csvContent += row + "\n";
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Laporan-Keuangan-Kasir-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      openNotification('success', 'Laporan Penjualan berhasil diunduh (CSV).');
    }, 500);
  };

  // Calculations variables
  const totalRevenue = calculateTotalRevenue();
  const totalProfit = calculateTotalProfit();
  const totalItemsSold = calculateTotalItemsSold();
  const topProducts = getTopProducts();
  const categoryShares = getCategoryShares();

  return (
    <div className="flex-1 flex flex-col p-6 bg-slate-50 overflow-hidden select-none">
      
      {/* Top Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Laporan Keuangan & Analisis Penjualan</h2>
          <p className="text-xs text-slate-500 mt-0.5">Analisis instan omset harian, laba kotor, dan rekam jejak kasir.</p>
        </div>

        <button
          onClick={handleExportCSVReport}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all mt-3 md:mt-0"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Ekspor Laporan Penjualan (CSV)</span>
        </button>
      </div>

      {/* Row Metrics Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        {/* Total Omset */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Pendapatan (Omset)</span>
            <span className="text-base md:text-lg font-black text-slate-900 font-mono tracking-tight mt-0.5 block">
              {formatCurrency(totalRevenue)}
            </span>
          </div>
        </div>

        {/* Laba Bersih */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimasi Laba Bersih</span>
            <span className="text-base md:text-lg font-black text-emerald-600 font-mono tracking-tight mt-0.5 block">
              {formatCurrency(totalProfit)}
            </span>
          </div>
        </div>

        {/* Total Penjualan */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-sky-50 text-sky-600">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Jumlah Transaksi</span>
            <span className="text-base md:text-lg font-black text-slate-900 font-mono mt-0.5 block">
              {activeTx.length} struk
            </span>
          </div>
        </div>

        {/* Barang Terjual */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-rose-50 text-rose-600">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Barang Terjual</span>
            <span className="text-base md:text-lg font-black text-slate-900 font-mono mt-0.5 block">
              {totalItemsSold} pcs
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Visual Graphics panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        
        {/* Graph 1: Daily Revenue distribution */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tren Kolom Penjualan (Hourly/Daily)</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Pendapatan kotor per nominal struk terbaru.</p>
          </div>

          {/* Custom SVG Column Graph */}
          <div className="h-40 flex items-end justify-between space-x-2 pt-6 pb-2 px-1 select-none">
            {activeTx.length === 0 ? (
              <div className="w-full text-center text-slate-400 text-xs py-8">Belum ada grafik tersedia</div>
            ) : (
              // Show last 6 transactions as interactive bar columns
              activeTx.slice(-6).map((tx, idx) => {
                const maxTotal = Math.max(...activeTx.map(t => t.total)) || 1;
                const heightPercentage = Math.max(12, (tx.total / maxTotal) * 100);
                
                return (
                  <div key={tx.id} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-1.5 bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-15 pointer-events-none font-mono">
                      {tx.invoiceNumber}<br/>{formatCurrency(tx.total)}
                    </div>
                    
                    {/* Column */}
                    <div 
                      style={{ height: `${heightPercentage}%` }}
                      className="w-full rounded-t-md bg-gradient-to-t from-blue-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 transition-all duration-300 shadow-xs"
                    />
                    
                    {/* Invoice ID tag */}
                    <span className="text-[9px] font-mono text-slate-500 mt-1.5 block">
                      #{tx.invoiceNumber.split('-')[2]}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Graph 2: Category Quantity split Progress Bars */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Proporsi Penjualan Kategori</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Persentase produk terjual berdasarkan kategori.</p>
          </div>

          <div className="space-y-3.5 pt-4">
            {categoryShares.map((share, idx) => {
              const barColors = [
                'bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-rose-500', 'bg-slate-400'
              ];
              const color = barColors[idx % barColors.length];

              return (
                <div key={share.category} className="space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-semibold text-slate-700">
                    <span className="flex items-center">
                      <span className={`w-2 h-2 rounded-full ${color} mr-2`} />
                      {share.category}
                    </span>
                    <span className="font-mono text-slate-500">{share.percentage}% ({share.qty} pcs)</span>
                  </div>
                  {/* Outer track */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${share.percentage}%` }}
                      className={`${color} h-full rounded-full transition-all duration-500`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Graph 3: Top Selling products leaderboard */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Produk Terlaris (Top 5)</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Produk paling dicari dengan perolehan omset tertinggi.</p>
          </div>

          <div className="space-y-3.5 pt-4">
            {topProducts.length === 0 ? (
              <div className="text-center text-slate-400 text-xs py-8">Belum ada data produk terlaris</div>
            ) : (
              topProducts.map((p, idx) => {
                const maxQty = Math.max(...topProducts.map(t => t.qty)) || 1;
                const percent = Math.round((p.qty / maxQty) * 100);

                return (
                  <div key={p.name} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px] leading-none">
                      <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                        {idx + 1}. {p.name}
                      </span>
                      <span className="font-mono font-bold text-slate-600 shrink-0">{p.qty} terjual</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Bar */}
                      <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${percent}%` }}
                          className="bg-sky-500 h-full rounded-full"
                        />
                      </div>
                      <span className="text-[9px] font-bold text-blue-600 font-mono shrink-0 w-16 text-right">
                        {formatCurrency(p.revenue)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Bottom section: Audit history lists */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        
        {/* Table Filter header */}
        <div className="px-4 py-3 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center space-x-2">
            <Receipt className="w-4.5 h-4.5 text-blue-600" />
            <span className="font-bold text-slate-800 text-xs">Arsip Pembukuan Transaksi</span>
          </div>

          {/* Filters controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Cari No. Invoice / Member..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-2 py-1 w-full text-xs rounded border border-slate-200 bg-white"
              />
            </div>

            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value as any)}
              className="px-2 py-1 text-xs rounded border border-slate-200 bg-white"
            >
              <option value="Semua">Metode: Semua</option>
              <option value="Tunai">Tunai</option>
              <option value="QRIS">QRIS</option>
              <option value="Debit">Debit</option>
              <option value="Transfer">Transfer</option>
            </select>
          </div>
        </div>

        {/* Grid Ledger Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold tracking-wider uppercase">
                <th className="py-2.5 px-4">No. Invoice</th>
                <th className="py-2.5 px-4 w-28">Tanggal Jam</th>
                <th className="py-2.5 px-4">Nama Pelanggan</th>
                <th className="py-2.5 px-4 w-28 text-center">Metode</th>
                <th className="py-2.5 px-4 text-right">Subtotal</th>
                <th className="py-2.5 px-4 text-right">Potongan</th>
                <th className="py-2.5 px-4 text-right w-28">Total Bersih</th>
                <th className="py-2.5 px-4 text-center w-24">Status</th>
                <th className="py-2.5 px-4 text-center w-32">Opsi Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-mono">
              {filteredTx.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-sans">
                    <CheckCircle2 className="w-12 h-12 text-slate-200 mx-auto mb-2.5 stroke-1" />
                    <p className="font-semibold text-sm">Tidak ada transaksi ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">Lakukan transaksi baru di mesin kasir.</p>
                  </td>
                </tr>
              ) : (
                filteredTx.map(tx => {
                  const dateObj = new Date(tx.date);
                  const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1} ${dateObj.getHours()}:${dateObj.getMinutes()}`;
                  const isRefunded = tx.status === 'DIREFUND';

                  return (
                    <tr key={tx.id} className={`hover:bg-slate-55/50 transition-colors ${isRefunded ? 'bg-rose-50/20 text-slate-400' : 'text-slate-700'}`}>
                      {/* Invoice */}
                      <td className="py-3 px-4 font-bold text-slate-900 leading-none">
                        {tx.invoiceNumber}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-500 text-[10px]">
                        {formattedDate}
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4 font-sans font-medium">
                        {tx.customerName || 'Pelanggan Umum'}
                      </td>

                      {/* Method */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          tx.paymentMethod === 'Tunai' ? 'bg-emerald-100 text-emerald-800' :
                          tx.paymentMethod === 'QRIS' ? 'bg-blue-100 text-blue-800' :
                          'bg-sky-100 text-sky-800'
                        }`}>
                          {tx.paymentMethod}
                        </span>
                      </td>

                      {/* Subtotal */}
                      <td className="py-3 px-4 text-right text-slate-500 font-semibold">
                        {formatCurrency(tx.subtotal)}
                      </td>

                      {/* Discount */}
                      <td className="py-3 px-4 text-right text-rose-500 font-medium">
                        {tx.discountNominal + (tx.subtotal * tx.discountPercent / 100) > 0 
                          ? `-${formatCurrency(tx.discountNominal + (tx.subtotal * tx.discountPercent / 100))}`
                          : 'Rp0'
                        }
                      </td>

                      {/* Grand Total */}
                      <td className={`py-3 px-4 text-right font-bold text-slate-800 ${isRefunded ? 'line-through text-slate-300' : ''}`}>
                        {formatCurrency(tx.total)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                          isRefunded 
                            ? 'bg-rose-100 text-rose-700' 
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {tx.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Detail / Thermal receipt */}
                          <button
                            onClick={() => setSelectedTxForReceipt(tx)}
                            className="p-1 hover:text-blue-600 hover:bg-blue-50 text-slate-400 rounded transition-all"
                            title="Tinjau Slip Struk"
                          >
                            <Printer className="w-3.8 h-3.8" />
                          </button>

                          {/* Refund trigger */}
                          <button
                            onClick={() => handleRefundTransaction(tx)}
                            disabled={isRefunded}
                            className={`p-1 rounded transition-all ${
                              isRefunded 
                                ? 'text-slate-200 cursor-not-allowed' 
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                            title={isRefunded ? 'Selesai Direfund' : 'Lakukan Pembatalan / Refund'}
                          >
                            <Undo2 className="w-3.8 h-3.8" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Footer bar */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider text-right">
          Total Rekaman: {filteredTx.length} Transaksi Audit Terdaftar
        </div>
      </div>

      {/* Reprint Receipt overlay drawer */}
      {selectedTxForReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-5 w-full max-w-sm overflow-hidden flex flex-col relative animate-scale-up">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-2 mb-3 border-b border-slate-200 select-none">
              <span className="text-xs font-bold text-slate-700">Arsip Struk Transaksi</span>
              <button 
                onClick={() => setSelectedTxForReceipt(null)}
                className="text-slate-400 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated thermal receipt paper roll */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 overflow-y-auto max-h-[60vh] font-mono text-[11px] leading-relaxed text-slate-800">
              <div className="text-center space-y-0.5 pb-2.5 border-b border-dashed border-slate-400">
                <span className="font-bold text-xs tracking-wide text-slate-900 block">TOKO KASIR MODERN</span>
                <span className="text-[10px] text-slate-500 block">Kec. Sudirman, Jakarta Pusat</span>
                <span className="text-[10px] text-slate-500 block">Telp: 021-8894532</span>
              </div>

              {/* Bill Meta */}
              <div className="py-2 border-b border-dashed border-slate-400 text-slate-600 text-[10px] space-y-0.5">
                <div>No. Struk: <span className="font-bold text-slate-800">{selectedTxForReceipt.invoiceNumber}</span></div>
                <div>Tanggal: {new Date(selectedTxForReceipt.date).toLocaleString('id-ID')}</div>
                <div>Kasir: {selectedTxForReceipt.cashierName.toUpperCase()}</div>
                <div>Pelanggan: {selectedTxForReceipt.customerName || 'Umum'}</div>
                {selectedTxForReceipt.status === 'DIREFUND' && (
                  <div className="text-rose-600 font-extrabold text-[10px] uppercase border border-rose-600 text-center py-0.5 mt-1">*** TELAH DI-REFUND / BATAL ***</div>
                )}
              </div>

              {/* Items List */}
              <div className="py-2 border-b border-dashed border-slate-400 space-y-2">
                {selectedTxForReceipt.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="font-semibold">{item.name}</div>
                    <div className="flex justify-between text-slate-500 text-[10px]">
                      <span>{item.quantity} x {formatCurrency(item.sellPrice * (1 - item.discountPercent / 100))}</span>
                      <span className="font-bold text-slate-800">{formatCurrency(item.totalPrice)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="py-2 space-y-1 text-slate-700">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedTxForReceipt.subtotal)}</span>
                </div>
                
                {selectedTxForReceipt.discountPercent > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Diskon {selectedTxForReceipt.discountPercent}%:</span>
                    <span>-{formatCurrency(Math.round((selectedTxForReceipt.subtotal * selectedTxForReceipt.discountPercent) / 100))}</span>
                  </div>
                )}

                {selectedTxForReceipt.discountNominal > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Potongan Harga:</span>
                    <span>-{formatCurrency(selectedTxForReceipt.discountNominal)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Pajak (PPN {selectedTxForReceipt.taxPercent}%):</span>
                  <span>{formatCurrency(selectedTxForReceipt.taxNominal)}</span>
                </div>

                <div className="flex justify-between border-t border-dashed border-slate-300 pt-2 text-slate-900 font-extrabold text-xs">
                  <span>TOTAL BELANJA:</span>
                  <span>{formatCurrency(selectedTxForReceipt.total)}</span>
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                  <span>Pembayaran {selectedTxForReceipt.paymentMethod}:</span>
                  <span className="font-bold text-slate-700">{formatCurrency(selectedTxForReceipt.amountPaid)}</span>
                </div>

                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Uang Kembali:</span>
                  <span className="font-bold text-slate-700">{formatCurrency(selectedTxForReceipt.amountChange)}</span>
                </div>
              </div>

              <div className="text-center pt-3 border-t border-dashed border-slate-400 mt-2">
                <span className="text-[8px] text-slate-400 block uppercase font-medium">Re-print Struk Resmi Toko</span>
                <span className="text-[8px] text-slate-400 block font-mono">{selectedTxForReceipt.id}</span>
              </div>
            </div>

            {/* Print action buttons */}
            <div className="mt-4 flex space-x-2.5">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Salinan</span>
              </button>
              <button
                onClick={() => setSelectedTxForReceipt(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
