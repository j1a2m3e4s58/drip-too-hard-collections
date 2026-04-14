import { Product } from '../types';

const PHOTO_SUFFIX = '_2026-04-09_06-15-22.jpg';

const topSizes = ['S', 'M', 'L', 'XL', 'XXL'];
const bottomSizes = ['30', '32', '34', '36', '38', '40'];
const hatSizes = ['One Size'];

type CatalogGroup = {
  start: number;
  end: number;
  category: string;
  prefix: string;
  description: string;
  basePrice: number;
  sizeOptions?: string[];
};

const catalogGroups: CatalogGroup[] = [
  { start: 1, end: 8, category: 'Bottoms', prefix: 'Street Bottom', description: 'Imported premium bottom from your uploaded catalog.', basePrice: 185, sizeOptions: bottomSizes },
  { start: 9, end: 10, category: 'Accessories', prefix: 'Crossbody Bag', description: 'Imported accessory drop from your uploaded catalog.', basePrice: 150, sizeOptions: hatSizes },
  { start: 11, end: 17, category: 'Tops', prefix: 'Premium Top', description: 'Imported premium top from your uploaded catalog.', basePrice: 145, sizeOptions: topSizes },
  { start: 18, end: 22, category: 'Denim', prefix: 'Denim Fit', description: 'Imported denim piece from your uploaded catalog.', basePrice: 220, sizeOptions: bottomSizes },
  { start: 23, end: 27, category: 'Tees', prefix: 'Graphic Tee', description: 'Imported statement tee from your uploaded catalog.', basePrice: 140, sizeOptions: topSizes },
  { start: 28, end: 33, category: 'Accessories', prefix: 'Cap Drop', description: 'Imported headwear from your uploaded catalog.', basePrice: 120, sizeOptions: hatSizes },
  { start: 34, end: 43, category: 'Sets', prefix: 'Sport Layer', description: 'Imported set or jersey-inspired piece from your uploaded catalog.', basePrice: 235, sizeOptions: topSizes },
  { start: 44, end: 53, category: 'Shorts', prefix: 'Summer Short', description: 'Imported short or warm-weather bottom from your uploaded catalog.', basePrice: 170, sizeOptions: bottomSizes },
  { start: 54, end: 56, category: 'Outerwear', prefix: 'Puffer Layer', description: 'Imported outerwear piece from your uploaded catalog.', basePrice: 320, sizeOptions: topSizes },
  { start: 57, end: 61, category: 'Denim', prefix: 'Clean Denim', description: 'Imported denim essential from your uploaded catalog.', basePrice: 210, sizeOptions: bottomSizes },
  { start: 62, end: 72, category: 'Sets', prefix: 'Street Set', description: 'Imported co-ord or matching set from your uploaded catalog.', basePrice: 240, sizeOptions: topSizes },
  { start: 73, end: 90, category: 'Apparel', prefix: 'Catalog Drop', description: 'Imported apparel piece from your uploaded catalog.', basePrice: 165, sizeOptions: topSizes },
];

const featuredNumbers = new Set([1, 5, 12, 23, 27, 35, 40, 54, 62, 71]);
const flashSaleNumbers = new Set([2, 10, 18, 24, 33, 45, 58, 70]);

const getCatalogGroup = (index: number) =>
  catalogGroups.find((group) => index >= group.start && index <= group.end) || catalogGroups[catalogGroups.length - 1];

const buildImportedProduct = (index: number): Product => {
  const group = getCatalogGroup(index);
  const padded = index.toString().padStart(2, '0');
  const price = group.basePrice + ((index - group.start) % 4) * 15;
  const hasFlashSale = flashSaleNumbers.has(index);

  return {
    id: `catalog-photo-${padded}`,
    name: `${group.prefix} ${padded}`,
    price,
    category: group.category,
    image: `/catalog-import/photo_${index}${PHOTO_SUFFIX}`,
    galleryImages: [],
    description: group.description,
    inStock: true,
    stockCount: 8 + (index % 9),
    sizeOptions: group.sizeOptions,
    featured: featuredNumbers.has(index),
    isNew: index % 3 === 0,
    isBestseller: index % 11 === 0,
    flashSalePrice: hasFlashSale ? Math.max(95, price - 20) : 0,
    imageSourceType: 'url',
    imageOriginalUrl: `/catalog-import/photo_${index}${PHOTO_SUFFIX}`,
  };
};

export const importedCatalogProducts: Product[] = Array.from({ length: 90 }, (_, index) => buildImportedProduct(index + 1));

export const importedCatalogIds = new Set(importedCatalogProducts.map((item) => item.id));

const ensureStringArray = (value: unknown, fallback: string[] = []) => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }

  return fallback;
};

const ensureNumber = (value: unknown, fallback = 0) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const ensureBoolean = (value: unknown, fallback = false) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }

  return fallback;
};

const normalizeProductShape = (product: Product): Product => ({
  ...product,
  galleryImages: ensureStringArray(product.galleryImages),
  sizeOptions: ensureStringArray(product.sizeOptions),
  colorOptions: ensureStringArray(product.colorOptions),
  price: ensureNumber(product.price),
  flashSalePrice: product.flashSalePrice === undefined ? undefined : ensureNumber(product.flashSalePrice),
  stockCount: product.stockCount === undefined ? undefined : ensureNumber(product.stockCount),
  viewCount: product.viewCount === undefined ? undefined : ensureNumber(product.viewCount),
  inStock: ensureBoolean(product.inStock, true),
});

export function mergeWithImportedCatalogProducts(products: Product[]) {
  const merged = new Map(importedCatalogProducts.map((item) => [item.id, item]));

  products.forEach((item) => {
    merged.set(item.id, normalizeProductShape({
      ...(merged.get(item.id) || {}),
      ...item,
    } as Product));
  });

  return Array.from(merged.values()).map(normalizeProductShape);
}

export function findImportedCatalogProduct(productId?: string | null) {
  if (!productId) {
    return null;
  }

  const found = importedCatalogProducts.find((item) => item.id === productId);
  return found ? normalizeProductShape(found) : null;
}
