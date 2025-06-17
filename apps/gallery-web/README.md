# Particle0 Frontend

This is the frontend application for the Particle0 platform, built with React, TypeScript, and Vite. It uses the `auth-frontend` package for authentication.

## Features

- React + TypeScript
- Vite for fast development and building
- Authentication via Logto
- Role-based access control
- Responsive design with Tailwind CSS
- Theme switching (light/dark mode)

## Installation

```bash
# From the root of the monorepo
pnpm install
```

## Configuration

Create a `.env.local` file in the `packages/particle0-frontend` directory with the following content:

```
# Logto Authentication Configuration
VITE_LOGTO_ENDPOINT=https://logto.dev
VITE_LOGTO_APP_ID=your-logto-app-id

# API Configuration
VITE_API_URL=http://localhost:8000
```

## Development

To run the development server:

```bash
# From the root of the monorepo
pnpm run dev:particle0-frontend

# Or directly
cd packages/particle0-frontend
pnpm run dev
```

The application will be available at http://localhost:5173 (or another port if 5173 is in use).

## Building

To build the application for production:

```bash
# From the root of the monorepo
pnpm run build:particle0-frontend

# Or directly
cd packages/particle0-frontend
pnpm run build
```

The built files will be in the `packages/particle0-frontend/dist` directory.

## Components

### Auth Status

The `AuthStatus` component displays the current authentication status and provides sign-in/sign-out buttons.

```tsx
import { AuthStatus } from './components/auth-status';

function App() {
  return (
    <div>
      <header>
        <AuthStatus />
      </header>
      {/* Rest of your application */}
    </div>
  );
}
```

### UI Components

The application includes reusable UI components:

- `Button`: A customizable button component with various styles and sizes
- More components will be added as needed

## Authentication

Authentication is handled by the `auth-frontend` package. The following components are used:

- `AuthProvider`: Provides authentication context to the application
- `AuthCallbackHandler`: Handles the authentication callback from Logto
- `ProtectedRoute`: Restricts access to authenticated users, optionally with specific roles

## Testing

To run the tests:

```bash
# From the root of the monorepo
pnpm run test:particle0-frontend

# Or directly
cd packages/particle0-frontend
pnpm run test
```

## License

MIT
