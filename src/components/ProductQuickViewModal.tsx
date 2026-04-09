import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Heart, ShoppingBag, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { useWishlist } from '../hooks/useWishlist';
import { useCart } from '../hooks/useCart';
import { cn, formatGhanaCedis } from '../lib/utils';

interface ProductQuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

const ProductQuickViewModal = ({ product, onClose }: ProductQuickViewModalProps) => {
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [activeImage, setActiveImage] = useState('');
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  useEffect(() => {
    if (!product) {
      return;
    }

    setSelectedSize(product.sizeOptions?.[0] || '');
    setSelectedColor(product.colorOptions?.[0] || '');
    setActiveImage(product.image);
  }, [product]);

  const gallery = useMemo(() => Array.from(new Set([product?.image, ...(product?.galleryImages || [])].filter(Boolean))), [product]);
  const isInWishlist = wishlist.includes(product?.id || '');
  const currentPrice = product ? product.flashSalePrice || product.price : 0;

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm"
            aria-label="Close quick view"
          />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed inset-x-3 bottom-3 top-auto z-[81] max-h-[92svh] overflow-hidden border border-white/10 bg-zinc-950 shadow-2xl md:inset-x-0 md:left-1/2 md:top-1/2 md:h-[min(84vh,720px)] md:max-h-none md:w-[min(1120px,94vw)] md:-translate-x-1/2 md:-translate-y-1/2"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-400">Quick View</p>
              <button type="button" onClick={onClose} className="text-white/60 transition-colors hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="grid max-h-[calc(92svh-57px)] grid-cols-1 overflow-y-auto md:h-[calc(min(84vh,720px)-57px)] md:max-h-none md:grid-cols-[1fr_0.98fr] md:overflow-hidden">
              <div className="border-b border-white/10 p-4 md:flex md:min-h-0 md:flex-col md:border-b-0 md:border-r md:p-5">
                <div className="aspect-[4/5] overflow-hidden bg-zinc-900 md:flex md:min-h-0 md:flex-1 md:items-center md:justify-center md:aspect-auto md:p-4">
                  <img
                    src={activeImage || product.image}
                    alt={product.name}
                    className="h-full w-full object-cover md:max-h-full md:object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                {gallery.length > 1 && (
                  <div className="mt-3 grid grid-cols-4 gap-2 md:grid-cols-5">
                    {gallery.map((image) => (
                      <button
                        key={image}
                        type="button"
                        onClick={() => setActiveImage(image)}
                        className={cn(
                          'aspect-[4/5] overflow-hidden border bg-zinc-900',
                          activeImage === image ? 'border-orange-500' : 'border-white/10',
                        )}
                      >
                        <img src={image} alt={product.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 sm:p-5 md:min-h-0 md:overflow-y-auto">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-400">{product.category}</p>
                <h2 className="mt-2 text-2xl font-black uppercase italic tracking-tight">{product.name}</h2>
                <div className="mt-4 flex items-center gap-3">
                  <p className="text-2xl font-black">{formatGhanaCedis(currentPrice)}</p>
                  {!!product.flashSalePrice && product.flashSalePrice > 0 && (
                    <p className="text-sm text-white/35 line-through">{formatGhanaCedis(product.price)}</p>
                  )}
                </div>
                <p className="mt-4 text-sm leading-7 text-white/65">{product.description}</p>

                {!!product.sizeOptions?.length && (
                  <div className="mt-6">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Available Sizes</p>
                    <div className="flex flex-wrap gap-2">
                      {product.sizeOptions.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={cn(
                            'min-w-[52px] border px-3 py-2 text-[11px] font-black uppercase tracking-widest transition-colors',
                            selectedSize === size ? 'border-orange-500 bg-orange-500 text-black' : 'border-white/10 bg-zinc-900 text-white',
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!!product.colorOptions?.length && (
                  <div className="mt-6">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Available Colors</p>
                    <div className="flex flex-wrap gap-2">
                      {product.colorOptions.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={cn(
                            'min-w-[72px] border px-3 py-2 text-[11px] font-black uppercase tracking-widest transition-colors',
                            selectedColor === color ? 'border-orange-500 bg-orange-500 text-black' : 'border-white/10 bg-zinc-900 text-white',
                          )}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/65">
                  <div className="border border-white/10 bg-zinc-900 px-3 py-3">Fast Delivery</div>
                  <div className="border border-white/10 bg-zinc-900 px-3 py-3">Mobile Money Ready</div>
                  {product.stockCount !== undefined && product.stockCount < 5 && product.stockCount > 0 && (
                    <div className="border border-orange-500/30 bg-orange-500/10 px-3 py-3 text-orange-300">Only {product.stockCount} Left</div>
                  )}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      addToCart(product, selectedSize || undefined, selectedColor || undefined);
                      window.dispatchEvent(new Event('open-cart'));
                      onClose();
                    }}
                    className="inline-flex flex-1 items-center justify-center gap-2 bg-orange-500 px-5 py-3.5 text-sm font-black uppercase tracking-[0.18em] text-black transition-colors hover:bg-orange-400"
                  >
                    <ShoppingBag size={16} />
                    Add to Bag
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product.id)}
                    className={cn(
                      'inline-flex items-center justify-center gap-2 border px-5 py-3.5 text-sm font-black uppercase tracking-[0.18em] transition-colors',
                      isInWishlist ? 'border-orange-500 bg-orange-500 text-black' : 'border-white/10 bg-zinc-900 text-white',
                    )}
                  >
                    <Heart size={16} fill={isInWishlist ? 'currentColor' : 'none'} />
                    Wishlist
                  </button>
                </div>

                <Link
                  to={`/product/${product.id}`}
                  onClick={onClose}
                  className="mt-4 inline-flex text-sm font-bold uppercase tracking-[0.18em] text-white/70 transition-colors hover:text-orange-400"
                >
                  Open full product page
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProductQuickViewModal;
