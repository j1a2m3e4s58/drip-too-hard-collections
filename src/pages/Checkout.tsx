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
import { formatGhanaCedis } from '../lib/utils';

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
        ...(item.selectedColor ? { selectedColor: item.selectedColor } : {}),
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
    } finally {
      setIsSubmitting(false);
    }
  };

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
      </div>
    );
  }

  return (
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
                          <p className="text-xs sm:text-sm text-white/55">Delivery fee: {formatGhanaCedis(zone.fee)}</p>
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
                <InfoLine label="Amount" value={formatGhanaCedis(estimatedTotal)} highlight />
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
                    {item.selectedColor && <p className="text-[11px] sm:text-sm font-semibold uppercase tracking-widest text-white/55">Color {item.selectedColor}</p>}
                  </div>
                    <p className="shrink-0 text-xs sm:text-xl font-bold text-orange-400">{formatGhanaCedis((item.flashSalePrice || item.price) * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-[1.15rem] border border-white/10 bg-[rgba(9,9,11,0.34)] p-4 text-sm sm:text-base leading-7 md:leading-8 text-white/60">
                Select a delivery zone to apply the correct delivery fee before placing your order.
              </div>

              <div className="mt-6 space-y-3 border-t border-white/10 pt-6">
                <SummaryRow label="Payment" value={formData.paymentMethod} />
                <SummaryRow label="Delivery Zone" value={selectedZone?.name || 'Not selected'} />
                <SummaryRow label="Subtotal" value={formatGhanaCedis(subtotal)} />
                <SummaryRow label="Delivery Fee" value={formatGhanaCedis(deliveryFee)} />
                <div className="flex items-center justify-between gap-4 pt-3">
                  <span className="text-xl sm:text-3xl font-black tracking-tight">Estimated Total</span>
                  <span className="text-2xl sm:text-4xl font-black text-orange-400">{formatGhanaCedis(estimatedTotal)}</span>
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
          </div>
        </div>
      </div>
    </div>
  );
};

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
