import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatGhanaCedis(amount: number) {
  return `GH\u20B5 ${amount.toFixed(2)}`;
}

export function getVariantStockKey(selectedSize?: string, selectedColor?: string) {
  return `${selectedSize?.trim() || 'no-size'}__${selectedColor?.trim() || 'no-color'}`;
}

export function getVariantStockQuantity(
  variantStock: Record<string, number> | undefined,
  selectedSize?: string,
  selectedColor?: string,
) {
  if (!variantStock) {
    return undefined;
  }

  const candidates = [
    getVariantStockKey(selectedSize, selectedColor),
    getVariantStockKey(selectedSize, undefined),
    getVariantStockKey(undefined, selectedColor),
    getVariantStockKey(undefined, undefined),
  ];

  for (const key of candidates) {
    if (typeof variantStock[key] === 'number') {
      return Math.max(0, variantStock[key]);
    }
  }

  return undefined;
}

export function normalizeVariantStock(variantStock?: Record<string, number>) {
  if (!variantStock) {
    return undefined;
  }

  const entries = Object.entries(variantStock)
    .filter(([key, quantity]) => typeof key === 'string' && Number.isFinite(quantity))
    .map(([key, quantity]) => [key, Math.max(0, Number(quantity))] as const);

  if (!entries.length) {
    return undefined;
  }

  return Object.fromEntries(entries);
}

export function parseVariantStockInput(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, number>>((acc, line) => {
      const [size = '', color = '', qty = ''] = line.split('|').map((item) => item.trim());
      const parsedQty = Number(qty);

      if (!Number.isFinite(parsedQty)) {
        return acc;
      }

      acc[getVariantStockKey(size, color)] = Math.max(0, parsedQty);
      return acc;
    }, {});
}

export function serializeVariantStockInput(variantStock?: Record<string, number>) {
  if (!variantStock) {
    return '';
  }

  return Object.entries(variantStock)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, quantity]) => {
      const [size, color] = key.split('__');
      const sizeLabel = size === 'no-size' ? '' : size;
      const colorLabel = color === 'no-color' ? '' : color;
      return `${sizeLabel}|${colorLabel}|${quantity}`;
    })
    .join('\n');
}
