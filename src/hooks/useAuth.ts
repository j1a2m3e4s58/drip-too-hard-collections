import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, ensureUserProfileDocument } from '../firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          await ensureUserProfileDocument(user);
          // Check if user is admin in Firestore or by email (as defined in rules)
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          const isDefaultAdmin = user.email === 'maxwinflip@gmail.com';
          setIsAdmin(userData?.role === 'admin' || isDefaultAdmin);
        } catch (error) {
          console.error("Error loading auth profile:", error);
          const isDefaultAdmin = user.email === 'maxwinflip@gmail.com';
          setIsAdmin(isDefaultAdmin);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, isAdmin, loading };
}