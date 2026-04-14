import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, ChevronRight, Clock, LogOut, Mail, MapPin, Package, Repeat, Save, ShoppingBag, Truck, User } from 'lucide-react';
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db, logOut } from '../firebase';
import { CustomerDirectMessage, Order, UserProfile } from '../types';
import { formatGhanaCedis } from '../lib/utils';

const CHECKOUT_DRAFT_KEY = 'dthc_checkout_draft';
const statusFilters = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const;
type OrderFilter = (typeof statusFilters)[number];

const formatWhen = (value: any) => {
  if (!value) return 'Pending sync';
  if (typeof value?.toDate === 'function') return value.toDate().toLocaleString();
  const nextDate = typeof value === 'string' ? new Date(value) : null;
  return nextDate && !Number.isNaN(nextDate.getTime()) ? nextDate.toLocaleString() : 'Pending sync';
};

const Profile = () => {
  const [user, loading] = useAuthState(auth);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profileDoc, setProfileDoc] = useState<UserProfile | null>(null);
  const [customerInbox, setCustomerInbox] = useState<CustomerDirectMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'updates' | 'settings'>('orders');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('All');
  const [savedAddressForm, setSavedAddressForm] = useState({ name: '', phone: '', address: '', selectedZoneId: '' });
  const [settingsNotice, setSettingsNotice] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [busyMessageId, setBusyMessageId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user && !loading) {
      navigate('/');
      return;
    }
    if (!user) return;

    const unsubOrders = onSnapshot(query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')), (snapshot) => {
      setOrders(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as Order[]);
    });

    const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (!snapshot.exists()) {
        setProfileDoc(null);
        return;
      }
      const nextProfile = { uid: user.uid, ...(snapshot.data() as Omit<UserProfile, 'uid'>) } as UserProfile;
      setProfileDoc(nextProfile);
      setSavedAddressForm({
        name: nextProfile.savedAddress?.name || user.displayName || '',
        phone: nextProfile.savedAddress?.phone || nextProfile.phone || '',
        address: nextProfile.savedAddress?.address || '',
        selectedZoneId: nextProfile.savedAddress?.selectedZoneId || '',
      });
    });

    const unsubInbox = onSnapshot(query(collection(db, 'customerMessages'), where('recipientUid', '==', user.uid)), (snapshot) => {
      const next = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as CustomerDirectMessage);
      next.sort((a, b) => {
        const left = typeof a.createdAt?.toMillis === 'function' ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
        const right = typeof b.createdAt?.toMillis === 'function' ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
        return right - left;
      });
      setCustomerInbox(next);
    });

    return () => {
      unsubOrders();
      unsubProfile();
      unsubInbox();
    };
  }, [user, loading, navigate]);

  const orderSummary = useMemo(() => ({
    total: orders.length,
    active: orders.filter((item) => ['Pending', 'Processing', 'Shipped'].includes(item.status)).length,
    delivered: orders.filter((item) => item.status === 'Delivered').length,
    spend: orders.reduce((sum, item) => sum + (item.total || 0), 0),
  }), [orders]);

  const filteredOrders = useMemo(() => orders.filter((item) => orderFilter === 'All' || item.status === orderFilter), [orders, orderFilter]);
  const unreadInboxCount = useMemo(() => customerInbox.filter((item) => (item.status || 'new') === 'new').length, [customerInbox]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  if (!user) return null;

  const saveAddress = async () => {
    setSettingsNotice(null);
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || savedAddressForm.name,
        savedAddress: { ...savedAddressForm },
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setSettingsNotice({ type: 'success', message: 'Saved address updated for repeat checkout.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSettingsNotice({ type: 'error', message: `Could not save your address. ${message}` });
    } finally {
      setSavingSettings(false);
    }
  };

  const repeatCheckout = (order: Order) => {
    localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify({
      name: order.shippingAddress.name,
      phone: order.shippingAddress.phone,
      address: order.shippingAddress.address,
      note: order.customerNotes || '',
      paymentMethod: order.paymentMethod,
      selectedZoneId: profileDoc?.savedAddress?.selectedZoneId || '',
    }));
    navigate('/checkout');
  };

  const openTrackOrder = (order: Order) => {
    const params = new URLSearchParams();
    if (order.trackingCode) params.set('tracking', order.trackingCode);
    if (order.shippingAddress.phone) params.set('phone', order.shippingAddress.phone);
    navigate(`/track-order?${params.toString()}`);
  };

  const markInboxMessageRead = async (messageId: string) => {
    setBusyMessageId(messageId);
    try {
      await updateDoc(doc(db, 'customerMessages', messageId), { status: 'read', updatedAt: serverTimestamp() });
    } finally {
      setBusyMessageId(null);
    }
  };

  const summaryCards = [
    { label: 'Total Orders', value: String(orderSummary.total), icon: ShoppingBag },
    { label: 'Active Orders', value: String(orderSummary.active), icon: Truck },
    { label: 'Delivered', value: String(orderSummary.delivered), icon: Package },
    { label: 'Total Spend', value: formatGhanaCedis(orderSummary.spend), icon: Repeat },
  ];

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-24">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 sm:px-6 lg:flex-row lg:px-8">
        <div className="space-y-8 lg:w-80">
          <div className="border border-white/10 bg-zinc-900 p-8 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-orange-500 text-black"><User size={48} /></div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">{user.displayName || 'DTHC Member'}</h2>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/50">{user.email}</p>
            <button onClick={logOut} className="mt-8 flex w-full items-center justify-center gap-2 border border-white/10 py-3 text-[10px] font-black uppercase tracking-widest transition-all hover:border-red-600 hover:bg-red-600">
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>

          <div className="overflow-hidden border border-white/10 bg-zinc-900">
            {[
              { id: 'orders', label: 'Order History', icon: Package, badge: orderSummary.total },
              { id: 'updates', label: 'Updates & Inbox', icon: Bell, badge: unreadInboxCount },
              { id: 'settings', label: 'Account Settings', icon: User, badge: 0 },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as 'orders' | 'updates' | 'settings')} className={`flex w-full items-center justify-between border-b border-white/5 px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all last:border-0 ${activeTab === tab.id ? 'bg-orange-500 text-black' : 'hover:bg-white/5'}`}>
                <div className="flex items-center gap-3"><tab.icon size={16} /><span>{tab.label}</span></div>
                <div className="flex items-center gap-2">
                  {tab.badge > 0 && <span className={`min-w-5 rounded-full px-1.5 py-1 text-center text-[10px] font-black ${activeTab === tab.id ? 'bg-black text-orange-500' : 'bg-orange-500 text-black'}`}>{tab.badge}</span>}
                  <ChevronRight size={14} />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-grow">
          <AnimatePresence mode="wait">
            {activeTab === 'orders' ? (
              <motion.div key="orders" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter">Your Orders</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">Track every purchase, reuse checkout details, and keep an eye on payment and delivery updates in one place.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {statusFilters.map((filter) => (
                      <button key={filter} type="button" onClick={() => setOrderFilter(filter)} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${orderFilter === filter ? 'bg-orange-500 text-black' : 'border border-white/10 text-white/65 hover:border-orange-500/35 hover:text-orange-400'}`}>
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {summaryCards.map((item) => (
                    <div key={item.label} className="border border-white/10 bg-zinc-900 p-5">
                      <item.icon size={18} className="text-orange-500" />
                      <p className="mt-4 text-3xl font-black tracking-tight">{item.value}</p>
                      <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-white/40">{item.label}</p>
                    </div>
                  ))}
                </div>

                {filteredOrders.length ? (
                  <div className="space-y-6">
                    {filteredOrders.map((order) => (
                      <div key={order.id} className="border border-white/10 bg-zinc-900">
                        <div className="flex flex-col gap-4 border-b border-white/5 p-6 xl:flex-row xl:items-start xl:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <div className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest ${order.status === 'Delivered' ? 'bg-green-500 text-black' : order.status === 'Cancelled' ? 'bg-red-600 text-white' : 'bg-orange-500 text-black'}`}>{order.status}</div>
                              <span className="text-xs font-mono text-white/50">#{order.trackingCode || order.id.slice(0, 8)}</span>
                            </div>
                            <p className="mt-3 text-sm text-white/55">Placed on {formatWhen(order.createdAt)}</p>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[320px]">
                            <div className="border border-white/10 bg-black/35 px-4 py-3"><p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Payment</p><p className="mt-2 text-sm font-bold">{order.paymentStatus || 'Pending'}</p></div>
                            <div className="border border-white/10 bg-black/35 px-4 py-3"><p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Update</p><p className="mt-2 text-sm font-bold">{order.orderUpdateStatus || 'Not Sent'}</p></div>
                          </div>
                        </div>

                        <div className="grid gap-6 p-6 xl:grid-cols-[1.15fr_0.85fr]">
                          <div className="space-y-4">
                            {order.items.map((item, idx) => (
                              <div key={`${item.productId}-${idx}`} className="flex items-center gap-4 border border-white/5 bg-black/35 p-4">
                                <div className="h-16 w-14 flex-shrink-0 overflow-hidden bg-black"><img src={item.image} alt={item.name} className="h-full w-full object-cover" /></div>
                                <div className="flex-grow">
                                  <p className="text-sm font-bold uppercase tracking-tight">{item.name}</p>
                                  <p className="mt-1 text-[10px] uppercase tracking-widest text-white/50">{item.quantity}x {formatGhanaCedis(item.price)}</p>
                                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-widest text-white/40">
                                    {item.selectedSize && <span>Size {item.selectedSize}</span>}
                                    {item.selectedColor && <span>Color {item.selectedColor}</span>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-4 border border-white/10 bg-black/35 p-5">
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between gap-4"><span className="text-white/45">Delivery Zone</span><span className="text-right font-semibold">{order.deliveryZone || `${order.shippingAddress.city}, ${order.shippingAddress.region}`}</span></div>
                              <div className="flex justify-between gap-4"><span className="text-white/45">Shipping Address</span><span className="text-right font-semibold">{order.shippingAddress.address}</span></div>
                              <div className="flex justify-between gap-4"><span className="text-white/45">Subtotal</span><span className="text-right font-semibold">{formatGhanaCedis(order.subtotal ?? order.total)}</span></div>
                              <div className="flex justify-between gap-4"><span className="text-white/45">Delivery Fee</span><span className="text-right font-semibold">{formatGhanaCedis(order.shipping ?? 0)}</span></div>
                              <div className="flex justify-between gap-4 border-t border-white/10 pt-4"><span className="text-white/45">Final Total</span><span className="text-right text-lg font-black text-orange-500">{formatGhanaCedis(order.total)}</span></div>
                            </div>
                            <div className="grid gap-3">
                              <button type="button" onClick={() => openTrackOrder(order)} className="inline-flex items-center justify-center gap-2 border border-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:border-orange-500 hover:text-orange-400"><Clock size={14} />Track Order</button>
                              <button type="button" onClick={() => repeatCheckout(order)} className="inline-flex items-center justify-center gap-2 border border-orange-500 bg-orange-500 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:border-white hover:bg-white"><Repeat size={14} />Repeat Checkout</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-white/10 py-24 text-center">
                    <ShoppingBag size={48} className="mx-auto mb-4 text-white/10" />
                    <p className="text-xs font-bold uppercase tracking-widest text-white/30">No orders match this view yet</p>
                    <Link to="/shop" className="mt-6 inline-block font-bold uppercase tracking-widest text-orange-500 transition-colors hover:text-white">Start Shopping</Link>
                  </div>
                )}
              </motion.div>
            ) : activeTab === 'updates' ? (
              <motion.div key="updates" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                <div>
                  <h1 className="text-4xl font-black uppercase italic tracking-tighter">Updates & Inbox</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">Direct admin messages and order-status notifications will appear here automatically.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {[{ label: 'Unread', value: unreadInboxCount, icon: Bell }, { label: 'Order Updates', value: customerInbox.filter((item) => item.senderType === 'system').length, icon: Truck }, { label: 'Admin Messages', value: customerInbox.filter((item) => (item.senderType || 'admin') === 'admin').length, icon: Mail }].map((item) => (
                    <div key={item.label} className="border border-white/10 bg-zinc-900 p-5">
                      <item.icon size={18} className="text-orange-500" />
                      <p className="mt-4 text-3xl font-black tracking-tight">{item.value}</p>
                      <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-white/40">{item.label}</p>
                    </div>
                  ))}
                </div>

                {customerInbox.length ? (
                  <div className="space-y-4">
                    {customerInbox.map((message) => (
                      <div key={message.id} className={`border p-5 ${message.status === 'new' ? 'border-orange-500/20 bg-orange-500/5' : 'border-white/10 bg-zinc-900'}`}>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest ${message.senderType === 'system' ? 'bg-orange-500 text-black' : 'bg-white text-black'}`}>{message.senderType === 'system' ? 'Order Update' : 'Admin Message'}</span>
                              {(message.status || 'new') === 'new' && <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">New</span>}
                            </div>
                            <h3 className="mt-4 text-2xl font-black tracking-tight">{message.subject}</h3>
                            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/35">{formatWhen(message.createdAt)}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {message.relatedTrackingCode && <button type="button" onClick={() => navigate(`/track-order?tracking=${encodeURIComponent(message.relatedTrackingCode || '')}`)} className="inline-flex items-center gap-2 border border-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:border-orange-500 hover:text-orange-400"><Truck size={14} />Track Order</button>}
                            {(message.status || 'new') === 'new' && <button type="button" onClick={() => markInboxMessageRead(message.id)} disabled={busyMessageId === message.id} className="inline-flex items-center gap-2 border border-orange-500 bg-orange-500 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:border-white hover:bg-white disabled:opacity-60"><Bell size={14} />{busyMessageId === message.id ? 'Updating...' : 'Mark Read'}</button>}
                          </div>
                        </div>
                        <div className="mt-5 border border-white/10 bg-black/35 p-4"><p className="text-sm leading-7 text-white/78">{message.body}</p></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-white/10 py-24 text-center">
                    <Bell size={48} className="mx-auto mb-4 text-white/10" />
                    <p className="text-xs font-bold uppercase tracking-widest text-white/30">No updates yet</p>
                    <p className="mt-4 text-sm text-white/50">Admin replies and order-status changes will appear here automatically.</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                <h1 className="text-4xl font-black uppercase italic tracking-tighter">Account Settings</h1>
                <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
                  <div className="space-y-8">
                    <h2 className="border-b border-white/10 pb-4 text-xl font-black uppercase italic">Personal Info</h2>
                    <div className="space-y-6">
                      <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Full Name</label><input disabled type="text" value={user.displayName || ''} className="w-full border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white/50 outline-none" /></div>
                      <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Email Address</label><input disabled type="email" value={user.email || ''} className="w-full border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white/50 outline-none" /></div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <h2 className="border-b border-white/10 pb-4 text-xl font-black uppercase italic">Saved Address</h2>
                    <div className="space-y-5 border border-white/10 bg-zinc-900 p-8">
                      <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Full Name</label><input type="text" value={savedAddressForm.name} onChange={(event) => setSavedAddressForm((current) => ({ ...current, name: event.target.value }))} className="w-full border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-orange-500" placeholder="Name for repeat checkout" /></div>
                      <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Phone Number</label><input type="text" value={savedAddressForm.phone} onChange={(event) => setSavedAddressForm((current) => ({ ...current, phone: event.target.value }))} className="w-full border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-orange-500" placeholder="Phone for delivery updates" /></div>
                      <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Delivery Address</label><textarea value={savedAddressForm.address} onChange={(event) => setSavedAddressForm((current) => ({ ...current, address: event.target.value }))} className="min-h-32 w-full border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-orange-500" placeholder="Delivery address for faster checkout" /></div>
                      <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Delivery Zone ID (optional)</label><input type="text" value={savedAddressForm.selectedZoneId} onChange={(event) => setSavedAddressForm((current) => ({ ...current, selectedZoneId: event.target.value }))} className="w-full border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-orange-500" placeholder="Zone ID from checkout/admin" /></div>
                      {settingsNotice && <div className={`border px-4 py-3 text-xs font-bold uppercase tracking-widest ${settingsNotice.type === 'error' ? 'border-red-500/20 bg-red-500/10 text-red-300' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'}`}>{settingsNotice.message}</div>}
                      <button type="button" onClick={saveAddress} disabled={savingSettings} className="inline-flex items-center justify-center gap-2 border border-orange-500 bg-orange-500 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:border-white hover:bg-white disabled:opacity-60"><Save size={14} />{savingSettings ? 'Saving...' : 'Save Address'}</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Profile;
