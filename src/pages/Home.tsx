import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Clock, MapPin, ShoppingBag, Truck, Zap } from 'lucide-react';
import { collection, doc, limit, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import ProductCard from '../components/ProductCard';
import { Collection, DeliveryZone, HeroBanner, Product, StoreSettings } from '../types';
import { defaultCollections, defaultDeliveryZones, defaultHeroBanners, defaultStoreSettings, isValidHeroBannerContent, sanitizeAdminManagedImage, STOREFRONT_SETTINGS_DOC } from '../lib/storefront';
import { importedCatalogProducts } from '../lib/importedCatalog';
import { formatGhanaCedis } from '../lib/utils';

const heroAnimationMap: Record<string, { initial: { opacity: number; x?: number; y?: number; scale?: number }; animate: { opacity: number; x?: number; y?: number; scale?: number }; transition: { duration: number; ease?: string } }> = {
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.6 } },
  zoom: { initial: { opacity: 0, scale: 1.08 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.75 } },
  'slide-left': { initial: { opacity: 0, x: 80 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.7 } },
  'slide-up': { initial: { opacity: 0, y: 70 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7 } },
  float: { initial: { opacity: 0, y: 24, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { duration: 0.7 } },
  spotlight: { initial: { opacity: 0, scale: 1.03 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.9 } },
};

