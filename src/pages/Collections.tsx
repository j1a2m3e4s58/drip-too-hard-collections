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
              </motion.div>
            </div>
          ))}
        </div>

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
      </div>
    </div>
  );
};

export default Collections;
