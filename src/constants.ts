import { Product, Collection, LookbookItem } from './types';

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Oversized Graphic Tee - Midnight',
    price: 150,
    category: 'Tees',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800',
    description: 'Heavyweight cotton oversized tee with custom DTHC back print.',
    isNew: true,
    inStock: true,
  },
  {
    id: '2',
    name: 'DTHC Retro High Sneakers',
    price: 450,
    category: 'Sneakers',
    image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=800',
    description: 'Classic high-top silhouette with premium leather and suede panels.',
    isBestseller: true,
    inStock: true,
  },
  {
    id: '3',
    name: 'Cuban Link Chain - Silver',
    price: 120,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800',
    description: '12mm stainless steel cuban link chain.',
    inStock: true,
  },
  {
    id: '4',
    name: 'Distressed Denim Jacket',
    price: 320,
    category: 'Tees', // Using Tees as a general category for now or could add more
    image: 'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?auto=format&fit=crop&q=80&w=800',
    description: 'Vintage wash distressed denim jacket with DTHC branding.',
    inStock: true,
  },
  {
    id: '5',
    name: 'DTHC Logo Cap - Black',
    price: 85,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=800',
    description: 'Embroidered logo 6-panel cap.',
    isNew: true,
    inStock: true,
  },
  {
    id: '6',
    name: 'Urban Runner V1',
    price: 380,
    category: 'Sneakers',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
    description: 'Lightweight breathable mesh runners for the city streets.',
    isBestseller: true,
    inStock: true,
  },
  {
    id: '7',
    name: 'Leather Utility Belt',
    price: 95,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1624222247344-550fb8ec973d?auto=format&fit=crop&q=80&w=800',
    description: 'Genuine leather belt with tactical buckle.',
    inStock: true,
  },
  {
    id: '8',
    name: 'Essential White Tee',
    price: 110,
    category: 'Tees',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800',
    description: 'The perfect white tee. 240gsm cotton.',
    inStock: true,
  }
];

export const COLLECTIONS: Collection[] = [
  {
    id: 'c1',
    title: 'Accra Nights',
    description: 'Inspired by the vibrant energy of Accra after dark.',
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=1200',
    story: 'Accra Nights is a tribute to the neon lights and the rhythmic pulse of the city. We used reflective materials and deep purples to capture the essence of the night.'
  },
  {
    id: 'c2',
    title: 'Concrete Jungle',
    description: 'Streetwear built for the urban explorer.',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1200',
    story: 'Concrete Jungle focuses on utility and durability. Cargo pockets, heavy-duty fabrics, and earthy tones define this collection.'
  }
];

export const LOOKBOOK: LookbookItem[] = [
  { id: 'l1', image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=800', caption: 'Midnight Tee + Distressed Denim' },
  { id: 'l2', image: 'https://images.unsplash.com/photo-1516257984877-a03a80476661?auto=format&fit=crop&q=80&w=800', caption: 'Urban Runner V1 in Action' },
  { id: 'l3', image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=800', caption: 'Accessories Highlight' },
  { id: 'l4', image: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&q=80&w=800', caption: 'Full DTHC Fit' },
];
