import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Package, User, LogOut, ChevronRight, Clock, MapPin, Phone, Mail, Heart, ArrowRight } from 'lucide-react';
import { auth, db, logOut } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Order, Product } from '../types';
import { Link, useNavigate } from 'react-router-dom';

const Profile = () => {
  const [user, loading] = useAuthState(auth);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'settings'>('orders');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user && !loading) {
      navigate('/');
      return;
    }

    if (user) {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const unsub = onSnapshot(q, (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[]);
      });
      return () => unsub();
    }
  }, [user, loading, navigate]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar */}
          <div className="lg:w-80 space-y-8">
            <div className="bg-zinc-900 border border-white/10 p-8 text-center">
              <div className="w-24 h-24 bg-orange-500 rounded-full mx-auto flex items-center justify-center text-black mb-6">
                <User size={48} />
              </div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">{user.displayName || 'DTHC Member'}</h2>
              <p className="text-white/50 text-[10px] uppercase tracking-widest font-bold mt-1">{user.email}</p>
              <button 
                onClick={logOut}
                className="mt-8 w-full border border-white/10 py-3 text-[10px] uppercase font-black tracking-widest hover:bg-red-600 hover:border-red-600 transition-all flex items-center justify-center space-x-2"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>

            <div className="bg-zinc-900 border border-white/10 overflow-hidden">
              {[
                { id: 'orders', label: 'Order History', icon: Package },
                { id: 'settings', label: 'Account Settings', icon: User },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between px-8 py-4 text-[10px] uppercase font-black tracking-widest transition-all border-b border-white/5 last:border-0 ${activeTab === tab.id ? 'bg-orange-500 text-black' : 'hover:bg-white/5'}`}
                >
                  <div className="flex items-center space-x-3">
                    <tab.icon size={16} />
                    <span>{tab.label}</span>
                  </div>
                  <ChevronRight size={14} />
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-grow">
            <AnimatePresence mode="wait">
              {activeTab === 'orders' ? (
                <motion.div
                  key="orders"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <h1 className="text-4xl font-black uppercase italic tracking-tighter">Your Orders</h1>
                  
                  {orders.length > 0 ? (
                    <div className="space-y-6">
                      {orders.map(order => (
                        <div key={order.id} className="bg-zinc-900 border border-white/10 overflow-hidden">
                          <div className="p-6 border-b border-white/5 flex flex-wrap justify-between items-center gap-4">
                            <div className="flex items-center space-x-4">
                              <div className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                                order.status === 'Delivered' ? 'bg-green-500 text-black' :
                                order.status === 'Cancelled' ? 'bg-red-600 text-white' :
                                'bg-orange-500 text-black'
                              }`}>
                                {order.status}
                              </div>
                              <span className="text-xs font-mono text-white/50">#{order.id.slice(0, 8)}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-white/30 text-[10px] uppercase font-bold">
                              <Clock size={12} />
                              <span>{order.createdAt?.toDate().toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div className="p-6 space-y-4">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center space-x-4">
                                <div className="w-12 h-16 bg-black flex-shrink-0">
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-grow">
                                  <p className="text-xs font-bold uppercase tracking-tight">{item.name}</p>
                                  <p className="text-[10px] text-white/50 uppercase tracking-widest">{item.quantity}x GH₵ {item.price}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="p-6 bg-black/40 border-t border-white/5 flex justify-between items-center">
                            <div className="flex items-center space-x-2 text-white/50">
                              <MapPin size={14} />
                              <span className="text-[10px] uppercase font-bold tracking-widest">{order.shippingAddress.city}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Total Paid</p>
                              <p className="text-xl font-black font-mono text-orange-500">GH₵ {order.total}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-24 text-center border-2 border-dashed border-white/10">
                      <ShoppingBag size={48} className="mx-auto text-white/10 mb-4" />
                      <p className="text-xs uppercase font-bold tracking-widest text-white/30">No orders found yet</p>
                      <Link to="/shop" className="mt-6 inline-block text-orange-500 font-bold uppercase tracking-widest hover:text-white transition-colors">Start Shopping</Link>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-12"
                >
                  <h1 className="text-4xl font-black uppercase italic tracking-tighter">Account Settings</h1>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <h2 className="text-xl font-black uppercase italic border-b border-white/10 pb-4">Personal Info</h2>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Full Name</label>
                          <input disabled type="text" value={user.displayName || ''} className="w-full bg-zinc-900 border border-white/10 px-4 py-3 text-sm text-white/50 outline-none" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Email Address</label>
                          <input disabled type="email" value={user.email || ''} className="w-full bg-zinc-900 border border-white/10 px-4 py-3 text-sm text-white/50 outline-none" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <h2 className="text-xl font-black uppercase italic border-b border-white/10 pb-4">Security</h2>
                      <div className="bg-zinc-900 border border-white/10 p-8 text-center space-y-4">
                        <ShieldCheck size={32} className="mx-auto text-orange-500" />
                        <p className="text-xs uppercase font-bold tracking-widest leading-relaxed">Your account is secured via Google Authentication</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest">Password management is handled by Google</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

const ShieldCheck = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default Profile;
