import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Déclarer l'interface pour mainAPI (définie dans preload.ts)
declare global {
  interface Window {
    mainAPI: any;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);