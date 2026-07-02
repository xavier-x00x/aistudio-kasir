import { Product, Transaction } from './types';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    sku: '899886620021',
    name: 'Indomie Goreng Spesial',
    category: 'Makanan',
    buyPrice: 2800,
    sellPrice: 3500,
    stock: 48,
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=120&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' // Noodle placeholder
  },
  {
    id: 'prod-2',
    sku: '742111000321',
    name: 'Aqua Air Mineral Gelas 240ml',
    category: 'Minuman',
    buyPrice: 800,
    sellPrice: 1500,
    stock: 120,
    imageUrl: 'https://images.unsplash.com/photo-1608889174633-41a1c22502e4?w=120&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' // Water placeholder
  },
  {
    id: 'prod-3',
    sku: '899318820015',
    name: 'Teh Pucuk Harum 350ml',
    category: 'Minuman',
    buyPrice: 2400,
    sellPrice: 3500,
    stock: 64,
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=120&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' // Tea placeholder
  },
  {
    id: 'prod-4',
    sku: '899200110411',
    name: 'Chitato Sapi Panggang 68g',
    category: 'Snack',
    buyPrice: 8200,
    sellPrice: 10500,
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d22?w=120&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' // Snack placeholder
  },
  {
    id: 'prod-5',
    sku: '899100230044',
    name: 'Minyak Goreng Bimoli 1L',
    category: 'Sembako',
    buyPrice: 16500,
    sellPrice: 19500,
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=120&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' // Bottle oil placeholder
  },
  {
    id: 'prod-6',
    sku: '899300411090',
    name: 'Beras Pandan Wangi Super 5kg',
    category: 'Sembako',
    buyPrice: 68000,
    sellPrice: 79000,
    stock: 8,
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=120&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' // Rice grain placeholder
  },
  {
    id: 'prod-7',
    sku: '899454120012',
    name: 'Gula Pasir Gulaku Premium 1kg',
    category: 'Sembako',
    buyPrice: 14200,
    sellPrice: 17000,
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1581781894509-322081634ab9?w=120&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' // Sugar placeholder
  },
  {
    id: 'prod-8',
    sku: '899100110034',
    name: 'Kopi Kapal Api Mix 10 Sachet',
    category: 'Snack',
    buyPrice: 12500,
    sellPrice: 15000,
    stock: 35,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=120&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' // Coffee cup placeholder
  },
  {
    id: 'prod-9',
    sku: '899100240410',
    name: 'Silverqueen Almond 58g',
    category: 'Snack',
    buyPrice: 12000,
    sellPrice: 15500,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1548907040-4d42b52145ca?w=120&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' // Chocolate placeholder
  },
  {
    id: 'prod-10',
    sku: '049000000443',
    name: 'Coca-Cola Kaleng 330ml',
    category: 'Minuman',
    buyPrice: 4800,
    sellPrice: 6500,
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=120&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' // Cola placeholder
  },
  {
    id: 'prod-11',
    sku: '899886620014',
    name: 'Indomie Kuah Ayam Bawang',
    category: 'Makanan',
    buyPrice: 2700,
    sellPrice: 3400,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=120&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' // Bowl placeholder
  },
  {
    id: 'prod-12',
    sku: '899999905624',
    name: 'Sabun Mandi Lifebuoy Red 85g',
    category: 'Lainnya',
    buyPrice: 3200,
    sellPrice: 4500,
    stock: 35,
    imageUrl: 'https://images.unsplash.com/photo-1607006342411-9a33651610a1?w=120&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' // Soap placeholder
  },
  {
    id: 'prod-13',
    sku: '899999900214',
    name: 'Pasta Gigi Pepsodent 120g',
    category: 'Lainnya',
    buyPrice: 9500,
    sellPrice: 12500,
    stock: 24,
    imageUrl: 'https://images.unsplash.com/photo-1559591937-e620a2143e44?w=120&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' // Toothpaste placeholder
  },
  {
    id: 'prod-14',
    sku: '899100230552',
    name: 'Taro Net Rumput Laut 36g',
    category: 'Snack',
    buyPrice: 3800,
    sellPrice: 5000,
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1599490659273-1d5108f4dd84?w=120&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' // Crackers placeholder
  },
  {
    id: 'prod-15',
    sku: '899100130022',
    name: 'Susu UHT Ultra Milk Cokelat 250ml',
    category: 'Minuman',
    buyPrice: 5100,
    sellPrice: 6800,
    stock: 36,
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=120&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' // Milk carton placeholder
  }
];

