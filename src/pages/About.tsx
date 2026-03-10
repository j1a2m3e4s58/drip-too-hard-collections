import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Truck, RotateCcw, Award, Users, Globe } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="relative h-[60vh] overflow-hidden mb-24">
          <img 
            src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=1920" 
            alt="About DTHC" 
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-7xl md:text-9xl font-black uppercase italic tracking-tighter leading-none"
            >
              The <span className="text-orange-500">Culture</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-sm md:text-lg font-bold uppercase tracking-[0.3em] text-white/70"
            >
              Curating Streetwear Excellence Since 2024
            </motion.p>
          </div>
        </div>

        {/* Story Section */}
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
            </div>
          </div>
        </div>

        {/* Values */}
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
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest leading-relaxed">{value.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
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
        </div>
      </div>
    </div>
  );
};

export default About;
