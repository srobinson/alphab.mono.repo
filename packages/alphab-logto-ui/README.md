# @alphab/logto-ui

Reusable Logto authentication components for React applications.

## Installation

```bash
npm install @alphab/logto-ui
```

## Usage

```tsx
import { AuthProvider, useAuth, ProtectedRoute } from '@alphab/logto-ui';

function App() {
  const authConfig = {
    apiUrl: 'http://localhost:8000/api/v1',
    logtoEndpoint: 'https://your-logto-endpoint.com',
    appId: 'your-app-id',
  };

  return (
    <AuthProvider config={authConfig}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
```

## Features

- React Context-based authentication
- Protected routes with role-based access
- Automatic token refresh
- TypeScript support
- Tailwind CSS integration

## Development

```bash
# Install dependencies
pnpm install

# Build package
pnpm build

# Run tests
pnpm test
```
