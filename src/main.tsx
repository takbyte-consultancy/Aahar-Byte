import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global fetch wrapper to append x-organisation-code for multi-tenancy scoping
const originalFetch = window.fetch;
const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  let orgCode = '';
  try {
    const saved = localStorage.getItem('aahar_current_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.orgCode) {
        orgCode = parsed.orgCode;
      }
    }
  } catch (e) {}

  // If there's no logged in staff session, look up organisation code from URL params or customer cache
  if (!orgCode) {
    try {
      const hash = window.location.hash;
      const search = window.location.search;
      const paramSource = search || (hash.includes('?') ? hash.substring(hash.indexOf('?')) : '');
      const params = new URLSearchParams(paramSource);
      const urlOrg = params.get('org');
      if (urlOrg) {
        orgCode = urlOrg;
      } else {
        const cachedCustomerOrg = localStorage.getItem('aahar_customer_org');
        if (cachedCustomerOrg) {
          orgCode = cachedCustomerOrg;
        }
      }
    } catch (e) {}
  }

  if (orgCode) {
    const headers = new Headers(init?.headers);
    if (!headers.has('x-organisation-code')) {
      headers.set('x-organisation-code', orgCode);
    }
    init = {
      ...init,
      headers
    };
  }
  return originalFetch(input, init);
};

try {
  Object.defineProperty(window, 'fetch', {
    value: customFetch,
    configurable: true,
    writable: true
  });
} catch (e) {
  try {
    (window as any).fetch = customFetch;
  } catch (err) {
    console.warn('Failed to assign custom fetch to window.fetch:', err);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
