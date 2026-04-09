<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Collection, Product, StoreSettings } from '../types';
import { defaultCollections, defaultStoreSettings, sanitizeAdminManagedImage, STOREFRONT_SETTINGS_DOC } from '../lib/storefront';
import { mergeWithImportedCatalogProducts } from '../lib/importedCatalog';

const Collections = () => {
  const [items, setItems] = useState<Collection[]>(defaultCollections);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({ id: 'settings', ...defaultStoreSettings });

  useEffect(() => {
    const unsubCollections = onSnapshot(collection(db, 'storefrontCollections'), (snap) => {
      const next = snap.docs.map((item) => {
        const data = item.data() as Omit<Collection, 'id'>;
        return { id: item.id, ...data, image: sanitizeAdminManagedImage(data.image) };
      }) as Collection[];
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
    return () => { unsubCollections(); unsubProducts(); unsubSettings(); };
  }, []);

  const getShopTarget = (item: Collection) => {
    if (item.linkedProductIds?.length) {
      return `/shop?ids=${encodeURIComponent(item.linkedProductIds.join(','))}`;
    }

    return `/shop?q=${encodeURIComponent(item.title)}`;
  };

  const getLinkedProducts = (item: Collection) =>
    products.filter((product) => item.linkedProductIds?.includes(product.id)).slice(0, 3);

  return (
    <div className="min-h-screen bg-black pb-16 md:pb-24 pt-24 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 md:mb-16"><h1 className="mb-4 text-3xl sm:text-5xl md:text-6xl font-black uppercase italic tracking-tighter">{settings.collectionsHeadline}</h1><p className="max-w-2xl text-sm sm:text-base md:text-lg leading-7 md:leading-8 text-white/50">{settings.collectionsDescription}</p></div>
        {items.length === 0 ? (
          <div className="rounded-[1.75rem] border border-white/10 bg-[rgba(24,24,27,0.64)] p-6 sm:p-10 text-center backdrop-blur-xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">Collections Area Is Clear</p>
            <h2 className="mt-4 text-2xl sm:text-4xl font-black uppercase italic tracking-tighter">Add your own collections from admin</h2>
          </div>
        ) : (
        <div className="space-y-16 md:space-y-32">
          {items.map((item, index) => (
            <div key={item.id} className={`flex flex-col gap-6 md:gap-12 items-center ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
              <motion.div initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="w-full overflow-hidden rounded-[1.5rem] border border-white/10 bg-zinc-900 lg:w-1/2">
                <Link to={getShopTarget(item)} className="block">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="aspect-[16/10] h-full w-full object-cover transition-transform duration-500 hover:scale-[1.02]" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex aspect-[16/10] items-center justify-center bg-zinc-950 p-8 text-center">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-400">Collection Image Placeholder</p>
                        <p className="mt-3 text-xl font-black uppercase italic text-white/70">{item.title}</p>
                      </div>
                    </div>
                  )}
                </Link>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="w-full space-y-4 md:space-y-6 lg:w-1/2">
                <span className="block text-xs font-bold uppercase tracking-[0.3em] text-orange-500">Collection {index + 1}</span>
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase italic tracking-tighter break-words">{item.title}</h2>
                <p className="text-sm sm:text-lg md:text-xl italic text-white/80">"{item.description}"</p>
                <div className="flex flex-wrap gap-3">
                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/70">
                    {item.linkedProductIds?.length || getLinkedProducts(item).length || 0} Pieces
                  </span>
                  {item.featured && (
                    <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-orange-400">
                      Featured Drop
                    </span>
                  )}
                </div>
                <div className="h-px w-24 bg-orange-500" />
                <p className="text-sm sm:text-base leading-7 md:leading-relaxed text-white/50">{item.story}</p>
                {getLinkedProducts(item).length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/40">Collection Preview</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {getLinkedProducts(item).map((product) => (
                        <Link
                          key={product.id}
                          to={`/product/${product.id}`}
                          className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-[rgba(24,24,27,0.72)] transition-all hover:border-orange-500/40"
                        >
                          <div className="aspect-[4/5] overflow-hidden bg-zinc-950">
                            <img src={product.image} alt={product.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="p-3">
                            <p className="truncate text-xs font-bold uppercase tracking-tight text-white">{product.name}</p>
                            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-orange-400">
                              GHS {product.flashSalePrice || product.price}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                <Link to={getShopTarget(item)} className="inline-flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-widest text-white hover:text-orange-500"><span>{item.ctaText || 'Shop the Collection'}</span><ArrowRight size={18} /></Link>
=======
import React from 'react';
import { motion } from 'motion/react';
import { COLLECTIONS } from '../constants';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Collections = () => {
  return (
    <div className="bg-black text-white min-h-screen pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <h1 className="text-6xl font-black uppercase tracking-tighter italic mb-4">Collections</h1>
          <p className="text-white/50 max-w-2xl text-lg">
            Every drop is a chapter. Explore the stories and inspirations behind our seasonal collections.
          </p>
        </div>

        <div className="space-y-32">
          {COLLECTIONS.map((collection, index) => (
            <div key={collection.id} className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 items-center`}>
              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="w-full lg:w-1/2 aspect-[16/10] overflow-hidden bg-zinc-900"
              >
                <img
                  src={collection.image}
                  alt={collection.title}
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-full lg:w-1/2 space-y-6"
              >
                <span className="text-orange-500 font-bold tracking-[0.3em] uppercase text-xs block">
                  Collection {index + 1}
                </span>
                <h2 className="text-5xl font-black uppercase tracking-tighter italic">{collection.title}</h2>
                <p className="text-xl text-white/80 leading-relaxed italic">
                  "{collection.description}"
                </p>
                <div className="h-px w-24 bg-orange-500" />
                <p className="text-white/50 leading-relaxed">
                  {collection.story}
                </p>
                <Link
                  to="/shop"
                  className="inline-flex items-center space-x-2 text-sm font-black uppercase tracking-widest text-white hover:text-orange-500 transition-colors"
                >
                  <span>Shop the Collection</span>
                  <ArrowRight size={18} />
                </Link>
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
              </motion.div>
            </div>
          ))}
        </div>
<<<<<<< HEAD
        )}
=======

        {/* Future Collections Teaser */}
        <div className="mt-32 p-16 bg-zinc-900 border border-white/5 text-center">
          <h3 className="text-3xl font-black uppercase italic mb-4">Coming Soon</h3>
          <p className="text-white/50 mb-8 max-w-xl mx-auto">
            We're currently in the lab working on our next major drop. 
            Sign up for our newsletter to be the first to know.
          </p>
          <div className="flex max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-grow bg-black border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
            />
            <button className="bg-orange-500 text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors">
              Notify Me
            </button>
          </div>
        </div>
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
      </div>
    </div>
  );
};

export default Collections;
