export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  galleryImages?: string[];
  description: string;
  isNew?: boolean;
  isBestseller?: boolean;
  featured?: boolean;
  inStock: boolean;
  stockCount?: number;
  flashSalePrice?: number;
  flashSaleEnd?: any;
  sizeOptions?: string[];
  colorOptions?: string[];
  imageSourceType?: 'url' | 'upload' | 'drive';
  imageOriginalUrl?: string;
  imageStoragePath?: string;
  viewCount?: number;
  createdAt?: any;
  updatedAt?: any;
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
    selectedSize?: string;
    selectedColor?: string;
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
  paymentStatus?: 'Pending' | 'Paid' | 'Part Paid' | 'Failed';
  paymentProofStatus?: 'Not Sent' | 'Received' | 'Reviewed';
  orderUpdateStatus?: 'Not Sent' | 'Sent';
  trackingCode?: string;
  deliveryZone?: string;
  customerNotes?: string;
  subtotal?: number;
  shipping?: number;
  paymentProofUrl?: string;
  createdAt: any;
  updatedAt?: any;
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
  featured?: boolean;
  sortOrder?: number;
  ctaText?: string;
  linkedProductIds?: string[];
  imageSourceType?: 'url' | 'upload' | 'drive';
  imageOriginalUrl?: string;
  imageStoragePath?: string;
}

export interface LookbookItem {
  id: string;
  image: string;
  title?: string;
  caption: string;
  description?: string;
  sortOrder?: number;
  featured?: boolean;
  ctaText?: string;
  ctaLink?: string;
  linkedProductIds?: string[];
  imageSourceType?: 'url' | 'upload' | 'drive';
  imageOriginalUrl?: string;
  imageStoragePath?: string;
}

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  eyebrow?: string;
  priceLabel?: string;
  animationStyle?: 'fade' | 'zoom' | 'slide-left' | 'slide-up' | 'float' | 'spotlight';
  ctaText: string;
  ctaLink: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
  targetProductId?: string;
  bubbleItems?: {
    image: string;
    title: string;
    price: string;
    productId?: string;
  }[];
  imageSourceType?: 'url' | 'upload' | 'drive';
  imageOriginalUrl?: string;
  imageStoragePath?: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  eta: string;
  notes?: string;
  active: boolean;
  sortOrder?: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status?: 'new' | 'read' | 'replied';
  adminReply?: string;
  replyHistory?: {
    sender: 'customer' | 'admin';
    body: string;
    createdAt?: any;
  }[];
  createdAt?: any;
  repliedAt?: any;
  updatedAt?: any;
}

export interface StoreSettings {
  id: string;
  storeName: string;
  tagline: string;
  announcementText: string;
  homepageHeadline: string;
  homepageDescription: string;
  collectionsHeadline: string;
  collectionsDescription: string;
  lookbookHeadline: string;
  lookbookDescription: string;
  paymentDeliveryHeadline: string;
  paymentDeliveryDescription: string;
  baseLocation: string;
  freeDeliveryThreshold: number;
  supportWhatsapp: string;
  mobileMoneyNumber: string;
  mobileMoneyName: string;
  instagramHandle: string;
  paymentMethodsText: string;
  deliveryMessage: string;
  contactHeadlineLineOne: string;
  contactHeadlineAccent: string;
  contactDescription: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  contactHours: string;
  contactSuccessHeadline: string;
  contactSuccessMessage: string;
  aboutHeroImage: string;
  aboutHeroTitle: string;
  aboutHeroAccent: string;
  aboutHeroEyebrow: string;
  aboutStoryTitle: string;
  aboutStoryParagraphOne: string;
  aboutStoryParagraphTwo: string;
  aboutStoryParagraphThree: string;
  aboutImageOne: string;
  aboutImageTwo: string;
  aboutValueOneTitle: string;
  aboutValueOneDescription: string;
  aboutValueTwoTitle: string;
  aboutValueTwoDescription: string;
  aboutValueThreeTitle: string;
  aboutValueThreeDescription: string;
  aboutStatOneValue: string;
  aboutStatOneLabel: string;
  aboutStatTwoValue: string;
  aboutStatTwoLabel: string;
  aboutStatThreeValue: string;
  aboutStatThreeLabel: string;
  aboutStatFourValue: string;
  aboutStatFourLabel: string;
  themeModeLabel?: string;
}
