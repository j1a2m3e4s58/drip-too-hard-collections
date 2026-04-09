import React from 'react';
import { motion } from 'motion/react';
<<<<<<< HEAD
import { Award, Users, Globe } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { StoreSettings } from '../types';
import { defaultStoreSettings, STOREFRONT_SETTINGS_DOC } from '../lib/storefront';

const About = () => {
  const [settings, setSettings] = React.useState<StoreSettings>({ id: 'settings', ...defaultStoreSettings });

  React.useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, STOREFRONT_SETTINGS_DOC), (snap) => {
      if (snap.exists()) {
        setSettings({ id: snap.id, ...defaultStoreSettings, ...(snap.data() as Omit<StoreSettings, 'id'>) });
      }
    });

    return () => unsubscribe();
  }, []);

  const values = [
    { icon: Award, title: settings.aboutValueOneTitle, desc: settings.aboutValueOneDescription },
    { icon: Users, title: settings.aboutValueTwoTitle, desc: settings.aboutValueTwoDescription },
    { icon: Globe, title: settings.aboutValueThreeTitle, desc: settings.aboutValueThreeDescription },
  ];

  const stats = [
    { value: settings.aboutStatOneValue, label: settings.aboutStatOneLabel },
    { value: settings.aboutStatTwoValue, label: settings.aboutStatTwoLabel },
    { value: settings.aboutStatThreeValue, label: settings.aboutStatThreeLabel },
    { value: settings.aboutStatFourValue, label: settings.aboutStatFourLabel },
  ];

  return (
    <div className="min-h-screen bg-black text-white pt-24 md:pt-32 pb-16 md:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="relative mb-16 md:mb-24 h-[46vh] sm:h-[52vh] md:h-[60vh] overflow-hidden">
          <img 
            src={settings.aboutHeroImage}
=======
import { ShieldCheck, Truck, RotateCcw, Award, Users, Globe } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="relative h-[60vh] overflow-hidden mb-24">
          <img 
            src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=1920" 
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
            alt="About DTHC" 
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
<<<<<<< HEAD
              className="text-4xl sm:text-6xl md:text-9xl font-black uppercase italic tracking-tighter leading-none"
            >
              {settings.aboutHeroTitle} <span className="text-orange-500">{settings.aboutHeroAccent}</span>
=======
              className="text-7xl md:text-9xl font-black uppercase italic tracking-tighter leading-none"
            >
              The <span className="text-orange-500">Culture</span>
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
<<<<<<< HEAD
              className="mt-4 md:mt-6 text-[10px] sm:text-sm md:text-lg font-bold uppercase tracking-[0.3em] text-white/70"
            >
              {settings.aboutHeroEyebrow}
=======
              className="mt-6 text-sm md:text-lg font-bold uppercase tracking-[0.3em] text-white/70"
            >
              Curating Streetwear Excellence Since 2024
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
            </motion.p>
          </div>
        </div>

        {/* Story Section */}
<<<<<<< HEAD
        <div className="mb-20 md:mb-32 grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-24 items-center">
          <div className="space-y-6 md:space-y-8">
            <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter">{settings.aboutStoryTitle}</h2>
            <div className="space-y-5 md:space-y-6 text-white/60 text-sm sm:text-base md:text-lg leading-7 md:leading-relaxed font-medium">
              <p>{settings.aboutStoryParagraphOne}</p>
              <p>{settings.aboutStoryParagraphTwo}</p>
              <p>{settings.aboutStoryParagraphThree}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="aspect-[3/4] bg-zinc-900 border border-white/10 overflow-hidden">
              <img src={settings.aboutImageOne} alt="Culture 1" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="aspect-[3/4] bg-zinc-900 border border-white/10 overflow-hidden mt-8 md:mt-12">
              <img src={settings.aboutImageTwo} alt="Culture 2" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
=======
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center mb-32">
          <div className="space-y-8">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter">Our Story</h2>
            <div className="space-y-6 text-white/60 text-lg leading-relaxed font-medium">
              <p>
                Drip Too Hard Collections (DTHC) was born from a simple observation: the streets of Accra were hungry for authentic, high-quality streetwear that didn't compromise on style or substance.
              </p>
              <p>
                What started as a small curation of premium tees has evolved into a full-scale fashion movement. We don't just sell clothes; we curate a lifestyle that celebrates boldness, creativity, and the relentless pursuit of the "perfect drip."
              </p>
              <p>
                Every piece in our collection is handpicked or designed with the modern trendsetter in mind. We bridge the gap between global fashion trends and local street culture.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-[3/4] bg-zinc-900 border border-white/10 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800" alt="Culture 1" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="aspect-[3/4] bg-zinc-900 border border-white/10 overflow-hidden mt-12">
              <img src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=800" alt="Culture 2" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
            </div>
          </div>
        </div>

        {/* Values */}
<<<<<<< HEAD
        <div className="mb-20 md:mb-32 grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-12">
          {values.map((value, i) => (
            <div key={i} className="bg-zinc-900 border border-white/10 p-6 md:p-12 text-center space-y-5 md:space-y-6 group hover:border-orange-500 transition-colors">
              <div className="w-16 h-16 bg-black border border-white/10 flex items-center justify-center mx-auto group-hover:bg-orange-500 group-hover:text-black transition-all">
                <value.icon size={32} />
              </div>
              <h3 className="text-lg md:text-xl font-black uppercase italic">{value.title}</h3>
=======
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-32">
          {[
            { icon: Award, title: 'Authenticity', desc: 'We only deal in 100% authentic gear. No fakes, no compromises.' },
            { icon: Users, title: 'Community', desc: 'DTHC is for the people. We support local artists and creators.' },
            { icon: Globe, title: 'Global Vision', desc: 'Bringing world-class fashion to the heart of West Africa.' },
          ].map((value, i) => (
            <div key={i} className="bg-zinc-900 border border-white/10 p-12 text-center space-y-6 group hover:border-orange-500 transition-colors">
              <div className="w-16 h-16 bg-black border border-white/10 flex items-center justify-center mx-auto group-hover:bg-orange-500 group-hover:text-black transition-all">
                <value.icon size={32} />
              </div>
              <h3 className="text-xl font-black uppercase italic">{value.title}</h3>
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest leading-relaxed">{value.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
<<<<<<< HEAD
        <div className="bg-orange-500 text-black p-6 sm:p-10 md:p-24 grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-12 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-5xl md:text-7xl font-black italic tracking-tighter mb-2">{stat.value}</p>
              <p className="text-xs font-black uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
=======
        <div className="bg-orange-500 text-black p-12 md:p-24 grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
          <div>
            <p className="text-5xl md:text-7xl font-black italic tracking-tighter mb-2">10K+</p>
            <p className="text-xs font-black uppercase tracking-widest">Happy Clients</p>
          </div>
          <div>
            <p className="text-5xl md:text-7xl font-black italic tracking-tighter mb-2">500+</p>
            <p className="text-xs font-black uppercase tracking-widest">Unique Drops</p>
          </div>
          <div>
            <p className="text-5xl md:text-7xl font-black italic tracking-tighter mb-2">16</p>
            <p className="text-xs font-black uppercase tracking-widest">Regions Served</p>
          </div>
          <div>
            <p className="text-5xl md:text-7xl font-black italic tracking-tighter mb-2">24/7</p>
            <p className="text-xs font-black uppercase tracking-widest">Support</p>
          </div>
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
        </div>
      </div>
    </div>
  );
};

export default About;
