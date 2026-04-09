import React from 'react';
import { Heart, Home, Search, ShoppingBag, Truck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { cn } from '../lib/utils';

const navItems = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Shop', to: '/shop', icon: Search },
  { label: 'Track', to: '/track-order', icon: Truck },
  { label: 'Wishlist', to: '/wishlist', icon: Heart },
];

const MobileBottomNav = () => {
  const location = useLocation();
  const { itemCount } = useCart();
  const { wishlist } = useWishlist();

  if (
    location.pathname.startsWith('/admin') ||
    location.pathname === '/login' ||
    location.pathname.startsWith('/upload-payment-proof') ||
    location.pathname.startsWith('/order-confirmed')
  ) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[55] border-t border-white/10 bg-black/92 px-3 py-2 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between gap-1">
        {navItems.map(({ label, to, icon: Icon }) => {
          const active = location.pathname === to;
          const badge = label === 'Wishlist' ? wishlist.length : 0;

          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[1rem] px-2 py-2 text-[10px] font-bold uppercase tracking-[0.18em] transition-colors',
                active ? 'bg-orange-500 text-black' : 'text-white/60 hover:text-white',
              )}
            >
              <Icon size={18} />
              <span>{label}</span>
              {badge > 0 && (
                <span className="absolute right-3 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-black text-black">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('open-cart'))}
          className="relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[1rem] px-2 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60 transition-colors hover:text-white"
        >
          <ShoppingBag size={18} />
          <span>Cart</span>
          {itemCount > 0 && (
            <span className="absolute right-3 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-black text-black">
              {itemCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default MobileBottomNav;
