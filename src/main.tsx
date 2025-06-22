import React from 'react';
import ReactDOM from 'react-dom/client';
import { supabase } from './config/supabase';

import App from './App';
import './index.css';

// Initialize Supabase (already done in config file)
console.log('✅ Supabase initialized and ready!');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)