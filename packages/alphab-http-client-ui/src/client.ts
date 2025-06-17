/**
 * Simple, elegant HTTP client for TypeScript/JavaScript frontends.
 *
 * Provides a clean interface for making HTTP requests with proper error handling,
 * timeouts, and TypeScript types.
 */

export interface HttpClientConfig {
  baseURL: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
}

export interface HttpResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public response?: Response,
    public data?: unknown
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class HttpClient {
  private config: Required<HttpClientConfig>;

  constructor(config: HttpClientConfig) {
    this.config = {
      timeout: 10000,
      defaultHeaders: {},
      ...config,
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<HttpResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`;

    // Setup timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...this.config.defaultHeaders,
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      // Handle non-2xx responses
      if (!response.ok) {
        let errorData: unknown;
        try {
          errorData = await response.json();
        } catch {
          errorData = await response.text().catch(() => null);
        }

        const message =
          (errorData as any)?.message ||
          (errorData as any)?.error ||
          `HTTP ${response.status}: ${response.statusText}`;

        throw new HttpError(
          message,
          response.status,
          (errorData as any)?.code || "HTTP_ERROR",
          response,
          errorData
        );
      }

      // Parse response data
      let data: T;
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        data = (await response.text()) as unknown as T;
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof HttpError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new HttpError("Request timeout", 408, "TIMEOUT");
      }

      throw new HttpError(
        error instanceof Error ? error.message : "Network error",
        0,
        "NETWORK_ERROR"
      );
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string, options?: RequestInit): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      ...(data !== undefined && { body: JSON.stringify(data) }),
    });
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      ...(data !== undefined && { body: JSON.stringify(data) }),
    });
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      ...(data !== undefined && { body: JSON.stringify(data) }),
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }

  // Convenience methods for JSON responses
  async getJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await this.get<T>(endpoint, options);
    return response.data;
  }

  async postJson<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    const response = await this.post<T>(endpoint, data, options);
    return response.data;
  }

  async putJson<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    const response = await this.put<T>(endpoint, data, options);
    return response.data;
  }

  async patchJson<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    const response = await this.patch<T>(endpoint, data, options);
    return response.data;
  }

  async deleteJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await this.delete<T>(endpoint, options);
    return response.data;
  }

  // Authentication helpers
  withAuth(token: string): HttpClient {
    return new HttpClient({
      ...this.config,
      defaultHeaders: {
        ...this.config.defaultHeaders,
        Authorization: `Bearer ${token}`,
      },
    });
  }

  withHeaders(headers: Record<string, string>): HttpClient {
    return new HttpClient({
      ...this.config,
      defaultHeaders: {
        ...this.config.defaultHeaders,
        ...headers,
      },
    });
  }
}

// Convenience function for creating a client
export function createClient(config: HttpClientConfig): HttpClient {
  return new HttpClient(config);
}
