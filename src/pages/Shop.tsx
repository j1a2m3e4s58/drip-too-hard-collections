import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Filter, ChevronDown, Search } from 'lucide-react';
<<<<<<< HEAD
import { useSearchParams } from 'react-router-dom';
=======
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeleton';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
<<<<<<< HEAD
import { mergeWithImportedCatalogProducts } from '../lib/importedCatalog';

const Shop = () => {
  const [searchParams] = useSearchParams();
=======

const Shop = () => {
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Newest');

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
<<<<<<< HEAD
      setProducts(mergeWithImportedCatalogProducts(prods));
=======
      setProducts(prods);
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

<<<<<<< HEAD
  useEffect(() => {
    const incomingSearch = searchParams.get('q') || '';
    const incomingCategory = searchParams.get('category') || 'All';

    setSearchQuery(incomingSearch);
    setActiveCategory(incomingCategory);
  }, [searchParams]);

  const categories = ['All', ...Array.from(new Set(products.map((product) => product.category).filter(Boolean)))];
  const linkedIds = (searchParams.get('ids') || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
=======
  const categories = ['All', 'Tees', 'Sneakers', 'Accessories'];
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee

  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
<<<<<<< HEAD
    const matchesLinkedIds = !linkedIds.length || linkedIds.includes(product.id);
    return matchesCategory && matchesSearch && matchesLinkedIds;
=======
    return matchesCategory && matchesSearch;
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
  });

  if (loading) {
    return (
<<<<<<< HEAD
      <div className="bg-black text-white min-h-screen pt-24 md:pt-32 pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-y-12">
=======
      <div className="bg-black text-white min-h-screen pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12">
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
            {[...Array(8)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="bg-black text-white min-h-screen pt-24 pb-16 md:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter italic mb-3 md:mb-4">The Shop</h1>
          <p className="text-sm sm:text-base text-white/50 max-w-2xl leading-7">
            Browse our full collection of premium streetwear. Filter by category or search for your next favorite piece.
          </p>
          {(linkedIds.length > 0 || searchQuery) && (
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-orange-400">
              Filtered for your selected collection or lookbook item
            </p>
          )}
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 md:gap-6 mb-8 md:mb-12 border-b border-white/10 pb-6 md:pb-8">
=======
    <div className="bg-black text-white min-h-screen pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-black uppercase tracking-tighter italic mb-4">The Shop</h1>
          <p className="text-white/50 max-w-2xl">
            Browse our full collection of premium streetwear. Filter by category or search for your next favorite piece.
          </p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12 border-b border-white/10 pb-8">
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
<<<<<<< HEAD
                className={`px-4 py-2 text-[10px] sm:px-6 sm:text-xs font-bold uppercase tracking-widest transition-all ${
=======
                className={`px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
                  activeCategory === cat
                    ? 'bg-orange-500 text-black'
                    : 'bg-zinc-900 text-white hover:bg-white hover:text-black'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search & Sort */}
<<<<<<< HEAD
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full lg:w-auto">
=======
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
            <div className="relative flex-grow sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
<<<<<<< HEAD
                className="w-full bg-zinc-900 border border-white/10 px-10 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors"
=======
                className="w-full bg-zinc-900 border border-white/10 px-10 py-2 text-sm focus:outline-none focus:border-orange-500 transition-colors"
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
              />
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
<<<<<<< HEAD
                className="appearance-none bg-zinc-900 border border-white/10 px-4 sm:px-6 py-3 pr-10 text-[11px] sm:text-sm font-bold uppercase tracking-widest focus:outline-none focus:border-orange-500 transition-colors cursor-pointer w-full"
=======
                className="appearance-none bg-zinc-900 border border-white/10 px-6 py-2 pr-10 text-sm font-bold uppercase tracking-widest focus:outline-none focus:border-orange-500 transition-colors cursor-pointer w-full"
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
              >
                <option>Newest</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" size={16} />
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
<<<<<<< HEAD
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-8 gap-y-8 md:gap-y-12">
=======
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="text-white/40 text-lg">No products found matching your criteria.</p>
            <button
              onClick={() => { setActiveCategory('All'); setSearchQuery(''); }}
              className="mt-4 text-orange-500 font-bold uppercase tracking-widest hover:text-white transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