// Seed some realistic historical transactions distributed over the past 24 hours
// (This gives users fully functional reports right on initialization!)
export const generateSeedTransactions = (): Transaction[] => {
  const products = DEFAULT_PRODUCTS;
  const now = new Date();
  
  // Format helpers
  const pad = (num: number) => num.toString().padStart(2, '0');
  const getInvoiceStr = (date: Date, seq: number) => {
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    return `INV-${year}${month}${day}-${pad(seq)}`;
  };

  const cashiers = ['Ahmad Syarif', 'Siti Rahma', 'Budi Santoso'];
  const methods: ('Tunai' | 'QRIS' | 'Debit' | 'Transfer')[] = ['Tunai', 'QRIS', 'Debit', 'Tunai', 'QRIS'];

  const transactions: Transaction[] = [];

  // Generate 8 mock transactions across yesterday and today
  for (let i = 8; i >= 1; i--) {
    const txDate = new Date();
    txDate.setHours(now.getHours() - (i * 2.5) - Math.random() * 2); // Spread them in the past
    
    // Choose 2-4 random items
    const numItems = Math.floor(Math.random() * 3) + 2;
    const selectedItems = [];
    let subtotal = 0;
    
    // Shuffle products to pick random ones
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    
    for (let j = 0; j < Math.min(numItems, shuffled.length); j++) {
      const p = shuffled[j];
      const qty = Math.floor(Math.random() * 3) + 1; // 1 to 3 items
      const discount = Math.random() > 0.85 ? 10 : 0; // 10% discount occasionally
      const priceAfterDiscount = p.sellPrice * (1 - discount / 100);
      const totalItemPrice = priceAfterDiscount * qty;
      
      selectedItems.push({
        productId: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        buyPrice: p.buyPrice,
        sellPrice: p.sellPrice,
        quantity: qty,
        discountPercent: discount,
        totalPrice: totalItemPrice
      });
      
      subtotal += totalItemPrice;
    }

    const txDiscountPercent = Math.random() > 0.9 ? 5 : 0; // 5% cart discount sometimes
    const txDiscountNominal = Math.round((subtotal * txDiscountPercent) / 100);
    const afterDiscount = subtotal - txDiscountNominal;
    
    const taxPercent = 11; // 11% PPN Indonesia
    const taxNominal = Math.round((afterDiscount * taxPercent) / 100);
    const grandTotal = afterDiscount + taxNominal;

    const method = methods[i % methods.length];
    const cashier = cashiers[i % cashiers.length];
    
    let paid = grandTotal;
    if (method === 'Tunai') {
      // Round up to nearest cash note
      const bills = [10000, 20000, 50000, 100000];
      const matchingBill = bills.find(b => b >= grandTotal) || (Math.ceil(grandTotal / 50000) * 50000);
      paid = matchingBill;
    }
    
    const change = paid - grandTotal;

    transactions.push({
      id: `tx-${generateId()}`,
      invoiceNumber: getInvoiceStr(txDate, 9 - i),
      date: txDate.toISOString(),
      items: selectedItems,
      subtotal,
      discountPercent: txDiscountPercent,
      discountNominal: txDiscountNominal,
      taxPercent,
      taxNominal,
      total: grandTotal,
      paymentMethod: method,
      amountPaid: paid,
      amountChange: change,
      cashierName: cashier,
      customerName: Math.random() > 0.7 ? 'Pelanggan Member' : 'Pelanggan Umum',
      status: 'BERHASIL'
    });
  }

  return transactions;
};
