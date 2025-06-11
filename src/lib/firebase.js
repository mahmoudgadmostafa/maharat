
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA6lOKomvn9wHnwTQaoo3EZiR8C2uQMazw",
  authDomain: "mahmrat-edu.firebaseapp.com",
  projectId: "mahmrat-edu",
  storageBucket: "mahmrat-edu.firebasestorage.app",
  messagingSenderId: "193532135544",
  appId: "1:193532135544:web:e3a7f9c5baac84bd78858d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
