import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ArrowRight, ShieldCheck, Truck, CreditCard, ChevronLeft, CheckCircle2, Ticket, Tag, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, writeBatch, doc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Coupon, Product } from '../types';

const SHIPPING_RATES: Record<string, number> = {
  'Greater Accra': 20,
  'Ashanti': 40,
  'Western': 45,
  'Northern': 60,
  'Central': 35,
  'Eastern': 30,
  'Volta': 40,
  'Bono': 50,
  'Upper East': 70,
  'Upper West': 70,
};

const Checkout = () => {
  const { cart, total, clearCart } = useCart();
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    city: 'Accra',
    region: 'Greater Accra',
    address: '',
    paymentMethod: 'Cash on Delivery'
  });

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      name: user?.displayName || prev.name,
      email: user?.email || prev.email
    }));
  }, [user]);

  const shippingFee = SHIPPING_RATES[formData.region] || 0;
  
  const discountAmount = appliedCoupon 
    ? (appliedCoupon.discountType === 'percentage' 
        ? (total * appliedCoupon.value) / 100 
        : appliedCoupon.value)
    : 0;

  const finalTotal = Math.max(0, total - discountAmount + shippingFee);

  const isCouponExpired = (coupon: Coupon) => {
    if (!coupon.expiryDate) return false;
    if (coupon.expiryDate?.toDate) {
      return coupon.expiryDate.toDate().getTime() < Date.now();
    }
    return new Date(coupon.expiryDate).getTime() < Date.now();
  };

  const getLiveProductPrice = (product: Product) => {
    const hasFlashSale = product.flashSalePrice && product.flashSalePrice > 0;
    if (!hasFlashSale) return product.price;

    if (!product.flashSaleEnd) return product.flashSalePrice || product.price;

    if (product.flashSaleEnd?.toDate) {
      return product.flashSaleEnd.toDate().getTime() > Date.now() ? (product.flashSalePrice || product.price) : product.price;
    }

    return new Date(product.flashSaleEnd).getTime() > Date.now() ? (product.flashSalePrice || product.price) : product.price;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsValidatingCoupon(true);
    setCouponError('');
    try {
      const q = query(collection(db, 'coupons'), where('code', '==', couponCode.toUpperCase()), where('isActive', '==', true));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setCouponError('Invalid or expired coupon code');
        setAppliedCoupon(null);
      } else {
        const coupon = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Coupon;
        if (isCouponExpired(coupon)) {
          setCouponError('Invalid or expired coupon code');
          setAppliedCoupon(null);
        } else {
          setAppliedCoupon(coupon);
        }
      }
    } catch (error) {
      setCouponError('Error validating coupon');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    setIsSubmitting(true);
    try {
      const batch = writeBatch(db);
      const liveItems = [];

      for (const item of cart) {
        const productRef = doc(db, 'products', item.id);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
          throw new Error(`${item.name} is no longer available.`);
        }

        const liveProduct = { id: productSnap.id, ...productSnap.data() } as Product;
        const availableStock = !liveProduct.inStock ? 0 : (liveProduct.stockCount === undefined ? item.quantity : liveProduct.stockCount);

        if (availableStock < item.quantity) {
          throw new Error(`${liveProduct.name} only has ${availableStock} left in stock.`);
        }

        liveItems.push({
          productId: liveProduct.id,
          name: liveProduct.name,
          price: getLiveProductPrice(liveProduct),
          quantity: item.quantity,
          image: liveProduct.image,
          stockCount: availableStock
        });
      }

      const liveSubtotal = liveItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const liveDiscountAmount = appliedCoupon
        ? (appliedCoupon.discountType === 'percentage'
            ? (liveSubtotal * appliedCoupon.value) / 100
            : appliedCoupon.value)
        : 0;
      const liveFinalTotal = Math.max(0, liveSubtotal - liveDiscountAmount + shippingFee);

      if (appliedCoupon && isCouponExpired(appliedCoupon)) {
        throw new Error('Applied coupon has expired.');
      }

      // 1. Create Order
      const orderRef = doc(collection(db, 'orders'));
      const orderData = {
        userId: user?.uid || 'guest',
        items: liveItems.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        subtotal: liveSubtotal,
        discount: liveDiscountAmount,
        shipping: shippingFee,
        total: liveFinalTotal,
        status: 'Pending',
        shippingAddress: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          city: formData.city,
          region: formData.region,
          address: formData.address
        },
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentMethod === 'Cash on Delivery' ? 'pending_collection' : 'pending_payment',
        couponUsed: appliedCoupon?.code || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      batch.set(orderRef, orderData);

      // 2. Deduct Stock
      for (const item of liveItems) {
        const productRef = doc(db, 'products', item.productId);
        const newStock = Math.max(0, item.stockCount - item.quantity);
        batch.update(productRef, { 
          stockCount: newStock,
          inStock: newStock > 0,
          updatedAt: serverTimestamp()
        });
      }

      await batch.commit();
      clearCart();
      setIsSuccess(true);
    } catch (error) {
      console.error("Error placing order:", error);
      alert(error instanceof Error ? error.message : "Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center text-black">
              <CheckCircle2 size={48} />
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Order Received!</h1>
            <p className="text-white/50 text-sm uppercase tracking-widest font-bold">
              Your drip is on the way. We'll contact you shortly for delivery.
            </p>
          </div>
          <div className="pt-8">
            <Link 
              to="/shop" 
              className="inline-flex items-center space-x-3 bg-white text-black px-8 py-4 text-xs font-black uppercase tracking-widest hover:bg-orange-500 transition-all"
            >
              <span>Back to Shop</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (cart.length === 0 && !isSubmitting) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 space-y-6">
        <ShoppingBag size={64} className="text-white/10" />
        <h1 className="text-2xl font-black uppercase italic">Your bag is empty</h1>
        <Link to="/shop" className="text-orange-500 font-bold uppercase tracking-widest flex items-center space-x-2">
          <ChevronLeft size={16} /> <span>Go Shopping</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Form */}
          <div className="flex-grow space-y-12">
            <div>
              <h1 className="text-5xl font-black uppercase tracking-tighter italic mb-2">Checkout</h1>
              <p className="text-white/50 uppercase tracking-widest text-[10px] font-bold">Secure Delivery & Payment</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-xl font-black uppercase italic flex items-center space-x-3">
                  <Truck size={20} className="text-orange-500" />
                  <span>Shipping Details</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Full Name</label>
                    <input 
                      required 
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-zinc-900 border border-white/10 px-4 py-3 text-sm focus:border-orange-500 outline-none" 
                    />
                  </div>
                                    {/* ===================== ADD THIS BELOW phone field ===================== */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Email</label>
                    <input 
                      required 
                      type="email" 
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-zinc-900 border border-white/10 px-4 py-3 text-sm focus:border-orange-500 outline-none" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Phone Number</label>
                    <input 
                      required 
                      type="tel" 
                      placeholder="024 XXX XXXX"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-zinc-900 border border-white/10 px-4 py-3 text-sm focus:border-orange-500 outline-none" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">City</label>
                    <select 
                      value={formData.city}
                      onChange={e => setFormData({...formData, city: e.target.value})}
                      className="w-full bg-zinc-900 border border-white/10 px-4 py-3 text-sm focus:border-orange-500 outline-none"
                    >
                      <option>Accra</option>
                      <option>Kumasi</option>
                      <option>Takoradi</option>
                      <option>Tamale</option>
                      <option>Tema</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Region</label>
                    <select 
                      value={formData.region}
                      onChange={e => setFormData({...formData, region: e.target.value})}
                      className="w-full bg-zinc-900 border border-white/10 px-4 py-3 text-sm focus:border-orange-500 outline-none"
                    >
                      <option>Greater Accra</option>
                      <option>Ashanti</option>
                      <option>Western</option>
                      <option>Northern</option>
                      <option>Central</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Delivery Address</label>
                    <textarea 
                      required 
                      rows={3}
                      placeholder="House No, Street Name, Landmark..."
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      className="w-full bg-zinc-900 border border-white/10 px-4 py-3 text-sm focus:border-orange-500 outline-none resize-none" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-xl font-black uppercase italic flex items-center space-x-3">
                  <CreditCard size={20} className="text-orange-500" />
                  <span>Payment Method</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, paymentMethod: 'Cash on Delivery'})}
                    className={`p-6 border text-left transition-all ${formData.paymentMethod === 'Cash on Delivery' ? 'border-orange-500 bg-orange-500/5' : 'border-white/10 bg-zinc-900 hover:border-white/30'}`}
                  >
                    <p className="text-sm font-black uppercase tracking-widest">Cash on Delivery</p>
                    <p className="text-[10px] text-white/50 mt-1">Pay when you receive your order</p>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, paymentMethod: 'Mobile Money'})}
                    className={`p-6 border text-left transition-all ${formData.paymentMethod === 'Mobile Money' ? 'border-orange-500 bg-orange-500/5' : 'border-white/10 bg-zinc-900 hover:border-white/30'}`}
                  >
                    <p className="text-sm font-black uppercase tracking-widest">Mobile Money</p>
                    <p className="text-[10px] text-white/50 mt-1">MTN / Vodafone / AirtelTigo</p>
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-white text-black py-6 font-black uppercase tracking-widest hover:bg-orange-500 transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Place Order</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Summary */}
          <div className="lg:w-96">
            <div className="bg-zinc-900 border border-white/10 p-8 sticky top-32 space-y-8">
              <div>
                <h2 className="text-xl font-black uppercase italic mb-6">Order Summary</h2>
                <div className="space-y-6 max-h-64 overflow-y-auto no-scrollbar pr-2">
                  {cart.map(item => (
                    <div key={item.id} className="flex space-x-4">
                      <div className="w-16 h-16 bg-black flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-xs font-bold uppercase tracking-tight">{item.name}</p>
                        <p className="text-[10px] text-white/50 uppercase tracking-widest">{item.quantity}x GH₵ {item.flashSalePrice || item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coupon Section */}
              <div className="pt-6 border-t border-white/10 space-y-4">
                <div className="flex space-x-2">
                  <div className="relative flex-grow">
                    <input 
                      type="text" 
                      placeholder="PROMO CODE"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                      className="w-full bg-black border border-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:border-orange-500"
                    />
                    <Ticket className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                  </div>
                  <button 
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isValidatingCoupon || !couponCode}
                    className="bg-white text-black px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 transition-all disabled:opacity-50"
                  >
                    {isValidatingCoupon ? '...' : 'Apply'}
                  </button>
                </div>
                {couponError && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{couponError}</p>}
                {appliedCoupon && (
                  <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/20 p-3">
                    <div className="flex items-center space-x-2 text-orange-500">
                      <Tag size={12} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{appliedCoupon.code} Applied</span>
                    </div>
                    <button onClick={() => setAppliedCoupon(null)} className="text-orange-500 hover:text-white"><X size={12} /></button>
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-6 border-t border-white/10">
                <div className="flex justify-between text-xs uppercase font-bold text-white/50">
                  <span>Subtotal</span>
                  <span>GH₵ {total}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-xs uppercase font-bold text-green-500">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>- GH₵ {discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs uppercase font-bold text-white/50">
                  <span>Delivery ({formData.region})</span>
                  <span>GH₵ {shippingFee}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-white/10">
                  <span className="text-sm font-black uppercase italic">Total</span>
                  <span className="text-2xl font-black font-mono text-orange-500">GH₵ {finalTotal}</span>
                </div>
              </div>
              <div className="pt-8 border-t border-white/10 flex items-center space-x-3 text-white/30">
                <ShieldCheck size={20} />
                <p className="text-[10px] uppercase tracking-widest font-bold">Encrypted & Secure Payment</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;