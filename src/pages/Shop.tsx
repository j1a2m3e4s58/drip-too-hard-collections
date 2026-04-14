import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import ProductCard from '../components/ProductCard';
import ProductQuickViewModal from '../components/ProductQuickViewModal';
import { ProductCardSkeleton } from '../components/Skeleton';
import { db } from '../firebase';
import { DeliveryZone, Product } from '../types';
import { mergeWithImportedCatalogProducts } from '../lib/importedCatalog';
import { cn } from '../lib/utils';

const Shop = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Newest');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [priceFilter, setPriceFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');
  const [promoFilter, setPromoFilter] = useState('All');
  const [sizeFilter, setSizeFilter] = useState('All');
  const [colorFilter, setColorFilter] = useState('All');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      })) as Product[];
      setProducts(mergeWithImportedCatalogProducts(prods));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'deliveryZones'), orderBy('sortOrder', 'asc')), (snapshot) => {
      setDeliveryZones(
        snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }) as DeliveryZone)
          .filter((item) => item.active),
      );
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const incomingSearch = searchParams.get('q') || '';
    const incomingCategory = searchParams.get('category') || 'All';

    setSearchQuery(incomingSearch);
    setActiveCategory(incomingCategory);
  }, [searchParams]);

  const categories = ['All', ...Array.from(new Set(products.map((product) => product.category).filter(Boolean))) as string[]];
  const sizeOptions = ['All', ...Array.from(new Set(products.flatMap((product) => product.sizeOptions || []))).filter(Boolean)];
  const colorOptions = ['All', ...Array.from(new Set(products.flatMap((product) => product.colorOptions || []))).filter(Boolean)];
  const priceOptions = ['All', 'Under GH₵ 150', 'GH₵ 150 - 250', 'Above GH₵ 250'];
  const linkedIds = (searchParams.get('ids') || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const filteredProducts = products.filter((product) => {
    const normalizedQuery = searchQuery.toLowerCase();
    const productPrice = product.flashSalePrice || product.price;
    const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.category.toLowerCase().includes(normalizedQuery) ||
      product.description.toLowerCase().includes(normalizedQuery);
    const matchesLinkedIds = !linkedIds.length || linkedIds.includes(product.id);
    const matchesStock =
      stockFilter === 'All' ||
      (stockFilter === 'In Stock' && product.inStock && (product.stockCount === undefined || product.stockCount > 0)) ||
      (stockFilter === 'Low Stock' &&
        product.inStock &&
        product.stockCount !== undefined &&
        product.stockCount > 0 &&
        product.stockCount < 5) ||
      (stockFilter === 'Sold Out' && (!product.inStock || product.stockCount === 0));
    const matchesPromo =
      promoFilter === 'All' ||
      (promoFilter === 'Featured' && Boolean(product.featured)) ||
      (promoFilter === 'Flash Sale' && Boolean(product.flashSalePrice && product.flashSalePrice > 0)) ||
      (promoFilter === 'Best Seller' && Boolean(product.isBestseller)) ||
      (promoFilter === 'New Drop' && Boolean(product.isNew));
    const matchesSize =
      sizeFilter === 'All' || Boolean(product.sizeOptions?.includes(sizeFilter));
    const matchesColor =
      colorFilter === 'All' || Boolean(product.colorOptions?.includes(colorFilter));
    const matchesPrice =
      priceFilter === 'All' ||
      (priceFilter === 'Under GH₵ 150' && productPrice < 150) ||
      (priceFilter === 'GH₵ 150 - 250' && productPrice >= 150 && productPrice <= 250) ||
      (priceFilter === 'Above GH₵ 250' && productPrice > 250);

    return (
      matchesCategory &&
      matchesSearch &&
      matchesLinkedIds &&
      matchesStock &&
      matchesPromo &&
      matchesSize &&
      matchesColor &&
      matchesPrice
    );
  });

  const sortedProducts = useMemo(() => {
    const next = [...filteredProducts];

    switch (sortBy) {
      case 'Price: Low to High':
        next.sort((a, b) => (a.flashSalePrice || a.price) - (b.flashSalePrice || b.price));
        break;
      case 'Price: High to Low':
        next.sort((a, b) => (b.flashSalePrice || b.price) - (a.flashSalePrice || a.price));
        break;
      case 'Best Sellers':
        next.sort((a, b) => Number(Boolean(b.isBestseller)) - Number(Boolean(a.isBestseller)));
        break;
      default:
        break;
    }

    return next;
  }, [filteredProducts, sortBy]);

  const searchSuggestions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (normalizedQuery.length < 2) {
      return [];
    }

    const productMatches = products
      .filter(
        (product) =>
          product.name.toLowerCase().includes(normalizedQuery) ||
          product.category.toLowerCase().includes(normalizedQuery),
      )
      .slice(0, 5)
      .map((product) => ({
        key: `product-${product.id}`,
        label: product.name,
        meta: product.category,
        action: () => setSearchQuery(product.name),
      }));

    const categoryMatches = categories
      .filter((category) => category !== 'All' && category.toLowerCase().includes(normalizedQuery))
      .slice(0, 3)
      .map((category) => ({
        key: `category-${category}`,
        label: category,
        meta: 'Category',
        action: () => {
          setActiveCategory(category);
          setSearchQuery('');
        },
      }));

    return [...productMatches, ...categoryMatches].slice(0, 6);
  }, [categories, products, searchQuery]);

  const deliveryEta = useMemo(() => deliveryZones.find((item) => item.eta)?.eta || '', [deliveryZones]);
  const activeFilterCount = [priceFilter, stockFilter, promoFilter, sizeFilter, colorFilter].filter((item) => item !== 'All').length;

  const clearAdvancedFilters = () => {
    setPriceFilter('All');
    setStockFilter('All');
    setPromoFilter('All');
    setSizeFilter('All');
    setColorFilter('All');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black pb-24 pt-24 text-white md:pb-24 md:pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:gap-y-12 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24 pt-24 text-white md:pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 md:mb-12">
          <h1 className="mb-3 text-3xl font-black uppercase italic tracking-tighter sm:text-4xl md:mb-4 md:text-5xl">The Shop</h1>
          <p className="max-w-2xl text-sm leading-7 text-white/50 sm:text-base">
            Browse our full collection of premium streetwear. Filter by category or search for your next favorite piece.
          </p>
          {(linkedIds.length > 0 || searchQuery) && (
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-orange-400">
              Filtered for your selected collection or lookbook item
            </p>
          )}
        </div>

        <div className="mb-8 flex flex-col items-start gap-5 border-b border-white/10 pb-6 md:mb-12 md:gap-6 md:pb-8">
          <div className="flex w-full flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all sm:px-6 sm:text-xs ${
                  activeCategory === cat
                    ? 'bg-orange-500 text-black'
                    : 'bg-zinc-900 text-white hover:bg-white hover:text-black'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex w-full flex-col gap-3 md:gap-4 sm:flex-row lg:w-auto">
            <div className="relative flex-grow sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-white/10 bg-zinc-900 px-10 py-3 text-sm transition-colors focus:border-orange-500 focus:outline-none"
              />
              {searchSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 border border-white/10 bg-zinc-950 shadow-2xl">
                  {searchSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.key}
                      type="button"
                      onClick={suggestion.action}
                      className="flex w-full items-center justify-between border-b border-white/5 px-4 py-3 text-left text-sm text-white/80 transition-colors last:border-b-0 hover:bg-zinc-900 hover:text-white"
                    >
                      <span>{suggestion.label}</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-400">{suggestion.meta}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full cursor-pointer appearance-none border border-white/10 bg-zinc-900 px-4 py-3 pr-10 text-[11px] font-bold uppercase tracking-widest transition-colors focus:border-orange-500 focus:outline-none sm:px-6 sm:text-sm"
              >
                <option>Newest</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Best Sellers</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            </div>
          </div>
          </div>

          <div className="flex w-full flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAdvancedFilters((current) => !current)}
                className={cn(
                  'inline-flex items-center gap-2 border px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] transition-colors sm:text-xs',
                  showAdvancedFilters || activeFilterCount > 0
                    ? 'border-orange-500 bg-orange-500 text-black'
                    : 'border-white/10 bg-zinc-900 text-white/75 hover:border-orange-500 hover:text-orange-400'
                )}
              >
                <SlidersHorizontal size={14} />
                <span>Filters</span>
                {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
              </button>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearAdvancedFilters}
                  className="inline-flex items-center gap-2 border border-white/10 bg-zinc-900 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/65 transition-colors hover:border-white/30 hover:text-white sm:text-xs"
                >
                  <X size={14} />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>

            {showAdvancedFilters && (
              <div className="grid gap-3 border border-white/10 bg-zinc-950/70 p-4 sm:grid-cols-2 xl:grid-cols-5">
                <label className="space-y-2">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Price Range</span>
                  <select
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="w-full border border-white/10 bg-black px-3 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white outline-none transition-colors focus:border-orange-500"
                  >
                    {priceOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Availability</span>
                  <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                    className="w-full border border-white/10 bg-black px-3 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white outline-none transition-colors focus:border-orange-500"
                  >
                    {['All', 'In Stock', 'Low Stock', 'Sold Out'].map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Drop Type</span>
                  <select
                    value={promoFilter}
                    onChange={(e) => setPromoFilter(e.target.value)}
                    className="w-full border border-white/10 bg-black px-3 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white outline-none transition-colors focus:border-orange-500"
                  >
                    {['All', 'Featured', 'Flash Sale', 'Best Seller', 'New Drop'].map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Size</span>
                  <select
                    value={sizeFilter}
                    onChange={(e) => setSizeFilter(e.target.value)}
                    className="w-full border border-white/10 bg-black px-3 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white outline-none transition-colors focus:border-orange-500"
                  >
                    {sizeOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Color</span>
                  <select
                    value={colorFilter}
                    onChange={(e) => setColorFilter(e.target.value)}
                    className="w-full border border-white/10 bg-black px-3 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white outline-none transition-colors focus:border-orange-500"
                  >
                    {colorOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
          <Sparkles size={14} className="text-orange-400" />
          <span>Quick view lets customers preview products without leaving the grid</span>
        </div>

        {sortedProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:gap-x-8 md:gap-y-12 lg:grid-cols-4">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} onQuickView={setQuickViewProduct} deliveryEta={deliveryEta} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="text-lg text-white/40">No products found matching your criteria.</p>
            <button
              onClick={() => {
                setActiveCategory('All');
                setSearchQuery('');
              }}
              className="mt-4 font-bold uppercase tracking-widest text-orange-500 transition-colors hover:text-white"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      <ProductQuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </div>
  );
};

export default Shop;
