# Auth Frontend

A reusable authentication package for React applications using Logto as the authentication provider.

## Features

- Complete PKCE authentication flow
- Token management and validation
- User information retrieval
- Role-based access control
- Cross-tab synchronization
- Protected routes
- TypeScript support

## Installation

```bash
# From the root of the monorepo
pnpm install
```

Or if you're using this package in another project:

```bash
npm install auth-frontend
# or
yarn add auth-frontend
# or
pnpm add auth-frontend
```

## Quick Start

```tsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, AuthCallbackHandler, ProtectedRoute } from "auth-frontend";

const authConfig = {
  apiUrl: "http://localhost:8000/api/v1",
  logtoEndpoint: "https://logto.dev",
  appId: "your-app-id",
  redirectUri: "http://localhost:3000/auth/callback",
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider config={authConfig}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/callback" element={<AuthCallbackHandler />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRoles={["admin"]}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

## Authentication Flow

1. User clicks "Sign In" button which calls the `signIn()` function
2. User is redirected to the backend's `/auth/signin` endpoint
3. Backend redirects to Logto for authentication
4. After authentication, Logto redirects back to the backend's `/auth/callback` endpoint
5. Backend exchanges the authorization code for tokens and redirects to the frontend's callback URL
6. The `AuthCallbackHandler` component processes the tokens and stores them
7. User is redirected to the application

## Components

### AuthProvider

The `AuthProvider` component provides authentication context to your application.

```tsx
import { AuthProvider } from "auth-frontend";

const authConfig = {
  apiUrl: "http://localhost:8000/api/v1",
  logtoEndpoint: "https://logto.dev",
  appId: "your-app-id",
  redirectUri: "http://localhost:3000/auth/callback",
};

function App() {
  return <AuthProvider config={authConfig}>{/* Your application */}</AuthProvider>;
}
```

### AuthCallbackHandler

The `AuthCallbackHandler` component handles the authentication callback from Logto.

```tsx
import { AuthCallbackHandler } from "auth-frontend";

function App() {
  return (
    <Routes>
      {/* Other routes */}
      <Route path="/auth/callback" element={<AuthCallbackHandler />} />
    </Routes>
  );
}
```

### ProtectedRoute

The `ProtectedRoute` component restricts access to authenticated users, optionally with specific roles.

```tsx
import { ProtectedRoute } from "auth-frontend";

function App() {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/" element={<HomePage />} />

      {/* Protected route for any authenticated user */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Protected route for users with the 'admin' role */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRoles={["admin"]}>
            <AdminPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

## Hooks

### useAuth

The `useAuth` hook provides access to the authentication context.

```tsx
import { useAuth } from "auth-frontend";

function ProfileButton() {
  const { isAuthenticated, user, signIn, signOut } = useAuth();

  if (isAuthenticated && user) {
    return <button onClick={signOut}>Sign Out ({user.name})</button>;
  }

  return <button onClick={signIn}>Sign In</button>;
}
```

## API Reference

### AuthService

The `AuthService` class provides methods for authentication management.

```tsx
import { AuthService } from "auth-frontend";

const authConfig = {
  apiUrl: "http://localhost:8000/api/v1",
  logtoEndpoint: "https://logto.dev",
  appId: "your-app-id",
};

const authService = new AuthService(authConfig);

// Sign in
authService.signIn();

// Sign out
authService.signOut();

// Get user
const user = authService.getUser();

// Check if authenticated
const isAuthenticated = authService.getIsAuthenticated();

// Refresh user data
await authService.refreshUser();

// Make authenticated API requests
const response = await authService.fetchWithAuth("/users/me");
const data = await response.json();
```

## Testing

This package includes Jest tests for components and services. To run the tests:

```bash
pnpm run test
```

## License

MIT
