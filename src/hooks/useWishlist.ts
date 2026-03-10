import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot, setDoc } from 'firebase/firestore';
import { db, auth, ensureUserProfileDocument } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { UserProfile } from '../types';

export const useWishlist = () => {
  const [user] = useAuthState(auth);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWishlist([]);
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

  const toggleWishlist = async (productId: string) => {
    if (!user) return;

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