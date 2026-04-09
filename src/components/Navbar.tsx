import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingBag, Search, Heart, ArrowRight, Eye, EyeOff, KeyRound, ShieldAlert, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatGhanaCedis } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { useWishlist } from '../hooks/useWishlist';
import { useCart } from '../hooks/useCart';
import Cart from './Cart';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
import { mergeWithImportedCatalogProducts } from '../lib/importedCatalog';
import {
  ADMIN_RESET_PASSWORD,
  isAdminSessionOpen,
  isStrongAdminPassword,
  lockAdminSession,
  resetAdminPassword,
  unlockAdminSession,
  verifyAdminPassword,
} from '../lib/adminAuth';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLogoLongPressTriggered, setIsLogoLongPressTriggered] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(isAdminSessionOpen());
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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
          const merged = mergeWithImportedCatalogProducts(all);
          // Simple client-side filter for better UX since Firestore doesn't support partial matches easily without extra indexing
          const filtered = merged.filter(p => 
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
    const handleAdminSession = () => {
      setIsAdminUnlocked(isAdminSessionOpen());
    };

    window.addEventListener('open-cart', handleOpenCart);
    window.addEventListener('admin-session-changed', handleAdminSession);

    return () => {
      window.removeEventListener('open-cart', handleOpenCart);
      window.removeEventListener('admin-session-changed', handleAdminSession);
    };
  }, []);
  const startLogoLongPress = () => {
    setIsLogoLongPressTriggered(false);
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = window.setTimeout(() => {
      setIsLogoLongPressTriggered(true);
      setAdminError('');
      setIsResetMode(false);
      setIsAdminModalOpen(true);
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
    { name: 'Track Order', path: '/track-order' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const closeAdminModal = () => {
    setIsAdminModalOpen(false);
    setIsResetMode(false);
    setAdminPassword('');
    setResetPassword('');
    setNewAdminPassword('');
    setConfirmAdminPassword('');
    setAdminError('');
  };

  const openAdminArea = () => {
    if (!verifyAdminPassword(adminPassword)) {
      setAdminError('Wrong admin password.');
      return;
    }
    unlockAdminSession();
    setIsAdminUnlocked(true);
    closeAdminModal();
    navigate('/admin');
  };

  const handleResetPassword = () => {
    if (resetPassword !== ADMIN_RESET_PASSWORD) {
      setAdminError('Special reset password is not correct.');
      return;
    }
    if (!isStrongAdminPassword(newAdminPassword)) {
      setAdminError('New admin password must meet all password rules.');
      return;
    }
    if (newAdminPassword !== confirmAdminPassword) {
      setAdminError('New password and confirm password do not match.');
      return;
    }
    resetAdminPassword(newAdminPassword);
    unlockAdminSession();
    setIsAdminUnlocked(true);
    closeAdminModal();
    navigate('/admin');
  };

  const passwordChecks = [
    { label: 'At least 8 characters', valid: newAdminPassword.length >= 8 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(newAdminPassword) },
    { label: 'One lowercase letter', valid: /[a-z]/.test(newAdminPassword) },
    { label: 'One number', valid: /\d/.test(newAdminPassword) },
    { label: 'One special character', valid: /[^A-Za-z0-9]/.test(newAdminPassword) },
  ];

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
          scrolled 
            ? 'bg-black/90 backdrop-blur-md py-3 border-white/10' 
            : 'bg-transparent py-4 md:py-6 border-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
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
              <span className="text-[1.55rem] md:text-2xl font-black tracking-tighter text-white italic select-none">
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
            <div
              className={cn(
                'md:hidden flex items-center gap-1 pr-2',
                location.pathname === '/collections' && 'mr-5'
              )}
            >
              <button onClick={() => setIsSearchOpen(true)} className="shrink-0 p-0.5 text-white/70">
                <Search size={15} />
              </button>
              <Link to="/wishlist" className="relative shrink-0 p-0.5 text-white/70">
                <Heart size={15} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Link>
              <button onClick={() => setIsCartOpen(true)} className="relative shrink-0 p-0.5 text-white/70">
                <ShoppingBag size={15} />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="shrink-0 pl-1 pr-0.5 py-0.5 text-white transition-colors hover:text-orange-500"
              >
                {isOpen ? <X size={18} /> : <Menu size={18} />}
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
              <div className="px-4 pt-2 pb-6 space-y-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'block border-b border-white/5 pb-3 text-base font-bold tracking-tight uppercase',
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
            <div className="p-4 sm:p-6 flex justify-end">
              <button 
                onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                className="text-white/50 hover:text-orange-500 transition-colors"
              >
                <X size={32} />
              </button>
            </div>
            <div className="flex-grow flex flex-col items-center pt-8 px-4 sm:pt-12">
              <div className="w-full max-w-3xl space-y-8 sm:space-y-12">
                <div className="relative">
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="SEARCH FOR DRIP..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-white/10 text-2xl sm:text-4xl md:text-6xl font-black uppercase italic tracking-tighter py-4 outline-none focus:border-orange-500 transition-colors placeholder:text-white/5"
                  />
                  <Search className="absolute right-0 top-1/2 -translate-y-1/2 text-white/20" size={28} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
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
                        className="flex items-center space-x-3 p-3 sm:p-4 bg-zinc-900/50 border border-white/5 hover:border-orange-500 transition-all group"
                      >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black flex-shrink-0 overflow-hidden">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div>
                          <p className="text-[10px] text-orange-500 uppercase font-bold tracking-widest">{product.category}</p>
                          <h3 className="text-sm sm:text-lg font-black uppercase italic tracking-tight">{product.name}</h3>
                          <p className="text-sm font-mono text-white/50">{formatGhanaCedis(product.price)}</p>
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

      <AnimatePresence>
        {isAdminModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[4px]">
            <motion.div initial={{ opacity: 0, y: 18, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.985 }} className="max-h-[88svh] w-full max-w-[430px] overflow-y-auto rounded-[1.6rem] border border-white/12 bg-[rgba(24,24,27,0.74)] p-4 sm:p-5 text-white shadow-[0_28px_90px_rgba(0,0,0,0.48)] backdrop-blur-xl">
              {!isResetMode ? (
                <>
                  <div className="mb-4 flex items-start gap-4">
                    <div className="mt-1 flex h-[48px] w-[48px] items-center justify-center rounded-[16px] border border-orange-500/20 bg-orange-500/10 text-orange-400">
                      <KeyRound size={22} strokeWidth={2.25} />
                    </div>
                    <div>
                      <h3 className="text-[22px] sm:text-[24px] font-black tracking-[-0.04em] text-white">Admin Access</h3>
                      <p className="mt-1.5 max-w-[290px] text-[12px] sm:text-[13px] leading-6 text-white/58">Enter your premium admin password to open the DTHC control area.</p>
                    </div>
                  </div>
                  <label className="block">
                    <span className="sr-only">Admin password</span>
                    <div className="flex h-[54px] items-center rounded-[17px] border border-white/10 bg-[rgba(39,39,42,0.72)] px-4 backdrop-blur-md">
                      <input type={showAdminPassword ? 'text' : 'password'} value={adminPassword} onChange={(e) => { setAdminPassword(e.target.value); setAdminError(''); }} placeholder="Admin password" className="w-full bg-transparent text-[15px] font-medium outline-none placeholder:text-white/35" />
                      <button type="button" onClick={() => setShowAdminPassword((value) => !value)} className="text-white/35 hover:text-white">{showAdminPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
                    </div>
                  </label>
                  <button type="button" onClick={() => { setIsResetMode(true); setAdminError(''); }} className="mt-3 text-[13px] font-semibold text-white/72 hover:text-orange-400">Forgot password?</button>
                  {adminError && <p className="mt-3 text-sm font-semibold text-red-400">{adminError}</p>}
                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <button type="button" onClick={closeAdminModal} className="flex-1 rounded-full border border-white/10 bg-[rgba(9,9,11,0.32)] px-5 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-zinc-900/80">Cancel</button>
                    <button type="button" onClick={openAdminArea} className="flex-1 rounded-full bg-orange-500 px-5 py-3 text-[14px] font-bold text-black transition-colors hover:bg-orange-400">Open Admin</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <h3 className="text-[22px] sm:text-[24px] font-black tracking-[-0.04em] text-white">Reset Admin Password</h3>
                    <p className="mt-1.5 max-w-[310px] text-[12px] sm:text-[13px] leading-6 text-white/58">Enter the special master password first, then choose your new admin password.</p>
                  </div>
                  <div className="mb-4 rounded-[1.15rem] border border-white/10 bg-[rgba(39,39,42,0.62)] p-3.5 backdrop-blur-md">
                    <div className="space-y-2 text-[13px]">
                      {passwordChecks.map((rule) => (
                        <div key={rule.label} className={`flex items-center gap-3 ${rule.valid ? 'text-emerald-400' : 'text-red-400'}`}>
                          <ShieldAlert size={14} />
                          <span>{rule.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <PasswordField value={resetPassword} onChange={(value) => { setResetPassword(value); setAdminError(''); }} placeholder="Special reset password" visible={showResetPassword} onToggle={() => setShowResetPassword((value) => !value)} />
                  <PasswordField value={newAdminPassword} onChange={(value) => { setNewAdminPassword(value); setAdminError(''); }} placeholder="New admin password" visible={showNewPassword} onToggle={() => setShowNewPassword((value) => !value)} />
                  <PasswordField value={confirmAdminPassword} onChange={(value) => { setConfirmAdminPassword(value); setAdminError(''); }} placeholder="Confirm new password" visible={showConfirmPassword} onToggle={() => setShowConfirmPassword((value) => !value)} />
                  {adminError && <p className="mt-4 text-sm font-semibold text-red-400">{adminError}</p>}
                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <button type="button" onClick={() => { setIsResetMode(false); setAdminError(''); }} className="flex-1 rounded-full border border-white/10 bg-[rgba(9,9,11,0.32)] px-5 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-zinc-900/80">Back</button>
                    <button type="button" onClick={handleResetPassword} className="flex-1 rounded-full bg-orange-500 px-5 py-3 text-[14px] font-bold text-black transition-colors hover:bg-orange-400">Reset Password</button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

const PasswordField = ({
  value,
  onChange,
  placeholder,
  visible,
  onToggle,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  visible: boolean;
  onToggle: () => void;
}) => (
  <div className="mt-3 flex h-[52px] items-center rounded-[16px] border border-white/10 bg-[rgba(39,39,42,0.72)] px-4 backdrop-blur-md">
    <input type={visible ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-transparent text-[15px] font-medium outline-none placeholder:text-white/35" />
    <button type="button" onClick={onToggle} className="text-white/35 hover:text-white">{visible ? <EyeOff size={19} /> : <Eye size={19} />}</button>
  </div>
);

export default Navbar;
