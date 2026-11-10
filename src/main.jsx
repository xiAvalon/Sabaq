import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/ui.css';
import './styles/layout.css';
import './styles/screens.css';
import './styles/game.css';
import './styles/feedback.css';
import './styles/auth.css';
import './styles/extras.css';
import './styles/theme-light.css';

document.documentElement.lang = 'ar';
document.documentElement.dir = 'rtl';

// Offline support: the service worker precaches the app and question bank after the first visit.
// eslint-disable-next-line no-undef
const IS_SINGLE_FILE = typeof __ROUTER__ !== 'undefined' && __ROUTER__ === 'memory';
if ('serviceWorker' in navigator && import.meta.env.PROD && !IS_SINGLE_FILE) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
