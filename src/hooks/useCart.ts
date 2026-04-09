import { useState, useEffect } from 'react';
import { Product } from '../types';

export interface CartItem extends Product {
  quantity: number;
<<<<<<< HEAD
  selectedSize?: string;
  cartKey: string;
=======
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
}

const CART_STORAGE_KEY = 'dthc_cart';

const readCartFromStorage = (): CartItem[] => {
  const savedCart = localStorage.getItem(CART_STORAGE_KEY);
  if (!savedCart) return [];

  try {
<<<<<<< HEAD
    const parsed = JSON.parse(savedCart) as Array<CartItem & { selectedSize?: string; cartKey?: string }>;
    return parsed.map((item) => ({
      ...item,
      cartKey: item.cartKey || `${item.id}__${item.selectedSize?.trim() || 'no-size'}`,
    }));
=======
    return JSON.parse(savedCart);
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
  } catch (e) {
    console.error("Failed to parse cart", e);
    return [];
  }
};

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);

<<<<<<< HEAD
  const getCartKey = (productId: string, selectedSize?: string) =>
    `${productId}__${selectedSize?.trim() || 'no-size'}`;

=======
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
  useEffect(() => {
    setCart(readCartFromStorage());
  }, []);

  useEffect(() => {
    const handleStorageSync = () => {
      setCart(readCartFromStorage());
    };

    window.addEventListener('storage', handleStorageSync);
    window.addEventListener('focus', handleStorageSync);
    window.addEventListener('visibilitychange', handleStorageSync);

    return () => {
      window.removeEventListener('storage', handleStorageSync);
      window.removeEventListener('focus', handleStorageSync);
      window.removeEventListener('visibilitychange', handleStorageSync);
    };
  }, []);

  const getMaxAllowedQuantity = (product: Product | CartItem) => {
    if (!product.inStock) return 0;
    if (product.stockCount === undefined) return Number.MAX_SAFE_INTEGER;
    return Math.max(0, product.stockCount);
  };

  const syncCart = (nextCart: CartItem[]) => {
    setCart(nextCart);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextCart));
  };

<<<<<<< HEAD
  const addToCart = (product: Product, selectedSize?: string) => {
    setCart(prev => {
      const cartKey = getCartKey(product.id, selectedSize);
      const existing = prev.find(item => item.cartKey === cartKey);
=======
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
      const maxAllowedQuantity = getMaxAllowedQuantity(product);

      if (maxAllowedQuantity <= 0) {
        return prev;
      }

      let nextCart: CartItem[];

      if (existing) {
        const nextQuantity = Math.min(existing.quantity + 1, maxAllowedQuantity);
        nextCart = prev.map(item => 
<<<<<<< HEAD
          item.cartKey === cartKey ? { ...item, quantity: nextQuantity } : item
        );
      } else {
        nextCart = [...prev, { ...product, quantity: 1, selectedSize, cartKey }];
=======
          item.id === product.id ? { ...item, quantity: nextQuantity } : item
        );
      } else {
        nextCart = [...prev, { ...product, quantity: 1 }];
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
      }

      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextCart));
      window.dispatchEvent(new Event('dthc-cart-changed'));
      return nextCart;
    });
  };

<<<<<<< HEAD
  const addToCartQuantity = (product: Product, quantity: number, selectedSize?: string) => {
    const safeQuantity = Math.max(1, quantity);

    setCart(prev => {
      const cartKey = getCartKey(product.id, selectedSize);
      const existing = prev.find(item => item.cartKey === cartKey);
=======
  const addToCartQuantity = (product: Product, quantity: number) => {
    const safeQuantity = Math.max(1, quantity);

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
      const maxAllowedQuantity = getMaxAllowedQuantity(product);

      if (maxAllowedQuantity <= 0) {
        return prev;
      }

      let nextCart: CartItem[];

      if (existing) {
        const nextQuantity = Math.min(existing.quantity + safeQuantity, maxAllowedQuantity);
        nextCart = prev.map(item => 
<<<<<<< HEAD
          item.cartKey === cartKey ? { ...item, quantity: nextQuantity } : item
        );
      } else {
        nextCart = [...prev, { ...product, quantity: Math.min(safeQuantity, maxAllowedQuantity), selectedSize, cartKey }];
=======
          item.id === product.id ? { ...item, quantity: nextQuantity } : item
        );
      } else {
        nextCart = [...prev, { ...product, quantity: Math.min(safeQuantity, maxAllowedQuantity) }];
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
      }

      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextCart));
      window.dispatchEvent(new Event('dthc-cart-changed'));
      return nextCart;
    });
  };

<<<<<<< HEAD
  const removeFromCart = (cartKey: string) => {
    setCart(prev => {
      const nextCart = prev.filter(item => item.cartKey !== cartKey);
=======
  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const nextCart = prev.filter(item => item.id !== productId);
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextCart));
      window.dispatchEvent(new Event('dthc-cart-changed'));
      return nextCart;
    });
  };

<<<<<<< HEAD
  const updateQuantity = (cartKey: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartKey);
=======
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
      return;
    }

    setCart(prev => {
      const nextCart = prev.map(item => {
<<<<<<< HEAD
        if (item.cartKey !== cartKey) return item;
=======
        if (item.id !== productId) return item;
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
        const maxAllowedQuantity = getMaxAllowedQuantity(item);
        return { ...item, quantity: Math.min(quantity, maxAllowedQuantity) };
      });

      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextCart));
      window.dispatchEvent(new Event('dthc-cart-changed'));
      return nextCart;
    });
  };

  const clearCart = () => {
    syncCart([]);
    window.dispatchEvent(new Event('dthc-cart-changed'));
  };

  useEffect(() => {
    const handleCartChanged = () => {
      setCart(readCartFromStorage());
    };

    window.addEventListener('dthc-cart-changed', handleCartChanged);

    return () => {
      window.removeEventListener('dthc-cart-changed', handleCartChanged);
    };
  }, []);

  const total = cart.reduce((sum, item) => sum + (item.flashSalePrice || item.price) * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return { cart, addToCart, addToCartQuantity, removeFromCart, updateQuantity, clearCart, total, itemCount };
<<<<<<< HEAD
};
=======
};
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
