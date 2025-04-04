import create from 'zustand';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase';

interface AuthUser {
  email: string;
  uid: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  clearError: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,

  login: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });
      await signInWithEmailAndPassword(auth, email, password);
      // Auth state listener will handle setting the user state
    } catch (error: any) {
      console.error('Login error:', error);
      set({
        error: error.message || 'Failed to login',
        loading: false
      });
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
      // Auth state listener will handle clearing the user state
    } catch (error: any) {
      console.error('Logout error:', error);
      set({ error: error.message || 'Failed to logout' });
    }
  },

  signup: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });
      await createUserWithEmailAndPassword(auth, email, password);
      // Auth state listener will handle setting the user state
    } catch (error: any) {
      console.error('Signup error:', error);
      set({
        error: error.message || 'Failed to create account',
        loading: false
      });
    }
  },

  clearError: () => set({ error: null })
}));

// Setup auth state listener outside the store
onAuthStateChanged(auth, (firebaseUser) => {
  if (firebaseUser) {
    const user: AuthUser = {
      email: firebaseUser.email || '',
      uid: firebaseUser.uid
    };
    useAuth.setState({
      isAuthenticated: true,
      user,
      loading: false
    });
  } else {
    useAuth.setState({
      isAuthenticated: false,
      user: null,
      loading: false
    });
  }
});