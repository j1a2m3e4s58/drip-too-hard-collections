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
        </div>
      </div>
    </div>
  );
};

export default Lookbook;
