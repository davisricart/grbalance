import React from 'react';
import ReactDOM from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

import App from './App';
import './index.css';

// Debug environment variables
console.log('🔧 Firebase Environment Variables Check:');
console.log('VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing');
console.log('VITE_FIREBASE_AUTH_DOMAIN:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing');
console.log('VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing');
console.log('VITE_FIREBASE_STORAGE_BUCKET:', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? '✅ Set' : '❌ Missing');
console.log('VITE_FIREBASE_MESSAGING_SENDER_ID:', import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? '✅ Set' : '❌ Missing');
console.log('VITE_FIREBASE_APP_ID:', import.meta.env.VITE_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing');

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if all required config values are present
const missingVars = Object.entries(firebaseConfig).filter(([key, value]) => !value);
if (missingVars.length > 0) {
  console.error('🚨 Missing Firebase environment variables:', missingVars.map(([key]) => key));
  console.error('💡 Please set these in Netlify Environment Variables:');
  missingVars.forEach(([key]) => {
    console.error(`   VITE_FIREBASE_${key.toUpperCase().replace(/([A-Z])/g, '_$1').replace(/^_/, '')}`);
  });
}

console.log('🔥 Firebase Config:', firebaseConfig);

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)