import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import { GlobalStyle } from './styles';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Missing root element');
}

const app = (
  <React.StrictMode>
    <GlobalStyle />
    <App />
  </React.StrictMode>
);

if (root.hasChildNodes()) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
