export type Category = 'Makanan' | 'Minuman' | 'Sembako' | 'Snack' | 'Lainnya';

export interface Product {
  id: string;
  sku: string; // Barcode / SKU
  name: string;
  category: Category;
  buyPrice: number; // Harga Beli
  sellPrice: number; // Harga Jual
  stock: number;
  imageUrl?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discountPercent?: number; // Diskon khusus per item (%)
}

export interface TransactionItem {
  productId: string;
  sku: string;
  name: string;
  category: Category;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  discountPercent: number;
  totalPrice: number; // (sellPrice * quantity) * (1 - discountPercent/100)
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  date: string;
  items: TransactionItem[];
  subtotal: number;
  discountPercent: number; // Diskon transaksi (%)
  discountNominal: number; // Diskon transaksi (Rp)
  taxPercent: number; // Pajak (%) e.g. PPN 11%
  taxNominal: number;
  total: number;
  paymentMethod: 'Tunai' | 'QRIS' | 'Debit' | 'Transfer';
  amountPaid: number;
  amountChange: number;
  cashierName: string;
  customerName?: string;
  status: 'BERHASIL' | 'DIREFUND';
  notes?: string;
}

export interface Cashier {
  id: string;
  name: string;
  role: 'Admin' | 'Kasir';
  isActive: boolean;
}

export interface Shift {
  id: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  startCash: number;
  expectedEndCash: number;
  actualEndCash?: number;
  totalSalesCount: number;
  totalRevenue: number;
  notes?: string;
}

export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}