const Home = () => {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState<Product[]>([]);
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>(defaultHeroBanners);
  const [collectionsData, setCollectionsData] = useState<Collection[]>(defaultCollections);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(defaultDeliveryZones);
  const [settings, setSettings] = useState<StoreSettings>({ id: 'settings', ...defaultStoreSettings });
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const heroGestureStartRef = useRef<number | null>(null);
  const heroGestureMovedRef = useRef(false);

  useEffect(() => {
    const unsubFeatured = onSnapshot(query(collection(db, 'products'), where('featured', '==', true), limit(4)), (snap) => {
      const next = snap.docs.map((item) => ({ id: item.id, ...item.data() })) as Product[];
      setFeaturedProducts(next.length ? next : importedCatalogProducts.filter((item) => item.featured).slice(0, 4));
    });
    const unsubFlash = onSnapshot(query(collection(db, 'products'), where('flashSalePrice', '>', 0), limit(4)), (snap) => {
      const next = snap.docs.map((item) => ({ id: item.id, ...item.data() })) as Product[];
      setFlashSaleProducts(next.length ? next : importedCatalogProducts.filter((item) => !!item.flashSalePrice).slice(0, 4));
    });
    const unsubHero = onSnapshot(collection(db, 'heroBanners'), (snap) => {
      const next = snap.docs.map((item) => {
        const data = item.data() as Omit<HeroBanner, 'id'>;
        return {
          id: item.id,
          ...data,
          image: sanitizeAdminManagedImage(data.image),
          bubbleItems: (data.bubbleItems || []).map((bubble) => ({
            ...bubble,
            image: sanitizeAdminManagedImage(bubble.image),
          })),
        };
      }) as HeroBanner[];
      setHeroBanners(
        next
          .filter((item) => item.isActive && isValidHeroBannerContent(item))
          .sort((a, b) => a.sortOrder - b.sortOrder),
      );
    });
    const unsubCollections = onSnapshot(collection(db, 'storefrontCollections'), (snap) => {
      const next = snap.docs.map((item) => ({ id: item.id, ...item.data() })) as Collection[];
      setCollectionsData(next.sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99)));
    });
    const unsubZones = onSnapshot(collection(db, 'deliveryZones'), (snap) => {
      const next = snap.docs.map((item) => ({ id: item.id, ...item.data() })) as DeliveryZone[];
      setDeliveryZones(next.filter((item) => item.active).sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99)));
    });
    const unsubSettings = onSnapshot(doc(db, STOREFRONT_SETTINGS_DOC), (snap) => {
      if (snap.exists()) setSettings({ id: snap.id, ...defaultStoreSettings, ...(snap.data() as Omit<StoreSettings, 'id'>) });
    });

    setFeaturedProducts(importedCatalogProducts.filter((item) => item.featured).slice(0, 4));
    setFlashSaleProducts(importedCatalogProducts.filter((item) => !!item.flashSalePrice).slice(0, 4));

    const timer = setInterval(() => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();
      setTimeLeft({ hours: Math.floor((diff / (1000 * 60 * 60)) % 24), minutes: Math.floor((diff / 1000 / 60) % 60), seconds: Math.floor((diff / 1000) % 60) });
    }, 1000);

    return () => {
      unsubFeatured();
      unsubFlash();
      unsubHero();
      unsubCollections();
      unsubZones();
      unsubSettings();
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!heroBanners.length) {
      return;
    }

    const slider = window.setInterval(() => {
      setActiveHeroIndex((current) => (current + 1) % heroBanners.length);
    }, 5200);

    return () => window.clearInterval(slider);
  }, [heroBanners]);

  useEffect(() => {
    if (activeHeroIndex >= heroBanners.length && heroBanners.length > 0) {
      setActiveHeroIndex(0);
    }
  }, [activeHeroIndex, heroBanners.length]);

  const heroSlides = useMemo(() => heroBanners.filter((item) => item.image || item.title || item.subtitle), [heroBanners]);
  const hero = useMemo(() => heroSlides[activeHeroIndex] || null, [activeHeroIndex, heroSlides]);
  const featuredCollection = useMemo(() => collectionsData.find((item) => item.featured) || collectionsData[0] || null, [collectionsData]);
  const storefrontDeliveryEta = useMemo(() => deliveryZones.find((item) => item.eta)?.eta || '', [deliveryZones]);
  const heroImageAnimation = hero ? heroAnimationMap[hero.animationStyle || 'zoom'] || heroAnimationMap.zoom : heroAnimationMap.zoom;
  const bubblePositions = [
    'left-[5%] top-[16%] md:left-[56%] md:top-[14%]',
    'left-[6%] bottom-[16%] md:left-[52%] md:bottom-[13%]',
    'right-[4%] top-[20%] md:right-[11%] md:top-[16%]',
    'right-[7%] bottom-[12%] md:right-[7%] md:bottom-[16%]',
  ];

  const getHeroBubbleTarget = (bubble: NonNullable<HeroBanner['bubbleItems']>[number]) => {
    if (bubble.productId) {
      return `/product/${bubble.productId}`;
    }

    return `/shop?q=${encodeURIComponent(bubble.title)}`;
  };

  const getHeroTarget = (item: HeroBanner) => {
    if (item.targetProductId) {
      return `/shop?ids=${encodeURIComponent(item.targetProductId)}`;
    }

    if (item.ctaLink) {
      return item.ctaLink;
    }

    return item.title ? `/shop?q=${encodeURIComponent(item.title)}` : '/shop';
  };

  const stepHero = (direction: 'prev' | 'next') => {
    if (!heroSlides.length) {
      return;
    }

    setActiveHeroIndex((current) =>
      direction === 'next'
        ? (current + 1) % heroSlides.length
        : (current - 1 + heroSlides.length) % heroSlides.length,
    );
  };

  const startHeroGesture = (clientX: number) => {
    if (!hero) {
      return;
    }

    heroGestureStartRef.current = clientX;
    heroGestureMovedRef.current = false;
  };

  const finishHeroGesture = (clientX: number, target: EventTarget | null) => {
    if (!hero || heroGestureStartRef.current === null) {
      return;
    }

    const deltaX = clientX - heroGestureStartRef.current;
    const interactiveTarget = target instanceof HTMLElement ? target.closest('a, button, input, select, textarea') : null;

    if (Math.abs(deltaX) >= 12) {
      heroGestureMovedRef.current = true;
    }

    if (deltaX <= -60) {
      stepHero('next');
    } else if (deltaX >= 60) {
      stepHero('prev');
    } else if (!interactiveTarget && !heroGestureMovedRef.current) {
      navigate(getHeroTarget(hero));
    }

    heroGestureStartRef.current = null;
    heroGestureMovedRef.current = false;
  };

  const clearHeroGesture = () => {
    heroGestureStartRef.current = null;
    heroGestureMovedRef.current = false;
  };

  return (
    <div className="bg-black text-white">
      <section
        className="relative min-h-[92svh] md:min-h-screen overflow-hidden"
        onMouseDown={(event) => startHeroGesture(event.clientX)}
        onMouseUp={(event) => finishHeroGesture(event.clientX, event.target)}
        onMouseLeave={clearHeroGesture}
        onTouchStart={(event) => startHeroGesture(event.touches[0]?.clientX ?? 0)}
        onTouchMove={(event) => {
          const nextX = event.touches[0]?.clientX;
          if (heroGestureStartRef.current !== null && typeof nextX === 'number' && Math.abs(nextX - heroGestureStartRef.current) >= 12) {
            heroGestureMovedRef.current = true;
          }
        }}
        onTouchEnd={(event) => finishHeroGesture(event.changedTouches[0]?.clientX ?? heroGestureStartRef.current ?? 0, event.target)}
        onTouchCancel={clearHeroGesture}
      >
        <div className="absolute inset-0 bg-black" />
        {hero?.image ? (
          <motion.img
            key={`${hero.id}-image`}
            src={hero.image}
            alt={hero.title}
            initial={heroImageAnimation.initial}
            animate={heroImageAnimation.animate}
            transition={heroImageAnimation.transition}
            className="absolute inset-0 h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-950" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.26)_22%,rgba(0,0,0,0.44)_54%,rgba(0,0,0,0.82)_100%)] md:bg-[linear-gradient(90deg,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.76)_28%,rgba(0,0,0,0.35)_60%,rgba(0,0,0,0.58)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.14),transparent_25%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.06),transparent_24%)]" />
        <div className="relative z-10 flex min-h-[92svh] md:min-h-screen items-start px-5 pb-28 pt-24 sm:px-8 md:items-center md:px-10 md:py-24 lg:px-16 xl:px-20">
          <div className="max-w-3xl rounded-[0rem] border-0 bg-transparent p-0 backdrop-blur-none md:rounded-[2rem] md:border md:border-white/10 md:bg-black/35 md:p-10 md:backdrop-blur-md">
            {hero ? (
              <motion.div key={hero.id} initial={{ opacity: 0, x: -35 }} animate={{ opacity: 1, x: 0 }} className="max-w-3xl" style={{ touchAction: 'pan-y' }}>
                <span className="mb-4 block text-xs font-bold uppercase tracking-[0.35em] text-orange-500">{hero.eyebrow || settings.announcementText}</span>
                <h1 className="mb-4 max-w-[7ch] text-[3rem] font-black uppercase italic leading-[0.92] tracking-tighter sm:text-[4.3rem] md:mb-6 md:max-w-none md:text-7xl xl:text-8xl">{hero.title}</h1>
                <p className="mb-7 max-w-[18rem] text-[15px] leading-7 text-white/75 sm:max-w-[22rem] sm:text-lg md:mb-10 md:max-w-2xl">{hero.subtitle || settings.homepageDescription}</p>
                {hero.priceLabel && <p className="mb-5 text-sm font-black uppercase tracking-[0.22em] text-white/85 md:mb-6">{hero.priceLabel}</p>}
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
                  <Link to={getHeroTarget(hero)} className="inline-flex items-center justify-center gap-2 bg-orange-500 px-6 py-4 text-sm font-black uppercase tracking-widest text-black hover:bg-white md:px-8"><span>{hero.ctaText || 'Shop Now'}</span><ShoppingBag size={18} /></Link>
                  <Link to="/collections" className="inline-flex items-center justify-center gap-2 border border-white/30 bg-black/20 px-6 py-4 text-sm font-black uppercase tracking-widest hover:bg-white hover:text-black md:px-8"><span>View Collections</span><ArrowRight size={18} /></Link>
                </div>
                <div className="mt-6 flex gap-3 md:mt-8">
                  {heroSlides.map((slide, index) => (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setActiveHeroIndex(index)}
                      className={`h-2.5 rounded-full transition-all ${index === activeHeroIndex ? 'w-10 bg-orange-500' : 'w-2.5 bg-white/35 hover:bg-white/55'}`}
                      aria-label={`View hero slide ${index + 1}`}
                    />
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="max-w-2xl">
                <span className="mb-4 block text-xs font-bold uppercase tracking-[0.35em] text-orange-500">Hero Banner</span>
                <h1 className="mb-6 text-5xl font-black uppercase italic tracking-tighter md:text-7xl">Add Your Own Hero Images</h1>
                <p className="max-w-2xl text-lg leading-relaxed text-white/70">The homepage hero will only show banners you add from the admin hero manager.</p>
              </div>
            )}
          </div>
        </div>
        {(hero?.bubbleItems || []).some((bubble) => bubble.image) && (
          <div className="absolute bottom-5 left-0 right-0 z-20 px-4 md:hidden">
            <div className="flex gap-3 overflow-x-auto pb-1">
              {(hero?.bubbleItems || []).slice(0, 4).map((bubble, index) => {
                if (!bubble.image) {
                  return null;
                }

                return (
                  <Link
                    key={`${hero.id}-mobile-bubble-${index}`}
                    to={getHeroBubbleTarget(bubble)}
                    className="flex min-w-[168px] shrink-0 items-center gap-3 rounded-[1.1rem] border border-white/10 bg-[rgba(24,24,27,0.52)] p-2.5 shadow-[0_12px_24px_rgba(0,0,0,0.22)] backdrop-blur-xl"
                  >
                    <div className="h-12 w-12 overflow-hidden rounded-xl bg-zinc-950">
                      <img src={bubble.image} alt={bubble.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-black uppercase tracking-tight text-white">{bubble.title}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-orange-400">{bubble.price}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
        {(hero?.bubbleItems || []).slice(0, 4).map((bubble, index) => {
          if (!bubble.image) {
            return null;
          }

          return (
            <motion.div
              key={`${hero.id}-bubble-${index}`}
              initial={{ opacity: 0, y: 20, scale: 0.92 }}
              animate={{ opacity: 1, y: [0, -8, 0], scale: 1 }}
              transition={{ delay: 0.15 * (index + 1), duration: 0.45, repeat: Infinity, repeatDelay: 1.8 + index * 0.25 }}
              className={`absolute z-20 hidden max-w-[220px] md:block ${bubblePositions[index]}`}
            >
              <Link
                to={getHeroBubbleTarget(bubble)}
                className="block rounded-[1.4rem] border border-white/10 bg-[rgba(24,24,27,0.64)] p-3 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-transform hover:-translate-y-1"
              >
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl bg-zinc-950">
                    {bubble.image ? (
                      <img src={bubble.image} alt={bubble.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-bold uppercase tracking-widest text-white/35">No image</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black uppercase tracking-tight text-white">{bubble.title}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-widest text-orange-400">{bubble.price}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </section>

      {flashSaleProducts.length > 0 && (
        <section className="bg-zinc-900 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div><div className="mb-2 flex items-center gap-2 text-orange-500"><Zap size={20} fill="currentColor" /><span className="text-xs font-black uppercase tracking-widest">Flash Sale</span></div><h2 className="text-5xl font-black uppercase italic tracking-tighter">Limited Time Drops</h2></div>
              <div className="flex items-center gap-4 border border-white/10 bg-black p-4"><Clock size={20} className="text-orange-500" /><div className="flex gap-4 text-2xl font-black">{[timeLeft.hours, timeLeft.minutes, timeLeft.seconds].map((item, index) => <span key={index}>{item.toString().padStart(2, '0')}</span>)}</div></div>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">{flashSaleProducts.map((item) => <ProductCard key={item.id} product={item} deliveryEta={storefrontDeliveryEta} />)}</div>
          </div>
        </section>
      )}

      <section className="bg-zinc-950 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex items-end justify-between">
            <div><h2 className="text-4xl font-black uppercase italic tracking-tighter">Featured Drops</h2><p className="mt-2 text-white/50">The admin panel controls which products surface here.</p></div>
            <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-500 hover:text-white"><span>View All</span><ArrowRight size={16} /></Link>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">{featuredProducts.map((item) => <ProductCard key={item.id} product={item} deliveryEta={storefrontDeliveryEta} />)}</div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="relative overflow-hidden bg-zinc-900">
            {featuredCollection ? (
              <>
                {featuredCollection.image ? (
                  <img
                    src={featuredCollection.image}
                    alt={featuredCollection.title}
                    className="h-full w-full object-cover opacity-80"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full min-h-[420px] items-center justify-center bg-zinc-950 p-8 text-center">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-400">Collection Placeholder</p>
                      <p className="mt-3 text-3xl font-black uppercase italic text-white/70">{featuredCollection.title}</p>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <div className="max-w-md border border-white/10 bg-black/60 p-8 text-center backdrop-blur-sm">
                    <h3 className="mb-4 text-4xl font-black uppercase italic">{featuredCollection.title}</h3>
                    <p className="mb-6 text-white/70">{featuredCollection.description}</p>
                    <Link to="/collections" className="inline-block bg-white px-6 py-3 text-xs font-bold uppercase tracking-widest text-black hover:bg-orange-500">
                      Explore Collection
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full min-h-[420px] items-center justify-center bg-zinc-950 p-8 text-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-400">Collections Placeholder</p>
                  <p className="mt-3 text-4xl font-black uppercase italic text-white/70">Add your own collections from admin</p>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-8">
            <h2 className="text-5xl font-black uppercase italic tracking-tighter">{settings.homepageHeadline}</h2>
            <p className="text-lg leading-relaxed text-white/60">{settings.homepageDescription}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ValueCard icon={MapPin} title="Base Location" text={settings.baseLocation} />
              <ValueCard icon={Truck} title="Zone-Based Delivery" text={settings.deliveryMessage} />
          <ValueCard icon={ShoppingBag} title="Free Delivery" text={`Available from ${formatGhanaCedis(settings.freeDeliveryThreshold)}`} />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 text-black">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)_auto] lg:items-center lg:px-8">
          <div><h4 className="font-black uppercase">Delivery Zones</h4><p className="text-sm opacity-60">Customers only see active delivery zones managed from the admin panel.</p></div>
          <div className="flex flex-wrap gap-3">{deliveryZones.map((item) => <div key={item.id} className="rounded-full bg-black px-5 py-3 text-xs font-bold uppercase tracking-widest text-white">{item.name}: {formatGhanaCedis(item.fee)}</div>)}</div>
          <Link to="/payment-delivery" className="inline-flex items-center justify-center bg-black px-8 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-orange-500">Learn More</Link>
        </div>
      </section>
    </div>
  );
};

const ValueCard = ({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) => (
  <div className="border border-white/5 bg-zinc-900 p-6"><Icon className="mb-4 text-orange-500" size={28} /><h4 className="mb-2 font-bold uppercase text-sm">{title}</h4><p className="text-xs text-white/40">{text}</p></div>
);

export default Home;

