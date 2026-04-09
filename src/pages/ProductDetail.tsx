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
  Heart,
  Expand,
  X,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProductDetailSkeleton } from '../components/Skeleton';
import ProductCard from '../components/ProductCard';
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
import { findImportedCatalogProduct, mergeWithImportedCatalogProducts } from '../lib/importedCatalog';
import { getRecentlyViewedIds, pushRecentlyViewedId } from '../lib/customerExperience';
import { cn, formatGhanaCedis } from '../lib/utils';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [activeImage, setActiveImage] = useState('');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryZoomed, setGalleryZoomed] = useState(false);
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
      } else {
        setProduct(findImportedCatalogProduct(id));
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

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const next = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() })) as Product[];
      setCatalogProducts(mergeWithImportedCatalogProducts(next));
    });

    return () => {
      unsubReviews();
      unsubProducts();
    };
  }, [id]);

  useEffect(() => {
    if (!product) return;
    if (product.stockCount !== undefined && product.stockCount > 0 && quantity > product.stockCount) {
      setQuantity(product.stockCount);
    }
  }, [product, quantity]);

  useEffect(() => {
    if (!product) return;
    setSelectedSize(product.sizeOptions?.[0] || '');
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const gallery = [product.image, ...(product.galleryImages || [])].filter(Boolean);
    setActiveImage(gallery[0] || '');
  }, [product]);

  useEffect(() => {
    if (!product?.id) return;
    pushRecentlyViewedId(product.id);
  }, [product?.id]);

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
  const totalPrice = currentPrice * quantity;
  const originalTotalPrice = product.price * quantity;
  const isOutOfStock = !product.inStock || (product.stockCount !== undefined && product.stockCount === 0);
  const maxSelectableQuantity = product.stockCount !== undefined && product.stockCount > 0 ? product.stockCount : 99;
  const productGallery = Array.from(new Set([product.image, ...(product.galleryImages || [])].filter(Boolean)));
  const recommendedProducts = catalogProducts
    .filter((item) => item.id !== product.id && item.category === product.category)
    .slice(0, 4);
  const recentlyViewedProducts = getRecentlyViewedIds()
    .filter((recentId) => recentId !== product.id)
    .map((recentId) => catalogProducts.find((item) => item.id === recentId))
    .filter((item): item is Product => Boolean(item))
    .slice(0, 4);

  return (
    <div className="bg-black text-white min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-white/40 md:mb-8">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight size={10} />
          <Link to="/shop" className="hover:text-white transition-colors">Shop</Link>
          <ChevronRight size={10} />
          <span className="text-orange-500">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-24">
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-3 md:space-y-4"
          >
            <div className="relative aspect-[3/4] bg-zinc-900 overflow-hidden">
              <button
                type="button"
                onClick={() => setIsGalleryOpen(true)}
                className="relative block h-full w-full text-left"
              >
                <img
                  src={activeImage || product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute right-3 top-3 inline-flex items-center gap-2 border border-white/10 bg-black/55 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                  <Expand size={14} />
                  Fullscreen
                </span>
              </button>
              {hasFlashSale && (
              <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1.5 text-[10px] sm:px-4 sm:py-2 sm:text-xs font-black uppercase tracking-widest animate-pulse">
                  Flash Sale
                </div>
              )}
            </div>
            {productGallery.length > 1 && (
                <div className="grid grid-cols-4 gap-2 sm:gap-3 sm:grid-cols-5">
                {productGallery.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(image)}
                    className={cn(
                      'overflow-hidden border bg-zinc-900 aspect-[4/5] transition-all',
                      activeImage === image ? 'border-orange-500' : 'border-white/10 hover:border-orange-500/40'
                    )}
                  >
                    <img src={image} alt={`${product.name} view ${index + 1}`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
            {productGallery.length > 1 && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                {productGallery.length} product views available
              </p>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <div className="mb-6 md:mb-8">
              <p className="text-xs text-orange-500 font-black uppercase tracking-[0.3em] mb-2">
                {product.category}
              </p>
              <h1 className="mb-4 text-3xl sm:text-4xl md:text-6xl font-black uppercase italic leading-none tracking-tighter">
                {product.name}
              </h1>
              
              <div className="mb-5 flex items-center space-x-3 sm:space-x-4 md:mb-6">
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
                    <span className="text-3xl sm:text-4xl font-black text-white font-mono">{formatGhanaCedis(product.flashSalePrice)}</span>
                    <span className="text-lg sm:text-xl text-white/30 line-through font-mono">{formatGhanaCedis(product.price)}</span>
                  </>
                ) : (
                  <span className="text-3xl sm:text-4xl font-black text-white font-mono">{formatGhanaCedis(product.price)}</span>
                )}
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">
                  Unit Price: {formatGhanaCedis(currentPrice)}
                </p>
                <p className="text-sm font-bold uppercase tracking-widest text-orange-500">
                  Total For {quantity}: {formatGhanaCedis(totalPrice)}
                </p>
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

            <div className="mb-8 grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-[0.18em] sm:grid-cols-4">
              <div className="border border-white/10 bg-zinc-900 px-3 py-3 text-white/75">
                Delivery: 1-3 days
              </div>
              <div className="border border-white/10 bg-zinc-900 px-3 py-3 text-white/75">
                Pay: MoMo / Bank
              </div>
              <div className="border border-white/10 bg-zinc-900 px-3 py-3 text-white/75">
                Size Help: Available
              </div>
              <div className="border border-white/10 bg-zinc-900 px-3 py-3 text-white/75">
                Stock Left: {product.stockCount ?? 'Open'}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-6 mb-12">
              {!!product.sizeOptions?.length && (
                <div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-white/45">Select Size</p>
                  <div className="flex flex-wrap gap-3">
                    {product.sizeOptions.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          'min-w-[58px] border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all',
                          selectedSize === size
                            ? 'border-orange-500 bg-orange-500 text-black'
                            : 'border-white/10 bg-zinc-900 text-white hover:border-orange-500 hover:text-orange-400'
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {!isOutOfStock && (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:space-x-4 sm:gap-0">
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
                      addToCartQuantity(product, quantity, selectedSize || undefined);
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
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
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

        {(recommendedProducts.length > 0 || recentlyViewedProducts.length > 0) && (
          <section className="mt-20 space-y-14 border-t border-white/5 pt-16">
            {recommendedProducts.length > 0 && (
              <div>
                <div className="mb-8 flex items-center gap-3">
                  <Sparkles size={18} className="text-orange-400" />
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">Complete The Fit</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
                  {recommendedProducts.map((item) => (
                    <ProductCard key={item.id} product={item} />
                  ))}
                </div>
              </div>
            )}

            {recentlyViewedProducts.length > 0 && (
              <div>
                <h2 className="mb-8 text-3xl font-black uppercase italic tracking-tighter">Recently Viewed</h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
                  {recentlyViewedProducts.map((item) => (
                    <ProductCard key={item.id} product={item} />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Reviews Section */}
        <section className="mt-24 border-t border-white/5 pt-24">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter mb-2">Customer Reviews</h2>
              <div className="flex items-center space-x-3 sm:space-x-4">
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
                <form onSubmit={handleAddReview} className="max-w-2xl border border-white/10 bg-zinc-900 p-5 sm:p-8">
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

      <AnimatePresence>
        {isGalleryOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsGalleryOpen(false);
                setGalleryZoomed(false);
              }}
              className="fixed inset-0 z-[90] bg-black/88 backdrop-blur-sm"
              aria-label="Close gallery"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="fixed inset-0 z-[91] flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-4 sm:px-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">Fullscreen Gallery</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setGalleryZoomed((current) => !current)}
                    className="border border-white/10 bg-zinc-900 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white"
                  >
                    {galleryZoomed ? 'Fit to screen' : 'Zoom'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsGalleryOpen(false);
                      setGalleryZoomed(false);
                    }}
                    className="border border-white/10 bg-zinc-900 p-2 text-white"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="flex flex-1 items-center justify-center px-4 pb-4 sm:px-6">
                <div className="relative flex h-full w-full max-w-5xl items-center justify-center overflow-hidden bg-zinc-950">
                  <img
                    src={activeImage || product.image}
                    alt={product.name}
                    className={cn(
                      'max-h-full max-w-full object-contain transition-transform duration-300',
                      galleryZoomed && 'scale-[1.45] cursor-zoom-out',
                    )}
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              {productGallery.length > 1 && (
                <div className="flex items-center justify-center gap-3 px-4 pb-6 sm:px-6">
                  <button
                    type="button"
                    onClick={() => {
                      const currentIndex = productGallery.indexOf(activeImage);
                      const nextIndex = currentIndex <= 0 ? productGallery.length - 1 : currentIndex - 1;
                      setActiveImage(productGallery[nextIndex]);
                    }}
                    className="border border-white/10 bg-zinc-900 p-3 text-white"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="flex max-w-[70vw] gap-2 overflow-x-auto">
                    {productGallery.map((image, index) => (
                      <button
                        key={`${image}-${index}-fullscreen`}
                        type="button"
                        onClick={() => setActiveImage(image)}
                        className={cn(
                          'h-16 w-16 shrink-0 overflow-hidden border bg-zinc-900',
                          activeImage === image ? 'border-orange-500' : 'border-white/10',
                        )}
                      >
                        <img src={image} alt={`${product.name} thumb ${index + 1}`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const currentIndex = productGallery.indexOf(activeImage);
                      const nextIndex = currentIndex >= productGallery.length - 1 ? 0 : currentIndex + 1;
                      setActiveImage(productGallery[nextIndex]);
                    }}
                    className="border border-white/10 bg-zinc-900 p-3 text-white"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetail;
