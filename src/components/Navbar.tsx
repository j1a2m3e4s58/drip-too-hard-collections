import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingBag, Search, Heart, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { useWishlist } from '../hooks/useWishlist';
import { useCart } from '../hooks/useCart';
import Cart from './Cart';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLogoLongPressTriggered, setIsLogoLongPressTriggered] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { wishlist } = useWishlist();
  const { itemCount } = useCart();
  const longPressTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Search Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const q = query(
            collection(db, 'products'),
            where('inStock', '==', true),
            limit(10)
          );
          const snapshot = await getDocs(q);
          const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
          // Simple client-side filter for better UX since Firestore doesn't support partial matches easily without extra indexing
          const filtered = all.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            p.category.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setSearchResults(filtered);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);
  // ===================== ADD THIS BELOW logo long press cleanup effect =====================
  useEffect(() => {
    const handleOpenCart = () => {
      setIsCartOpen(true);
    };

    window.addEventListener('open-cart', handleOpenCart);

    return () => {
      window.removeEventListener('open-cart', handleOpenCart);
    };
  }, []);
  const startLogoLongPress = () => {
    setIsLogoLongPressTriggered(false);
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = window.setTimeout(() => {
      setIsLogoLongPressTriggered(true);
      navigate('/admin');
    }, 1200);
  };

  const cancelLogoLongPress = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isLogoLongPressTriggered) {
      e.preventDefault();
      setIsLogoLongPressTriggered(false);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'Collections', path: '/collections' },
    { name: 'Lookbook', path: '/lookbook' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  if (isAdmin) {
    navLinks.push({ name: 'Admin', path: '/admin' });
  }

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
          scrolled 
            ? 'bg-black/90 backdrop-blur-md py-3 border-white/10' 
            : 'bg-transparent py-6 border-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center space-x-2"
              onClick={handleLogoClick}
              onMouseDown={startLogoLongPress}
              onMouseUp={cancelLogoLongPress}
              onMouseLeave={cancelLogoLongPress}
              onTouchStart={startLogoLongPress}
              onTouchEnd={cancelLogoLongPress}
              onTouchCancel={cancelLogoLongPress}
              onContextMenu={(e) => e.preventDefault()}
            >
              <span className="text-2xl font-black tracking-tighter text-white italic select-none">
                DTHC<span className="text-orange-500">.</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={cn(
                    'text-xs uppercase tracking-widest font-semibold transition-colors hover:text-orange-500',
                    location.pathname === link.path ? 'text-orange-500' : 'text-white/70'
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Icons */}
            <div className="hidden md:flex items-center space-x-6">
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <Search size={20} />
              </button>
              <Link to="/wishlist" className="text-white/70 hover:text-white transition-colors relative">
                <Heart size={20} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Link>
              <button 
                onClick={() => setIsCartOpen(true)}
                className="text-white/70 hover:text-white transition-colors relative"
              >
                <ShoppingBag size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-4">
              <button onClick={() => setIsSearchOpen(true)} className="text-white/70">
                <Search size={20} />
              </button>
              <Link to="/wishlist" className="text-white/70 relative">
                <Heart size={20} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Link>
              <button onClick={() => setIsCartOpen(true)} className="text-white/70 relative">
                <ShoppingBag size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-white hover:text-orange-500 transition-colors"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-black border-b border-white/10 overflow-hidden"
            >
              <div className="px-4 pt-2 pb-6 space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'block text-lg font-bold tracking-tight uppercase',
                      location.pathname === link.path ? 'text-orange-500' : 'text-white'
                    )}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[100] flex flex-col"
          >
            <div className="p-6 flex justify-end">
              <button 
                onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                className="text-white/50 hover:text-orange-500 transition-colors"
              >
                <X size={32} />
              </button>
            </div>
            <div className="flex-grow flex flex-col items-center pt-12 px-4">
              <div className="w-full max-w-3xl space-y-12">
                <div className="relative">
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="SEARCH FOR DRIP..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-white/10 text-4xl md:text-6xl font-black uppercase italic tracking-tighter py-4 outline-none focus:border-orange-500 transition-colors placeholder:text-white/5"
                  />
                  <Search className="absolute right-0 top-1/2 -translate-y-1/2 text-white/20" size={48} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {isSearching ? (
                    <div className="col-span-full py-12 text-center">
                      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(product => (
                      <Link 
                        key={product.id}
                        to={`/product/${product.id}`}
                        onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                        className="flex items-center space-x-4 p-4 bg-zinc-900/50 border border-white/5 hover:border-orange-500 transition-all group"
                      >
                        <div className="w-20 h-20 bg-black flex-shrink-0 overflow-hidden">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div>
                          <p className="text-[10px] text-orange-500 uppercase font-bold tracking-widest">{product.category}</p>
                          <h3 className="text-lg font-black uppercase italic tracking-tight">{product.name}</h3>
                          <p className="text-sm font-mono text-white/50">GH₵ {product.price}</p>
                        </div>
                        <ArrowRight className="ml-auto text-white/20 group-hover:text-orange-500 group-hover:translate-x-2 transition-all" size={20} />
                      </Link>
                    ))
                  ) : searchQuery.length >= 2 ? (
                    <div className="col-span-full py-12 text-center text-white/30 uppercase font-bold tracking-widest">
                      No available items found for "{searchQuery}"
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Navbar;