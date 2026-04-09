const RECENTLY_VIEWED_STORAGE_KEY = 'dthc_recently_viewed';

const readIds = () => {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
    if (!raw) {
      return [] as string[];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch (error) {
    console.error('Failed to read recently viewed items:', error);
    return [] as string[];
  }
};

export const getRecentlyViewedIds = () => readIds();

export const pushRecentlyViewedId = (productId: string) => {
  if (!productId) {
    return;
  }

  const next = [productId, ...readIds().filter((item) => item !== productId)].slice(0, 12);
  localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(next));
};
