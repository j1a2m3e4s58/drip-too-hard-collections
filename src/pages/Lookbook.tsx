<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { ArrowRight, Instagram } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { LookbookItem, Product, StoreSettings } from '../types';
import { defaultLookbook, defaultStoreSettings, sanitizeAdminManagedImage, STOREFRONT_SETTINGS_DOC } from '../lib/storefront';
import { mergeWithImportedCatalogProducts } from '../lib/importedCatalog';

const Lookbook = () => {
  const [items, setItems] = useState<LookbookItem[]>(defaultLookbook);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({ id: 'settings', ...defaultStoreSettings });

  useEffect(() => {
    const unsubItems = onSnapshot(collection(db, 'lookbookItems'), (snap) => {
      const next = snap.docs.map((item) => {
        const data = item.data() as Omit<LookbookItem, 'id'>;
        return { id: item.id, ...data, image: sanitizeAdminManagedImage(data.image) };
      }) as LookbookItem[];
      setItems(next.sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99)));
    });
    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      const next = snap.docs.map((item) => ({ id: item.id, ...item.data() })) as Product[];
      setProducts(mergeWithImportedCatalogProducts(next));
    });
    const unsubSettings = onSnapshot(doc(db, STOREFRONT_SETTINGS_DOC), (snap) => {
      if (snap.exists()) setSettings({ id: snap.id, ...defaultStoreSettings, ...(snap.data() as Omit<StoreSettings, 'id'>) });
    });
    setProducts(mergeWithImportedCatalogProducts([]));
    return () => { unsubItems(); unsubProducts(); unsubSettings(); };
  }, []);

  const getShopTarget = (item: LookbookItem) => {
    if (item.linkedProductIds?.length) {
      return `/shop?ids=${encodeURIComponent(item.linkedProductIds.join(','))}`;
    }

    return `/shop?q=${encodeURIComponent(item.title || item.caption)}`;
  };

  const getLinkedProducts = (item: LookbookItem) =>
    products.filter((product) => item.linkedProductIds?.includes(product.id)).slice(0, 3);

  return (
    <div className="min-h-screen bg-black pb-16 md:pb-24 pt-24 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 md:mb-16 text-center"><h1 className="mb-4 text-3xl sm:text-5xl md:text-8xl font-black uppercase italic tracking-tighter">{settings.lookbookHeadline}</h1><p className="mx-auto max-w-2xl text-sm sm:text-base md:text-lg leading-7 md:leading-8 text-white/50">{settings.lookbookDescription}</p></div>
        {items.length === 0 ? (
          <div className="rounded-[1.75rem] border border-white/10 bg-[rgba(24,24,27,0.64)] p-6 sm:p-10 text-center backdrop-blur-xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">Lookbook Area Is Clear</p>
            <h2 className="mt-4 text-2xl sm:text-4xl font-black uppercase italic tracking-tighter">Add your own lookbook items from admin</h2>
          </div>
        ) : (
        <div className="grid grid-cols-1 gap-5 md:gap-8 md:grid-cols-2">
          {items.map((item, index) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }} className={`group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-zinc-900 ${index % 3 === 0 ? 'md:row-span-2' : ''}`}>
              <Link to={getShopTarget(item)} className="block h-full w-full">
                <LookbookImage image={item.image} alt={item.caption} title={item.title || item.caption} />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-transparent to-transparent p-5 sm:p-8">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-orange-500">{item.title || 'Style Inspo'}</p>
                  <h3 className="text-base sm:text-xl font-black uppercase italic break-words">{item.caption}</h3>
                  {item.description && <p className="mt-2 text-xs sm:text-sm leading-6 text-white/70">{item.description}</p>}
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2.5 sm:px-5 sm:py-3 text-[10px] sm:text-xs font-black uppercase tracking-widest text-black">
                    <span>{item.ctaText || 'Shop This Fit'}</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
              {getLinkedProducts(item).length > 0 && (
                <div className="absolute left-3 right-3 top-3 z-10 rounded-[1.15rem] border border-white/10 bg-black/50 p-2.5 sm:left-4 sm:right-4 sm:top-4 sm:p-3 backdrop-blur-md">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Linked Fit Pieces</p>
                  <div className="space-y-2">
                    {getLinkedProducts(item).map((product) => (
                      <Link
                        key={product.id}
                        to={`/product/${product.id}`}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white/85 transition-colors hover:border-orange-500/40 hover:text-orange-400"
                      >
                        <span className="truncate pr-3">{product.name}</span>
                        <span className="shrink-0 text-orange-400">GHS {product.flashSalePrice || product.price}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
        )}
        <div className="mt-16 md:mt-24 text-center">
          <h3 className="mb-5 md:mb-6 text-xl md:text-2xl font-black uppercase italic">Want to be featured?</h3>
          <p className="mb-6 md:mb-8 text-sm md:text-base text-white/50">Tag the brand and keep the fit clean.</p>
          <a href={`https://instagram.com/${settings.instagramHandle.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-white px-6 py-3.5 md:px-8 md:py-4 text-xs sm:text-sm font-black uppercase tracking-widest text-black hover:bg-orange-500"><Instagram size={20} /><span>Follow @{settings.instagramHandle.replace(/^@/, '')}</span></a>
=======
import React from 'react';
import { motion } from 'motion/react';
import { LOOKBOOK } from '../constants';
import { Instagram } from 'lucide-react';

const Lookbook = () => {
  return (
    <div className="bg-black text-white min-h-screen pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic mb-4">Lookbook</h1>
          <p className="text-white/50 max-w-2xl mx-auto text-lg">
            Streetwear fits and drip inspiration. See how the community is rocking DTHC.
          </p>
        </div>

        {/* Masonry-style Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {LOOKBOOK.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative group overflow-hidden bg-zinc-900 ${
                index % 3 === 0 ? 'md:row-span-2' : ''
              }`}
            >
              <img
                src={item.image}
                alt={item.caption}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8">
                <p className="text-orange-500 text-xs font-bold uppercase tracking-widest mb-2">Style Inspo</p>
                <h3 className="text-xl font-black uppercase italic">{item.caption}</h3>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-24 text-center">
          <h3 className="text-2xl font-black uppercase italic mb-6">Want to be featured?</h3>
          <p className="text-white/50 mb-8">Tag us in your fits on Instagram using #DTHCAccra</p>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-3 bg-white text-black px-8 py-4 text-sm font-black uppercase tracking-widest hover:bg-orange-500 transition-colors"
          >
            <Instagram size={20} />
            <span>Follow @DTHC_Accra</span>
          </a>
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
        </div>
      </div>
    </div>
  );
};

<<<<<<< HEAD
const LookbookImage = ({ image, alt, title }: { image: string; alt: string; title: string }) => {
  const [failed, setFailed] = useState(false);

  if (!image || failed) {
    return (
      <div className="flex h-full min-h-[300px] sm:min-h-[360px] w-full items-center justify-center bg-zinc-950 p-6 text-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-400">Lookbook Image Placeholder</p>
          <p className="mt-3 text-lg font-black uppercase italic text-white/70">{title}</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={alt}
      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
};

=======
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
export default Lookbook;
