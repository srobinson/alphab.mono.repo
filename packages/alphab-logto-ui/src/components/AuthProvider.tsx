import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AuthService } from '../services/authService';
import type { AuthContextType, User } from '../types';
import { createLogger } from '@alphab/logging-ui';

const logger = createLogger('AuthProvider');

// Create a context for the auth state
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication provider component
 *
 * This component provides authentication state and functions to its children
 * through React Context.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [authClient] = useState<AuthService>(() => new AuthService());
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [roles, setRoles] = useState<string[]>([]);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for token in URL (from callback)
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const refreshToken = urlParams.get('refresh_token');

        if (token) {
          // Handle the callback with token
          authClient.handleCallback(token, refreshToken || undefined);

          // Clean up the URL
          const url = new URL(window.location.href);
          url.searchParams.delete('token');
          if (refreshToken) {
            url.searchParams.delete('refresh_token');
          }
          window.history.replaceState({}, document.title, url.toString());
        }

        // Check if we have a token in storage
        const hasToken = !!authClient.getAccessToken();

        // Only try to refresh user data if we have a token
        if (hasToken) {
          // Refresh user data
          await authClient.refreshUser();
        }

        // Update state from authClient
        const currentUser = authClient.getUser();
        const authStatus = authClient.getIsAuthenticated();

        setUser(currentUser);
        setIsAuthenticated(authStatus);
        setRoles(currentUser?.roles || []);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error('Error initializing auth', error);
        setError(error);
        // We can't directly access clearStorage, but we can set these states
        setUser(null);
        setIsAuthenticated(false);
        setRoles([]);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [authClient]);

  // Listen for storage events (for cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = () => {
      const currentUser = authClient.getUser();
      const authStatus = authClient.getIsAuthenticated();

      setUser(currentUser);
      setIsAuthenticated(authStatus);
      setRoles(currentUser?.roles || []);
    };

    window.addEventListener('storage', handleStorageChange);

    // Check auth state when the page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        authClient.refreshUser().then(() => {
          const currentUser = authClient.getUser();
          const authStatus = authClient.getIsAuthenticated();

          setUser(currentUser);
          setIsAuthenticated(authStatus);
          setRoles(currentUser?.roles || []);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [authClient]);

  // Sign in function
  const signIn = async (redirectUri?: string, provider?: string) => {
    setIsLoading(true);
    try {
      await authClient.signIn(redirectUri, provider);
      // Note: signIn will redirect, so we won't reach this point
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Sign-in error', error);
      setError(error);
      setIsLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    setIsLoading(true);
    try {
      await authClient.signOut();
      // Note: signOut will redirect, so we won't reach this point
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Sign-out error', error);
      setError(error);
      setUser(null);
      setIsAuthenticated(false);
      setRoles([]);
      setIsLoading(false);
    }
  };

  // Refresh user function
  const refreshUser = async () => {
    setIsLoading(true);
    try {
      await authClient.refreshUser();
      const currentUser = authClient.getUser();
      const authStatus = authClient.getIsAuthenticated();

      setUser(currentUser);
      setIsAuthenticated(authStatus);
      setRoles(currentUser?.roles || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Refresh user error', error);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    error,
    user,
    roles,
    signIn,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook for using the auth context
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
