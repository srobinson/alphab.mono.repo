interface ApiConfig {
  baseURL: string;
  timeout?: number;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = {
      timeout: 10000,
      ...config,
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code || 'HTTP_ERROR',
          errorData
        );
      }

      const data = await response.json();
      return {
        data,
        status: response.status,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408, 'TIMEOUT');
      }

      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0,
        'NETWORK_ERROR',
        error
      );
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Authenticated requests
  async authenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ): Promise<ApiResponse<T>> {
    const authToken = token || localStorage.getItem('logto_token');

    if (!authToken) {
      throw new ApiError('No authentication token available', 401, 'NO_TOKEN');
    }

    return this.request<T>(endpoint, {
      ...options,
      headers: {
        Authorization: `Bearer ${authToken}`,
        ...options.headers,
      },
    });
  }
}

// Default API client instance
export const apiClient = new ApiClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

// Convenience methods for common authenticated endpoints
export const authApi = {
  getProfile: () => apiClient.authenticatedRequest('/api/v1/auth/me'),
  getSession: () => apiClient.authenticatedRequest('/api/v1/auth/session'),
  refreshToken: () => apiClient.authenticatedRequest('/api/v1/auth/refresh'),
  validateToken: () => apiClient.authenticatedRequest('/api/v1/auth/validate-token'),
};
