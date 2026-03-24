/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Application entry point.
 *
 * Wraps the App component in BrowserRouter for client-side routing
 * and StrictMode for development-time checks.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
