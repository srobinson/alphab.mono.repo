import { AuthConfig, User } from '../types';

const config: AuthConfig = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
};

/**
 * Custom error class for authentication errors
 */
export class AuthError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Authentication service
 */
export class AuthService {
  private user: User | null = null;
  private isAuthenticated = false;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  /**
   * Create a new authentication service
   * @param config Authentication configuration
   */
  constructor() {
    this.loadFromStorage();
  }

  /**
   * Load authentication state from storage
   */
  private loadFromStorage() {
    try {
      // Load user from storage
      const userJson = localStorage.getItem('logto_user');
      if (userJson) {
        this.user = JSON.parse(userJson);
      }

      // Load auth status from storage
      const authStatus = localStorage.getItem('logto_auth_status');
      this.isAuthenticated = authStatus === 'true';

      // Load tokens from storage
      this.accessToken = localStorage.getItem('logto_token');
      this.refreshToken = localStorage.getItem('logto_refresh_token');
    } catch (error) {
      console.error('Error loading auth state from storage:', error);
      this.clearStorage();
    }
  }

  /**
   * Save authentication state to storage
   */
  private saveToStorage() {
    try {
      // Save user to storage
      if (this.user) {
        localStorage.setItem('logto_user', JSON.stringify(this.user));
      } else {
        localStorage.removeItem('logto_user');
      }

      // Save auth status to storage
      localStorage.setItem('logto_auth_status', String(this.isAuthenticated));

      // Save tokens to storage
      if (this.accessToken) {
        localStorage.setItem('logto_token', this.accessToken);
      } else {
        localStorage.removeItem('logto_token');
      }

      if (this.refreshToken) {
        localStorage.setItem('logto_refresh_token', this.refreshToken);
      } else {
        localStorage.removeItem('logto_refresh_token');
      }

      // Dispatch storage event for cross-tab synchronization
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('Error saving auth state to storage:', error);
    }
  }

  /**
   * Clear authentication state from storage
   */
  private clearStorage() {
    localStorage.removeItem('logto_user');
    localStorage.removeItem('logto_auth_status');
    localStorage.removeItem('logto_token');
    localStorage.removeItem('logto_refresh_token');
    this.user = null;
    this.isAuthenticated = false;
    this.accessToken = null;
    this.refreshToken = null;
  }

  /**
   * Get the current user
   * @returns The current user or null if not authenticated
   */
  getUser(): User | null {
    return this.user;
  }

  /**
   * Get authentication status
   * @returns Whether the user is authenticated
   */
  getIsAuthenticated(): boolean {
    return this.isAuthenticated;
  }

