import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  Boxes,
  Bell,
  LayoutPanelTop,
  MapPinned,
  MessageSquare,
  Package,
  Pencil,
  Plus,
  Reply,
  Save,
  Settings2,
  ShoppingBag,
  Trash2,
  UserRoundCog,
  ArrowLeft,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { db } from '../firebase';
import {
  Collection as StoreCollection,
  ContactMessage,
  DeliveryZone,
  HeroBanner,
  LookbookItem,
  Order,
  Product,
  StoreSettings,
} from '../types';
import { defaultCollections, defaultDeliveryZones, defaultLookbook, defaultStoreSettings, isLegacyDemoImageUrl, isValidHeroBannerContent, STOREFRONT_SETTINGS_DOC } from '../lib/storefront';
import ImageSourceField from '../components/admin/ImageSourceField';
import { importedCatalogProducts, mergeWithImportedCatalogProducts } from '../lib/importedCatalog';
import { formatGhanaCedis } from '../lib/utils';

type Section = 'products' | 'hero' | 'collections' | 'lookbook' | 'settings' | 'delivery' | 'orders' | 'messages';
const sectionIds: Section[] = ['products', 'hero', 'collections', 'lookbook', 'settings', 'delivery', 'orders', 'messages'];

const emptyProduct = {
  name: '',
  price: 0,
  category: 'Tees',
  image: '',
  galleryImages: [''],
  description: '',
  sizeOptions: [] as string[],
  isNew: false,
  isBestseller: false,
  featured: false,
  inStock: true,
  stockCount: 0,
  flashSalePrice: 0,
  flashSaleEnd: '',
  imageSourceType: 'url' as const,
  imageOriginalUrl: '',
};

const emptyHero = {
  title: '',
  subtitle: '',
  eyebrow: 'Featured Drop',
  priceLabel: '',
  animationStyle: 'zoom' as const,
  ctaText: 'Shop Now',
  ctaLink: '/shop',
  image: '',
  isActive: true,
  sortOrder: 1,
  targetProductId: '',
  bubbleItems: Array.from({ length: 4 }, () => ({
    image: '',
    title: '',
    price: '',
    productId: '',
  })),
  imageSourceType: 'url' as const,
  imageOriginalUrl: '',
};

const emptyCollection = {
  title: '',
  description: '',
  image: '',
  story: '',
  featured: false,
  sortOrder: 1,
  ctaText: 'Explore Collection',
  linkedProductIds: [] as string[],
  imageSourceType: 'url' as const,
  imageOriginalUrl: '',
};

const emptyLookbook = {
  title: '',
  image: '',
  caption: '',
  description: '',
  sortOrder: 1,
  featured: false,
  ctaText: 'Shop the Fit',
  ctaLink: '/shop',
  linkedProductIds: [] as string[],
  imageSourceType: 'url' as const,
  imageOriginalUrl: '',
};

const emptyZone = {
  name: '',
  fee: 0,
  eta: '',
  notes: '',
  active: true,
  sortOrder: 1,
};

