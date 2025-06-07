import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Debug environment variables
console.log('Environment variables:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? 'loaded' : 'missing',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? 'loaded' : 'missing',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? 'loaded' : 'missing',
  env: import.meta.env.MODE
});

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBNdKlkXK2zLWKNbqL9HbnHgq3iHpg7AKs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gr-balance.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gr-balance",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gr-balance.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "888884147701",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:888884147701:web:361c589f7c3488f4ba5cbc"
};
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)