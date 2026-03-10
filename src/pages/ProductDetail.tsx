import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Star, 
  ChevronRight, 
  ShieldCheck, 
  Truck, 
  RotateCcw,
  Plus,
  Minus,
  MessageSquare,
  User,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProductDetailSkeleton } from '../components/Skeleton';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Product, Review } from '../types';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useWishlist } from '../hooks/useWishlist';
import { useCart } from '../hooks/useCart';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [user] = useAuthState(auth);
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCartQuantity } = useCart();
  const isInWishlist = wishlist.includes(id || '');
  
  // Review Form State
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
      }
      setLoading(false);
    };

    fetchProduct();

    // Fetch Reviews
    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', id),
      orderBy('createdAt', 'desc')
    );
    const unsubReviews = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Review[]);
    });

    return () => unsubReviews();
  }, [id]);

  useEffect(() => {
    if (!product) return;
    if (product.stockCount !== undefined && product.stockCount > 0 && quantity > product.stockCount) {
      setQuantity(product.stockCount);
    }
  }, [product, quantity]);

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !comment.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productId: id,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        rating,
        comment,
        createdAt: serverTimestamp(),
        approved: true // Auto-approve for now
      });
      setComment('');
      setRating(5);
      setShowReviewForm(false);
    } catch (error) {
      console.error("Error adding review:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <ProductDetailSkeleton />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
        <h1 className="text-4xl font-black uppercase italic mb-4">Product Not Found</h1>
        <Link to="/shop" className="text-orange-500 uppercase tracking-widest font-bold hover:text-white transition-colors">
          Back to Shop
        </Link>
      </div>
    );
  }

  const hasFlashSale = product.flashSalePrice && product.flashSalePrice > 0;
  const currentPrice = hasFlashSale ? product.flashSalePrice : product.price;
  const isOutOfStock = !product.inStock || (product.stockCount !== undefined && product.stockCount === 0);
  const maxSelectableQuantity = product.stockCount !== undefined && product.stockCount > 0 ? product.stockCount : 99;

  return (
    <div className="bg-black text-white min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-[10px] uppercase tracking-widest font-bold text-white/40 mb-8">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight size={10} />
          <Link to="/shop" className="hover:text-white transition-colors">Shop</Link>
          <ChevronRight size={10} />
          <span className="text-orange-500">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative aspect-[3/4] bg-zinc-900 overflow-hidden"
          >
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {hasFlashSale && (
              <div className="absolute top-6 left-6 bg-red-600 text-white px-4 py-2 text-xs font-black uppercase tracking-widest animate-pulse">
                Flash Sale
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <div className="mb-8">
              <p className="text-xs text-orange-500 font-black uppercase tracking-[0.3em] mb-2">
                {product.category}
              </p>
              <h1 className="text-5xl md:text-6xl font-black uppercase italic leading-none tracking-tighter mb-4">
                {product.name}
              </h1>
              
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center text-orange-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < 4 ? "currentColor" : "none"} />
                  ))}
                </div>
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                  {reviews.length} Reviews
                </span>
              </div>

              <div className="flex items-baseline space-x-4">
                {hasFlashSale ? (
                  <>
                    <span className="text-4xl font-black text-white font-mono">GH₵ {product.flashSalePrice}</span>
                    <span className="text-xl text-white/30 line-through font-mono">GH₵ {product.price}</span>
                  </>
                ) : (
                  <span className="text-4xl font-black text-white font-mono">GH₵ {product.price}</span>
                )}
              </div>
            </div>

            <div className="prose prose-invert max-w-none mb-10">
              <p className="text-white/60 leading-relaxed">
                {product.description || "Premium quality streetwear designed for those who demand the best. Crafted with attention to detail and superior fabrics."}
              </p>
            </div>

            {/* Stock Status */}
            <div className="mb-8">
              {isOutOfStock ? (
                <div className="inline-flex items-center space-x-2 text-red-500 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Out of Stock</span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-2 text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {product.stockCount && product.stockCount < 5 ? `Only ${product.stockCount} Left` : 'In Stock'}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-6 mb-12">
              {!isOutOfStock && (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-white/10 bg-zinc-900">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-4 hover:text-orange-500 transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-12 text-center font-mono font-bold">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(Math.min(maxSelectableQuantity, quantity + 1))}
                      className="p-4 hover:text-orange-500 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      addToCartQuantity(product, quantity);
                      window.dispatchEvent(new Event('open-cart'));
                    }}
                    className="flex-1 bg-white text-black py-4 text-sm font-black uppercase tracking-widest hover:bg-orange-500 transition-all flex items-center justify-center space-x-3 group"
                  >
                    <span>Add to Bag</span>
                    <ShoppingBag size={18} className="group-hover:scale-110 transition-transform" />
                  </button>
                  <button 
                    onClick={() => toggleWishlist(product.id)}
                    className={cn(
                      "p-4 border transition-all duration-300",
                      isInWishlist 
                        ? "bg-orange-500 border-orange-500 text-black" 
                        : "bg-zinc-900 border-white/10 text-white hover:bg-white hover:text-black"
                    )}
                  >
                    <Heart size={20} fill={isInWishlist ? "currentColor" : "none"} />
                  </button>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: Truck, text: "Fast Delivery" },
                  { icon: ShieldCheck, text: "Secure Checkout" },
                  { icon: RotateCcw, text: "Easy Returns" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-3 p-4 bg-zinc-900/50 border border-white/5">
                    <item.icon size={16} className="text-orange-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <section className="mt-24 border-t border-white/5 pt-24">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
            <div>
              <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-2">Customer Reviews</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-orange-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill={i < 4 ? "currentColor" : "none"} />
                  ))}
                </div>
                <span className="text-sm text-white/40">Based on {reviews.length} reviews</span>
              </div>
            </div>
            {user ? (
              <button 
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="bg-zinc-900 border border-white/10 px-8 py-4 text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center space-x-2"
              >
                <MessageSquare size={16} />
                <span>{showReviewForm ? 'Cancel Review' : 'Write a Review'}</span>
              </button>
            ) : (
              <p className="text-sm text-white/40 italic">Please sign in to leave a review.</p>
            )}
          </div>

          <AnimatePresence>
            {showReviewForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-12"
              >
                <form onSubmit={handleAddReview} className="bg-zinc-900 p-8 border border-white/10 max-w-2xl">
                  <div className="mb-6">
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-4">Rating</label>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={cn(
                            "transition-colors",
                            rating >= star ? "text-orange-500" : "text-white/20"
                          )}
                        >
                          <Star size={24} fill={rating >= star ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-6">
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Your Review</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      required
                      placeholder="What did you think of the product?"
                      className="w-full bg-black border border-white/10 p-4 text-sm focus:outline-none focus:border-orange-500 min-h-[120px]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-orange-500 text-black px-10 py-4 text-xs font-black uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Post Review'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="bg-zinc-900/30 p-8 border border-white/5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-zinc-800 flex items-center justify-center rounded-full">
                        <User size={20} className="text-white/40" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{review.userName}</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest">
                          {review.createdAt?.toDate().toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center text-orange-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} />
                      ))}
                    </div>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {review.comment}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-12 bg-zinc-900/20 border border-dashed border-white/10">
                <p className="text-white/30 uppercase tracking-widest text-xs font-bold">No reviews yet. Be the first to review!</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductDetail;