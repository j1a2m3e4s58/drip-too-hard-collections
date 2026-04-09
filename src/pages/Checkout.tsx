<<<<<<< HEAD
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Banknote,
  CreditCard,
  Info,
  Landmark,
  MapPin,
  NotebookPen,
  Phone,
  ShieldCheck,
  Smartphone,
  Truck,
  User,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, writeBatch } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useCart } from '../hooks/useCart';
import { DeliveryZone, Order, StoreSettings } from '../types';
import { defaultDeliveryZones, defaultStoreSettings, STOREFRONT_SETTINGS_DOC } from '../lib/storefront';

type PaymentMethod = 'Mobile Money' | 'Bank Transfer' | 'Pay on Delivery';

const CHECKOUT_DRAFT_KEY = 'dthc_checkout_draft';

const paymentMethods: {
  id: PaymentMethod;
  title: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    id: 'Mobile Money',
    title: 'Mobile Money',
    description: 'Place order now and pay to the DTHC MoMo number using your order reference.',
    icon: Smartphone,
  },
  {
    id: 'Bank Transfer',
    title: 'Bank Transfer',
    description: 'Place order now and complete payment with the provided account details after confirmation.',
    icon: Landmark,
  },
  {
    id: 'Pay on Delivery',
    title: 'Pay on Delivery',
    description: 'Available only where DTHC confirms it first.',
    icon: Truck,
  },
];

const Checkout = () => {
  const { cart, clearCart } = useCart();
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(defaultDeliveryZones);
  const [settings, setSettings] = useState<StoreSettings>({ id: 'settings', ...defaultStoreSettings });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutNotice, setCheckoutNotice] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    phone: '',
    address: '',
    note: '',
    paymentMethod: 'Mobile Money' as PaymentMethod,
    selectedZoneId: '',
  });

  useEffect(() => {
    const savedDraft = localStorage.getItem(CHECKOUT_DRAFT_KEY);
    if (!savedDraft) {
      return;
    }

    try {
      const parsed = JSON.parse(savedDraft) as Partial<typeof formData>;
      setFormData((prev) => ({
        ...prev,
        ...parsed,
        paymentMethod: (parsed.paymentMethod as PaymentMethod) || prev.paymentMethod,
      }));
    } catch (error) {
      console.error('Failed to load checkout draft:', error);
    }
  }, []);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      name: user?.displayName || prev.name,
    }));
  }, [user]);

  useEffect(() => {
    localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    const unsubZones = onSnapshot(query(collection(db, 'deliveryZones'), orderBy('sortOrder', 'asc')), (snap) => {
      const next = snap.empty
        ? defaultDeliveryZones
        : (snap.docs.map((item) => ({ id: item.id, ...item.data() })) as DeliveryZone[]);
      const activeZones = next.filter((item) => item.active);
      setDeliveryZones(activeZones);

      setFormData((prev) => {
        if (prev.selectedZoneId && activeZones.some((item) => item.id === prev.selectedZoneId)) {
          return prev;
        }
        return {
          ...prev,
          selectedZoneId: activeZones[0]?.id || '',
        };
      });
    });

    const unsubSettings = onSnapshot(doc(db, STOREFRONT_SETTINGS_DOC), (snap) => {
      if (snap.exists()) {
        setSettings({ id: snap.id, ...defaultStoreSettings, ...(snap.data() as Omit<StoreSettings, 'id'>) });
      }
    });

    return () => {
      unsubZones();
      unsubSettings();
    };
  }, []);

  const selectedZone = useMemo(
    () => deliveryZones.find((item) => item.id === formData.selectedZoneId) || null,
    [deliveryZones, formData.selectedZoneId],
  );

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + (item.flashSalePrice || item.price) * item.quantity, 0),
    [cart],
  );
  const deliveryFee = selectedZone?.fee || 0;
  const estimatedTotal = subtotal + deliveryFee;

  const handlePlaceOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    setCheckoutNotice(null);

    if (!cart.length) {
      return;
    }

    if (!selectedZone) {
      setCheckoutNotice({ type: 'error', message: 'Please select a delivery zone before placing your order.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const generatedTrackingCode = `DTHC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const batch = writeBatch(db);
      const orderRef = doc(collection(db, 'orders'));

      const orderItems = cart.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.flashSalePrice || item.price,
        quantity: item.quantity,
        image: item.image,
        ...(item.selectedSize ? { selectedSize: item.selectedSize } : {}),
      }));

      const orderData: Omit<Order, 'id'> & {
        subtotal: number;
        shipping: number;
      } = {
        userId: user?.uid || 'guest',
        items: orderItems,
        subtotal,
        shipping: deliveryFee,
        total: estimatedTotal,
        status: 'Pending',
        shippingAddress: {
          name: formData.name,
          phone: formData.phone,
          city: selectedZone.name,
          region: selectedZone.name,
          address: formData.address,
        },
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentMethod === 'Pay on Delivery' ? 'Pending' : 'Pending',
        paymentProofStatus: 'Not Sent',
        orderUpdateStatus: 'Not Sent',
        trackingCode: generatedTrackingCode,
        deliveryZone: selectedZone.name,
        customerNotes: formData.note,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      batch.set(orderRef, orderData);
      await batch.commit();

      clearCart();
      localStorage.removeItem(CHECKOUT_DRAFT_KEY);
      navigate(`/order-confirmed/${orderRef.id}`);
    } catch (error) {
      console.error('Checkout failed:', error);
      const message = error instanceof Error ? error.message : String(error);
      setCheckoutNotice({ type: 'error', message: `Failed to place order. ${message}` });
=======
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
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
    } finally {
      setIsSubmitting(false);
    }
  };

<<<<<<< HEAD
  if (!cart.length && !isSubmitting) {
    return (
      <div className="min-h-screen bg-black px-4 pt-24 pb-24 text-white">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-white/10 bg-[rgba(24,24,27,0.64)] p-8 text-center backdrop-blur-xl">
          <h1 className="text-3xl font-black tracking-tight">Your bag is empty</h1>
          <p className="mt-4 text-lg text-white/55">Add products to your bag before checking out.</p>
          <Link to="/shop" className="mt-8 inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-bold text-black">
            <ArrowLeft size={16} />
            Go Shopping
          </Link>
        </div>
=======
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
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-black pt-24 pb-24 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {checkoutNotice && (
          <div className={`mb-5 rounded-[1.35rem] border px-4 py-3 text-sm font-semibold backdrop-blur-xl ${checkoutNotice.type === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'}`}>
            {checkoutNotice.message}
          </div>
        )}
        <div className="mb-6 md:mb-8 flex items-center gap-3 md:gap-4">
          <Link to="/shop" className="text-white/60 hover:text-orange-400">
            <ArrowLeft size={22} />
          </Link>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Checkout</h1>
        </div>

        <div className="grid gap-5 md:gap-6 xl:grid-cols-[1.25fr_0.9fr]">
          <form onSubmit={handlePlaceOrder} className="space-y-5">
            <Panel
              title="Complete your order"
              subtitle="Fill in your details clearly so DTHC can confirm your order, delivery location, payment path, and final dispatch plan."
            />

            <Panel
              title="Payment & Delivery Info"
              subtitle="DTHC delivery zones and fees are synced live from admin settings. Choose your zone below and your total will update automatically."
              icon={Info}
            >
              <Link
                to="/payment-delivery"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[rgba(9,9,11,0.3)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-900/80"
              >
                <Truck size={16} />
                View Payment & Delivery
              </Link>
            </Panel>

            <Panel
              title="Customer Details"
              subtitle="Enter the correct details for contact and delivery confirmation."
              icon={User}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <InfoInput
                  icon={User}
                  label="Full Name"
                  value={formData.name}
                  onChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
                />
                <InfoInput
                  icon={Phone}
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(value) => setFormData((prev) => ({ ...prev, phone: value }))}
                />
              </div>
              <InfoInput
                icon={MapPin}
                label="Delivery Address"
                value={formData.address}
                onChange={(value) => setFormData((prev) => ({ ...prev, address: value }))}
                fullWidth
              />
              <InfoInput
                icon={NotebookPen}
                label="Order Note (optional)"
                value={formData.note}
                onChange={(value) => setFormData((prev) => ({ ...prev, note: value }))}
                fullWidth
                multiline
              />
            </Panel>

            <Panel
              title="Delivery Zone"
              subtitle="Choose one delivery zone. The delivery fee and final total will update immediately."
              icon={Truck}
            >
              <div className="space-y-4">
                {deliveryZones.map((zone) => {
                  const selected = zone.id === formData.selectedZoneId;
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, selectedZoneId: zone.id }))}
                    className={`flex w-full items-start justify-between gap-3 rounded-[1.35rem] border px-4 py-4 text-left transition-all ${
                        selected
                          ? 'border-orange-500 bg-[rgba(39,39,42,0.78)]'
                          : 'border-white/10 bg-[rgba(9,9,11,0.34)] hover:border-orange-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.04)] text-orange-400">
                          <MapPin size={18} />
                        </div>
                        <div>
                          <p className="text-lg sm:text-2xl font-bold">{zone.name}</p>
                          <p className="text-xs sm:text-sm text-white/55">Delivery fee: GHS {zone.fee.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className={`h-6 w-6 rounded-full border-2 ${selected ? 'border-orange-500 bg-orange-500/20' : 'border-white/35'}`} />
                    </button>
                  );
                })}
              </div>
            </Panel>

            <Panel
              title="Payment Method"
              subtitle="Choose how the customer will complete payment for this order."
              icon={CreditCard}
            >
              <div className="space-y-4">
                {paymentMethods.map((method) => {
                  const selected = formData.paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: method.id }))}
                    className={`flex w-full items-start justify-between gap-3 rounded-[1.35rem] border px-4 py-4 text-left transition-all ${
                        selected
                          ? 'border-orange-500 bg-[rgba(39,39,42,0.78)]'
                          : 'border-white/10 bg-[rgba(9,9,11,0.34)] hover:border-orange-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${selected ? 'bg-orange-500 text-black' : 'bg-[rgba(255,255,255,0.04)] text-white/75'}`}>
                          <method.icon size={20} />
                        </div>
                        <div>
                          <p className="text-lg sm:text-2xl font-bold">{method.title}</p>
                          <p className="max-w-xl text-xs sm:text-sm leading-6 sm:leading-7 text-white/55">{method.description}</p>
                        </div>
                      </div>
                      <div className={`h-6 w-6 rounded-full border-2 ${selected ? 'border-orange-500 bg-orange-500/20' : 'border-white/35'}`} />
                    </button>
                  );
                })}
              </div>
            </Panel>

            {formData.paymentMethod === 'Mobile Money' && (
              <Panel
                title="Mobile Money Instructions"
                subtitle="After placing the order, send the exact amount to the DTHC MoMo number below and use your tracking code as the payment reference."
                icon={Smartphone}
              >
                <InfoLine label="MoMo Number" value={settings.mobileMoneyNumber} />
                <InfoLine label="Name" value={settings.mobileMoneyName} />
                <InfoLine label="Amount" value={`GHS ${estimatedTotal.toFixed(2)}`} highlight />
                <div className="rounded-[1.15rem] border border-white/10 bg-[rgba(9,9,11,0.34)] px-4 py-4 text-sm text-white/60">
                  Reference: your tracking code will be shown after placing the order.
                </div>
              </Panel>
            )}

            {formData.paymentMethod === 'Bank Transfer' && (
              <Panel
                title="Bank Transfer Instructions"
                subtitle="Place the order first, then DTHC can confirm transfer details and expected payment reference before dispatch."
                icon={Landmark}
              >
                <div className="rounded-[1.15rem] border border-white/10 bg-[rgba(9,9,11,0.34)] px-4 py-4 text-sm text-white/60">
                  This option is for manual confirmation. DTHC will contact you with the final transfer steps after the order is placed.
                </div>
              </Panel>
            )}

            {formData.paymentMethod === 'Pay on Delivery' && (
              <Panel
                title="Pay on Delivery Notes"
                subtitle="This option is only available where DTHC confirms delivery route, order value, and dispatch conditions first."
                icon={Banknote}
              >
                <div className="rounded-[1.15rem] border border-white/10 bg-[rgba(9,9,11,0.34)] px-4 py-4 text-sm text-white/60">
                  Pay on delivery is not guaranteed for every location. DTHC will review the address and confirm availability before dispatch.
                </div>
              </Panel>
            )}
          </form>

          <div className="xl:sticky xl:top-28 xl:self-start">
            <Panel title="Order Summary" subtitle="Review your selected products before placing your order.">
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.cartKey} className="flex items-center gap-3 sm:gap-4 rounded-[1.35rem] border border-white/10 bg-[rgba(9,9,11,0.34)] p-3 sm:p-4">
                    <img src={item.image} alt={item.name} className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm sm:text-xl font-bold">{item.name} x{item.quantity}</p>
                      {item.selectedSize && <p className="text-[11px] sm:text-sm font-semibold uppercase tracking-widest text-orange-400">Size {item.selectedSize}</p>}
                    </div>
                    <p className="shrink-0 text-xs sm:text-xl font-bold text-orange-400">GHS {((item.flashSalePrice || item.price) * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-[1.15rem] border border-white/10 bg-[rgba(9,9,11,0.34)] p-4 text-sm sm:text-base leading-7 md:leading-8 text-white/60">
                Select a delivery zone to apply the correct delivery fee before placing your order.
              </div>

              <div className="mt-6 space-y-3 border-t border-white/10 pt-6">
                <SummaryRow label="Payment" value={formData.paymentMethod} />
                <SummaryRow label="Delivery Zone" value={selectedZone?.name || 'Not selected'} />
                <SummaryRow label="Subtotal" value={`GHS ${subtotal.toFixed(2)}`} />
                <SummaryRow label="Delivery Fee" value={`GHS ${deliveryFee.toFixed(2)}`} />
                <div className="flex items-center justify-between gap-4 pt-3">
                  <span className="text-xl sm:text-3xl font-black tracking-tight">Estimated Total</span>
                  <span className="text-2xl sm:text-4xl font-black text-orange-400">GHS {estimatedTotal.toFixed(2)}</span>
                </div>
              </div>

              <p className="mt-5 text-xs sm:text-sm leading-6 md:leading-7 text-white/55">
                Select your delivery zone at checkout to calculate the final delivery fee.
              </p>

              <button
                type="submit"
                onClick={handlePlaceOrder}
                disabled={isSubmitting || !selectedZone || !formData.name || !formData.phone || !formData.address}
                className="mt-6 w-full rounded-full bg-orange-500 px-6 py-4 text-base font-bold text-black transition-colors hover:bg-orange-400 disabled:opacity-60"
              >
                {isSubmitting ? 'Placing Order...' : 'Place Order & View Payment Instructions'}
              </button>

              <div className="mt-5 flex items-center gap-3 text-sm text-white/45">
                <ShieldCheck size={18} className="text-orange-400" />
                <span>Secure checkout flow and admin-synced delivery settings.</span>
              </div>
            </Panel>
=======
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
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
          </div>
        </div>
      </div>
    </div>
  );
};

<<<<<<< HEAD
const Panel = ({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon?: React.ElementType;
  children?: React.ReactNode;
}) => (
  <section className="rounded-[2rem] border border-white/10 bg-[rgba(24,24,27,0.64)] p-4 sm:p-6 backdrop-blur-xl">
    <div className="flex items-start gap-4">
      {Icon && (
        <div className="mt-1 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-orange-500 text-black">
          <Icon size={24} />
        </div>
      )}
      <div className="flex-1">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">{title}</h2>
        <p className="mt-3 max-w-4xl text-sm sm:text-base md:text-lg leading-7 md:leading-8 text-white/55">{subtitle}</p>
      </div>
    </div>
    {children && <div className="mt-6 space-y-4">{children}</div>}
  </section>
);

const InfoInput = ({
  icon: Icon,
  label,
  value,
  onChange,
  fullWidth = false,
  multiline = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  onChange: (value: string) => void;
  fullWidth?: boolean;
  multiline?: boolean;
}) => (
  <div className={fullWidth ? 'w-full' : ''}>
    <label className="mb-2 block text-xs sm:text-sm text-white/45">{label}</label>
    <div className={`flex items-start gap-3 rounded-[1.15rem] border border-white/10 bg-[rgba(9,9,11,0.34)] px-4 py-3.5 sm:py-4 backdrop-blur-md ${fullWidth ? 'w-full' : ''}`}>
      <Icon size={18} className="mt-1 text-orange-400" />
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-[90px] w-full resize-none bg-transparent text-base sm:text-lg font-medium outline-none placeholder:text-white/35"
          placeholder={label}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent text-base sm:text-lg font-medium outline-none placeholder:text-white/35"
          placeholder={label}
        />
      )}
    </div>
  </div>
);

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-4 text-sm sm:text-2xl md:text-[28px] font-bold tracking-tight">
    <span className="text-white/85">{label}</span>
    <span className="max-w-[48%] text-right text-white break-words">{value}</span>
  </div>
);

const InfoLine = ({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div className={`flex items-center justify-between gap-4 rounded-[1.15rem] border px-4 py-4 ${highlight ? 'border-orange-500 bg-[rgba(249,115,22,0.05)]' : 'border-white/10 bg-[rgba(9,9,11,0.34)]'}`}>
    <span className="text-sm sm:text-lg font-semibold text-white/55">{label}</span>
    <span className={`max-w-[52%] text-right break-words text-base sm:text-2xl font-black ${highlight ? 'text-orange-400' : 'text-white'}`}>{value}</span>
  </div>
);

export default Checkout;
=======
export default Checkout;
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
