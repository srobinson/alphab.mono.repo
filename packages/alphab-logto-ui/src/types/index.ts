import type { ReactNode } from 'react';

/**
 * Authentication configuration
 */
export interface AuthConfig {
  /** API base URL */
  apiUrl: string;
  // /** Logto endpoint URL */
  // logtoEndpoint: string;
  // /** Logto application ID */
  // appId: string;
  // /** Redirect URI for authentication callback */
  // redirectUri?: string;
}

/**
 * User information
 */
export interface User {
  /** User ID */
  id: string;
  /** User's full name */
  name?: string;
  /** User's email address */
  email?: string;
  /** URL to user's profile picture */
  picture?: string;
  /** User roles */
  roles: string[];
  /** User's username */
  username?: string;
  /** Whether the email is verified */
  email_verified?: boolean;
  /** User creation timestamp */
  created_at?: number;
  /** User update timestamp */
  updated_at?: number;
}

/**
 * Authentication context
 */
export interface AuthContextType {
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Whether authentication is in progress */
  isLoading: boolean;
  /** Authentication error */
  error: Error | null;
  /** User information */
  user: User | null;
  /** User roles */
  roles: string[];
  /** Sign in function */
  signIn: (redirectUri?: string, provider?: string) => Promise<void>;
  /** Sign out function */
  signOut: () => Promise<void>;
  /** Refresh user information */
  refreshUser: () => Promise<void>;
}

/**
 * Protected route props
 */
export interface ProtectedRouteProps {
  /** Child components */
  children: ReactNode;
  /** Required roles for access */
  requiredRoles?: string[];
}
