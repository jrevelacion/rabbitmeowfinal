import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '../App.tsx'
import '../index.css'

/* ------------------------------
   Clear browser storage ONLY when version changes
------------------------------ */
try {
  const APP_VERSION = '2.0.2'; // Update this when you want to clear storage
  const storedVersion = localStorage.getItem('appVersion');
  
  if (storedVersion !== APP_VERSION) {
    console.log('App version changed, clearing storage...');
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('appVersion', APP_VERSION);
  } else {
    console.log('App version unchanged, preserving storage');
  }
} catch (e) {
  console.warn("Storage check failed:", e);
}

/* ------------------------------
   DO NOT freeze localStorage - we need to write to it!
------------------------------ */
// REMOVE THESE LINES:
// try {
//   Object.freeze(localStorage);
//   Object.freeze(sessionStorage);
// } catch (e) {
//   console.warn("Storage freeze failed:", e);
// }

/* ------------------------------
   Render React App
------------------------------ */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)