import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import AppRouter from './AppRouter.jsx';
import { BrowserRouter } from 'react-router-dom';
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <StrictMode>
      <AppRouter />
    </StrictMode>
  </BrowserRouter>
);
