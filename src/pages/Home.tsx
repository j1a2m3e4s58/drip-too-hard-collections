import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ShoppingBag, Zap, Truck, ShieldCheck, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { COLLECTIONS } from '../constants';
import ProductCard from '../components/ProductCard';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState<Product[]>([]);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Featured Products
    const qFeatured = query(
      collection(db, 'products'),
      where('inStock', '==', true),
      limit(4)
    );
    const unsubFeatured = onSnapshot(qFeatured, (snapshot) => {
      setFeaturedProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);
    });

    // Flash Sale Products
    const qFlash = query(
      collection(db, 'products'),
      where('flashSalePrice', '>', 0),
      limit(4)
    );
    const unsubFlash = onSnapshot(qFlash, (snapshot) => {
      setFlashSaleProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);
    });

    // Countdown Timer
    const timer = setInterval(() => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();
      
      setTimeLeft({
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60)
      });
    }, 1000);

    return () => {
      unsubFeatured();
      unsubFlash();
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="bg-black text-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=1920"
            alt="Hero Streetwear"
            className="w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <span className="text-orange-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 block">
              New Collection 2024
            </span>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 uppercase italic">
              Drip Too <br />
              <span className="text-transparent stroke-white stroke-1" style={{ WebkitTextStroke: '1px white' }}>Hard</span>
            </h1>
            <p className="text-lg text-white/70 mb-10 max-w-lg leading-relaxed">
              Elevate your street game with our latest drop. Premium quality, 
              unapologetic style. Accra's finest streetwear is here.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/shop"
                className="bg-orange-500 text-black px-8 py-4 text-sm font-black uppercase tracking-widest flex items-center space-x-2 hover:bg-white transition-all"
              >
                <span>Shop Now</span>
                <ShoppingBag size={18} />
              </Link>
              <Link
                to="/collections"
                className="border border-white/30 text-white px-8 py-4 text-sm font-black uppercase tracking-widest flex items-center space-x-2 hover:bg-white hover:text-black transition-all"
              >
                <span>View Collections</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Marquee */}
        <div className="absolute bottom-0 left-0 right-0 bg-orange-500 py-4 overflow-hidden whitespace-nowrap z-20 hidden md:block">
          <div className="flex animate-marquee space-x-12">
            {[...Array(10)].map((_, i) => (
              <span key={i} className="text-black font-black uppercase tracking-tighter text-2xl italic">
                DRIP TOO HARD COLLECTIONS • ACCRA STREETWEAR • PREMIUM QUALITY • NEW DROP NOW LIVE • 
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Flash Sale Section */}
      {flashSaleProducts.length > 0 && (
        <section className="py-24 bg-zinc-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <div className="flex items-center space-x-2 text-orange-500 mb-2">
                  <Zap size={20} fill="currentColor" />
                  <span className="text-xs font-black uppercase tracking-widest">Flash Sale</span>
                </div>
                <h2 className="text-5xl font-black uppercase italic tracking-tighter">Limited Time Drops</h2>
              </div>
              <div className="flex items-center space-x-4 bg-black p-4 border border-white/10">
                <Clock size={20} className="text-orange-500" />
                <div className="flex space-x-4 text-2xl font-black font-mono">
                  <div className="text-center">
                    <span className="block">{timeLeft.hours.toString().padStart(2, '0')}</span>
                    <span className="text-[8px] uppercase text-white/30">Hrs</span>
                  </div>
                  <span className="text-orange-500">:</span>
                  <div className="text-center">
                    <span className="block">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                    <span className="text-[8px] uppercase text-white/30">Min</span>
                  </div>
                  <span className="text-orange-500">:</span>
                  <div className="text-center">
                    <span className="block">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                    <span className="text-[8px] uppercase text-white/30">Sec</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {flashSaleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-24 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-black uppercase tracking-tighter italic">Featured Drops</h2>
              <p className="text-white/50 mt-2">The most wanted pieces of the season.</p>
            </div>
            <Link to="/shop" className="text-orange-500 text-sm font-bold uppercase tracking-widest flex items-center space-x-2 hover:text-white transition-colors">
              <span>View All</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Collections Highlight */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative aspect-square overflow-hidden bg-zinc-900"
            >
              <img
                src={COLLECTIONS[0].image}
                alt={COLLECTIONS[0].title}
                className="w-full h-full object-cover opacity-80"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8 bg-black/60 backdrop-blur-sm border border-white/10 max-w-md">
                  <h3 className="text-4xl font-black uppercase italic mb-4">{COLLECTIONS[0].title}</h3>
                  <p className="text-white/70 mb-6">{COLLECTIONS[0].description}</p>
                  <Link to="/collections" className="inline-block bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-orange-500 transition-colors">
                    Explore Collection
                  </Link>
                </div>
              </div>
            </motion.div>
            <div className="space-y-8">
              <h2 className="text-5xl font-black uppercase tracking-tighter leading-tight italic">
                Beyond Just <br />
                <span className="text-orange-500">Clothing.</span>
              </h2>
              <p className="text-lg text-white/60 leading-relaxed">
                Every DTHC piece tells a story of the streets. We don't just follow trends; we set the vibe. 
                Our collections are meticulously crafted for those who demand more from their wardrobe.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-zinc-900 border border-white/5">
                  <Zap className="text-orange-500 mb-4" size={32} />
                  <h4 className="font-bold uppercase text-sm mb-2">Fast Drops</h4>
                  <p className="text-xs text-white/40">Limited edition releases every month.</p>
                </div>
                <div className="p-6 bg-zinc-900 border border-white/5">
                  <ShieldCheck className="text-orange-500 mb-4" size={32} />
                  <h4 className="font-bold uppercase text-sm mb-2">Premium Quality</h4>
                  <p className="text-xs text-white/40">Hand-picked fabrics and expert stitching.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Delivery Info Banner */}
      <section className="bg-white text-black py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center space-x-4">
              <Truck size={40} className="text-orange-500" />
              <div>
                <h4 className="font-black uppercase tracking-tight">Nationwide Delivery</h4>
                <p className="text-sm opacity-60">Fast shipping across all regions in Ghana.</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center border-2 border-white font-bold text-[10px]">MTN</div>
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center border-2 border-white font-bold text-[10px] text-white">VODA</div>
              </div>
              <div>
                <h4 className="font-black uppercase tracking-tight">Mobile Money Ready</h4>
                <p className="text-sm opacity-60">Pay securely with MoMo or Bank Cards.</p>
              </div>
            </div>
            <Link to="/payment-delivery" className="bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-orange-500 transition-colors">
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
