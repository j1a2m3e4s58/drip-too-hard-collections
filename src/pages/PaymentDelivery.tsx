import React, { useEffect, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { Clock, CreditCard, MapPin, ShieldCheck, Smartphone, Truck } from 'lucide-react';
import { db } from '../firebase';
import { formatGhanaCedis } from '../lib/utils';
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
            <div className="space-y-4">{zones.map((item) => <div key={item.id} className="rounded-[1.5rem] border border-white/10 bg-zinc-900 p-6"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><h3 className="text-2xl font-bold">{item.name}</h3><p className="font-semibold text-orange-400">{formatGhanaCedis(item.fee)}</p></div><p className="mt-2 text-white/60">{item.eta}</p>{item.notes && <p className="mt-2 text-sm text-white/40">{item.notes}</p>}</div>)}</div>
          </section>
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) => (
  <div className="space-y-4 border border-white/5 bg-zinc-900 p-8"><div className="flex items-center gap-3"><Icon className="text-orange-500" size={24} /><h3 className="text-xl font-bold uppercase">{title}</h3></div><p className="text-sm leading-relaxed text-white/50">{text}</p></div>
);

export default PaymentDelivery;
