import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { Link } from 'react-router-dom';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

const Cart: React.FC<CartProps> = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, updateQuantity, total, itemCount } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-zinc-950 z-[70] shadow-2xl border-l border-white/10 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <ShoppingBag size={20} className="text-orange-500" />
                <h2 className="text-xl font-black uppercase italic tracking-tighter">Your Bag ({itemCount})</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:text-orange-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6 no-scrollbar">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div key={item.cartKey} className="flex space-x-4 group">
                    <div className="w-24 aspect-[3/4] bg-zinc-900 overflow-hidden">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-grow flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="text-sm font-bold uppercase tracking-tight group-hover:text-orange-500 transition-colors">{item.name}</h3>
                          <button onClick={() => removeFromCart(item.cartKey)} className="text-white/30 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold mt-1">{item.category}</p>
                        {item.selectedSize && <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-orange-400">Size {item.selectedSize}</p>}
                      </div>
                      
                      <div className="flex justify-between items-end">
                        <div className="flex items-center border border-white/10 bg-black">
                          <button 
                            onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                            className="p-1 hover:text-orange-500 transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center text-xs font-mono">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                            className="p-1 hover:text-orange-500 transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <p className="text-sm font-black text-orange-500 font-mono">
                          GH₵ {(item.flashSalePrice || item.price) * item.quantity}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                  <ShoppingBag size={48} />
                  <p className="text-xs uppercase font-bold tracking-widest">Your bag is empty</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-white/10 bg-zinc-900/50 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase font-bold text-white/50 tracking-widest">Subtotal</span>
                  <span className="text-xl font-black font-mono">GH₵ {total}</span>
                </div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest text-center">
                  Shipping & taxes calculated at checkout
                </p>
                                {/* ===================== ADD THIS ABOVE checkout link ===================== */}
                <button
                  onClick={onClose}
                  className="w-full border border-white/10 text-white py-4 font-black uppercase tracking-widest hover:border-orange-500 hover:text-orange-500 transition-all"
                >
                  Continue Shopping
                </button>
                <Link 
                  to="/checkout" 
                  onClick={onClose}
                  className="w-full bg-white text-black py-4 font-black uppercase tracking-widest hover:bg-orange-500 transition-all flex items-center justify-center space-x-3"
                >
                  <span>Secure Checkout</span>
                  <ArrowRight size={18} />
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Cart;
