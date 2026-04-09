import React from 'react';
import { motion } from 'motion/react';
import { Instagram, Twitter, Facebook, Mail, Phone, MapPin, ArrowUpRight, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
<<<<<<< HEAD
    <footer className="bg-zinc-950 border-t border-white/5 pt-16 md:pt-24 pb-10 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 mb-16 md:mb-24">
          {/* Brand Column */}
          <div className="space-y-8">
            <Link to="/" className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter flex items-center space-x-2">
=======
    <footer className="bg-zinc-950 border-t border-white/5 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-24">
          {/* Brand Column */}
          <div className="space-y-8">
            <Link to="/" className="text-3xl font-black uppercase italic tracking-tighter flex items-center space-x-2">
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
              <span className="bg-orange-500 text-black px-2 py-1">DTH</span>
              <span>Collections</span>
            </Link>
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest leading-relaxed">
              Curating the finest street culture and high-end fashion for the bold. Based in Accra, serving the world.
            </p>
<<<<<<< HEAD
            <div className="flex space-x-3 md:space-x-4">
              {[Instagram, Twitter, Facebook].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 md:w-10 md:h-10 border border-white/10 flex items-center justify-center hover:bg-orange-500 hover:text-black transition-all">
=======
            <div className="flex space-x-4">
              {[Instagram, Twitter, Facebook].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-orange-500 hover:text-black transition-all">
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-8">
            <h3 className="text-sm font-black uppercase italic tracking-widest text-orange-500">Navigation</h3>
            <ul className="space-y-4">
              {['Shop All', 'New Arrivals', 'Bestsellers', 'Collections', 'Lookbook'].map((link) => (
                <li key={link}>
                  <Link to="/shop" className="text-[10px] uppercase font-black tracking-widest text-white/50 hover:text-white transition-colors flex items-center group">
                    <span>{link}</span>
                    <ArrowUpRight size={12} className="ml-1 opacity-0 group-hover:opacity-100 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-8">
            <h3 className="text-sm font-black uppercase italic tracking-widest text-orange-500">Customer Care</h3>
            <ul className="space-y-4">
              {['Contact Us', 'Shipping & Returns', 'Size Guide', 'FAQ', 'Privacy Policy'].map((link) => (
                <li key={link}>
                  <Link to="/contact" className="text-[10px] uppercase font-black tracking-widest text-white/50 hover:text-white transition-colors flex items-center group">
                    <span>{link}</span>
                    <ArrowUpRight size={12} className="ml-1 opacity-0 group-hover:opacity-100 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-8">
            <h3 className="text-sm font-black uppercase italic tracking-widest text-orange-500">Join the Cult</h3>
            <p className="text-[10px] uppercase font-black tracking-widest text-white/30">Get early access to drops and exclusive offers.</p>
<<<<<<< HEAD
            <form className="flex flex-col sm:flex-row">
=======
            <form className="flex">
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
              <input 
                type="email" 
                placeholder="EMAIL ADDRESS" 
                className="flex-grow bg-zinc-900 border border-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:border-orange-500"
              />
              <button className="bg-white text-black px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 transition-all">
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
<<<<<<< HEAD
        <div className="pt-10 md:pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8">
          <div className="flex flex-col items-start sm:flex-row sm:flex-wrap sm:justify-center gap-4 sm:gap-8">
=======
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-wrap justify-center gap-8">
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
            <div className="flex items-center space-x-2 text-white/30">
              <Truck size={14} />
              <span className="text-[10px] uppercase font-black tracking-widest">Nationwide Delivery</span>
            </div>
            <div className="flex items-center space-x-2 text-white/30">
              <RotateCcw size={14} />
              <span className="text-[10px] uppercase font-black tracking-widest">14 Day Returns</span>
            </div>
            <div className="flex items-center space-x-2 text-white/30">
              <ShieldCheck size={14} />
              <span className="text-[10px] uppercase font-black tracking-widest">Secure Checkout</span>
            </div>
          </div>
<<<<<<< HEAD
          <p className="text-center text-[10px] uppercase font-black tracking-widest text-white/20">
=======
          <p className="text-[10px] uppercase font-black tracking-widest text-white/20">
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
            © {currentYear} Drip Too Hard Collections. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
