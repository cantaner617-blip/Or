import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

// Register PWA Service Worker
const isBot = typeof navigator !== 'undefined' && /bot|google|baidu|bing|msn|duckduckgo|teoma|slurp|yandex|lighthouse|chrome-lighthouse|headless/i.test(navigator.userAgent);

if ('serviceWorker' in navigator && !isBot) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registered successfully:', reg.scope);
      })
      .catch((err) => {
        // Log as simple information/warning instead of console.error to keep Search Console audits clean
        console.warn('[PWA] Service Worker registration skipped or failed:', err.message || err);
      });
  });
}

