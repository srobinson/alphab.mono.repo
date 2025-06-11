import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './contexts/theme-provider.tsx';
import { AuthProvider } from '@alphab/logto-ui';
import { AuthCallbackHandler } from '@alphab/logto-ui';
import ProfilePage from './pages/profile.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider defaultTheme="system">
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/auth/callback" element={<AuthCallbackHandler />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
