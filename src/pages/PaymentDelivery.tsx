<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { Clock, CreditCard, MapPin, ShieldCheck, Smartphone, Truck } from 'lucide-react';
import { db } from '../firebase';
import { DeliveryZone, StoreSettings } from '../types';
import { defaultDeliveryZones, defaultStoreSettings, STOREFRONT_SETTINGS_DOC } from '../lib/storefront';

const PaymentDelivery = () => {
  const [zones, setZones] = useState<DeliveryZone[]>(defaultDeliveryZones);
  const [settings, setSettings] = useState<StoreSettings>({ id: 'settings', ...defaultStoreSettings });

  useEffect(() => {
    const unsubZones = onSnapshot(collection(db, 'deliveryZones'), (snap) => {
      const next = snap.docs.map((item) => ({ id: item.id, ...item.data() })) as DeliveryZone[];
      if (next.length) setZones(next.filter((item) => item.active).sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99)));
    });
    const unsubSettings = onSnapshot(doc(db, STOREFRONT_SETTINGS_DOC), (snap) => {
      if (snap.exists()) setSettings({ id: snap.id, ...defaultStoreSettings, ...(snap.data() as Omit<StoreSettings, 'id'>) });
    });
    return () => { unsubZones(); unsubSettings(); };
  }, []);

  return (
    <div className="min-h-screen bg-black pb-24 pt-24 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16"><h1 className="mb-4 text-6xl font-black uppercase italic tracking-tighter">{settings.paymentDeliveryHeadline}</h1><p className="max-w-2xl text-lg text-white/50">{settings.paymentDeliveryDescription}</p></div>
        <div className="grid gap-16 lg:grid-cols-2">
          <section className="space-y-8">
            <div className="flex items-center gap-4"><CreditCard className="text-orange-500" size={32} /><h2 className="text-3xl font-black uppercase italic">Payment Methods</h2></div>
            <InfoCard icon={Smartphone} title="Mobile Money" text={settings.paymentMethodsText} />
            <InfoCard icon={CreditCard} title="Cards & Transfers" text="Payment handling can be updated from the admin order screen as each order moves through proof review and payment confirmation." />
            <div className="flex items-start gap-4 rounded-lg border border-orange-500/20 bg-orange-500/10 p-6"><ShieldCheck className="shrink-0 text-orange-500" size={24} /><p className="text-sm leading-relaxed text-orange-200/80">Your security is a priority. Payment messaging, customer support details, and fulfillment updates are centrally controlled from the admin panel.</p></div>
          </section>
          <section className="space-y-8">
            <div className="flex items-center gap-4"><Truck className="text-orange-500" size={32} /><h2 className="text-3xl font-black uppercase italic">Delivery Info</h2></div>
            <InfoCard icon={MapPin} title="Base Location" text={settings.baseLocation} />
            <InfoCard icon={Truck} title="Zone-Based Delivery" text={settings.deliveryMessage} />
            <InfoCard icon={Clock} title="Active Delivery Zones" text="Only zones switched on in admin appear here and are used for customer-facing delivery messaging." />
            <div className="space-y-4">{zones.map((item) => <div key={item.id} className="rounded-[1.5rem] border border-white/10 bg-zinc-900 p-6"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><h3 className="text-2xl font-bold">{item.name}</h3><p className="font-semibold text-orange-400">GHS {item.fee.toFixed(2)}</p></div><p className="mt-2 text-white/60">{item.eta}</p>{item.notes && <p className="mt-2 text-sm text-white/40">{item.notes}</p>}</div>)}</div>
=======
import React from 'react';
import { motion } from 'motion/react';
import { CreditCard, Truck, Smartphone, ShieldCheck, Clock, MapPin } from 'lucide-react';

const PaymentDelivery = () => {
  return (
    <div className="bg-black text-white min-h-screen pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <h1 className="text-6xl font-black uppercase tracking-tighter italic mb-4">Payment & Delivery</h1>
          <p className="text-white/50 max-w-2xl text-lg">
            Everything you need to know about getting your drip delivered safely and securely in Ghana.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Payment Methods */}
          <section className="space-y-12">
            <div className="flex items-center space-x-4">
              <CreditCard className="text-orange-500" size={32} />
              <h2 className="text-3xl font-black uppercase italic">Payment Methods</h2>
            </div>
            
            <div className="space-y-6">
              <div className="p-8 bg-zinc-900 border border-white/5 space-y-4">
                <div className="flex items-center space-x-3">
                  <Smartphone className="text-orange-500" size={24} />
                  <h3 className="text-xl font-bold uppercase">Mobile Money (MoMo)</h3>
                </div>
                <p className="text-white/50 text-sm leading-relaxed">
                  We accept all major Mobile Money networks in Ghana including MTN Mobile Money, 
                  Telecel Cash, and AT Money. Fast, secure, and convenient.
                </p>
                <div className="flex gap-4 grayscale opacity-50">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/MTN_Logo.svg" alt="MTN" className="h-8" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Telecel_Group_Logo.svg/1200px-Telecel_Group_Logo.svg.png" alt="Telecel" className="h-8" />
                </div>
              </div>

              <div className="p-8 bg-zinc-900 border border-white/5 space-y-4">
                <div className="flex items-center space-x-3">
                  <CreditCard className="text-orange-500" size={24} />
                  <h3 className="text-xl font-bold uppercase">Debit & Credit Cards</h3>
                </div>
                <p className="text-white/50 text-sm leading-relaxed">
                  Secure online payments via Visa and Mastercard. All transactions are encrypted 
                  and processed through our secure payment gateway.
                </p>
                <div className="flex gap-4 grayscale opacity-50">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-8" />
                </div>
              </div>
            </div>

            <div className="p-6 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-start space-x-4">
              <ShieldCheck className="text-orange-500 shrink-0" size={24} />
              <p className="text-xs text-orange-500/80 leading-relaxed">
                Your security is our priority. We use industry-standard encryption to protect 
                your payment information. We never store your full card details.
              </p>
            </div>
          </section>

          {/* Delivery Info */}
          <section className="space-y-12">
            <div className="flex items-center space-x-4">
              <Truck className="text-orange-500" size={32} />
              <h2 className="text-3xl font-black uppercase italic">Delivery Info</h2>
            </div>

            <div className="space-y-8">
              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0">
                  <Clock className="text-orange-500" size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-black uppercase tracking-widest mb-2">Delivery Times</h4>
                  <ul className="text-white/50 text-sm space-y-2">
                    <li>• Accra & Tema: 1 - 2 Business Days</li>
                    <li>• Kumasi & Takoradi: 2 - 3 Business Days</li>
                    <li>• Other Regions: 3 - 5 Business Days</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0">
                  <MapPin className="text-orange-500" size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-black uppercase tracking-widest mb-2">Delivery Rates</h4>
                  <p className="text-white/50 text-sm leading-relaxed">
                    Standard delivery starts at GH₵ 30 within Accra. Rates for other regions 
                    are calculated at checkout based on your location.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0">
                  <Smartphone className="text-orange-500" size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-black uppercase tracking-widest mb-2">Tracking Your Order</h4>
                  <p className="text-white/50 text-sm leading-relaxed">
                    Once your order is dispatched, you will receive a SMS notification 
                    with your tracking details and the courier's contact information.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-zinc-900 border border-white/5">
              <h4 className="text-sm font-black uppercase tracking-widest mb-4">In-Store Pickup</h4>
              <p className="text-white/50 text-sm leading-relaxed mb-4">
                Prefer to pick up your order? Visit our studio in Osu, Accra. 
                Select "In-Store Pickup" at checkout.
              </p>
              <p className="text-xs text-orange-500 font-bold">Ready for pickup in 24 hours.</p>
            </div>
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
          </section>
        </div>
      </div>
    </div>
  );
};

<<<<<<< HEAD
const InfoCard = ({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) => (
  <div className="space-y-4 border border-white/5 bg-zinc-900 p-8"><div className="flex items-center gap-3"><Icon className="text-orange-500" size={24} /><h3 className="text-xl font-bold uppercase">{title}</h3></div><p className="text-sm leading-relaxed text-white/50">{text}</p></div>
);

=======
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
export default PaymentDelivery;
