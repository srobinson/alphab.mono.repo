import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../lib/authClient';

export function AuthCallbackHandler() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract the tokens from URL if present
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const refreshToken = urlParams.get('refresh_token');

        console.log('Auth callback received token:', token ? 'yes' : 'no');
        console.log('Auth callback received refresh token:', refreshToken ? 'yes' : 'no');

        if (token) {
          // Handle the callback with tokens
          authClient.handleCallback(token, refreshToken || undefined);
          console.log('Tokens stored in auth client');

          // Clean up the URL
          const url = new URL(window.location.href);
          url.searchParams.delete('token');
          url.searchParams.delete('refresh_token');
          window.history.replaceState({}, document.title, url.toString());

          // Refresh user data
          await authClient.refreshUser();

          // Navigate to home page
          navigate('/', { replace: true });
        } else {
          // If no token in URL, don't show an error immediately
          // This could be a direct navigation to the callback page
          console.warn('No token found in URL, redirecting to home page');
          navigate('/', { replace: true });
        }
      } catch (err) {
        console.error('Error handling auth callback:', err);
        setError('Authentication failed. Please try again.');
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 max-w-md">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Authentication Error</h2>
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Completing Authentication</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we complete the authentication process...
        </p>
        <div className="mt-4 w-12 h-12 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}
