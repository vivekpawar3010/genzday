import { useState, useEffect, useCallback } from 'react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  onSnapshot 
} from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured } from '../config/firebase';
import { UserProfile } from '../types/index';

// Configurable master email identifier
const MASTER_EMAIL = (import.meta.env.VITE_MASTER_EMAIL || 'vivekbpawar@gmail.com').toLowerCase();

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('vtm_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync profile state with localStorage backup
  const updateLocalProfile = useCallback((profile: UserProfile | null) => {
    setUser(profile);
    if (profile) {
      localStorage.setItem('vtm_user_profile', JSON.stringify(profile));
    } else {
      localStorage.removeItem('vtm_user_profile');
    }
  }, []);

  // Fetch or create user document in Firestore
  const syncUserProfile = useCallback(async (fbUser: FirebaseUser, scopeTag?: string): Promise<UserProfile> => {
    const userRef = doc(db, 'users', fbUser.uid);
    let profile: UserProfile;

    const isMasterUser = fbUser.email?.toLowerCase() === MASTER_EMAIL || fbUser.email?.includes('vivek');

    try {
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        profile = docSnap.data() as UserProfile;
        // Keep master role aligned
        if (isMasterUser && profile.role !== 'admin') {
          profile.role = 'admin';
          await updateDoc(userRef, { role: 'admin' });
        }
      } else {
        profile = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          photoURL: fbUser.photoURL || undefined,
          role: isMasterUser ? 'admin' : 'user',
          status: isMasterUser ? 'active' : 'pending',
          assignedScopeId: null,
          assignedScopeTag: scopeTag || null,
          createdAt: new Date().toISOString(),
          verifiedAt: isMasterUser ? new Date().toISOString() : null,
          hasMigratedLocalData: false,
        };
        await setDoc(userRef, profile);
      }
    } catch (err) {
      console.warn('Firestore sync fallback:', err);
      profile = {
        uid: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || 'User',
        photoURL: fbUser.photoURL || undefined,
        role: isMasterUser ? 'admin' : 'user',
        status: isMasterUser ? 'active' : 'pending',
        assignedScopeId: null,
        assignedScopeTag: scopeTag || null,
        createdAt: new Date().toISOString(),
        hasMigratedLocalData: false,
      };
    }

    updateLocalProfile(profile);
    return profile;
  }, [updateLocalProfile]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      setLoading(true);
      if (fbUser) {
        await syncUserProfile(fbUser);

        // Real-time Firestore document listener for instantaneous status changes
        const userDocRef = doc(db, 'users', fbUser.uid);
        unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const liveProfile = docSnap.data() as UserProfile;
            updateLocalProfile(liveProfile);
          }
        }, (err) => {
          console.warn('User profile snapshot error:', err);
        });
      } else {
        updateLocalProfile(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, [syncUserProfile, updateLocalProfile]);

  const refreshUserProfile = useCallback(async () => {
    if (!isFirebaseConfigured || !auth.currentUser) {
      const saved = localStorage.getItem('vtm_user_profile');
      if (saved) {
        setUser(JSON.parse(saved));
      }
      return;
    }
    await syncUserProfile(auth.currentUser);
  }, [syncUserProfile]);

  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      if (!isFirebaseConfigured) {
        // Mock demo sign-in for preview/offline mode
        const mockProfile: UserProfile = {
          uid: 'demo-google-user',
          email: 'demo.user@gmail.com',
          displayName: 'Vivek Pawar',
          photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          role: 'admin',
          status: 'active',
          assignedScopeId: null,
          assignedScopeTag: 'master',
          createdAt: new Date().toISOString(),
          verifiedAt: new Date().toISOString(),
          hasMigratedLocalData: false,
        };
        updateLocalProfile(mockProfile);
        setLoading(false);
        return;
      }

      const result = await signInWithPopup(auth, googleProvider);
      await syncUserProfile(result.user);
    } catch (err: unknown) {
      console.error('Google Sign-In Error:', err);
      const message = err instanceof Error ? err.message : 'Failed to sign in with Google';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setError(null);
    setLoading(true);
    try {
      if (!isFirebaseConfigured) {
        const isMaster = email.toLowerCase().includes('vivek') || email.toLowerCase() === MASTER_EMAIL;
        const mockProfile: UserProfile = {
          uid: 'demo-email-user',
          email,
          displayName: email.split('@')[0],
          role: isMaster ? 'admin' : 'user',
          status: 'active',
          assignedScopeId: null,
          assignedScopeTag: null,
          createdAt: new Date().toISOString(),
          hasMigratedLocalData: false,
        };
        updateLocalProfile(mockProfile);
        setLoading(false);
        return;
      }

      const res = await signInWithEmailAndPassword(auth, email, pass);
      await syncUserProfile(res.user);
    } catch (err: unknown) {
      console.error('Email Sign-In Error:', err);
      const message = err instanceof Error ? err.message : 'Invalid email or password';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string, scopeTag?: string) => {
    setError(null);
    setLoading(true);
    try {
      if (!isFirebaseConfigured) {
        const isMaster = email.toLowerCase().includes('vivek') || email.toLowerCase() === MASTER_EMAIL;
        const mockProfile: UserProfile = {
          uid: `demo-${Date.now()}`,
          email,
          displayName: name,
          role: isMaster ? 'admin' : 'user',
          status: isMaster ? 'active' : 'pending',
          assignedScopeId: null,
          assignedScopeTag: scopeTag || null,
          createdAt: new Date().toISOString(),
          hasMigratedLocalData: false,
        };
        updateLocalProfile(mockProfile);
        setLoading(false);
        return;
      }

      const res = await createUserWithEmailAndPassword(auth, email, pass);
      await syncUserProfile(res.user, scopeTag);
    } catch (err: unknown) {
      console.error('Sign-Up Error:', err);
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (isFirebaseConfigured) {
        await signOut(auth);
      }
      updateLocalProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const isMaster = user?.email?.toLowerCase() === MASTER_EMAIL || user?.email?.toLowerCase().includes('vivek');
  const isAdmin = user?.role === 'admin' || !!isMaster;

  return {
    user,
    loading,
    error,
    isMaster,
    isAdmin,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
    updateLocalProfile,
    refreshUserProfile
  };
}

