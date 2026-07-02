import React, { useState, useRef, useEffect } from 'react';
import { Product, CartItem, Category } from '../types';
import ProductCard from './ProductCard';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Calculator, 
  QrCode,
  Sparkles,
  Ticket,
  Percent,
  Barcode,
  Keyboard,
  UserCheck,
  RotateCcw
} from 'lucide-react';

interface POSViewProps {
  products: Product[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  openPaymentModal: (subtotal: number, discountPercent: number, discountNominal: number, taxPercent: number, grandTotal: number, customerName: string) => void;
  openNotification: (type: 'success' | 'error' | 'warning' | 'info', msg: string) => void;
}

const CATEGORIES: (Category | 'Semua')[] = ['Semua', 'Makanan', 'Minuman', 'Sembako', 'Snack', 'Lainnya'];

export default function POSView({
  products,
  cart,
  setCart,
  openPaymentModal,
  openNotification
}: POSViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'Semua'>('Semua');
  const [skuInput, setSkuInput] = useState('');
  
  // Custom transaction-wide settings
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountNominal, setDiscountNominal] = useState(0);
  const [taxPercent, setTaxPercent] = useState(11); // Standard 11% PPN Indonesia
  
  // Customer settings
  const [customerType, setCustomerType] = useState<'Umum' | 'Member'>('Umum');
  const [memberId, setMemberId] = useState('');
  const [memberName, setMemberName] = useState('');

  const skuInputRef = useRef<HTMLInputElement>(null);

  // Trigger member discount
  useEffect(() => {
    if (customerType === 'Member') {
      setDiscountPercent(5); // Automatic 5% discount for members
      openNotification('info', 'Member Terdeteksi: Diskon Otomatis 5% Diterapkan');
    } else {
      setDiscountPercent(0);
      setMemberId('');
      setMemberName('');
    }
  }, [customerType]);

