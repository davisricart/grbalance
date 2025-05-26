import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBNdKlkXK2zLWKNbqL9HbnHgq3iHpg7AKs",
  authDomain: "gr-balance.firebaseapp.com",
  projectId: "gr-balance",
  storageBucket: "gr-balance.firebasestorage.app",
  messagingSenderId: "888884147701",
  appId: "1:888884147701:web:361c589f7c3488f4ba5cbc"
};
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)