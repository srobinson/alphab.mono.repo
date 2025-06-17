# @alphab/http-client-ui

Simple, elegant HTTP client for TypeScript/JavaScript frontends with proper error handling and TypeScript types.

## Features

- 🚀 **Modern Fetch API** with timeout support
- 🎯 **TypeScript first** with full type safety
- ⚡ **Lightweight** - zero external dependencies
- 🛠️ **Flexible configuration** with sensible defaults
- 🔐 **Auth helpers** for bearer token authentication
- 📦 **KISS principle** - simple and easy to use

## Installation

```bash
npm install @alphab/http-client-ui
# or
pnpm add @alphab/http-client-ui
```

## Usage

### Basic Usage

```typescript
import { createClient } from "@alphab/http-client-ui";

const api = createClient({
  baseURL: "https://api.example.com",
});

// GET request
const users = await api.getJson<User[]>("/users");

// POST request
const newUser = await api.postJson<User>("/users", {
  name: "John Doe",
  email: "john@example.com",
});

// Error handling
try {
  const data = await api.getJson("/protected");
} catch (error) {
  if (error instanceof HttpError) {
    console.log(`HTTP ${error.status}: ${error.message}`);
  }
}
```

### Authentication

```typescript
// With authentication
const authenticatedApi = api.withAuth("your-jwt-token");
const profile = await authenticatedApi.getJson<UserProfile>("/me");

// Custom headers
const apiWithHeaders = api.withHeaders({
  "X-API-Key": "your-api-key",
  "Custom-Header": "value",
});
```

### Configuration

```typescript
import { HttpClient } from "@alphab/http-client-ui";

const client = new HttpClient({
  baseURL: "https://api.example.com",
  timeout: 30000, // 30 seconds
  defaultHeaders: {
    Authorization: "Bearer token",
    "X-API-Version": "v1",
  },
});
```

## API Reference

### Methods

- `get<T>(endpoint, options?)` - GET request
- `post<T>(endpoint, data?, options?)` - POST request
- `put<T>(endpoint, data?, options?)` - PUT request
- `patch<T>(endpoint, data?, options?)` - PATCH request
- `delete<T>(endpoint, options?)` - DELETE request

### JSON Convenience Methods

- `getJson<T>(endpoint, options?)` - GET and parse JSON
- `postJson<T>(endpoint, data?, options?)` - POST and parse JSON
- `putJson<T>(endpoint, data?, options?)` - PUT and parse JSON
- `patchJson<T>(endpoint, data?, options?)` - PATCH and parse JSON
- `deleteJson<T>(endpoint, options?)` - DELETE and parse JSON

### Configuration Helpers

- `withAuth(token)` - Create client with Bearer authorization
- `withHeaders(headers)` - Create client with additional headers

## License

MIT
