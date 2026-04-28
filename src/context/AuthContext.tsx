import React, {
  createContext, useContext, useEffect,
  useState, useCallback, useMemo,
} from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

// ─── Context shape ────────────────────────────────────────────────────────────
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetches (or creates) the Firestore profile for a given UID.
   * Falls back to the Google-provided data so the app never shows blank names.
   */
  const fetchProfile = useCallback(async (firebaseUser: User): Promise<void> => {
    const fallback: UserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? '',
      displayName: firebaseUser.displayName ?? 'Employee',
      role: 'employee',
      photoURL: firebaseUser.photoURL ?? undefined,
      status: 'active',
      department: 'General',
    };

    try {
      const ref = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      } else {
        // First login — create the profile document
        try {
          await setDoc(ref, fallback);
        } catch {
          // Firestore unavailable — use the fallback in memory only
        }
        setProfile(fallback);
      }
    } catch {
      // Firestore read failed — show something rather than a blank app
      setProfile(fallback);
    }
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchProfile(firebaseUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user);
  }, [user, fetchProfile]);

  // Stable context value — only re-renders consumers when user/profile/loading change
  const value = useMemo<AuthContextType>(
    () => ({ user, profile, loading, refreshProfile }),
    [user, profile, loading, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useAuth = () => useContext(AuthContext);