  // Handle hotkeys (F2 for checkout, F4 for clear)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        handleTriggerCheckout();
      } else if (e.key === 'F4') {
        e.preventDefault();
        handleClearCart();
      } else if (e.key === 'F9') {
        e.preventDefault();
        skuInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, discountPercent, discountNominal, taxPercent, customerType, memberName]);

  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      
      // Check stock limits
      const requestedQty = existing ? existing.quantity + 1 : 1;
      if (requestedQty > product.stock) {
        openNotification('warning', `Stok terbatas! Hanya tersisa ${product.stock} pcs untuk ${product.name}`);
        return prevCart;
      }

      openNotification('success', `Ditambahkan ke keranjang: ${product.name}`);
      
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const handleDecreaseQuantity = (productId: string) => {
    setCart((prevCart) => {
      const item = prevCart.find((i) => i.product.id === productId);
      if (!item) return prevCart;

      if (item.quantity <= 1) {
        return prevCart.filter((i) => i.product.id !== productId);
      }

      return prevCart.map((i) =>
        i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i
      );
    });
  };

  const handleRemoveFromCart = (productId: string, name: string) => {
    setCart((prevCart) => prevCart.filter((i) => i.product.id !== productId));
    openNotification('info', `Dihapus dari keranjang: ${name}`);
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
    setDiscountNominal(0);
    setDiscountPercent(customerType === 'Member' ? 5 : 0);
    openNotification('info', 'Keranjang kasir telah dikosongkan.');
  };

  // Simulate Barcode/SKU Instant Scanner
  const handleSkuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuInput.trim()) return;

    const matchedProduct = products.find(
      (p) => p.sku === skuInput.trim() || p.name.toLowerCase().includes(skuInput.toLowerCase())
    );

    if (matchedProduct) {
      // Simulate POS Laser Sound
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1400, audioCtx.currentTime); // High pitched beep
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.08); // Short duration beep
      } catch (err) {
        // AudioContext not supported or allowed yet, fail silently
      }

      handleAddToCart(matchedProduct);
      setSkuInput('');
    } else {
      openNotification('error', `SKU atau nama produk "${skuInput}" tidak ditemukan!`);
    }
  };

  // Calculations
  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => {
      const itemPrice = item.product.sellPrice;
      const discountAmount = item.discountPercent ? (itemPrice * item.discountPercent) / 100 : 0;
      return sum + (itemPrice - discountAmount) * item.quantity;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const discValue = Math.round((subtotal * discountPercent) / 100) + discountNominal;
  const subtotalAfterDiscount = Math.max(0, subtotal - discValue);
  const taxValue = Math.round((subtotalAfterDiscount * taxPercent) / 100);
  const grandTotal = subtotalAfterDiscount + taxValue;

  const handleTriggerCheckout = () => {
    if (cart.length === 0) {
      openNotification('error', 'Keranjang belanja masih kosong! Silakan pilih produk terlebih dahulu.');
      return;
    }

    const customerDisplayName = customerType === 'Member' 
      ? `Member [${memberId || 'MEM-089'}] ${memberName ? `- ${memberName}` : ''}`
      : 'Pelanggan Umum';

    openPaymentModal(subtotal, discountPercent, discountNominal, taxPercent, grandTotal, customerDisplayName);
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.includes(searchTerm);
    const matchesCategory = activeCategory === 'Semua' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-50">
      
      {/* LEFT COLUMN: Product Selector Catalog */}
      <div className="flex-1 flex flex-col border-r border-slate-200 overflow-hidden p-4">
        
        {/* SKU Simulator & Search Panel combined */}
        <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs mb-4">
          
          {/* Simulated SKU / Barcode input */}
          <form onSubmit={handleSkuSubmit} className="flex-1 relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Barcode className="w-5 h-5 text-blue-500" />
            </div>
            <input
              ref={skuInputRef}
              type="text"
              placeholder="Scan Barcode / Ketik SKU produk... [F9]"
              value={skuInput}
              onChange={(e) => setSkuInput(e.target.value)}
              className="pl-10 pr-24 py-2 w-full text-sm rounded-lg border border-slate-250 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono tracking-wider"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold tracking-wider transition-all"
            >
              Cari / Scan
            </button>
          </form>

          {/* Quick Search keyword */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Cari produk dengan kata kunci..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-sm rounded-lg border border-slate-250 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Category Pill Tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-3 scrollbar-thin select-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-350'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid wrapper */}
        <div className="flex-1 overflow-y-auto mt-2 pr-1">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center bg-white border border-dashed border-slate-200 rounded-xl p-8">
              <Search className="w-12 h-12 text-slate-300 stroke-1 mb-2" />
              <p className="text-slate-500 font-medium text-sm">Produk tidak ditemukan</p>
              <p className="text-slate-400 text-xs mt-1">Coba kata kunci lain atau ubah filter kategori Anda</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
              {filteredProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Active Cart Panel */}
      <div className="w-full lg:w-[420px] bg-white border-t lg:border-t-0 border-slate-200 flex flex-col justify-between overflow-hidden shadow-lg z-10">
        
        {/* Cart Header */}
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-800 text-sm">Keranjang Transaksi</span>
            <span className="bg-blue-100 text-blue-800 text-xs font-extrabold px-2 py-0.5 rounded-full">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </div>
          <button
            onClick={handleClearCart}
            disabled={cart.length === 0}
            className={`p-1.5 rounded-md transition-colors ${
              cart.length === 0 
                ? 'text-slate-300 cursor-not-allowed' 
                : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
            }`}
            title="Kosongkan Keranjang [F4]"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Customer Identity Panel */}
        <div className="p-3 border-b border-slate-100 bg-white">
          <div className="flex bg-slate-100 rounded-lg p-0.5 mb-2.5">
            <button
              onClick={() => setCustomerType('Umum')}
              className={`flex-1 text-center py-1 rounded-md text-xs font-semibold transition-all ${
                customerType === 'Umum' 
                  ? 'bg-white text-slate-800 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pelanggan Umum
            </button>
            <button
              onClick={() => setCustomerType('Member')}
              className={`flex-1 text-center py-1 rounded-md text-xs font-semibold transition-all flex items-center justify-center space-x-1 ${
                customerType === 'Member' 
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 mr-0.5" />
              <span>Pelanggan Member</span>
            </button>
          </div>

          {customerType === 'Member' && (
            <div className="grid grid-cols-2 gap-2 animate-slide-down">
              <input
                type="text"
                placeholder="ID Member (Contoh: M-204)"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded border border-amber-200 bg-amber-50/30 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 font-mono"
              />
              <input
                type="text"
                placeholder="Nama Pemilik"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded border border-amber-200 bg-amber-50/30 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>
          )}
        </div>

        {/* Cart Item list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 select-none">
              <ShoppingCart className="w-16 h-16 stroke-1 text-slate-200 mb-2.5" />
              <p className="text-sm font-semibold text-slate-400">Keranjang Masih Kosong</p>
              <p className="text-xs text-slate-400 text-center px-4 mt-1">
                Ketuk produk di sebelah kiri atau ketik barcode untuk memulai transaksi baru.
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const itemPrice = item.product.sellPrice;
              const hasDiscount = !!item.discountPercent;
              const priceAfterDiscount = hasDiscount ? (itemPrice * (1 - item.discountPercent! / 100)) : itemPrice;

              return (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between border-b border-slate-100 pb-3 group animate-fade-in"
                >
                  <div className="flex-1 pr-2">
                    <h4 className="text-xs font-semibold text-slate-800 leading-tight">
                      {item.product.name}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-[10px] font-mono text-slate-400">{item.product.sku}</span>
                      <span className="text-xs font-semibold text-slate-700">
                        {formatCurrency(priceAfterDiscount)}
                      </span>
                      {hasDiscount && (
                        <span className="text-[9px] line-through text-slate-400">
                          {formatCurrency(itemPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity and Actions */}
                  <div className="flex items-center space-x-2.5">
                    {/* Qty Controls */}
                    <div className="flex items-center bg-slate-100 rounded-md border border-slate-200 p-0.5">
                      <button
                        onClick={() => handleDecreaseQuantity(item.product.id)}
                        className="p-1 hover:bg-white hover:text-rose-500 rounded text-slate-600 transition-all focus:outline-none"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleAddToCart(item.product)}
                        className="p-1 hover:bg-white hover:text-emerald-500 rounded text-slate-600 transition-all focus:outline-none"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Delete Item */}
                    <button
                      onClick={() => handleRemoveFromCart(item.product.id, item.product.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Hapus item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Calculation Invoice Footer */}
        <div className="border-t border-slate-100 p-4 bg-slate-50/50 space-y-2.5">
          <div className="flex justify-between items-center text-xs text-slate-600">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
          </div>

          {/* Discount details */}
          <div className="flex justify-between items-center text-xs text-slate-600">
            <div className="flex items-center space-x-1">
              <span>Diskon</span>
              {discountPercent > 0 && (
                <span className="bg-rose-100 text-rose-800 text-[9px] font-bold px-1 rounded-sm">
                  {discountPercent}%
                </span>
              )}
            </div>
            <span className="font-semibold text-rose-600">
              -{formatCurrency(discValue)}
            </span>
          </div>

          {/* Tax details */}
          <div className="flex justify-between items-center text-xs text-slate-600">
            <div className="flex items-center space-x-1">
              <span>Pajak (PPN)</span>
              <span className="bg-slate-200 text-slate-700 text-[9px] font-bold px-1 rounded-sm">
                {taxPercent}%
              </span>
            </div>
            <span className="font-semibold text-slate-800">{formatCurrency(taxValue)}</span>
          </div>

          {/* Horizontal divider */}
          <div className="border-t border-slate-200 my-1 pt-2.5 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-800">TOTAL BELANJA</span>
            <span className="text-xl font-black text-blue-700 tracking-tight">
              {formatCurrency(grandTotal)}
            </span>
          </div>

          {/* Actions - Checkout Trigger */}
          <button
            onClick={handleTriggerCheckout}
            disabled={cart.length === 0}
            className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all shadow-md flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              cart.length === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg focus:ring-blue-500'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>BAYAR SEKARANG (F2)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
