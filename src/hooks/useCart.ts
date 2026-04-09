import { useState, useEffect } from 'react';
import { Product } from '../types';

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  cartKey: string;
}

const CART_STORAGE_KEY = 'dthc_cart';

const readCartFromStorage = (): CartItem[] => {
  const savedCart = localStorage.getItem(CART_STORAGE_KEY);
  if (!savedCart) return [];

  try {
    const parsed = JSON.parse(savedCart) as Array<CartItem & { selectedSize?: string; cartKey?: string }>;
    return parsed.map((item) => ({
      ...item,
      cartKey: item.cartKey || `${item.id}__${item.selectedSize?.trim() || 'no-size'}`,
    }));
  } catch (e) {
    console.error("Failed to parse cart", e);
    return [];
  }
};

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const getCartKey = (productId: string, selectedSize?: string) =>
    `${productId}__${selectedSize?.trim() || 'no-size'}`;

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

  const addToCart = (product: Product, selectedSize?: string) => {
    setCart(prev => {
      const cartKey = getCartKey(product.id, selectedSize);
      const existing = prev.find(item => item.cartKey === cartKey);
      const maxAllowedQuantity = getMaxAllowedQuantity(product);

      if (maxAllowedQuantity <= 0) {
        return prev;
      }

      let nextCart: CartItem[];

      if (existing) {
        const nextQuantity = Math.min(existing.quantity + 1, maxAllowedQuantity);
        nextCart = prev.map(item => 
          item.cartKey === cartKey ? { ...item, quantity: nextQuantity } : item
        );
      } else {
        nextCart = [...prev, { ...product, quantity: 1, selectedSize, cartKey }];
      }

      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextCart));
      window.dispatchEvent(new Event('dthc-cart-changed'));
      return nextCart;
    });
  };

  const addToCartQuantity = (product: Product, quantity: number, selectedSize?: string) => {
    const safeQuantity = Math.max(1, quantity);

    setCart(prev => {
      const cartKey = getCartKey(product.id, selectedSize);
      const existing = prev.find(item => item.cartKey === cartKey);
      const maxAllowedQuantity = getMaxAllowedQuantity(product);

      if (maxAllowedQuantity <= 0) {
        return prev;
      }

      let nextCart: CartItem[];

      if (existing) {
        const nextQuantity = Math.min(existing.quantity + safeQuantity, maxAllowedQuantity);
        nextCart = prev.map(item => 
          item.cartKey === cartKey ? { ...item, quantity: nextQuantity } : item
        );
      } else {
        nextCart = [...prev, { ...product, quantity: Math.min(safeQuantity, maxAllowedQuantity), selectedSize, cartKey }];
      }

      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextCart));
      window.dispatchEvent(new Event('dthc-cart-changed'));
      return nextCart;
    });
  };

  const removeFromCart = (cartKey: string) => {
    setCart(prev => {
      const nextCart = prev.filter(item => item.cartKey !== cartKey);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextCart));
      window.dispatchEvent(new Event('dthc-cart-changed'));
      return nextCart;
    });
  };

  const updateQuantity = (cartKey: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartKey);
      return;
    }

    setCart(prev => {
      const nextCart = prev.map(item => {
        if (item.cartKey !== cartKey) return item;
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
};
