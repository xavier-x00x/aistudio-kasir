import React from 'react';
import { Product } from '../types';
import { ShoppingCart, AlertTriangle, Plus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  key?: any;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isMediumStock = product.stock > 5 && product.stock <= 15;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  return (
    <div
      onClick={() => !isOutOfStock && onAddToCart(product)}
      className={`group relative bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer select-none ${
        isOutOfStock 
          ? 'border-slate-200 bg-slate-50 opacity-65 cursor-not-allowed' 
          : 'border-slate-200 hover:border-blue-400 hover:-translate-y-0.5 active:translate-y-0'
      }`}
    >
      {/* Category Tag overlay */}
      <span className="absolute top-2.5 left-2.5 bg-slate-900/85 backdrop-blur-xs text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full z-10 shadow-xs">
        {product.category}
      </span>

      {/* Stock warning badge */}
      {isOutOfStock && (
        <span className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center z-10 select-none">
          STOK HABIS
        </span>
      )}

      {/* Main product photo or fallback design */}
      <div className="relative w-full h-32 bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-150">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center text-slate-355">
            <ShoppingCart className="w-10 h-10 stroke-1" />
            <span className="text-[10px] mt-1.5 font-medium uppercase tracking-wider">No Image</span>
          </div>
        )}

        {/* Action quick add button on hover */}
        {!isOutOfStock && (
          <div className="absolute inset-0 bg-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <div className="bg-blue-600 text-white p-2.5 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-all duration-200">
              <Plus className="w-5 h-5 font-bold" />
            </div>
          </div>
        )}
      </div>

      {/* Product Information Body */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
            {product.sku}
          </span>
          <h3 className="font-semibold text-slate-800 text-xs md:text-sm leading-tight line-clamp-2 mt-0.5 h-10">
            {product.name}
          </h3>
        </div>

        <div className="mt-2.5">
          {/* Price */}
          <div className="font-bold text-slate-900 text-sm md:text-base tracking-tight">
            {formatCurrency(product.sellPrice)}
          </div>

          {/* Stock Meter */}
          <div className="mt-1.5 flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <span className={`w-1.5 h-1.5 rounded-full ${
                isOutOfStock ? 'bg-rose-500' :
                isLowStock ? 'bg-amber-500 animate-pulse' :
                isMediumStock ? 'bg-yellow-400' : 'bg-emerald-500'
              }`} />
              <span className="text-[10px] text-slate-500 font-medium">
                Stok: <span className="font-semibold text-slate-700">{product.stock} pcs</span>
              </span>
            </div>

            {/* Warning visual indicators */}
            {isLowStock && (
              <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex items-center font-bold">
                <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> LIMIT
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
