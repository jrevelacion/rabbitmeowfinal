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
import { doc, setDoc, getDoc, updateDoc, query, where, collection, getDocs, deleteDoc, orderBy, limit as firestoreLimit, serverTimestamp, startAfter } from 'firebase/firestore';

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

      // Update Firebase Auth profile first
      await updateProfile(firebaseUser, {
        displayName: displayName,
      });

      const isAdmin = email === 'surotember@gmail.com' || displayName === 'RabbitMeowAdmin';

      // Create user document in Firestore
      // We wrap this in a small delay or retry to ensure Auth state is propagated
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: displayName,
        photoURL: firebaseUser.photoURL || null,
        isAdmin: isAdmin,
        isBanned: false,
        createdAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      } catch (firestoreError: any) {
        console.warn('Initial Firestore write failed, retrying once...', firestoreError);
        // Small wait and retry
        await new Promise(resolve => setTimeout(resolve, 500));
        await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      }

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
      console.error('Signup error:', error);
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
        callback({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            isAdmin: firebaseUser.email === 'surotember@gmail.com' || firebaseUser.displayName === 'RabbitMeowAdmin',
            isBanned: false,
          });
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
      
      let querySnapshot;
      try {
        querySnapshot = await getDocs(q);
      } catch (e: any) {
        // If we get permission-denied here, it usually means the user is not logged in 
        // and the Firestore rules are strict. For a username check, we might need 
        // a public view or a different approach, but for now let's assume if we can't 
        // read, we should at least not crash the signup flow if possible.
        if (e.code === 'permission-denied') {
          console.warn('Permission denied during username check. This is expected if rules require auth.');
          // In many setups, username check is allowed publicly or we have a specific function.
          // If it fails, we'll let the user proceed and handle the collision during setDoc.
          return { available: true, message: 'Username check bypassed due to permissions' };
        }
        throw e;
      }

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

  async clearWatchHistory(): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const historyRef = collection(db, 'users', currentUser.uid, 'watchHistory');
      const snapshot = await getDocs(historyRef);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error clearing watch history:', error);
      throw error;
    }
  }

  async deleteWatchHistoryItem(id: string): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'watchHistory', id));
    } catch (error) {
      console.error('Error deleting watch history item:', error);
      throw error;
    }
  }

  async cleanupWatchHistory(): Promise<{ removedDuplicates: number; remainingItems: number }> {
    const currentUser = auth.currentUser;
    if (!currentUser) return { removedDuplicates: 0, remainingItems: 0 };

    try {
      const historyRef = collection(db, 'users', currentUser.uid, 'watchHistory');
      const snapshot = await getDocs(historyRef);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      
      const seen = new Set();
      const duplicates: string[] = [];
      
      items.forEach(item => {
        const key = `${item.media_id}_${item.media_type}_${item.season || 0}_${item.episode || 0}`;
        if (seen.has(key)) {
          duplicates.push(item.id);
        } else {
          seen.add(key);
        }
      });

      const deletePromises = duplicates.map(id => deleteDoc(doc(db, 'users', currentUser.uid, 'watchHistory', id)));
      await Promise.all(deletePromises);

      return {
        removedDuplicates: duplicates.length,
        remainingItems: items.length - duplicates.length
      };
    } catch (error) {
      console.error('Error cleaning up watch history:', error);
      throw error;
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

  // Helper to get user, waiting for auth to initialize if it's currently null
  private async getActiveUser(): Promise<FirebaseUser | null> {
    if (auth.currentUser) return auth.currentUser;
    
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
      // Timeout after 2 seconds to avoid hanging
      setTimeout(() => {
        unsubscribe();
        resolve(auth.currentUser);
      }, 2000);
    });
  }

  // Watchlist Methods
  async getWatchlist(): Promise<any[]> {
    const currentUser = await this.getActiveUser();
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
    const currentUser = await this.getActiveUser();
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
  async getWatchHistory(limitCount: number = 20, lastDocId?: string): Promise<{ items: any[]; lastDocId: string | null; hasMore: boolean }> {
    const currentUser = await this.getActiveUser();
    if (!currentUser) return { items: [], lastDocId: null, hasMore: false };

    try {
      const historyRef = collection(db, 'users', currentUser.uid, 'watchHistory');
      let q = query(historyRef, orderBy('updatedAt', 'desc'), firestoreLimit(limitCount + 1)); // Fetch one extra to check for more

      if (lastDocId) {
        const lastDocRef = doc(db, 'users', currentUser.uid, 'watchHistory', lastDocId);
        const lastDocSnapshot = await getDoc(lastDocRef);
        if (lastDocSnapshot.exists()) {
          q = query(historyRef, orderBy('updatedAt', 'desc'), startAfter(lastDocSnapshot), firestoreLimit(limitCount + 1));
        }
      }

      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.slice(0, limitCount).map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      const newLastDocId = querySnapshot.docs.length > limitCount ? querySnapshot.docs[limitCount - 1].id : null;
      const hasMore = querySnapshot.docs.length > limitCount;

      return { items, lastDocId: newLastDocId, hasMore };
    } catch (error) {
      console.error('Error getting watch history:', error);
      return { items: [], lastDocId: null, hasMore: false };
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
