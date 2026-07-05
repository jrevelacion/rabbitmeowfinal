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
import { doc, setDoc, getDoc, updateDoc, query, where, collection, getDocs } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
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

      // Create user document in Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: displayName,
        photoURL: firebaseUser.photoURL || null,
        createdAt: new Date().toISOString(),
      });

      return {
        user: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: displayName,
          photoURL: firebaseUser.photoURL,
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

      return {
        user: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
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

      return {
        user: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
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
    return onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        callback({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
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
      throw new Error('Failed to check username availability: ' + (error.message || 'Unknown error'));
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

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }

    return {
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName,
      photoURL: currentUser.photoURL,
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
}

export const firebaseAuthService = new FirebaseAuthService();
