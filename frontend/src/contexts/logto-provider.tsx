import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { LogtoProvider as ReactLogtoProvider } from '@logto/react';
import { authClient, logtoConfig, type User } from '../lib/authClient';

// Create a context for the auth state
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  user: User | null;
  roles: string[];
  signIn: (redirectUri?: string, provider?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a wrapper component for the Logto context
export function LogtoProvider({ children }: { children: ReactNode }) {
  return (
    <ReactLogtoProvider config={logtoConfig}>
      <AuthProviderInternal>{children}</AuthProviderInternal>
    </ReactLogtoProvider>
  );
}

function AuthProviderInternal({ children }: { children: ReactNode }) {
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

        if (token) {
          // Handle the callback with token
          authClient.handleCallback(token);

          // Clean up the URL
          const url = new URL(window.location.href);
          url.searchParams.delete('token');
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
        console.error('Error initializing auth:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        // We can't directly access clearStorage, but we can set these states
        setUser(null);
        setIsAuthenticated(false);
        setRoles([]);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

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
  }, []);

  // Sign in function
  const signIn = async (redirectUri?: string, provider?: string) => {
    setIsLoading(true);
    try {
      await authClient.signIn(redirectUri, provider);
      // Note: signIn will redirect, so we won't reach this point
    } catch (err) {
      console.error('Sign-in error:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
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
      console.error('Sign-out error:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
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
      console.error('Refresh user error:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
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
export function useLogtoContext() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useLogtoContext must be used within a LogtoProvider');
  }

  return context;
}
