import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc, getDoc, updateDoc, query, where, collection, getDocs, deleteDoc, orderBy, limit as firestoreLimit, serverTimestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAdmin?: boolean;
  isBanned?: boolean;
}

class FirebaseAuthService {
  async signUp(email: string, password: string, displayName: string): Promise<{ user: User }> {
    try {
      await setPersistence(auth, browserLocalPersistence);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update profile with display name
      await updateProfile(firebaseUser, {
        displayName: displayName,
      });

      const isAdmin = email === 'surotember@gmail.com' || displayName === 'RabbitMeowAdmin';

      // Create user document in Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: displayName,
        photoURL: firebaseUser.photoURL || null,
        isAdmin: isAdmin,
        isBanned: false,
        createdAt: new Date().toISOString(),
      });

      return {
        user: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: displayName,
          photoURL: firebaseUser.photoURL,
          isAdmin: isAdmin,
          isBanned: false,
        },
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign up');
    }
  }

  async signIn(email: string, password: string): Promise<{ user: User }> {
    try {
      await setPersistence(auth, browserLocalPersistence);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const isAdmin = firebaseUser.email === 'surotember@gmail.com' || firebaseUser.displayName === 'RabbitMeowAdmin';
      
      // Ensure user document exists in Firestore
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userRef);
      let userData = userDoc.exists() ? userDoc.data() : null;

      if (!userData) {
        // Create the missing document
        userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anonymous',
          photoURL: firebaseUser.photoURL || null,
          isAdmin: isAdmin,
          isBanned: false,
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, userData);
      } else if (isAdmin && !userData.isAdmin) {
        // Update admin status if it's missing in Firestore
        await updateDoc(userRef, { isAdmin: true });
        userData.isAdmin = true;
      }

      return {
        user: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: userData.displayName || firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          isAdmin: userData.isAdmin || false,
          isBanned: userData.isBanned || false,
        },
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in');
    }
  }

  async signInByUsername(username: string, password: string): Promise<{ user: User }> {
    try {
      await setPersistence(auth, browserLocalPersistence);
      
      // Query Firestore to find user by displayName (username)
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('displayName', '==', username));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('User not found');
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as User;
      
      // Now sign in with the email
      if (!userData.email) {
        throw new Error('User email not found');
      }

      const userCredential = await signInWithEmailAndPassword(auth, userData.email, password);
      const firebaseUser = userCredential.user;

      const isAdmin = firebaseUser.email === 'surotember@gmail.com' || firebaseUser.displayName === 'RabbitMeowAdmin';
      
      // We already have userData from the initial query, but let's ensure it's up to date
      if (isAdmin && !userData.isAdmin) {
        await updateDoc(doc(db, 'users', firebaseUser.uid), { isAdmin: true });
        userData.isAdmin = true;
      }

      return {
        user: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          isAdmin: userData.isAdmin || false,
          isBanned: userData.isBanned || false,
        },
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in with username');
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign out');
    }
  }

  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const isAdmin = firebaseUser.email === 'surotember@gmail.com' || firebaseUser.displayName === 'RabbitMeowAdmin';
        
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.exists() ? userDoc.data() : {};
          
          callback({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            isAdmin: isAdmin || userData.isAdmin || false,
            isBanned: userData.isBanned || false,
          });
        } catch (error) {
          console.error('Error fetching user data in onAuthStateChanged:', error);
          callback({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            isAdmin: isAdmin,
            isBanned: false,
          });
        }
      } else {
        callback(null);
      }
    });
  }

  async updateProfile(updates: { displayName?: string; photoURL?: string }): Promise<User> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No user is currently signed in');
    }

    try {
      await updateProfile(currentUser, updates);

      // Update Firestore document
      await updateDoc(doc(db, 'users', currentUser.uid), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      return {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile');
    }
  }

  async updateDisplayName(displayName: string): Promise<User> {
    return this.updateProfile({ displayName });
  }

  isAuthenticated(): boolean {
    return !!auth.currentUser;
  }

  async checkUsername(username: string): Promise<{ available: boolean; message: string }> {
    try {
      // Query Firestore to check if username already exists
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('displayName', '==', username));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Username is available
        return {
          available: true,
          message: 'Username is available'
        };
      } else {
        // Username is already taken
        return {
          available: false,
          message: 'Username is already taken'
        };
      }
    } catch (error: any) {
      console.error('Error checking username availability:', error);
      
      let errorMessage = 'Failed to check username availability';
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied: Check Firestore security rules';
      } else if (error.code === 'not-found') {
        errorMessage = 'Firestore database not initialized';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Firestore service temporarily unavailable';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('Detailed error:', { code: error.code, message: error.message });
      throw new Error(errorMessage);
    }
  }

  getStoredUser(): User | null {
    const currentUser = auth.currentUser;
    if (currentUser) {
      return {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
      };
    }
    return null;
  }

  async getCurrentUserData(): Promise<User | null> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return null;
    }

    const isAdmin = currentUser.email === 'surotember@gmail.com' || currentUser.displayName === 'RabbitMeowAdmin';

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        if (isAdmin && !userData.isAdmin) {
          await updateDoc(userRef, { isAdmin: true });
          userData.isAdmin = true;
        }
        return userData;
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }

    return {
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName,
      photoURL: currentUser.photoURL,
      isAdmin: isAdmin,
      isBanned: false,
    };
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    throw new Error('Password change not yet implemented');
  }

  async deleteAccount(password: string): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No user is currently signed in');
    }

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        deletedAt: new Date().toISOString(),
        deleted: true,
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete account');
    }
  }

  async changeEmail(newEmail: string): Promise<User> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No user is currently signed in');
    }

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        email: newEmail,
        updatedAt: new Date().toISOString(),
      });

      return {
        uid: currentUser.uid,
        email: newEmail,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to change email');
    }
  }

  // Watchlist Methods
  async getWatchlist(): Promise<any[]> {
    const currentUser = auth.currentUser;
    if (!currentUser) return [];

    try {
      const watchlistRef = collection(db, 'users', currentUser.uid, 'watchlist');
      const q = query(watchlistRef, orderBy('addedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting watchlist:', error);
      return [];
    }
  }

  async addToWatchlist(media: any): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    try {
      const mediaId = String(media.id || media.media_id);
      const watchlistRef = doc(db, 'users', currentUser.uid, 'watchlist', mediaId);
      await setDoc(watchlistRef, {
        media_id: mediaId,
        title: media.title || media.name || 'Unknown',
        poster_path: media.poster_path || null,
        backdrop_path: media.backdrop_path || null,
        media_type: media.media_type || 'unknown',
        overview: media.overview || '',
        rating: media.vote_average || 0,
        addedAt: serverTimestamp(),
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to add to watchlist');
    }
  }

  async removeFromWatchlist(mediaId: string): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    try {
      const watchlistRef = doc(db, 'users', currentUser.uid, 'watchlist', String(mediaId));
      await deleteDoc(watchlistRef);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to remove from watchlist');
    }
  }

  // Favorites Methods
  async getFavorites(): Promise<any[]> {
    const currentUser = auth.currentUser;
    if (!currentUser) return [];

    try {
      const favoritesRef = collection(db, 'users', currentUser.uid, 'favorites');
      const q = query(favoritesRef, orderBy('addedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  async addToFavorites(media: any): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    try {
      const mediaId = String(media.id || media.media_id);
      const favoritesRef = doc(db, 'users', currentUser.uid, 'favorites', mediaId);
      await setDoc(favoritesRef, {
        media_id: mediaId,
        title: media.title || media.name || 'Unknown',
        poster_path: media.poster_path || null,
        backdrop_path: media.backdrop_path || null,
        media_type: media.media_type || 'unknown',
        overview: media.overview || '',
        rating: media.vote_average || 0,
        addedAt: serverTimestamp(),
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to add to favorites');
    }
  }

  async removeFromFavorites(mediaId: string): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    try {
      const favoritesRef = doc(db, 'users', currentUser.uid, 'favorites', String(mediaId));
      await deleteDoc(favoritesRef);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to remove from favorites');
    }
  }

  // Watch History Methods (Migration to Firestore)
  async getWatchHistory(limitCount: number = 20): Promise<{ items: any[]; hasMore: boolean }> {
    const currentUser = auth.currentUser;
    if (!currentUser) return { items: [], hasMore: false };

    try {
      const historyRef = collection(db, 'users', currentUser.uid, 'watchHistory');
      const q = query(historyRef, orderBy('updatedAt', 'desc'), firestoreLimit(limitCount));
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { items, hasMore: items.length === limitCount };
    } catch (error) {
      console.error('Error getting watch history:', error);
      return { items: [], hasMore: false };
    }
  }

  async addToWatchHistory(media: any, watchPosition: number, duration: number, season?: number, episode?: number): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const mediaId = String(media.id || media.media_id);
      const docId = media.media_type === 'tv' ? `${mediaId}_s${season}_e${episode}` : mediaId;
      const historyRef = doc(db, 'users', currentUser.uid, 'watchHistory', docId);
      
      await setDoc(historyRef, {
        media_id: mediaId,
        title: media.title || media.name || 'Unknown',
        poster_path: media.poster_path || null,
        backdrop_path: media.backdrop_path || null,
        media_type: media.media_type || 'unknown',
        overview: media.overview || '',
        rating: media.vote_average || 0,
        watch_position: watchPosition || 0,
        duration: duration || 0,
        season: season || null,
        episode: episode || null,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (error: any) {
      console.error('Error adding to watch history:', error);
    }
  }
}

export const firebaseAuthService = new FirebaseAuthService();
