import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot, setDoc } from 'firebase/firestore';
import { db, auth, ensureUserProfileDocument } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { UserProfile } from '../types';

const LOCAL_WISHLIST_KEY = 'dthc_guest_wishlist';

const readLocalWishlist = () => {
  if (typeof window === 'undefined') {
    return [] as string[];
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_WISHLIST_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const writeLocalWishlist = (wishlist: string[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(LOCAL_WISHLIST_KEY, JSON.stringify(wishlist));
};

export const useWishlist = () => {
  const [user] = useAuthState(auth);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWishlist(readLocalWishlist());
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as UserProfile;
        setWishlist(data.wishlist || []);
      } else {
        setWishlist([]);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const syncGuestWishlist = async () => {
      const guestWishlist = readLocalWishlist();
      if (!guestWishlist.length) {
        return;
      }

      try {
        await ensureUserProfileDocument(user);
        await setDoc(
          doc(db, 'users', user.uid),
          {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            role: 'user',
            wishlist: Array.from(new Set([...(wishlist || []), ...guestWishlist])),
          },
          { merge: true },
        );
        writeLocalWishlist([]);
      } catch (error) {
        console.error('Error syncing guest wishlist:', error);
      }
    };

    void syncGuestWishlist();
  }, [user]);

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      const current = readLocalWishlist();
      const next = current.includes(productId)
        ? current.filter((item) => item !== productId)
        : [...current, productId];
      writeLocalWishlist(next);
      setWishlist(next);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const isInWishlist = wishlist.includes(productId);

    try {
      await ensureUserProfileDocument(user);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          role: 'user',
          wishlist: isInWishlist ? [] : [productId]
        }, { merge: true });
        return;
      }

      if (isInWishlist) {
        await updateDoc(userRef, {
          wishlist: arrayRemove(productId)
        });
      } else {
        await updateDoc(userRef, {
          wishlist: arrayUnion(productId)
        });
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
    }
  };

  return { wishlist, toggleWishlist, loading };
};