  /**
   * Get the access token
   * @returns The access token or null if not authenticated
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Check if the token is expired
   * @returns Whether the token is expired
   */
  isTokenExpired(): boolean {
    if (!this.accessToken) {
      return true;
    }

    try {
      // Split the token into parts
      const parts = this.accessToken.split('.');
      if (parts.length !== 3) {
        // Not a valid JWT token
        return true;
      }

      // Decode the token without verification to get the expiration time
      const payload = JSON.parse(atob(parts[1]));
      if (!payload.exp) {
        return false;
      }

      // Check if the token is expired
      return payload.exp * 1000 < Date.now();
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  /**
   * Refresh the access token
   * @returns Whether the token was refreshed successfully
   */
  async refreshAccessToken(): Promise<boolean> {
    if (!this.accessToken) {
      console.error('Cannot refresh token: No access token available');
      return false;
    }

    if (!this.refreshToken) {
      console.error('Cannot refresh token: No refresh token available');
      return false;
    }

    try {
      console.log('Refreshing token with refresh token');

      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Refresh-Token': this.refreshToken,
      };

      const response = await fetch(`${config.apiUrl}/auth/refresh`, {
        method: 'GET',
        headers,
        credentials: 'include',
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh token: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;

      // Store new refresh token if provided
      if (data.refresh_token) {
        this.refreshToken = data.refresh_token;
      }

      console.log('Token refreshed successfully');

      this.isAuthenticated = true;
      this.saveToStorage();

      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }

  /**
   * Set the token from URL or other source
   * @param token Access token
   * @param refreshToken Refresh token
   */
  setToken(token: string, refreshToken?: string): void {
    this.accessToken = token;
    if (refreshToken) {
      this.refreshToken = refreshToken;
    }
    this.isAuthenticated = true;
    this.saveToStorage();
  }

  /**
   * Refresh user data from server
   */
  async refreshUser(): Promise<void> {
    if (!this.accessToken) {
      this.clearStorage();
      return;
    }

    try {
      // Call the backend's session endpoint
      const response = await fetch(`${config.apiUrl}/auth/session`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        mode: 'cors',
      });

      if (!response.ok) {
        console.error('Failed to get session info:', await response.text());
        throw new Error(`Failed to get session info: ${response.status}`);
      }

      const sessionData = await response.json();

      if (!sessionData.isAuthenticated || !sessionData.user) {
        this.clearStorage();
        return;
      }

      // Update user data
      this.user = {
        id: sessionData.user.id,
        name: sessionData.user.name,
        email: sessionData.user.email,
        picture: sessionData.user.picture,
        roles: sessionData.user.roles || [],
        username: sessionData.user.username,
        email_verified: sessionData.user.email_verified,
        created_at: sessionData.user.created_at,
        updated_at: sessionData.user.updated_at,
      };

      this.isAuthenticated = true;
      this.saveToStorage();
    } catch (error) {
      console.error('Error refreshing user:', error);
      // If we can't get user info, clear the auth state
      this.clearStorage();
    }
  }

  /**
   * Sign in
   * @param redirectUri Redirect URI after sign in
   * @param provider Authentication provider
   */
  async signIn(redirectUri?: string, provider?: string): Promise<void> {
    // Build the sign-in URL
    let signInUrl = `${config.apiUrl}/auth/signin`;

    // Add query parameters if provided
    const params = new URLSearchParams();
    if (redirectUri) {
      params.append('redirectUri', redirectUri);
    }
    if (provider) {
      params.append('provider', provider);
    }

    const queryString = params.toString();
    if (queryString) {
      signInUrl += `?${queryString}`;
    }

    // Redirect to the sign-in URL
    window.location.href = signInUrl;
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      // Clear the auth state first
      this.clearStorage();

      // Redirect to the signout URL
      window.location.href = `${config.apiUrl}/auth/signout`;
    } catch (error) {
      console.error('Error during sign-out:', error);
      // If there's an error, still clear the auth state and redirect
      this.clearStorage();
      window.location.href = '/';
    }
  }

  /**
   * Handle the authentication callback
   * @param token Access token
   * @param refreshToken Refresh token
   */
  handleCallback(token: string, refreshToken?: string): void {
    if (token) {
      this.setToken(token, refreshToken);
      this.refreshUser();
    }
  }

  /**
   * Validate token with the server
   * @returns Whether the token is valid
   */
  async validateToken(): Promise<boolean> {
    if (!this.isAuthenticated || !this.accessToken) {
      return false;
    }

    try {
      const response = await fetch(`${config.apiUrl}/auth/validate-token`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        mode: 'cors',
      });

      if (!response.ok) {
        console.error('Token validation failed:', response.status);
        return false;
      }

      const data = await response.json();

      // If token is valid but needs renewal
      if (data.valid && data.renew && data.token) {
        console.log('Token is valid but needs renewal, updating token');
        this.accessToken = data.token;
        this.saveToStorage();
      }

      return data.valid;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }

  /**
   * Fetch data with authentication
   * @param url API URL
   * @param options Fetch options
   * @returns Fetch response
   */
  async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    if (!this.isAuthenticated || !this.accessToken) {
      throw new AuthError('User is not authenticated', 'not_authenticated');
    }

    // Use server-side token validation instead of client-side expiration check
    const isValid = await this.validateToken();

    if (!isValid) {
      // If token is invalid and we have a refresh token, try to refresh
      if (this.refreshToken) {
        console.log('Token is invalid, attempting to refresh');
        const refreshed = await this.refreshAccessToken();
        if (!refreshed) {
          console.warn('Failed to refresh token, will try to use existing token anyway');
        }
      } else {
        console.warn('Token is invalid but no refresh token available. Will try to use it anyway.');
      }
    }

    // Add the Authorization header
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${this.accessToken}`);
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');

    // Return the fetch promise
    return fetch(`${config.apiUrl}${url}`, {
      ...options,
      headers,
      credentials: 'include',
      mode: 'cors',
    });
  }
}
