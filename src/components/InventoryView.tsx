import React, { useState } from 'react';
import { Product, Category } from '../types';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  TrendingUp, 
  PackageCheck,
  ChevronDown,
  RotateCcw,
  Check,
  Tag,
  Eye,
  FileDown,
  X
} from 'lucide-react';

interface InventoryViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  openNotification: (type: 'success' | 'error' | 'warning' | 'info', msg: string) => void;
}

export default function InventoryView({
  products,
  setProducts,
  openNotification
}: InventoryViewProps) {
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'Semua'>('Semua');
  
  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form fields
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Makanan');
  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState('');

  // Search filter
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.includes(searchTerm);
    const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Low stock counter
  const lowStockProducts = products.filter(p => p.stock <= 5);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  const resetForm = () => {
    setSku('');
    setName('');
    setCategory('Makanan');
    setBuyPrice(0);
    setSellPrice(0);
    setStock(0);
    setImageUrl('');
    setEditingProduct(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    // Pre-populate mock SKU for quick testing
    setSku(`899${Math.floor(100000000 + Math.random() * 900000000)}`);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setSku(p.sku);
    setName(p.name);
    setCategory(p.category);
    setBuyPrice(p.buyPrice);
    setSellPrice(p.sellPrice);
    setStock(p.stock);
    setImageUrl(p.imageUrl || '');
    setIsFormOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();

    if (!sku.trim() || !name.trim()) {
      openNotification('error', 'Semua kolom wajib diisi!');
      return;
    }

    if (sellPrice <= buyPrice) {
      openNotification('warning', 'Peringatan: Harga Jual disarankan lebih tinggi dari Harga Beli untuk menghindari kerugian.');
    }

    if (editingProduct) {
      // Edit
      setProducts(prev => prev.map(p => 
        p.id === editingProduct.id 
          ? { ...p, sku, name, category, buyPrice, sellPrice, stock, imageUrl: imageUrl.trim() || undefined } 
          : p
      ));
      openNotification('success', `Berhasil memperbarui produk: ${name}`);
    } else {
      // Create new
      const newProd: Product = {
        id: `prod-${Math.random().toString(36).substring(2, 9)}`,
        sku,
        name,
        category,
        buyPrice,
        sellPrice,
        stock,
        imageUrl: imageUrl.trim() || undefined
      };
      setProducts(prev => [newProd, ...prev]);
      openNotification('success', `Berhasil menambahkan produk baru: ${name}`);
    }

    setIsFormOpen(false);
    resetForm();
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus produk "${name}" dari inventaris?`)) {
      setProducts(prev => prev.filter(p => p.id !== id));
      openNotification('info', `Produk "${name}" telah dihapus.`);
    }
  };

  const handleBulkRestock = () => {
    if (confirm('Simulasi: Tambahkan +10 stok untuk SEMUA produk yang kritis/habis (stok <= 5)?')) {
      setProducts(prev => prev.map(p => p.stock <= 5 ? { ...p, stock: p.stock + 10 } : p));
      openNotification('success', 'Stok darurat berhasil ditambah (+10 pcs) untuk produk kritis.');
    }
  };

  const handleExportBackup = () => {
    openNotification('info', 'Menyiapkan berkas ekspor inventaris...');
    setTimeout(() => {
      const jsonStr = JSON.stringify(products, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Backup-Inventaris-Kasir-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      openNotification('success', 'Backup database produk berhasil diunduh (JSON).');
    }, 500);
  };

  return (
    <div className="flex-1 flex flex-col p-6 bg-slate-50 overflow-hidden select-none">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Manajemen Inventaris & Stok</h2>
          <p className="text-xs text-slate-500 mt-0.5">Kelola seluruh database produk barang dagangan toko Anda di sini.</p>
        </div>
        
        {/* Actions bar */}
        <div className="flex flex-wrap gap-2.5 mt-3 md:mt-0">
          {lowStockProducts.length > 0 && (
            <button
              onClick={handleBulkRestock}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <AlertTriangle className="w-4 h-4 animate-bounce" />
              <span>Restock Kritis (+10)</span>
            </button>
          )}

          <button
            onClick={handleExportBackup}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
          >
            <FileDown className="w-4 h-4 text-slate-500" />
            <span>Ekspor Backup</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>TAMBAH BARANG (BARU)</span>
          </button>
        </div>
      </div>

      {/* Row Alert Widget for critical stocks */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start space-x-3 text-amber-900 animate-slide-down">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold">Peringatan Stok Kritis!</h4>
            <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
              Terdapat <span className="font-bold text-amber-900">{lowStockProducts.length} produk</span> dengan sisa stok kritis (kurang dari atau sama dengan 5 pcs). Segera lakukan pembelian stok ke distributor.
            </p>
          </div>
        </div>
      )}

      {/* Database Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Cari SKU / nama barang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-1.5 w-full text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Category Filter tabs */}
        <div className="flex space-x-1.5 overflow-x-auto scrollbar-none">
          {['Semua', 'Makanan', 'Minuman', 'Sembako', 'Snack', 'Lainnya'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat as Category | 'Semua')}
              className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Database Table Grid */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold tracking-wider uppercase select-none">
                <th className="py-3 px-4 w-32">SKU Barcode</th>
                <th className="py-3 px-4">Nama Barang</th>
                <th className="py-3 px-4 w-32">Kategori</th>
                <th className="py-3 px-4 w-28 text-right">Harga Modal</th>
                <th className="py-3 px-4 w-28 text-right">Harga Jual</th>
                <th className="py-3 px-4 w-24 text-right">Profit / pcs</th>
                <th className="py-3 px-4 w-24 text-center">Stok Sisa</th>
                <th className="py-3 px-4 w-28 text-center">Opsi Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <PackageCheck className="w-12 h-12 text-slate-200 mx-auto mb-2.5 stroke-1" />
                    <p className="font-semibold text-sm">Tidak ada data produk</p>
                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci atau buat produk baru.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const profit = p.sellPrice - p.buyPrice;
                  const isOutOfStock = p.stock <= 0;
                  const isLow = p.stock > 0 && p.stock <= 5;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* SKU */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-500">
                        {p.sku}
                      </td>
                      
                      {/* Name with icon preview if available */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} className="w-8 h-8 rounded-md object-cover border border-slate-200" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                              <Tag className="w-4 h-4 stroke-1.5" />
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-slate-800 block leading-tight">{p.name}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">ID: {p.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                          {p.category}
                        </span>
                      </td>

                      {/* Buy Price */}
                      <td className="py-3.5 px-4 text-right font-semibold font-mono text-slate-600">
                        {formatCurrency(p.buyPrice)}
                      </td>

                      {/* Sell Price */}
                      <td className="py-3.5 px-4 text-right font-bold font-mono text-slate-800">
                        {formatCurrency(p.sellPrice)}
                      </td>

                      {/* Profit */}
                      <td className={`py-3.5 px-4 text-right font-semibold font-mono ${profit >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {formatCurrency(profit)}
                      </td>

                      {/* Stock indicator badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block font-mono font-bold text-xs px-2.5 py-0.5 rounded-full ${
                          isOutOfStock 
                            ? 'bg-rose-100 text-rose-800' 
                            : isLow 
                            ? 'bg-amber-100 text-amber-800 animate-pulse' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {p.stock}
                        </span>
                      </td>

                      {/* Action edit/delete */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="Edit Produk"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-4 h-4" />
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
        
        {/* Table summary bar */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase select-none">
          <span>Menampilkan {filteredProducts.length} dari {products.length} Barang</span>
          <span>Database: SQLite Encrypted Engine</span>
        </div>
      </div>

      {/* CRUD Form Modal overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Modal Head */}
            <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
              <h3 className="font-bold text-sm">
                {editingProduct ? 'Edit Barang Inventaris' : 'Tambah Barang Inventaris Baru'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form body */}
            <form onSubmit={handleSaveProduct} className="p-5 space-y-4">
              
              {/* SKU Barcode input */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-1">SKU / Barcode *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 89901..."
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded border border-slate-250 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                {/* Category select */}
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-1">Kategori *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full px-3 py-1.5 text-xs rounded border border-slate-250 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {['Makanan', 'Minuman', 'Sembako', 'Snack', 'Lainnya'].map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-1">Nama Barang dagangan *</label>
                <input
                  type="text"
                  required
                  placeholder="Ketik nama lengkap produk..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-250 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Financial entries (Buy / Sell) */}
              <div className="grid grid-cols-3 gap-3">
                {/* Harga Beli */}
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-1">Harga Modal (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded border border-slate-250 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                {/* Harga Jual */}
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-1">Harga Jual (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded border border-slate-250 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                {/* Stok */}
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-1">Jumlah Stok *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded border border-slate-250 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Image URL Optional */}
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-1">URL Foto Produk (Opsional / Unsplash)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-250 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Actions */}
              <div className="border-t border-slate-100 pt-4 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow transition-colors flex items-center"
                >
                  <Check className="w-4 h-4 mr-1" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}


