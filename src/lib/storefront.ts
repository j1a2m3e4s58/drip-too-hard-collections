import {
  Collection,
  DeliveryZone,
  HeroBanner,
  LookbookItem,
  StoreSettings,
} from '../types';

export const STOREFRONT_SETTINGS_DOC = 'storefront/settings';

export const defaultStoreSettings: Omit<StoreSettings, 'id'> = {
  storeName: 'DTHC',
  tagline: 'Drip Too Hard Collections',
  announcementText: 'New season drops are live now.',
  homepageHeadline: 'Clear premium streetwear for every sharp Ghana fit.',
  homepageDescription:
    "Elevate your street game with premium essentials, standout collections, and fast delivery across Ghana.",
  collectionsHeadline: 'Collections',
  collectionsDescription:
    'Every drop is a chapter. Explore the stories and inspirations behind our seasonal collections.',
  lookbookHeadline: 'Lookbook',
  lookbookDescription:
    'Streetwear fits and drip inspiration. See how the community is rocking DTHC.',
  paymentDeliveryHeadline: 'Payment & Delivery',
  paymentDeliveryDescription:
    'Everything customers need to know about payments, delivery, and what to expect after checkout.',
  baseLocation: 'Accra, Ghana',
  freeDeliveryThreshold: 300,
  supportWhatsapp: '233000000000',
  mobileMoneyNumber: '0534206256',
  mobileMoneyName: 'Deborah Osardu',
  instagramHandle: 'DTHC_Accra',
  paymentMethodsText:
    'We accept Mobile Money, bank transfer, and supported debit or credit cards.',
  deliveryMessage:
    'Delivery pricing follows the selected active delivery zone and updates automatically for customers.',
  contactHeadlineLineOne: 'Get In',
  contactHeadlineAccent: 'Touch',
  contactDescription:
    'Have a question about a drop? Need help with an order? Our team is ready to assist you.',
  contactEmail: 'support@dthc.com',
  contactPhone: '+233 24 000 0000',
  contactAddress: 'Osu, Accra, Ghana',
  contactHours: 'Mon - Sat: 9AM - 8PM',
  contactSuccessHeadline: 'Message Sent',
  contactSuccessMessage: "We'll get back to you within 24 hours.",
  aboutHeroImage: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=1920',
  aboutHeroTitle: 'The',
  aboutHeroAccent: 'Culture',
  aboutHeroEyebrow: 'Curating Streetwear Excellence Since 2024',
  aboutStoryTitle: 'Our Story',
  aboutStoryParagraphOne:
    "Drip Too Hard Collections (DTHC) was born from a simple observation: the streets of Accra were hungry for authentic, high-quality streetwear that didn't compromise on style or substance.",
  aboutStoryParagraphTwo:
    `What started as a small curation of premium tees has evolved into a full-scale fashion movement. We don't just sell clothes; we curate a lifestyle that celebrates boldness, creativity, and the relentless pursuit of the "perfect drip."`,
  aboutStoryParagraphThree:
    'Every piece in our collection is handpicked or designed with the modern trendsetter in mind. We bridge the gap between global fashion trends and local street culture.',
  aboutImageOne: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800',
  aboutImageTwo: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=800',
  aboutValueOneTitle: 'Authenticity',
  aboutValueOneDescription: 'We only deal in 100% authentic gear. No fakes, no compromises.',
  aboutValueTwoTitle: 'Community',
  aboutValueTwoDescription: 'DTHC is for the people. We support local artists and creators.',
  aboutValueThreeTitle: 'Global Vision',
  aboutValueThreeDescription: 'Bringing world-class fashion to the heart of West Africa.',
  aboutStatOneValue: '10K+',
  aboutStatOneLabel: 'Happy Clients',
  aboutStatTwoValue: '500+',
  aboutStatTwoLabel: 'Unique Drops',
  aboutStatThreeValue: '16',
  aboutStatThreeLabel: 'Regions Served',
  aboutStatFourValue: '24/7',
  aboutStatFourLabel: 'Support',
  themeModeLabel: 'Light',
};

export const defaultHeroBanners: HeroBanner[] = [];

export const defaultCollections: Collection[] = [];

export const defaultLookbook: LookbookItem[] = [];

export const defaultDeliveryZones: DeliveryZone[] = [
  { id: 'accra', name: 'Accra', fee: 20, eta: '1 - 2 Business Days', active: true, sortOrder: 1 },
  { id: 'kumasi', name: 'Kumasi', fee: 30, eta: '2 - 3 Business Days', active: true, sortOrder: 2 },
];

const LEGACY_DEMO_IMAGE_MARKERS = [
  'photo-1552374196-1ab2a1c593e8',
  'photo-1503342217505-b0a15ec3261c',
  'photo-1515886657613-9f3515b0c78f',
  'photo-1516257984877-a03a80476661',
  'photo-1523398002811-999ca8dec234',
  'photo-1523381210434-271e8be1f52b',
];

export function isLegacyDemoImageUrl(value?: string) {
  const normalized = (value || '').trim();
  return !!normalized && LEGACY_DEMO_IMAGE_MARKERS.some((marker) => normalized.includes(marker));
}

export function sanitizeAdminManagedImage(value?: string) {
  return isLegacyDemoImageUrl(value) ? '' : (value || '');
}

const LEGACY_DEMO_TEXT_MARKERS = [
  'RSHTFBFDG',
  'FGDFGFD',
];

export function isLegacyDemoText(value?: string) {
  const normalized = (value || '').trim().toUpperCase();
  return !!normalized && LEGACY_DEMO_TEXT_MARKERS.some((marker) => normalized.includes(marker));
}

export function isValidHeroBannerContent(item: {
  image?: string;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
}) {
  const image = sanitizeAdminManagedImage(item.image);
  const title = (item.title || '').trim();
  const subtitle = (item.subtitle || '').trim();
  const eyebrow = (item.eyebrow || '').trim();

  if (isLegacyDemoText(title) || isLegacyDemoText(subtitle) || isLegacyDemoText(eyebrow)) {
    return false;
  }

  return Boolean(image);
}

export function sortByOrder<T extends { sortOrder?: number }>(items: T[]) {
  return [...items].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
}

export function normalizeGoogleDriveUrl(rawUrl: string) {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return '';
  }

  const fileMatch =
    trimmed.match(/\/file\/d\/([^/]+)/) ||
    trimmed.match(/[?&]id=([^&]+)/) ||
    trimmed.match(/\/d\/([^/]+)/);

  if (!fileMatch?.[1]) {
    return trimmed;
  }

  return `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`;
}
