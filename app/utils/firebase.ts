import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCk_9aMXVvqd95I4pO4S2otdyvCwR1KPao",
  authDomain: "learnova-d1846.firebaseapp.com",
  projectId: "learnova-d1846",
  storageBucket: "learnova-d1846.firebasestorage.app",
  messagingSenderId: "838782204374",
  appId: "1:838782204374:web:b888592d7763e78f498c77",
  measurementId: "G-3GWHF2GQN2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);