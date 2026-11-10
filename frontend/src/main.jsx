import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/archivo/index.css';
import '@fontsource-variable/inter/index.css';
import '@fontsource-variable/jetbrains-mono/index.css';
import './index.css';
import App from './App.jsx';

const rootElement = document.getElementById('root');
createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