const starterHeroBanners: Omit<HeroBanner, 'id'>[] = [
  {
    title: 'Accra Street Motion',
    subtitle: 'Sharp sneaker energy, clean layering, and premium street movement for everyday Ghana fits.',
    eyebrow: 'New season drops are live now.',
    priceLabel: 'From GHS 280',
    animationStyle: 'zoom',
    ctaText: 'Shop Sneakers',
    ctaLink: '/shop?q=sneakers',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1400&q=80',
    isActive: true,
    sortOrder: 1,
    targetProductId: '',
    bubbleItems: [
      { image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=420&q=80', title: 'Velocity Runner', price: 'GHS 280', productId: '' },
      { image: 'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=420&q=80', title: 'Night Motion Tee', price: 'GHS 140', productId: '' },
      { image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=420&q=80', title: 'Core Layer Shirt', price: 'GHS 155', productId: '' },
      { image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=420&q=80', title: 'Drop Cargo Fit', price: 'GHS 210', productId: '' },
    ],
    imageSourceType: 'url',
    imageOriginalUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1400&q=80',
  },
  {
    title: 'Luxury Street Energy',
    subtitle: 'Minimal pieces with strong shape, dark contrast, and easy styling for standout daily wear.',
    eyebrow: 'Featured drop',
    priceLabel: 'From GHS 135',
    animationStyle: 'spotlight',
    ctaText: 'View Collection',
    ctaLink: '/collections',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1400&q=80',
    isActive: true,
    sortOrder: 2,
    targetProductId: '',
    bubbleItems: [
      { image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=420&q=80', title: 'Midnight Statement Tee', price: 'GHS 135', productId: '' },
      { image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=420&q=80', title: 'Layered Street Jacket', price: 'GHS 240', productId: '' },
      { image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=420&q=80', title: 'Minimal Leather Bag', price: 'GHS 180', productId: '' },
      { image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=420&q=80', title: 'Downtown Trouser', price: 'GHS 165', productId: '' },
    ],
    imageSourceType: 'url',
    imageOriginalUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1400&q=80',
  },
];

const starterCollections: Omit<StoreCollection, 'id'>[] = [
  {
    title: 'Midnight Layers',
    description: 'Clean monochrome layers built for premium night styling.',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
    story: 'A focused collection of dark essential pieces for sharp movement, late-city comfort, and easy styling.',
    featured: true,
    sortOrder: 1,
    ctaText: 'Explore Collection',
    linkedProductIds: [],
    imageSourceType: 'url',
    imageOriginalUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Street Motion',
    description: 'Sneaker-led looks with bold energy and daily flexibility.',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
    story: 'Designed around movement, confidence, and visible product attitude from head to toe.',
    featured: false,
    sortOrder: 2,
    ctaText: 'Shop The Drop',
    linkedProductIds: [],
    imageSourceType: 'url',
    imageOriginalUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
  },
];

const starterLookbookItems: Omit<LookbookItem, 'id'>[] = [
  {
    title: 'Midnight Layer',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
    caption: 'Monochrome comfort with a clean statement front.',
    description: 'A wearable fit built for simple premium street presence.',
    sortOrder: 1,
    featured: true,
    ctaText: 'Shop This Fit',
    ctaLink: '/shop',
    linkedProductIds: [],
    imageSourceType: 'url',
    imageOriginalUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Runner Energy',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=80',
    caption: 'Built for movement, styled for impact.',
    description: 'Sharp layering with enough ease for everyday city wear.',
    sortOrder: 2,
    featured: false,
    ctaText: 'Shop This Fit',
    ctaLink: '/shop',
    linkedProductIds: [],
    imageSourceType: 'url',
    imageOriginalUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=80',
  },
];

const Admin = () => {
  const navigate = useNavigate();
  const { section: routeSection } = useParams<{ section?: string }>();
  const section = sectionIds.includes((routeSection || '') as Section) ? (routeSection as Section) : null;
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>([]);
  const [collectionsData, setCollectionsData] = useState<StoreCollection[]>([]);
  const [lookbookItems, setLookbookItems] = useState<LookbookItem[]>([]);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({ id: 'settings', ...defaultStoreSettings });

  const [productForm, setProductForm] = useState(emptyProduct);
  const [heroForm, setHeroForm] = useState(emptyHero);
  const [collectionForm, setCollectionForm] = useState(emptyCollection);
  const [lookbookForm, setLookbookForm] = useState(emptyLookbook);
  const [zoneForm, setZoneForm] = useState(emptyZone);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ collectionName: string; itemId: string; label: string } | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const sizePresets = {
    tops: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
    trousers: ['28', '30', '32', '34', '36', '38', '40', '42'],
    shoes: ['38', '39', '40', '41', '42', '43', '44', '45', '46'],
  };

  useEffect(() => {
    const unsubProducts = onSnapshot(query(collection(db, 'products'), orderBy('createdAt', 'desc')), (snap) => {
      const next = snap.docs.map((item) => ({ id: item.id, ...item.data() })) as Product[];
      setProducts(mergeWithImportedCatalogProducts(next));
    });
    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snap) => {
      setOrders(snap.docs.map((item) => ({ id: item.id, ...item.data() })) as Order[]);
    });
    const unsubHero = onSnapshot(query(collection(db, 'heroBanners'), orderBy('sortOrder', 'asc')), (snap) => {
      const next = snap.docs
        .map((item) => ({ id: item.id, ...item.data() })) as HeroBanner[];
      setHeroBanners(next.filter((item) => !isLegacyDemoImageUrl(item.image) && isValidHeroBannerContent(item)));
    });
    const unsubCollections = onSnapshot(query(collection(db, 'storefrontCollections'), orderBy('sortOrder', 'asc')), (snap) => {
      setCollectionsData(snap.empty ? defaultCollections : (snap.docs.map((item) => ({ id: item.id, ...item.data() })) as StoreCollection[]));
    });
    const unsubLookbook = onSnapshot(query(collection(db, 'lookbookItems'), orderBy('sortOrder', 'asc')), (snap) => {
      setLookbookItems(snap.empty ? defaultLookbook : (snap.docs.map((item) => ({ id: item.id, ...item.data() })) as LookbookItem[]));
    });
    const unsubZones = onSnapshot(query(collection(db, 'deliveryZones'), orderBy('sortOrder', 'asc')), (snap) => {
      setDeliveryZones(snap.empty ? defaultDeliveryZones : (snap.docs.map((item) => ({ id: item.id, ...item.data() })) as DeliveryZone[]));
    });
    const unsubMessages = onSnapshot(query(collection(db, 'contacts'), orderBy('createdAt', 'desc')), (snap) => {
      setContactMessages(snap.docs.map((item) => ({ id: item.id, ...item.data() })) as ContactMessage[]);
    });
    const unsubSettings = onSnapshot(doc(db, STOREFRONT_SETTINGS_DOC), (snap) => {
      setSettings(snap.exists() ? { id: snap.id, ...defaultStoreSettings, ...(snap.data() as Omit<StoreSettings, 'id'>) } : { id: 'settings', ...defaultStoreSettings });
    });
    return () => {
      unsubProducts();
      unsubOrders();
      unsubHero();
      unsubCollections();
      unsubLookbook();
      unsubZones();
      unsubMessages();
      unsubSettings();
    };
  }, []);

  useEffect(() => {
    setProducts((current) => (current.length ? current : mergeWithImportedCatalogProducts([])));
  }, []);

  const overview = useMemo(
    () => ({
      products: products.length,
      banners: heroBanners.filter((item) => item.isActive).length,
      collections: collectionsData.filter((item) => item.featured).length,
      zones: deliveryZones.filter((item) => item.active).length,
      pending: orders.filter((item) => item.status === 'Pending').length,
      messages: contactMessages.filter((item) => item.status !== 'replied').length,
    }),
    [collectionsData, contactMessages, deliveryZones, heroBanners, orders, products],
  );

  const receivedOrderCount = useMemo(
    () => orders.filter((item) => item.status === 'Pending' || item.status === 'Processing').length,
    [orders],
  );

  const sections = [
    { id: 'products' as const, title: 'Product Management', description: 'Edit products, stock, featured states, prices, and images.', icon: Package },
    { id: 'hero' as const, title: 'Hero Banner Management', description: 'Control homepage banners, CTA text, images, and ordering.', icon: LayoutPanelTop },
    { id: 'collections' as const, title: 'Collections Management', description: 'Create and feature collections for storefront discovery.', icon: Boxes },
    { id: 'lookbook' as const, title: 'Lookbook Management', description: 'Manage style inspiration cards and lookbook images.', icon: LayoutPanelTop },
    { id: 'settings' as const, title: 'Store Settings', description: 'Update messaging, support contacts, and page copy.', icon: Settings2 },
    { id: 'delivery' as const, title: 'Delivery Zones', description: 'Manage zone names, fees, ETAs, and active states.', icon: MapPinned },
    { id: 'orders' as const, title: 'Customer Orders', description: 'Track order, payment, proof, and fulfillment status.', icon: UserRoundCog },
    { id: 'messages' as const, title: 'Customer Messages', description: 'See contact submissions and reply directly from admin.', icon: MessageSquare },
  ];

  const resetEditor = () => {
    setEditingId(null);
    setShowForm(false);
    setProductForm(emptyProduct);
    setHeroForm(emptyHero);
    setCollectionForm(emptyCollection);
    setLookbookForm(emptyLookbook);
    setZoneForm(emptyZone);
  };

  const showNotice = (type: 'success' | 'error', message: string) => {
    setActionNotice({ type, message });
    window.setTimeout(() => {
      setActionNotice((current) => (current?.message === message ? null : current));
    }, 4500);
  };

  const openEditor = (kind: Section, item?: any) => {
    setShowForm(true);
    if (!item) {
      setEditingId(null);
      return;
    }
    setEditingId(item.id);
    const { id, ...rest } = item;
    if (kind === 'products') setProductForm({ ...emptyProduct, ...rest, galleryImages: Array.isArray(rest.galleryImages) && rest.galleryImages.length ? rest.galleryImages : [''] });
    if (kind === 'hero')
      setHeroForm({
        ...emptyHero,
        ...rest,
        bubbleItems: Array.from({ length: 4 }, (_, index) => ({
          ...emptyHero.bubbleItems[index],
          ...(Array.isArray(rest.bubbleItems) ? rest.bubbleItems[index] : {}),
        })),
      });
    if (kind === 'collections') setCollectionForm({ ...emptyCollection, ...rest, linkedProductIds: Array.isArray(rest.linkedProductIds) ? rest.linkedProductIds : [] });
    if (kind === 'lookbook') setLookbookForm({ ...emptyLookbook, ...rest, linkedProductIds: Array.isArray(rest.linkedProductIds) ? rest.linkedProductIds : [] });
    if (kind === 'delivery') setZoneForm({ ...emptyZone, ...rest });
  };

  const saveSection = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!section) return;
    setBusyAction('save-section');
    try {
      if (section === 'products') {
        const payload = {
          ...productForm,
          galleryImages: (productForm.galleryImages || []).map((item) => item.trim()).filter(Boolean),
          sizeOptions: (productForm.sizeOptions || []).map((item) => item.trim()).filter(Boolean),
          updatedAt: serverTimestamp(),
        };
        editingId
          ? await setDoc(doc(db, 'products', editingId), { ...payload, createdAt: serverTimestamp() }, { merge: true })
          : await addDoc(collection(db, 'products'), { ...payload, createdAt: serverTimestamp() });
      }
      if (section === 'hero') {
        const payload = {
          ...heroForm,
          bubbleItems: (heroForm.bubbleItems || []).map((item) => ({
            image: item.image || '',
            title: item.title || '',
            price: item.price || '',
            productId: item.productId || '',
          })),
          sortOrder: Number(heroForm.sortOrder || 1),
          updatedAt: serverTimestamp(),
        };
        editingId ? await updateDoc(doc(db, 'heroBanners', editingId), payload) : await addDoc(collection(db, 'heroBanners'), { ...payload, createdAt: serverTimestamp() });
      }
      if (section === 'collections') {
        const payload = {
          ...collectionForm,
          linkedProductIds: (collectionForm.linkedProductIds || []).map((item) => item.trim()).filter(Boolean),
          sortOrder: Number(collectionForm.sortOrder || 1),
          updatedAt: serverTimestamp(),
        };
        editingId ? await updateDoc(doc(db, 'storefrontCollections', editingId), payload) : await addDoc(collection(db, 'storefrontCollections'), { ...payload, createdAt: serverTimestamp() });
      }
      if (section === 'lookbook') {
        const payload = {
          ...lookbookForm,
          linkedProductIds: (lookbookForm.linkedProductIds || []).map((item) => item.trim()).filter(Boolean),
          sortOrder: Number(lookbookForm.sortOrder || 1),
          updatedAt: serverTimestamp(),
        };
        editingId ? await updateDoc(doc(db, 'lookbookItems', editingId), payload) : await addDoc(collection(db, 'lookbookItems'), { ...payload, createdAt: serverTimestamp() });
      }
      if (section === 'delivery') {
        const payload = { ...zoneForm, fee: Number(zoneForm.fee || 0), sortOrder: Number(zoneForm.sortOrder || 1), updatedAt: serverTimestamp() };
        editingId ? await updateDoc(doc(db, 'deliveryZones', editingId), payload) : await addDoc(collection(db, 'deliveryZones'), { ...payload, createdAt: serverTimestamp() });
      }
      showNotice('success', editingId ? 'Changes saved successfully.' : 'Item created successfully.');
      resetEditor();
    } catch (error) {
      console.error(`Failed to save ${section}:`, error);
      const message = error instanceof Error ? error.message : String(error);
      showNotice('error', `Could not save ${section}. ${message}`);
    } finally {
      setBusyAction(null);
    }
  };

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusyAction('save-settings');
    try {
      await setDoc(doc(db, STOREFRONT_SETTINGS_DOC), { ...settings, updatedAt: serverTimestamp() }, { merge: true });
      showNotice('success', 'Store settings updated.');
    } catch (error) {
      console.error('Failed to update store settings:', error);
      const message = error instanceof Error ? error.message : String(error);
      showNotice('error', `Could not save store settings. ${message}`);
    } finally {
      setBusyAction(null);
    }
  };

  const updateOrderField = async (orderId: string, patch: Partial<Order>) => {
    setBusyAction(`order-${orderId}`);
    try {
      await updateDoc(doc(db, 'orders', orderId), { ...patch, updatedAt: serverTimestamp() });
      showNotice('success', 'Order updated.');
    } catch (error) {
      console.error('Failed to update order:', error);
      const message = error instanceof Error ? error.message : String(error);
      showNotice('error', `Could not update this order. ${message}`);
    } finally {
      setBusyAction(null);
    }
  };

  const saveContactReply = async (messageId: string) => {
    const reply = (replyDrafts[messageId] || '').trim();
    if (!reply) {
      showNotice('error', 'Write a reply before sending it.');
      return;
    }

    setBusyAction(`message-${messageId}`);
    try {
      await updateDoc(doc(db, 'contacts', messageId), {
        adminReply: reply,
        status: 'replied',
        repliedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showNotice('success', 'Reply sent to customer thread.');
    } catch (error) {
      console.error('Failed to send contact reply:', error);
      const message = error instanceof Error ? error.message : String(error);
      showNotice('error', `Could not send contact reply. ${message}`);
    } finally {
      setBusyAction(null);
    }
  };

  const handleDeleteDoc = async (collectionName: string, itemId: string, label: string) => {
    setPendingDelete({ collectionName, itemId, label });
  };

  const importBundledCatalog = async () => {
    setBusyAction('import-catalog');
    try {
      await Promise.all(
        importedCatalogProducts.map((item) =>
          setDoc(
            doc(db, 'products', item.id),
            {
              ...item,
              updatedAt: serverTimestamp(),
              createdAt: serverTimestamp(),
            },
            { merge: true },
          ),
        ),
      );
      showNotice('success', 'Uploaded catalog imported into admin products.');
    } catch (error) {
      console.error('Failed to import uploaded catalog:', error);
      const message = error instanceof Error ? error.message : String(error);
      showNotice('error', `Could not import uploaded catalog. ${message}`);
    } finally {
      setBusyAction(null);
    }
  };

  const loadStarterContent = async (kind: 'hero' | 'collections' | 'lookbook') => {
    try {
      if (kind === 'hero') {
        await Promise.all(
          starterHeroBanners.map((item) =>
            addDoc(collection(db, 'heroBanners'), {
              ...item,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }),
          ),
        );
      }

      if (kind === 'collections') {
        await Promise.all(
          starterCollections.map((item) =>
            addDoc(collection(db, 'storefrontCollections'), {
              ...item,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }),
          ),
        );
      }

      if (kind === 'lookbook') {
        await Promise.all(
          starterLookbookItems.map((item) =>
            addDoc(collection(db, 'lookbookItems'), {
              ...item,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }),
          ),
        );
      }

      showNotice('success', `Starter ${kind} content added to admin.`);
    } catch (error) {
      console.error(`Failed to add starter ${kind}:`, error);
      const message = error instanceof Error ? error.message : String(error);
      showNotice('error', `Could not add starter ${kind}. ${message}`);
    }
  };

  const confirmDeleteDoc = async () => {
    if (!pendingDelete) {
      return;
    }
    setBusyAction('delete-doc');
    try {
      await deleteDoc(doc(db, pendingDelete.collectionName, pendingDelete.itemId));
      setPendingDelete(null);
      showNotice('success', `${pendingDelete.label} deleted successfully.`);
    } catch (error) {
      console.error(`Failed to delete ${pendingDelete.label}:`, error);
      const message = error instanceof Error ? error.message : String(error);
      showNotice('error', `Could not delete this ${pendingDelete.label}. ${message}`);
    } finally {
      setBusyAction(null);
    }
  };

  const renderForm = () => {
    if (!section) return null;
    if (!showForm || section === 'settings' || section === 'orders' || section === 'messages') return null;
    return (
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="rounded-[1.75rem] border border-white/10 bg-zinc-950 p-4 sm:p-5">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-2xl sm:text-3xl font-bold">{editingId ? 'Edit item' : 'Add item'}</h3>
          <button type="button" onClick={resetEditor} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70">Close</button>
        </div>
        <form onSubmit={saveSection} className="space-y-5">
          {section === 'products' && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Product name" value={productForm.name} onChange={(v) => setProductForm({ ...productForm, name: v })} />
                <Input label="Category" value={productForm.category} onChange={(v) => setProductForm({ ...productForm, category: v })} />
                <Input label="Price (GHS)" value={String(productForm.price)} type="number" onChange={(v) => setProductForm({ ...productForm, price: Number(v) })} />
                <Input label="Stock count" value={String(productForm.stockCount)} type="number" onChange={(v) => setProductForm({ ...productForm, stockCount: Number(v) })} />
              </div>
              <Input
                label="Available sizes"
                value={(productForm.sizeOptions || []).join(', ')}
                onChange={(v) => setProductForm({ ...productForm, sizeOptions: v.split(',').map((item) => item.trim()).filter(Boolean) })}
              />
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Quick size sets</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setProductForm({ ...productForm, sizeOptions: sizePresets.tops })} className="rounded-full border border-white/10 bg-[rgba(9,9,11,0.58)] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/80">Top sizes</button>
                  <button type="button" onClick={() => setProductForm({ ...productForm, sizeOptions: sizePresets.trousers })} className="rounded-full border border-white/10 bg-[rgba(9,9,11,0.58)] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/80">Trouser sizes</button>
                  <button type="button" onClick={() => setProductForm({ ...productForm, sizeOptions: sizePresets.shoes })} className="rounded-full border border-white/10 bg-[rgba(9,9,11,0.58)] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/80">Shoe sizes</button>
                  <button type="button" onClick={() => setProductForm({ ...productForm, sizeOptions: [] })} className="rounded-full border border-white/10 bg-[rgba(9,9,11,0.58)] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/60">Clear sizes</button>
                </div>
              </div>
              <ImageSourceField label="Product image" value={productForm.image} sourceType={productForm.imageSourceType} originalUrl={productForm.imageOriginalUrl} storageFolder="products" helperText="Use URL, upload from device, or a Google Drive share link." onChange={(payload) => setProductForm({ ...productForm, ...payload })} />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Product gallery images</p>
                  <button
                    type="button"
                    onClick={() => setProductForm({ ...productForm, galleryImages: [...(productForm.galleryImages || []), ''] })}
                    className="rounded-full border border-white/10 bg-[rgba(9,9,11,0.58)] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/80"
                  >
                    Add Gallery Image
                  </button>
                </div>
                {(productForm.galleryImages || ['']).map((galleryImage, index) => (
                  <div key={`gallery-${index}`} className="rounded-[1.25rem] border border-white/10 bg-[rgba(9,9,11,0.34)] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-widest text-white/45">Gallery Image {index + 1}</p>
                      {(productForm.galleryImages || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setProductForm({
                              ...productForm,
                              galleryImages: (productForm.galleryImages || []).filter((_, itemIndex) => itemIndex !== index),
                            })
                          }
                          className="rounded-full border border-red-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-red-300"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <ImageSourceField
                      label={`Gallery image ${index + 1}`}
                      value={galleryImage}
                      storageFolder="products"
                      helperText="Add extra angles like front, back, close-up, or lifestyle shots."
                      onChange={(payload) =>
                        setProductForm({
                          ...productForm,
                          galleryImages: (productForm.galleryImages || []).map((item, itemIndex) => (itemIndex === index ? payload.image : item)),
                        })
                      }
                    />
                  </div>
                ))}
              </div>
              <TextArea label="Description" value={productForm.description} onChange={(v) => setProductForm({ ...productForm, description: v })} />
              <div className="flex flex-wrap gap-4">
                <Toggle label="In stock" checked={productForm.inStock} onChange={(checked) => setProductForm({ ...productForm, inStock: checked })} />
                <Toggle label="Featured" checked={!!productForm.featured} onChange={(checked) => setProductForm({ ...productForm, featured: checked })} />
                <Toggle label="New arrival" checked={!!productForm.isNew} onChange={(checked) => setProductForm({ ...productForm, isNew: checked })} />
                <Toggle label="Best seller" checked={!!productForm.isBestseller} onChange={(checked) => setProductForm({ ...productForm, isBestseller: checked })} />
              </div>
            </>
          )}
          {section === 'hero' && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Eyebrow" value={heroForm.eyebrow || ''} onChange={(v) => setHeroForm({ ...heroForm, eyebrow: v })} />
                <Input label="Sort order" type="number" value={String(heroForm.sortOrder)} onChange={(v) => setHeroForm({ ...heroForm, sortOrder: Number(v) })} />
                <Input label="Headline" value={heroForm.title} onChange={(v) => setHeroForm({ ...heroForm, title: v })} />
                <Input label="Price label" value={heroForm.priceLabel || ''} onChange={(v) => setHeroForm({ ...heroForm, priceLabel: v })} />
                <Input label="CTA text" value={heroForm.ctaText} onChange={(v) => setHeroForm({ ...heroForm, ctaText: v })} />
                <Input label="CTA link" value={heroForm.ctaLink} onChange={(v) => setHeroForm({ ...heroForm, ctaLink: v })} />
                <Input label="Target product ID" value={heroForm.targetProductId || ''} onChange={(v) => setHeroForm({ ...heroForm, targetProductId: v })} />
                <Select
                  label="Hero animation"
                  value={heroForm.animationStyle || 'zoom'}
                  options={['fade', 'zoom', 'slide-left', 'slide-up', 'float', 'spotlight']}
                  onChange={(v) => setHeroForm({ ...heroForm, animationStyle: v as HeroBanner['animationStyle'] })}
                />
              </div>
              <TextArea label="Subtitle" value={heroForm.subtitle} onChange={(v) => setHeroForm({ ...heroForm, subtitle: v })} />
              <ImageSourceField label="Banner image" value={heroForm.image} sourceType={heroForm.imageSourceType} originalUrl={heroForm.imageOriginalUrl} storageFolder="hero-banners" helperText="Homepage hero images update for all customers immediately after save." onChange={(payload) => setHeroForm({ ...heroForm, ...payload })} />
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Hero bubble products</p>
                <div className="grid gap-4 xl:grid-cols-2">
                  {(heroForm.bubbleItems || []).map((bubble, index) => (
                    <div key={`hero-bubble-${index}`} className="rounded-[1.25rem] border border-white/10 bg-[rgba(9,9,11,0.34)] p-4">
                      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/45">Bubble {index + 1}</p>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Input
                          label="Product title"
                          value={bubble.title}
                          onChange={(v) =>
                            setHeroForm({
                              ...heroForm,
                              bubbleItems: (heroForm.bubbleItems || []).map((item, itemIndex) => (itemIndex === index ? { ...item, title: v } : item)),
                            })
                          }
                        />
                        <Input
                          label="Price"
                          value={bubble.price}
                          onChange={(v) =>
                            setHeroForm({
                              ...heroForm,
                              bubbleItems: (heroForm.bubbleItems || []).map((item, itemIndex) => (itemIndex === index ? { ...item, price: v } : item)),
                            })
                          }
                        />
                        <Input
                          label="Target product ID"
                          value={bubble.productId || ''}
                          onChange={(v) =>
                            setHeroForm({
                              ...heroForm,
                              bubbleItems: (heroForm.bubbleItems || []).map((item, itemIndex) => (itemIndex === index ? { ...item, productId: v } : item)),
                            })
                          }
                        />
                      </div>
                      <div className="mt-4">
                        <ImageSourceField
                          label={`Bubble ${index + 1} image`}
                          value={bubble.image}
                          storageFolder="hero-banners"
                          helperText="This small image appears in the animated floating bubble."
                          onChange={(payload) =>
                            setHeroForm({
                              ...heroForm,
                              bubbleItems: (heroForm.bubbleItems || []).map((item, itemIndex) => (itemIndex === index ? { ...item, image: payload.image } : item)),
                            })
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Toggle label="Active banner" checked={heroForm.isActive} onChange={(checked) => setHeroForm({ ...heroForm, isActive: checked })} />
            </>
          )}
          {section === 'collections' && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Collection name" value={collectionForm.title} onChange={(v) => setCollectionForm({ ...collectionForm, title: v })} />
                <Input label="Sort order" type="number" value={String(collectionForm.sortOrder)} onChange={(v) => setCollectionForm({ ...collectionForm, sortOrder: Number(v) })} />
                <Input label="CTA text" value={collectionForm.ctaText || ''} onChange={(v) => setCollectionForm({ ...collectionForm, ctaText: v })} />
                <Input label="Linked product IDs" value={(collectionForm.linkedProductIds || []).join(', ')} onChange={(v) => setCollectionForm({ ...collectionForm, linkedProductIds: v.split(',').map((item) => item.trim()).filter(Boolean) })} />
              </div>
              <TextArea label="Description" value={collectionForm.description} onChange={(v) => setCollectionForm({ ...collectionForm, description: v })} />
              <TextArea label="Story" value={collectionForm.story} onChange={(v) => setCollectionForm({ ...collectionForm, story: v })} />
              <ImageSourceField label="Cover image" value={collectionForm.image} sourceType={collectionForm.imageSourceType} originalUrl={collectionForm.imageOriginalUrl} storageFolder="collections" helperText="This image is used on the admin card and the public collections page." onChange={(payload) => setCollectionForm({ ...collectionForm, ...payload })} />
              <Toggle label="Featured collection" checked={!!collectionForm.featured} onChange={(checked) => setCollectionForm({ ...collectionForm, featured: checked })} />
            </>
          )}
          {section === 'lookbook' && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Title" value={lookbookForm.title || ''} onChange={(v) => setLookbookForm({ ...lookbookForm, title: v })} />
                <Input label="Sort order" type="number" value={String(lookbookForm.sortOrder)} onChange={(v) => setLookbookForm({ ...lookbookForm, sortOrder: Number(v) })} />
                <Input label="Caption" value={lookbookForm.caption} onChange={(v) => setLookbookForm({ ...lookbookForm, caption: v })} />
                <Input label="CTA link" value={lookbookForm.ctaLink || ''} onChange={(v) => setLookbookForm({ ...lookbookForm, ctaLink: v })} />
                <Input label="Linked product IDs" value={(lookbookForm.linkedProductIds || []).join(', ')} onChange={(v) => setLookbookForm({ ...lookbookForm, linkedProductIds: v.split(',').map((item) => item.trim()).filter(Boolean) })} />
              </div>
              <TextArea label="Description" value={lookbookForm.description || ''} onChange={(v) => setLookbookForm({ ...lookbookForm, description: v })} />
              <ImageSourceField label="Lookbook image" value={lookbookForm.image} sourceType={lookbookForm.imageSourceType} originalUrl={lookbookForm.imageOriginalUrl} storageFolder="lookbook" helperText="Lookbook cards support URL, device upload, and Google Drive sources." onChange={(payload) => setLookbookForm({ ...lookbookForm, ...payload })} />
              <Toggle label="Featured lookbook item" checked={!!lookbookForm.featured} onChange={(checked) => setLookbookForm({ ...lookbookForm, featured: checked })} />
            </>
          )}
          {section === 'delivery' && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Zone name" value={zoneForm.name} onChange={(v) => setZoneForm({ ...zoneForm, name: v })} />
                <Input label="Delivery fee" type="number" value={String(zoneForm.fee)} onChange={(v) => setZoneForm({ ...zoneForm, fee: Number(v) })} />
                <Input label="ETA" value={zoneForm.eta} onChange={(v) => setZoneForm({ ...zoneForm, eta: v })} />
                <Input label="Sort order" type="number" value={String(zoneForm.sortOrder)} onChange={(v) => setZoneForm({ ...zoneForm, sortOrder: Number(v) })} />
              </div>
              <TextArea label="Notes" value={zoneForm.notes || ''} onChange={(v) => setZoneForm({ ...zoneForm, notes: v })} />
              <Toggle label="Active zone" checked={zoneForm.active} onChange={(checked) => setZoneForm({ ...zoneForm, active: checked })} />
            </>
          )}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={resetEditor} disabled={busyAction === 'save-section'} className="rounded-full px-5 py-3 text-sm font-bold text-slate-300 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={busyAction === 'save-section'} className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-bold text-black disabled:opacity-60"><Save size={16} />{busyAction === 'save-section' ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </motion.div>
    );
  };

  if (!section) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-16 md:pb-20 text-white">
        <DeleteConfirmModal
          pendingDelete={pendingDelete}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDeleteDoc}
        />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {actionNotice && (
            <div className={`mb-6 rounded-2xl border px-5 py-4 text-sm font-semibold backdrop-blur-xl ${actionNotice.type === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'}`}>
              {actionNotice.message}
            </div>
          )}
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs sm:text-sm text-slate-300">Store control center</p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">DTHC Admin</h1>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/orders')}
              className="relative inline-flex h-14 w-14 items-center justify-center self-start rounded-2xl border border-white/10 bg-[rgba(24,24,27,0.62)] text-white transition-all backdrop-blur-md hover:border-orange-500/40 hover:text-orange-400"
              aria-label="Open customer orders"
            >
              <Bell size={22} />
              {receivedOrderCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 min-w-6 rounded-full bg-orange-500 px-1.5 py-0.5 text-center text-xs font-black text-black">
                  {receivedOrderCount}
                </span>
              )}
            </button>
          </div>

          <div className="mb-8 grid gap-3 md:gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Products" value={overview.products} icon={Package} />
            <StatCard label="Active banners" value={overview.banners} icon={LayoutPanelTop} />
            <StatCard label="Featured collections" value={overview.collections} icon={Boxes} />
            <StatCard label="Active zones" value={overview.zones} icon={MapPinned} />
            <StatCard label="Pending orders" value={overview.pending} icon={ShoppingBag} />
            <StatCard label="Open messages" value={overview.messages} icon={MessageSquare} />
          </div>

          <div className="grid gap-4 md:gap-6 md:grid-cols-2">
            {sections.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(`/admin/${item.id}`)}
                className="rounded-[1.75rem] border border-white/10 bg-[rgba(24,24,27,0.62)] p-4 sm:p-5 text-left transition-all backdrop-blur-md hover:border-orange-500/40 hover:bg-[rgba(39,39,42,0.72)]"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-400 backdrop-blur-sm">
                  <item.icon size={22} />
                </div>
                <h2 className="mb-2 text-xl sm:text-2xl font-bold">{item.title}</h2>
                <p className="mb-4 sm:mb-5 text-xs sm:text-sm leading-6 sm:leading-7 text-white/55">{item.description}</p>
                <div className="inline-flex rounded-full bg-orange-500 px-4 py-2 text-xs font-bold uppercase tracking-widest text-black">Open</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-16 md:pb-20 text-white">
      <DeleteConfirmModal
        pendingDelete={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDeleteDoc}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {actionNotice && (
          <div className={`mb-6 rounded-2xl border px-5 py-4 text-sm font-semibold backdrop-blur-xl ${actionNotice.type === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'}`}>
            {actionNotice.message}
          </div>
        )}
        <div className="mb-8 md:mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3">
              <Link to="/admin" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/55 hover:text-orange-400">
                <ArrowLeft size={16} />
                Back To Admin
              </Link>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">Store control center</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">{sections.find((item) => item.id === section)?.title}</h1>
            <p className="mt-2 text-sm sm:text-base text-white/50">{sections.find((item) => item.id === section)?.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/orders')}
              className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[rgba(24,24,27,0.62)] text-white transition-all backdrop-blur-md hover:border-orange-500/40 hover:text-orange-400"
              aria-label="Open customer orders"
            >
              <Bell size={20} />
              {receivedOrderCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-orange-500 px-1.5 py-0.5 text-center text-[10px] font-black text-black">
                  {receivedOrderCount}
                </span>
              )}
            </button>
            {section !== 'settings' && section !== 'orders' && (
              <button type="button" onClick={() => (showForm ? resetEditor() : openEditor(section))} className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-bold text-black shadow-[0_8px_24px_rgba(249,115,22,0.18)]">
                <Plus size={16} />
                {showForm ? 'Close Form' : 'Add New'}
              </button>
            )}
            {section === 'products' && (
              <button
                type="button"
                onClick={importBundledCatalog}
                disabled={busyAction === 'import-catalog'}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                <Save size={16} />
                {busyAction === 'import-catalog' ? 'Importing Catalog...' : 'Import Uploaded Catalog'}
              </button>
            )}
          </div>
        </div>

        <div className="mt-10 space-y-6">
          <AnimatePresence>{renderForm()}</AnimatePresence>
          {section === 'products' && (
            <div className="grid gap-6 lg:grid-cols-2">
              {products.map((item) => (
                  <MediaCard key={item.id} image={item.image} title={item.name} subtitle={item.description} badges={[item.category, formatGhanaCedis(item.price), `Stock ${item.stockCount ?? 0}`, item.galleryImages?.length ? `${item.galleryImages.length + 1} images` : '', item.sizeOptions?.length ? `${item.sizeOptions.length} sizes` : '', item.featured ? 'Featured' : '', item.inStock ? 'Available' : 'Out']} onEdit={() => openEditor('products', item)} onDelete={() => handleDeleteDoc('products', item.id, 'product')} />
              ))}
            </div>
          )}
          {section === 'hero' && (
            <div className="space-y-5">
              {[...heroBanners].sort((a, b) => a.sortOrder - b.sortOrder).length > 0 ? (
                [...heroBanners].sort((a, b) => a.sortOrder - b.sortOrder).map((item) => (
                  <MediaCard key={item.id} image={item.image} title={item.title} subtitle={item.subtitle} badges={[item.priceLabel || '', item.animationStyle || 'zoom', `${item.bubbleItems?.filter((bubble) => bubble.image || bubble.title).length || 0} bubbles`, item.ctaText, `Sort ${item.sortOrder}`, item.isActive ? 'Active' : 'Inactive']} onEdit={() => openEditor('hero', item)} onDelete={() => handleDeleteDoc('heroBanners', item.id, 'banner')} />
                ))
              ) : (
                <div className="rounded-[1.75rem] border border-white/10 bg-[rgba(24,24,27,0.66)] p-8 text-center backdrop-blur-xl">
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">Hero Area Is Clear</p>
                  <h3 className="mt-3 text-3xl font-black tracking-tight">No hero banners yet</h3>
                  <p className="mt-3 text-white/55">Use Add New to upload your own hero image, text, and bubble products.</p>
                </div>
              )}
            </div>
          )}
          {section === 'collections' && (
            <div className="grid gap-6 lg:grid-cols-2">
              {[...collectionsData].sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99)).map((item) => (
                <MediaCard key={item.id} image={item.image} title={item.title} subtitle={item.description} badges={[item.featured ? 'Featured' : '', `Sort ${item.sortOrder ?? 1}`, `${item.linkedProductIds?.length ?? 0} linked products`]} onEdit={() => openEditor('collections', item)} onDelete={() => handleDeleteDoc('storefrontCollections', item.id, 'collection')} />
              ))}
            </div>
          )}
          {section === 'lookbook' && (
            <div className="grid gap-6 lg:grid-cols-2">
              {[...lookbookItems].sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99)).map((item) => (
                <MediaCard key={item.id} image={item.image} title={item.title || item.caption} subtitle={item.description || item.caption} badges={[item.caption, `Sort ${item.sortOrder ?? 1}`, item.featured ? 'Featured' : '']} onEdit={() => openEditor('lookbook', item)} onDelete={() => handleDeleteDoc('lookbookItems', item.id, 'lookbook item')} />
              ))}
            </div>
          )}
          {section === 'delivery' && (
            <div className="space-y-4">
              {[...deliveryZones].sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99)).map((item) => (
                <div key={item.id} className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[0.03] p-4 sm:p-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold">{item.name}</h3>
                          <p className="text-base sm:text-lg font-semibold text-yellow-300">Delivery Fee: {formatGhanaCedis(item.fee)}</p>
                    <p className={item.active ? 'text-emerald-400' : 'text-slate-400'}>Status: {item.active ? 'Active' : 'Inactive'}</p>
                    <p className="text-sm text-slate-400">{item.eta}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={async () => {
                      setBusyAction(`zone-${item.id}`);
                      try {
                        await updateDoc(doc(db, 'deliveryZones', item.id), { active: !item.active, updatedAt: serverTimestamp() });
                        showNotice('success', 'Delivery zone updated.');
                      } catch (error) {
                        const message = error instanceof Error ? error.message : String(error);
                        showNotice('error', `Could not update delivery zone. ${message}`);
                      } finally {
                        setBusyAction(null);
                      }
                    }} disabled={busyAction === `zone-${item.id}`} className={`rounded-full px-5 py-3 text-sm font-bold disabled:opacity-60 ${item.active ? 'bg-yellow-400 text-black' : 'bg-slate-700 text-white'}`}>{busyAction === `zone-${item.id}` ? 'Saving...' : item.active ? 'Active' : 'Inactive'}</button>
                    <button type="button" disabled={busyAction === `zone-${item.id}`} onClick={() => openEditor('delivery', item)} className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-5 py-3 text-sm font-bold text-black disabled:opacity-60"><Pencil size={14} />Edit</button>
                    <button type="button" disabled={busyAction === `zone-${item.id}`} onClick={() => handleDeleteDoc('deliveryZones', item.id, 'delivery zone')} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"><Trash2 size={14} />Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {section === 'settings' && (
            <form onSubmit={saveSettings} className="rounded-[1.75rem] border border-white/10 bg-[rgba(24,24,27,0.68)] p-4 sm:p-5 backdrop-blur-xl">
              <div className="grid gap-5 md:grid-cols-2">
                <Input label="Store name" value={settings.storeName} onChange={(v) => setSettings({ ...settings, storeName: v })} />
                <Input label="Tagline" value={settings.tagline} onChange={(v) => setSettings({ ...settings, tagline: v })} />
                <Input label="Announcement text" value={settings.announcementText} onChange={(v) => setSettings({ ...settings, announcementText: v })} />
                <Input label="Theme mode label" value={settings.themeModeLabel || ''} onChange={(v) => setSettings({ ...settings, themeModeLabel: v })} />
                <Input label="Base location" value={settings.baseLocation} onChange={(v) => setSettings({ ...settings, baseLocation: v })} />
                <Input label="Free delivery threshold" type="number" value={String(settings.freeDeliveryThreshold)} onChange={(v) => setSettings({ ...settings, freeDeliveryThreshold: Number(v) })} />
                <Input label="Support WhatsApp" value={settings.supportWhatsapp} onChange={(v) => setSettings({ ...settings, supportWhatsapp: v })} />
                <Input label="Mobile Money Number" value={settings.mobileMoneyNumber} onChange={(v) => setSettings({ ...settings, mobileMoneyNumber: v })} />
                <Input label="Mobile Money Name" value={settings.mobileMoneyName} onChange={(v) => setSettings({ ...settings, mobileMoneyName: v })} />
                <Input label="Instagram handle" value={settings.instagramHandle} onChange={(v) => setSettings({ ...settings, instagramHandle: v })} />
              </div>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <TextArea label="Homepage headline" value={settings.homepageHeadline} onChange={(v) => setSettings({ ...settings, homepageHeadline: v })} />
                <TextArea label="Homepage description" value={settings.homepageDescription} onChange={(v) => setSettings({ ...settings, homepageDescription: v })} />
                <Input label="Collections headline" value={settings.collectionsHeadline} onChange={(v) => setSettings({ ...settings, collectionsHeadline: v })} />
                <TextArea label="Collections description" value={settings.collectionsDescription} onChange={(v) => setSettings({ ...settings, collectionsDescription: v })} />
                <Input label="Lookbook headline" value={settings.lookbookHeadline} onChange={(v) => setSettings({ ...settings, lookbookHeadline: v })} />
                <TextArea label="Lookbook description" value={settings.lookbookDescription} onChange={(v) => setSettings({ ...settings, lookbookDescription: v })} />
                <Input label="Payment & delivery headline" value={settings.paymentDeliveryHeadline} onChange={(v) => setSettings({ ...settings, paymentDeliveryHeadline: v })} />
                <TextArea label="Payment & delivery description" value={settings.paymentDeliveryDescription} onChange={(v) => setSettings({ ...settings, paymentDeliveryDescription: v })} />
                <TextArea label="Payment methods text" value={settings.paymentMethodsText} onChange={(v) => setSettings({ ...settings, paymentMethodsText: v })} />
                <TextArea label="Delivery message" value={settings.deliveryMessage} onChange={(v) => setSettings({ ...settings, deliveryMessage: v })} />
              </div>
              <div className="mt-8 border-t border-white/10 pt-6">
                <h3 className="text-xl font-bold text-white">Contact Page Control</h3>
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <Input label="Contact headline line one" value={settings.contactHeadlineLineOne} onChange={(v) => setSettings({ ...settings, contactHeadlineLineOne: v })} />
                  <Input label="Contact headline accent" value={settings.contactHeadlineAccent} onChange={(v) => setSettings({ ...settings, contactHeadlineAccent: v })} />
                  <Input label="Contact email" value={settings.contactEmail} onChange={(v) => setSettings({ ...settings, contactEmail: v })} />
                  <Input label="Contact phone" value={settings.contactPhone} onChange={(v) => setSettings({ ...settings, contactPhone: v })} />
                  <Input label="Contact address" value={settings.contactAddress} onChange={(v) => setSettings({ ...settings, contactAddress: v })} />
                  <Input label="Contact hours" value={settings.contactHours} onChange={(v) => setSettings({ ...settings, contactHours: v })} />
                  <Input label="Contact success headline" value={settings.contactSuccessHeadline} onChange={(v) => setSettings({ ...settings, contactSuccessHeadline: v })} />
                  <Input label="Contact success message" value={settings.contactSuccessMessage} onChange={(v) => setSettings({ ...settings, contactSuccessMessage: v })} />
                  <TextArea label="Contact description" value={settings.contactDescription} onChange={(v) => setSettings({ ...settings, contactDescription: v })} />
                </div>
              </div>
              <div className="mt-8 border-t border-white/10 pt-6">
                <h3 className="text-xl font-bold text-white">About Page Control</h3>
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <Input label="About hero image URL" value={settings.aboutHeroImage} onChange={(v) => setSettings({ ...settings, aboutHeroImage: v })} />
                  <Input label="About hero title" value={settings.aboutHeroTitle} onChange={(v) => setSettings({ ...settings, aboutHeroTitle: v })} />
                  <Input label="About hero accent" value={settings.aboutHeroAccent} onChange={(v) => setSettings({ ...settings, aboutHeroAccent: v })} />
                  <Input label="About hero eyebrow" value={settings.aboutHeroEyebrow} onChange={(v) => setSettings({ ...settings, aboutHeroEyebrow: v })} />
                  <Input label="About story title" value={settings.aboutStoryTitle} onChange={(v) => setSettings({ ...settings, aboutStoryTitle: v })} />
                  <Input label="About image one URL" value={settings.aboutImageOne} onChange={(v) => setSettings({ ...settings, aboutImageOne: v })} />
                  <Input label="About image two URL" value={settings.aboutImageTwo} onChange={(v) => setSettings({ ...settings, aboutImageTwo: v })} />
                  <TextArea label="About story paragraph one" value={settings.aboutStoryParagraphOne} onChange={(v) => setSettings({ ...settings, aboutStoryParagraphOne: v })} />
                  <TextArea label="About story paragraph two" value={settings.aboutStoryParagraphTwo} onChange={(v) => setSettings({ ...settings, aboutStoryParagraphTwo: v })} />
                  <TextArea label="About story paragraph three" value={settings.aboutStoryParagraphThree} onChange={(v) => setSettings({ ...settings, aboutStoryParagraphThree: v })} />
                </div>
                <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  <Input label="Value one title" value={settings.aboutValueOneTitle} onChange={(v) => setSettings({ ...settings, aboutValueOneTitle: v })} />
                  <Input label="Value two title" value={settings.aboutValueTwoTitle} onChange={(v) => setSettings({ ...settings, aboutValueTwoTitle: v })} />
                  <Input label="Value three title" value={settings.aboutValueThreeTitle} onChange={(v) => setSettings({ ...settings, aboutValueThreeTitle: v })} />
                  <TextArea label="Value one description" value={settings.aboutValueOneDescription} onChange={(v) => setSettings({ ...settings, aboutValueOneDescription: v })} />
                  <TextArea label="Value two description" value={settings.aboutValueTwoDescription} onChange={(v) => setSettings({ ...settings, aboutValueTwoDescription: v })} />
                  <TextArea label="Value three description" value={settings.aboutValueThreeDescription} onChange={(v) => setSettings({ ...settings, aboutValueThreeDescription: v })} />
                </div>
                <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                  <Input label="Stat one value" value={settings.aboutStatOneValue} onChange={(v) => setSettings({ ...settings, aboutStatOneValue: v })} />
                  <Input label="Stat one label" value={settings.aboutStatOneLabel} onChange={(v) => setSettings({ ...settings, aboutStatOneLabel: v })} />
                  <Input label="Stat two value" value={settings.aboutStatTwoValue} onChange={(v) => setSettings({ ...settings, aboutStatTwoValue: v })} />
                  <Input label="Stat two label" value={settings.aboutStatTwoLabel} onChange={(v) => setSettings({ ...settings, aboutStatTwoLabel: v })} />
                  <Input label="Stat three value" value={settings.aboutStatThreeValue} onChange={(v) => setSettings({ ...settings, aboutStatThreeValue: v })} />
                  <Input label="Stat three label" value={settings.aboutStatThreeLabel} onChange={(v) => setSettings({ ...settings, aboutStatThreeLabel: v })} />
                  <Input label="Stat four value" value={settings.aboutStatFourValue} onChange={(v) => setSettings({ ...settings, aboutStatFourValue: v })} />
                  <Input label="Stat four label" value={settings.aboutStatFourLabel} onChange={(v) => setSettings({ ...settings, aboutStatFourLabel: v })} />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button type="submit" disabled={busyAction === 'save-settings'} className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-bold text-black disabled:opacity-60"><Save size={16} />{busyAction === 'save-settings' ? 'Saving...' : 'Save Settings'}</button>
              </div>
            </form>
          )}
          {section === 'orders' && (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="rounded-[1.75rem] border border-white/10 bg-[rgba(24,24,27,0.66)] p-5 backdrop-blur-xl">
                  <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-3xl font-bold">{order.shippingAddress.name}</h3>
                      <p className="text-sm text-white/45">Order time: {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : 'Pending sync'}</p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Select disabled={busyAction === `order-${order.id}`} label="Order status" value={order.status} options={['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']} onChange={(v) => updateOrderField(order.id, { status: v as Order['status'] })} />
                      <Select disabled={busyAction === `order-${order.id}`} label="Payment" value={order.paymentStatus || 'Pending'} options={['Pending', 'Paid', 'Part Paid', 'Failed']} onChange={(v) => updateOrderField(order.id, { paymentStatus: v as Order['paymentStatus'] })} />
                      <Select disabled={busyAction === `order-${order.id}`} label="Proof" value={order.paymentProofStatus || 'Not Sent'} options={['Not Sent', 'Received', 'Reviewed']} onChange={(v) => updateOrderField(order.id, { paymentProofStatus: v as Order['paymentProofStatus'] })} />
                      <Select disabled={busyAction === `order-${order.id}`} label="Update status" value={order.orderUpdateStatus || 'Not Sent'} options={['Not Sent', 'Sent']} onChange={(v) => updateOrderField(order.id, { orderUpdateStatus: v as Order['orderUpdateStatus'] })} />
                    </div>
                  </div>
                  <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
                    <div className="space-y-4 rounded-[1.5rem] border border-white/10 bg-[rgba(9,9,11,0.6)] p-5 backdrop-blur-md">
                      <InfoBlock title="Customer Details" lines={[order.shippingAddress.name, order.shippingAddress.phone, order.shippingAddress.address]} />
                      <InfoBlock title="Order Meta" lines={[`Payment: ${order.paymentMethod}`, `Zone: ${order.deliveryZone || `${order.shippingAddress.city}, ${order.shippingAddress.region}`}`, `Order ID: ${order.id}`]} />
                      {order.customerNotes && (
                        <div className="rounded-[1.25rem] border border-white/10 bg-[rgba(39,39,42,0.72)] p-4 backdrop-blur-sm">
                          <p className="mb-2 text-sm font-bold text-orange-400">Customer Note</p>
                          <p className="text-sm leading-7 text-white/75">{order.customerNotes}</p>
                        </div>
                      )}
                      {order.items.map((item, index) => (
                        <div key={`${item.productId}-${index}`} className="flex items-center gap-4 rounded-[1.25rem] border border-white/10 bg-[rgba(39,39,42,0.72)] p-4 backdrop-blur-sm">
                          <img src={item.image} alt={item.name} className="h-20 w-20 rounded-2xl object-cover" />
                          <div className="flex-1">
                            <p className="text-xl font-bold">{item.name}</p>
                              <p className="text-orange-400">Unit Price: {formatGhanaCedis(item.price)}</p>
                            <p className="text-white/45">Qty {item.quantity}</p>
                            {item.selectedSize && <p className="text-xs font-semibold uppercase tracking-widest text-white/55">Size {item.selectedSize}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-4 rounded-[1.5rem] border border-white/10 bg-[rgba(9,9,11,0.6)] p-5 backdrop-blur-md">
                      <Input label="Tracking code" value={order.trackingCode || ''} onChange={(v) => updateOrderField(order.id, { trackingCode: v })} />
                      <Input label="Delivery zone" value={order.deliveryZone || ''} onChange={(v) => updateOrderField(order.id, { deliveryZone: v })} />
                      {busyAction === `order-${order.id}` && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-400">Saving order update...</p>}
                      <div className="rounded-[1.25rem] border border-white/10 bg-[rgba(39,39,42,0.72)] p-4 text-sm text-white/75 backdrop-blur-sm">
                        <p className="mb-2 font-bold text-orange-400">Totals</p>
                        <div className="space-y-2">
                        <div className="flex justify-between"><span>Subtotal</span><span>{formatGhanaCedis(order.subtotal ?? order.total)}</span></div>
                        <div className="flex justify-between"><span>Delivery Fee</span><span>{formatGhanaCedis(order.shipping ?? 0)}</span></div>
                        <div className="flex justify-between"><span>Total</span><span>{formatGhanaCedis(order.total)}</span></div>
                          <div className="flex justify-between"><span>Payment Status</span><span>{order.paymentStatus || 'Pending'}</span></div>
                          <div className="flex justify-between"><span>Tracking Code</span><span>{order.trackingCode || 'Not set'}</span></div>
                        </div>
                      </div>
                      {order.paymentProofUrl && (
                        <a
                          href={order.paymentProofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-[rgba(39,39,42,0.72)] px-5 py-3 text-sm font-bold text-white transition-colors hover:border-orange-500/40 hover:text-orange-400"
                        >
                          View Payment Proof
                        </a>
                      )}
                      {order.status === 'Delivered' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteDoc('orders', order.id, 'delivered order')}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-300 transition-colors hover:bg-red-500/20"
                        >
                          <Trash2 size={14} />
                          Delete Delivered Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {section === 'messages' && (
            <div className="space-y-6">
              {contactMessages.length ? (
                contactMessages.map((message) => (
                  <div key={message.id} className="rounded-[1.75rem] border border-white/10 bg-[rgba(24,24,27,0.66)] p-5 backdrop-blur-xl">
                    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-2xl font-bold">{message.name}</h3>
                        <p className="mt-1 text-sm text-white/55">{message.email}</p>
                        <p className="mt-1 text-sm text-white/45">
                          {message.createdAt?.toDate ? message.createdAt.toDate().toLocaleString() : 'Pending sync'}
                        </p>
                      </div>
                      <div className="inline-flex self-start rounded-full border border-white/10 bg-[rgba(9,9,11,0.55)] px-4 py-2 text-xs font-bold uppercase tracking-widest text-orange-300">
                        {message.status || 'new'}
                      </div>
                    </div>
                    <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
                      <div className="rounded-[1.5rem] border border-white/10 bg-[rgba(9,9,11,0.6)] p-5 backdrop-blur-md">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-400">Customer Message</p>
                        <h4 className="mt-3 text-lg font-bold">{message.subject}</h4>
                        <p className="mt-4 text-sm leading-7 text-white/75">{message.message}</p>
                      </div>
                      <div className="rounded-[1.5rem] border border-white/10 bg-[rgba(9,9,11,0.6)] p-5 backdrop-blur-md">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-400">Admin Reply</p>
                        {message.adminReply && (
                          <div className="mt-3 rounded-[1.25rem] border border-white/10 bg-[rgba(39,39,42,0.72)] p-4 text-sm leading-7 text-white/75">
                            {message.adminReply}
                          </div>
                        )}
                        <div className="mt-4">
                          <TextArea
                            label={message.adminReply ? 'Update reply' : 'Reply message'}
                            value={replyDrafts[message.id] ?? message.adminReply ?? ''}
                            onChange={(value) => setReplyDrafts((current) => ({ ...current, [message.id]: value }))}
                          />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => saveContactReply(message.id)}
                            disabled={busyAction === `message-${message.id}`}
                            className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-bold text-black disabled:opacity-60"
                          >
                            <Reply size={14} />
                            {busyAction === `message-${message.id}` ? 'Sending Reply...' : 'Send Reply'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDoc('contacts', message.id, 'customer message')}
                            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-white"
                          >
                            <Trash2 size={14} />
                            Delete Message
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.75rem] border border-white/10 bg-[rgba(24,24,27,0.66)] p-8 text-center backdrop-blur-xl">
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">Inbox Is Clear</p>
                  <h3 className="mt-3 text-3xl font-black tracking-tight">No customer messages yet</h3>
                  <p className="mt-3 text-white/55">When someone sends a message from Contact Us, it will appear here immediately.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) => (
  <div className="rounded-[1.5rem] border border-white/10 bg-[rgba(24,24,27,0.62)] p-4 backdrop-blur-xl">
    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-400 backdrop-blur-sm"><Icon size={18} /></div>
    <p className="text-4xl font-black">{value}</p>
    <p className="text-sm text-white/45">{label}</p>
  </div>
);

const MediaCard: React.FC<{ image: string; title: string; subtitle: string; badges: string[]; onEdit: () => void; onDelete: () => void | Promise<void> }> = ({ image, title, subtitle, badges, onEdit, onDelete }) => (
  <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[rgba(24,24,27,0.66)] backdrop-blur-xl">
    <div className="grid md:grid-cols-[220px_1fr]">
      <div className="min-h-48 md:min-h-64 bg-black">
        <SafeImage image={image} alt={title} title={title} className="h-full w-full object-cover" />
      </div>
      <div className="p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div><h3 className="text-xl sm:text-3xl font-bold">{title}</h3><p className="mt-2 text-sm sm:text-base text-white/55">{subtitle}</p></div>
          <div className="flex gap-2">
            <button type="button" onClick={onEdit} className="rounded-full border border-white/10 p-3 text-orange-400"><Pencil size={16} /></button>
            <button type="button" onClick={onDelete} className="rounded-full border border-white/10 p-3 text-red-400"><Trash2 size={16} /></button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">{badges.filter(Boolean).map((badge) => <span key={badge} className="rounded-full border border-white/10 bg-[rgba(9,9,11,0.55)] px-3 py-2 text-xs font-semibold text-white/80 backdrop-blur-sm">{badge}</span>)}</div>
      </div>
    </div>
  </div>
);

const SafeImage = ({
  image,
  alt,
  title,
  className,
}: {
  image: string;
  alt: string;
  title: string;
  className: string;
}) => {
  const [failed, setFailed] = useState(false);

  if (!image || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-950 p-4 text-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-orange-400">Image Unavailable</p>
          <p className="mt-2 text-sm text-white/55">{title}</p>
        </div>
      </div>
    );
  }

  return <img src={image} alt={alt} className={className} referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
};

const Input = ({ label, value, onChange, type = 'text', disabled = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; disabled?: boolean }) => (
  <label className="block space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">{label}</span><input disabled={disabled} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-[rgba(9,9,11,0.58)] px-4 py-3 text-sm outline-none backdrop-blur-sm focus:border-orange-500 disabled:opacity-60" /></label>
);

const TextArea = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <label className="block space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">{label}</span><textarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} className="min-h-24 w-full rounded-2xl border border-white/10 bg-[rgba(9,9,11,0.58)] px-4 py-3 text-sm outline-none backdrop-blur-sm focus:border-orange-500" /></label>
);

const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) => (
  <label className="inline-flex items-center gap-3"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-yellow-400" /><span>{label}</span></label>
);

const Select = ({ label, value, options, onChange, disabled = false }: { label: string; value: string; options: string[]; onChange: (value: string) => void; disabled?: boolean }) => (
  <label className="block space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">{label}</span><select disabled={disabled} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-[rgba(9,9,11,0.58)] px-4 py-3 text-sm outline-none backdrop-blur-sm focus:border-orange-500 disabled:opacity-60">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
);

const InfoBlock = ({ title, lines }: { title: string; lines: string[] }) => (
  <div><p className="mb-3 text-sm font-bold text-orange-400">{title}</p><div className="space-y-2 text-white/75">{lines.map((line) => <p key={line}>{line}</p>)}</div></div>
);

const DeleteConfirmModal = ({
  pendingDelete,
  onCancel,
  onConfirm,
}: {
  pendingDelete: { collectionName: string; itemId: string; label: string } | null;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  if (!pendingDelete) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="max-h-[85svh] w-full max-w-sm overflow-y-auto rounded-[1.5rem] border border-white/10 bg-[rgba(39,39,42,0.58)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
          <Trash2 size={20} />
        </div>
        <h3 className="text-2xl font-black tracking-tight">Delete {pendingDelete.label}</h3>
        <p className="mt-3 text-sm leading-6 text-white/60">
          This will permanently remove the {pendingDelete.label} from the admin area and database.
        </p>
        <p className="mt-2 text-sm font-semibold text-red-300">This action cannot be undone.</p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-white/10 bg-[rgba(9,9,11,0.22)] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-zinc-900/60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-full bg-red-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-red-400"
          >
            Delete Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Admin;
