import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './contexts/theme-provider.tsx';
import { LogtoProvider } from './contexts/logto-provider.tsx';
import { AuthCallbackHandler } from './components/auth-callback-handler.tsx';
import ProfilePage from './pages/profile.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LogtoProvider>
        <ThemeProvider defaultTheme="system">
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/auth/callback" element={<AuthCallbackHandler />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </ThemeProvider>
      </LogtoProvider>
    </BrowserRouter>
  </React.StrictMode>
);
