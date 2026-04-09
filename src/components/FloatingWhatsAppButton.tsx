import React, { useEffect, useState } from 'react';
import { MessageCircleMore } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { StoreSettings } from '../types';
import { defaultStoreSettings, STOREFRONT_SETTINGS_DOC } from '../lib/storefront';

const FloatingWhatsAppButton = () => {
  const location = useLocation();
  const [settings, setSettings] = useState<StoreSettings>({ id: 'settings', ...defaultStoreSettings });
  const hideButton = location.pathname.startsWith('/admin') || location.pathname === '/login';

  useEffect(() => {
    const unsub = onSnapshot(doc(db, STOREFRONT_SETTINGS_DOC), (snap) => {
      if (snap.exists()) {
        setSettings({ id: snap.id, ...defaultStoreSettings, ...(snap.data() as Omit<StoreSettings, 'id'>) });
      }
    });

    return () => unsub();
  }, []);

  const cleanNumber = settings.supportWhatsapp.replace(/\D/g, '');
  const message = encodeURIComponent('Hello DTHC team, I need help with a product or order.');

  if (hideButton) {
    return null;
  }

  return (
    <a
      href={`https://wa.me/${cleanNumber}?text=${message}`}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-24 right-4 z-[54] inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#25D366] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-black shadow-[0_16px_40px_rgba(0,0,0,0.32)] transition-transform hover:-translate-y-0.5 md:bottom-6 md:right-6"
    >
      <MessageCircleMore size={18} />
      <span className="hidden sm:inline">WhatsApp Help</span>
    </a>
  );
};

export default FloatingWhatsAppButton;
