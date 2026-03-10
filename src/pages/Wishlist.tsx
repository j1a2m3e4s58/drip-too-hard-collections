import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
import { useWishlist } from '../hooks/useWishlist';
import ProductCard from '../components/ProductCard';

const Wishlist = () => {
  const { wishlist, toggleWishlist, loading: wishlistLoading } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      if (wishlist.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'products'),
          where(documentId(), 'in', wishlist)
        );
        const snapshot = await getDocs(q);
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);
      } catch (error) {
        console.error("Error fetching wishlist products:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!wishlistLoading) {
      fetchWishlistProducts();
    }
  }, [wishlist, wishlistLoading]);

  if (loading || wishlistLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-6xl font-black uppercase italic tracking-tighter mb-4">My Wishlist</h1>
          <p className="text-white/50 uppercase tracking-widest text-xs font-bold">
            {products.length} Items Saved
          </p>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <AnimatePresence mode="popLayout">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative"
                >
                  <ProductCard product={product} />
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className="absolute top-4 right-4 z-20 p-2 bg-red-600 text-white rounded-full hover:bg-white hover:text-black transition-colors shadow-xl"
                    title="Remove from Wishlist"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-24 bg-zinc-900/20 border border-dashed border-white/10">
            <Heart size={48} className="mx-auto text-white/10 mb-6" />
            <h2 className="text-2xl font-black uppercase italic mb-4">Your wishlist is empty</h2>
            <p className="text-white/40 mb-8 max-w-md mx-auto">
              Save items you love to your wishlist and they'll appear here.
            </p>
            <Link 
              to="/shop" 
              className="inline-flex items-center space-x-3 bg-white text-black px-8 py-4 text-xs font-black uppercase tracking-widest hover:bg-orange-500 transition-all"
            >
              <span>Start Shopping</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* Recommendations */}
        {products.length > 0 && (
          <div className="mt-24">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-12">You Might Also Like</h2>
            {/* This could be a separate component or a simple query */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 opacity-50">
              {/* Placeholder for recommendations */}
              <p className="text-white/30 text-xs uppercase tracking-widest font-bold col-span-full">
                Check our new arrivals for more inspiration.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
