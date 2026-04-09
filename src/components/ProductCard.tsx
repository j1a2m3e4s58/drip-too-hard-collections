import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Heart } from 'lucide-react';
import { Product } from '../types';
import { Link } from 'react-router-dom';
import { useWishlist } from '../hooks/useWishlist';
import { useCart } from '../hooks/useCart';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const isLowStock = product.stockCount !== undefined && product.stockCount > 0 && product.stockCount < 5;
  const hasFlashSale = product.flashSalePrice && product.flashSalePrice > 0;
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const isInWishlist = wishlist.includes(product.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative"
    >
      <div className="relative overflow-hidden bg-zinc-900 aspect-[3/4]">
        <Link to={`/product/${product.id}`} className="block w-full h-full">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
        </Link>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none sm:top-4 sm:left-4 sm:gap-2">
          {!product.inStock || product.stockCount === 0 ? (
            <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2 py-1 tracking-tighter">
              Sold Out
            </span>
          ) : isLowStock ? (
            <span className="bg-orange-500 text-black text-[10px] font-black uppercase px-2 py-1 tracking-tighter">
              Only {product.stockCount} Left
            </span>
          ) : null}
          {product.isNew && (
            <span className="bg-white text-black text-[10px] font-black uppercase px-2 py-1 tracking-tighter">
              New Drop
            </span>
          )}
          {product.isBestseller && (
            <span className="bg-orange-500 text-black text-[10px] font-black uppercase px-2 py-1 tracking-tighter">
              Hottest
            </span>
          )}
          {hasFlashSale && (
            <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2 py-1 tracking-tighter animate-pulse">
              Flash Sale
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product.id);
          }}
          className={cn(
            "absolute top-3 right-3 p-2 rounded-full transition-all duration-300 z-10 sm:top-4 sm:right-4",
            isInWishlist ? "bg-orange-500 text-black" : "bg-black/40 text-white hover:bg-white hover:text-black backdrop-blur-md"
          )}
        >
          <Heart size={16} fill={isInWishlist ? "currentColor" : "none"} />
        </button>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto">
            {product.inStock && (product.stockCount === undefined || product.stockCount > 0) ? (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  addToCart(product);
                }}
                className="bg-white text-black px-4 py-2.5 sm:px-6 sm:py-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center space-x-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 hover:bg-orange-500"
              >
                <span>Add to Bag</span>
                <ShoppingBag size={14} />
              </button>
            ) : (
              <div className="bg-zinc-800 text-white/50 px-6 py-3 text-xs font-bold uppercase tracking-widest transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                Sold Out
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-1 sm:mt-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] text-orange-500 uppercase tracking-widest font-bold">
              {product.category}
            </p>
            <h3 className="text-[13px] leading-5 sm:text-sm font-bold text-white group-hover:text-orange-500 transition-colors">
              {product.name}
            </h3>
          </div>
          <div className="text-right">
            {hasFlashSale ? (
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-white/40 line-through font-mono">GHâ‚µ {product.price}</span>
                <span className="text-sm font-black text-orange-500 font-mono">GHâ‚µ {product.flashSalePrice}</span>
              </div>
            ) : (
              <p className="text-sm font-mono text-white/70">
                GHâ‚µ {product.price}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
