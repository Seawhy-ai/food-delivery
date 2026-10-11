import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './i18n'

// Handle GitHub Pages redirect
if (window.location.pathname.includes('index.html')) {
  const params = new URLSearchParams(window.location.search);
  const pathname = params.get('p') || '/';
  const hash = window.location.hash.slice(1).replace(/~and~/g, '&');
  window.history.replaceState(null, '', pathname + (hash ? '#' + hash : ''));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
