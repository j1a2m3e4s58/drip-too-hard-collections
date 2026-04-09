import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatGhanaCedis(amount: number) {
  return `GH\u20B5 ${amount.toFixed(2)}`;
}
