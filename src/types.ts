export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'Tees' | 'Sneakers' | 'Accessories';
  image: string;
  description: string;
  isNew?: boolean;
  isBestseller?: boolean;
  inStock: boolean;
  stockCount?: number;
  flashSalePrice?: number;
  flashSaleEnd?: any;
  createdAt?: any;
}

export interface Order {
  id: string;
  userId: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  total: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  shippingAddress: {
    name: string;
    phone: string;
    city: string;
    region: string;
    address: string;
  };
  paymentMethod: string;
  createdAt: any;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  imageUrl?: string;
  createdAt: any;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  expiryDate: any;
  isActive: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'user';
  wishlist?: string[]; // Array of product IDs
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  image: string;
  story: string;
}

export interface LookbookItem {
  id: string;
  image: string;
  caption: string;
}
