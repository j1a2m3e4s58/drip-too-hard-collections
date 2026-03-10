import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { Product, Order, Coupon } from '../types';
import { 
  Plus, Edit2, Trash2, Save, X, Package, Database, 
  ShoppingBag, Ticket, BarChart3, Clock, TrendingUp, 
  AlertCircle, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PRODUCTS } from '../constants';

import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const Admin = () => {
  const { loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'coupons' | 'analytics'>('inventory');
  
  // Inventory State
  const [products, setProducts] = useState<Product[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    category: 'Tees',
    image: '',
    description: '',
    isNew: false,
    isBestseller: false,
    inStock: true,
    stockCount: 0,
    flashSalePrice: 0,
    flashSaleEnd: ''
  });

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Coupons State
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponFormData, setCouponFormData] = useState<Partial<Coupon>>({
    code: '',
    discountType: 'percentage',
    value: 0,
    isActive: true,
    expiryDate: ''
  });

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);

  useEffect(() => {
    // Generate some analytics data from orders
    if (orders.length > 0) {
      const dailySales: Record<string, number> = {};
      orders.forEach(order => {
        const date = order.createdAt?.toDate().toLocaleDateString();
        if (date) {
          dailySales[date] = (dailySales[date] || 0) + order.total;
        }
      });
      const data = Object.entries(dailySales).map(([date, total]) => ({ date, total }));
      setAnalyticsData(data);
    } else {
      setAnalyticsData([]);
    }
  }, [orders]);

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) return;

    try {
      const batch = writeBatch(db);
      selectedProducts.forEach(id => {
        batch.delete(doc(db, 'products', id));
      });
      await batch.commit();
      setSelectedProducts([]);
      alert('Bulk delete successful');
    } catch (error) {
      console.error("Error bulk deleting:", error);
    }
  };

  const lowStockProducts = products.filter(p => p.stockCount !== undefined && p.stockCount < 5);

  useEffect(() => {
    // Listen to Products
    const qProds = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubProds = onSnapshot(qProds, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);
    });

    // Listen to Orders
    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[]);
    });

    // Listen to Coupons
    const qCoupons = query(collection(db, 'coupons'), orderBy('code', 'asc'));
    const unsubCoupons = onSnapshot(qCoupons, (snapshot) => {
      setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Coupon[]);
    });

    return () => {
      unsubProds();
      unsubOrders();
      unsubCoupons();
    };
  }, []);

  // Analytics Calculations
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => order.status !== 'Cancelled' ? sum + order.total : sum, 0);
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    const lowStockItems = products.filter(p => (p.stockCount || 0) < 5).length;
    return { totalRevenue, pendingOrders, lowStockItems, totalOrders: orders.length };
  }, [orders, products]);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...formData, updatedAt: serverTimestamp() };
      if (isEditing) {
        await updateDoc(doc(db, 'products', isEditing), data);
        setIsEditing(null);
      } else {
        await addDoc(collection(db, 'products'), { ...data, createdAt: serverTimestamp() });
      }
      setShowAddForm(false);
      resetProductForm();
    } catch (error) {
      console.error(error);
      alert("Error saving product.");
    }
  };

  const resetProductForm = () => {
    setFormData({
      name: '', price: 0, category: 'Tees', image: '', description: '',
      isNew: false, isBestseller: false, inStock: true, stockCount: 0,
      flashSalePrice: 0, flashSaleEnd: ''
    });
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus, updatedAt: serverTimestamp() });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'coupons'), { ...couponFormData, createdAt: serverTimestamp() });
      setShowCouponForm(false);
      setCouponFormData({ code: '', discountType: 'percentage', value: 0, isActive: true, expiryDate: '' });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSeedData = async () => {
    if (products.length > 0) return;
    setIsSeeding(true);
    try {
      for (const prod of PRODUCTS) {
        const { id, ...prodData } = prod;
        await addDoc(collection(db, 'products'), {
          ...prodData,
          inStock: true,
          stockCount: 20,
          createdAt: serverTimestamp()
        });
      }
      alert("Database seeded successfully!");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSeeding(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter italic">Command Center</h1>
            <p className="text-white/50 mt-2">DTHC Operations & Inventory Management</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-12 overflow-x-auto no-scrollbar">
          {[
            { id: 'inventory', label: 'Inventory', icon: Package },
            { id: 'orders', label: 'Orders', icon: ShoppingBag },
            { id: 'coupons', label: 'Coupons', icon: Ticket },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-8 py-4 text-xs uppercase font-black tracking-widest transition-all border-b-2 ${activeTab === tab.id ? 'border-orange-500 text-orange-500' : 'border-transparent text-white/50 hover:text-white'}`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-12">
          {activeTab === 'inventory' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black uppercase italic">Product Catalog</h2>
                <div className="flex space-x-4">
                  {products.length === 0 && (
                    <button onClick={handleSeedData} disabled={isSeeding} className="bg-zinc-800 text-white px-6 py-3 text-xs font-black uppercase flex items-center space-x-2 hover:bg-white hover:text-black transition-all">
                      <Database size={16} /> <span>{isSeeding ? 'Seeding...' : 'Seed Data'}</span>
                    </button>
                  )}
                  <button onClick={() => { setShowAddForm(!showAddForm); setIsEditing(null); }} className="bg-orange-500 text-black px-6 py-3 text-xs font-black uppercase flex items-center space-x-2 hover:bg-white transition-all">
                    {showAddForm ? <X size={16} /> : <Plus size={16} />} <span>{showAddForm ? 'Cancel' : 'Add Drop'}</span>
                  </button>
                </div>
              </div>

              {/* Product Form */}
              <AnimatePresence>
                {showAddForm && (
                  <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-zinc-900 border border-white/10 p-8">
                    <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Product Name</label>
                          <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-black border border-white/10 px-4 py-3 text-sm focus:border-orange-500 outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Price (GHS)</label>
                            <input required type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full bg-black border border-white/10 px-4 py-3 text-sm focus:border-orange-500 outline-none" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Stock Count</label>
                            <input required type="number" value={formData.stockCount} onChange={e => setFormData({ ...formData, stockCount: Number(e.target.value) })} className="w-full bg-black border border-white/10 px-4 py-3 text-sm focus:border-orange-500 outline-none" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Category</label>
                          <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as any })} className="w-full bg-black border border-white/10 px-4 py-3 text-sm focus:border-orange-500 outline-none">
                            <option>Tees</option><option>Sneakers</option><option>Accessories</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Image URL</label>
                          <input required type="url" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} className="w-full bg-black border border-white/10 px-4 py-3 text-sm focus:border-orange-500 outline-none" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Flash Sale Price</label>
                          <input type="number" value={formData.flashSalePrice} onChange={e => setFormData({ ...formData, flashSalePrice: Number(e.target.value) })} className="w-full bg-black border border-white/10 px-4 py-3 text-sm focus:border-orange-500 outline-none" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Flash Sale End Date</label>
                          <input type="datetime-local" value={formData.flashSaleEnd} onChange={e => setFormData({ ...formData, flashSaleEnd: e.target.value })} className="w-full bg-black border border-white/10 px-4 py-3 text-sm focus:border-orange-500 outline-none" />
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Description</label>
                          <textarea required rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-black border border-white/10 px-4 py-3 text-sm focus:border-orange-500 outline-none resize-none" />
                        </div>
                        <div className="flex flex-wrap gap-4">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={formData.inStock} onChange={e => setFormData({ ...formData, inStock: e.target.checked })} className="accent-orange-500" />
                            <span className="text-[10px] uppercase font-bold">In Stock</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={formData.isNew} onChange={e => setFormData({ ...formData, isNew: e.target.checked })} className="accent-orange-500" />
                            <span className="text-[10px] uppercase font-bold">New Drop</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={formData.isBestseller} onChange={e => setFormData({ ...formData, isBestseller: e.target.checked })} className="accent-orange-500" />
                            <span className="text-[10px] uppercase font-bold">Bestseller</span>
                          </label>
                        </div>
                        <button type="submit" className="w-full bg-white text-black py-4 font-black uppercase tracking-widest hover:bg-orange-500 transition-all flex items-center justify-center space-x-2">
                          <Save size={18} /> <span>{isEditing ? 'Update Drop' : 'Launch Drop'}</span>
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Product Grid */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => {
                      if (selectedProducts.length === products.length) setSelectedProducts([]);
                      else setSelectedProducts(products.map(p => p.id));
                    }}
                    className="text-[10px] uppercase font-black tracking-widest text-white/50 hover:text-white"
                  >
                    {selectedProducts.length === products.length ? 'Deselect All' : 'Select All'}
                  </button>
                  {selectedProducts.length > 0 && (
                    <button 
                      onClick={handleBulkDelete}
                      className="text-[10px] uppercase font-black tracking-widest text-red-500 hover:text-red-400 flex items-center space-x-1"
                    >
                      <Trash2 size={12} />
                      <span>Delete Selected ({selectedProducts.length})</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <div key={product.id} className={`bg-zinc-900 border p-4 group transition-all ${selectedProducts.includes(product.id) ? 'border-orange-500' : 'border-white/5'}`}>
                    <div className="aspect-[4/5] bg-black mb-4 overflow-hidden relative">
                      <div className="absolute top-2 left-2 z-10">
                        <input 
                          type="checkbox" 
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => {
                            if (selectedProducts.includes(product.id)) {
                              setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                            } else {
                              setSelectedProducts([...selectedProducts, product.id]);
                            }
                          }}
                          className="w-4 h-4 accent-orange-500"
                        />
                      </div>
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-2 right-2 flex flex-col gap-1">
                        {product.stockCount !== undefined && product.stockCount < 10 && (
                          <span className="bg-red-500 text-white text-[8px] font-black uppercase px-2 py-1">Low Stock: {product.stockCount}</span>
                        )}
                        {product.flashSalePrice && product.flashSalePrice > 0 && (
                          <span className="bg-orange-500 text-black text-[8px] font-black uppercase px-2 py-1">Flash Sale</span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold uppercase tracking-tight">{product.name}</h3>
                        <p className="text-white/50 text-xs font-mono">GH₵ {product.price}</p>
                      </div>
                      <div className="flex space-x-1">
                        <button onClick={() => { setFormData(product); setIsEditing(product.id); setShowAddForm(true); }} className="p-2 bg-black border border-white/10 hover:text-orange-500 transition-all"><Edit2 size={14} /></button>
                        <button onClick={() => deleteDoc(doc(db, 'products', product.id))} className="p-2 bg-black border border-white/10 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-black uppercase italic">Customer Orders</h2>
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-zinc-900 border border-white/5 p-6 flex flex-col md:flex-row gap-8">
                    <div className="flex-grow space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-white/30">Order ID</p>
                          <p className="font-mono text-xs">{order.id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-widest text-white/30">Date</p>
                          <p className="text-xs">{order.createdAt?.toDate().toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center space-x-3 text-sm">
                            <span className="text-white/30">{item.quantity}x</span>
                            <span>{item.name}</span>
                            <span className="text-white/30">GH₵ {item.price}</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                        <span className="text-xs uppercase font-black">Total Amount</span>
                        <div className="flex items-center space-x-4">
                          <span className="text-orange-500 font-black">GH₵ {order.total}</span>
                          {order.status === 'Delivered' && (
                            <button 
                              onClick={() => deleteDoc(doc(db, 'orders', order.id))}
                              className="p-2 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all rounded"
                              title="Delete Order"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="md:w-64 space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Status</label>
                        <select 
                          value={order.status} 
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as any)}
                          className={`w-full bg-black border border-white/10 px-4 py-2 text-xs font-bold uppercase outline-none ${
                            order.status === 'Delivered' ? 'text-green-500' : 
                            order.status === 'Cancelled' ? 'text-red-500' : 'text-orange-500'
                          }`}
                        >
                          {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-widest text-white/30">Shipping To</p>
                        <p className="text-xs font-bold">{order.shippingAddress.name}</p>
                        <p className="text-xs text-white/50">{order.shippingAddress.phone}</p>
                        <p className="text-xs text-white/50">{order.shippingAddress.city}, {order.shippingAddress.region}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && <div className="py-24 text-center border-2 border-dashed border-white/10 text-white/30">No orders yet.</div>}
              </div>
            </div>
          )}

          {activeTab === 'coupons' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black uppercase italic">Promo Codes</h2>
                <button onClick={() => setShowCouponForm(!showCouponForm)} className="bg-white text-black px-6 py-3 text-xs font-black uppercase flex items-center space-x-2 hover:bg-orange-500 transition-all">
                  {showCouponForm ? <X size={16} /> : <Plus size={16} />} <span>{showCouponForm ? 'Cancel' : 'New Coupon'}</span>
                </button>
              </div>

              <AnimatePresence>
                {showCouponForm && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-zinc-900 border border-white/10 p-8">
                    <form onSubmit={handleSaveCoupon} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Code</label>
                        <input required type="text" value={couponFormData.code} onChange={e => setCouponFormData({ ...couponFormData, code: e.target.value.toUpperCase() })} className="w-full bg-black border border-white/10 px-4 py-3 text-sm focus:border-orange-500 outline-none" placeholder="ACCRA20" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Type</label>
                        <select value={couponFormData.discountType} onChange={e => setCouponFormData({ ...couponFormData, discountType: e.target.value as any })} className="w-full bg-black border border-white/10 px-4 py-3 text-sm focus:border-orange-500 outline-none">
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount (GHS)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Value</label>
                        <input required type="number" value={couponFormData.value} onChange={e => setCouponFormData({ ...couponFormData, value: Number(e.target.value) })} className="w-full bg-black border border-white/10 px-4 py-3 text-sm focus:border-orange-500 outline-none" />
                      </div>
                      <div className="flex items-end">
                        <button type="submit" className="w-full bg-orange-500 text-black py-3 font-black uppercase tracking-widest hover:bg-white transition-all">Create</button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {coupons.map(coupon => (
                  <div key={coupon.id} className="bg-zinc-900 border border-white/5 p-6 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Ticket size={80} />
                    </div>
                    <h3 className="text-2xl font-black text-orange-500 mb-2">{coupon.code}</h3>
                    <p className="text-xs uppercase font-bold text-white/50 mb-4">
                      {coupon.discountType === 'percentage' ? `${coupon.value}% OFF` : `GH₵ ${coupon.value} OFF`}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 ${coupon.isActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button onClick={() => deleteDoc(doc(db, 'coupons', coupon.id))} className="text-white/30 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-12">
              <h2 className="text-2xl font-black uppercase italic">Performance Insights</h2>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Revenue', value: `GH₵ ${stats.totalRevenue}`, icon: TrendingUp, color: 'text-green-500' },
                  { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'text-blue-500' },
                  { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'text-orange-500' },
                  { label: 'Low Stock Items', value: stats.lowStockItems, icon: AlertCircle, color: 'text-red-500' },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-zinc-900 border border-white/5 p-8">
                    <div className="flex justify-between items-start mb-4">
                      <stat.icon size={24} className={stat.color} />
                    </div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-white/50 mb-1">{stat.label}</p>
                    <p className="text-3xl font-black tracking-tight">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Charts Section */}
              <div className="bg-zinc-900 border border-white/5 p-8">
                <h3 className="text-lg font-black uppercase italic mb-8 flex items-center space-x-2">
                  <BarChart3 size={18} className="text-orange-500" />
                  <span>Sales Trend</span>
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#71717a" 
                        fontSize={10} 
                        tickFormatter={(val) => val.split('/')[0] + '/' + val.split('/')[1]}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="#71717a" 
                        fontSize={10} 
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '0' }}
                        itemStyle={{ color: '#f97316', fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#f97316" 
                        strokeWidth={3} 
                        dot={{ fill: '#f97316', r: 4 }} 
                        activeDot={{ r: 6, stroke: '#000', strokeWidth: 2 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category & Health */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-zinc-900 border border-white/5 p-8">
                  <h3 className="text-lg font-black uppercase italic mb-6 flex items-center space-x-2">
                    <TrendingUp size={18} className="text-orange-500" />
                    <span>Top Categories</span>
                  </h3>
                  <div className="space-y-6">
                    {['Tees', 'Sneakers', 'Accessories'].map(cat => (
                      <div key={cat} className="space-y-2">
                        <div className="flex justify-between text-xs uppercase font-bold">
                          <span>{cat}</span>
                          <span className="text-white/50">
                            {Math.round((products.filter(p => p.category === cat).length / products.length) * 100) || 0}%
                          </span>
                        </div>
                        <div className="h-1 bg-black overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(products.filter(p => p.category === cat).length / products.length) * 100}%` }}
                            className="h-full bg-orange-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-zinc-900 border border-white/5 p-8">
                  <h3 className="text-lg font-black uppercase italic mb-6 flex items-center space-x-2">
                    <AlertCircle size={18} className="text-orange-500" />
                    <span>Low Stock Alerts</span>
                  </h3>
                  <div className="space-y-4 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                    {lowStockProducts.length > 0 ? (
                      lowStockProducts.map(product => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-black border border-red-500/20">
                          <div className="flex items-center space-x-3">
                            <img src={product.image} alt={product.name} className="w-8 h-8 object-cover" />
                            <div>
                              <p className="text-[10px] font-bold uppercase">{product.name}</p>
                              <p className="text-[9px] text-red-500 font-black uppercase tracking-widest">{product.stockCount} left</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              setIsEditing(product.id);
                              setFormData(product);
                              setActiveTab('inventory');
                            }}
                            className="text-white/30 hover:text-orange-500 transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-32 text-center">
                        <CheckCircle size={32} className="text-green-500/20 mb-2" />
                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">All stock levels healthy</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;