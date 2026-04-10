import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Heart } from 'lucide-react';
import { Product } from '../types';
import { Link } from 'react-router-dom';
import { useWishlist } from '../hooks/useWishlist';
import { useCart } from '../hooks/useCart';
import { cn, formatGhanaCedis } from '../lib/utils';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  deliveryEta?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView, deliveryEta }) => {
  const addLockRef = useRef(false);
  const isLowStock = product.stockCount !== undefined && product.stockCount > 0 && product.stockCount < 5;
  const hasFlashSale = product.flashSalePrice && product.flashSalePrice > 0;
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const isInWishlist = wishlist.includes(product.id);

  const handleAddToBag = (event: React.SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (addLockRef.current) {
      return;
    }

    addLockRef.current = true;
    addToCart(product);

    window.setTimeout(() => {
      addLockRef.current = false;
    }, 700);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-900">
        <Link to={`/product/${product.id}`} className="block h-full w-full">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5 sm:left-4 sm:top-4 sm:gap-2">
          {!product.inStock || product.stockCount === 0 ? (
            <span className="bg-red-600 px-2 py-1 text-[10px] font-black uppercase tracking-tighter text-white">
              Sold Out
            </span>
          ) : isLowStock ? (
            <span className="bg-orange-500 px-2 py-1 text-[10px] font-black uppercase tracking-tighter text-black">
              Only {product.stockCount} Left
            </span>
          ) : null}
          {product.isNew && (
            <span className="bg-white px-2 py-1 text-[10px] font-black uppercase tracking-tighter text-black">
              New Drop
            </span>
          )}
          {product.isBestseller && (
            <span className="bg-orange-500 px-2 py-1 text-[10px] font-black uppercase tracking-tighter text-black">
              Hottest
            </span>
          )}
          {hasFlashSale && (
            <span className="animate-pulse bg-red-600 px-2 py-1 text-[10px] font-black uppercase tracking-tighter text-white">
              Flash Sale
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleWishlist(product.id);
          }}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          className={cn(
            'absolute right-3 top-3 z-10 rounded-full p-2 transition-all duration-300 sm:right-4 sm:top-4',
            isInWishlist ? 'bg-orange-500 text-black' : 'bg-black/40 text-white backdrop-blur-md hover:bg-white hover:text-black',
          )}
        >
          <Heart size={16} fill={isInWishlist ? 'currentColor' : 'none'} />
        </button>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="pointer-events-auto flex flex-col items-center gap-3">
            {product.inStock && (product.stockCount === undefined || product.stockCount > 0) ? (
              <button
                type="button"
                onClick={handleAddToBag}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onTouchStart={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                className="flex translate-y-4 items-center space-x-2 bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-black transition-transform duration-300 hover:bg-orange-500 group-hover:translate-y-0 sm:px-6 sm:py-3 sm:text-xs"
              >
                <span>Add to Bag</span>
                <ShoppingBag size={14} />
              </button>
            ) : (
              <div className="translate-y-4 bg-zinc-800 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white/50 transition-transform duration-300 group-hover:translate-y-0">
                Sold Out
              </div>
            )}
            {onQuickView && (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onQuickView(product);
                }}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                className="border border-white/20 bg-black/70 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-all duration-300 hover:border-orange-500 hover:text-orange-400"
              >
                Quick View
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-1 sm:mt-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">{product.category}</p>
            <h3 className="text-[13px] font-bold leading-5 text-white transition-colors group-hover:text-orange-500 sm:text-sm">
              {product.name}
            </h3>
          </div>
          <div className="text-right">
            {hasFlashSale ? (
              <div className="flex flex-col items-end">
                <span className="font-mono text-[10px] text-white/40 line-through">{formatGhanaCedis(product.price)}</span>
                <span className="font-mono text-sm font-black text-orange-500">{formatGhanaCedis(product.flashSalePrice)}</span>
              </div>
            ) : (
              <p className="font-mono text-sm text-white/70">{formatGhanaCedis(product.price)}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {deliveryEta && (
            <span className="border border-white/10 bg-zinc-900 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/55">
              ETA {deliveryEta}
            </span>
          )}
          {isLowStock && (
            <span className="border border-orange-500/25 bg-orange-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-orange-300">
              Low Stock
            </span>
          )}
        </div>
        {onQuickView && (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onQuickView(product);
            }}
            className="mt-2 inline-flex border border-white/10 bg-zinc-900 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/75 transition-colors hover:border-orange-500 hover:text-orange-400 md:hidden"
          >
            Quick View
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;
