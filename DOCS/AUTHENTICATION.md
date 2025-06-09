# Authentication in ParticleZero

ParticleZero implements a modern authentication system using Logto integration for OAuth2 and PKCE flows, providing a secure and seamless user experience.

## Overview

The authentication system is built using the following components:

- Logto OAuth2 Provider integration for secure authentication flows
- React Context API for global authentication state management
- Role-based access control (RBAC) for authorization
- Secure token handling and refresh mechanisms
- Comprehensive audit logging

## Frontend Implementation

### Authentication Context

The frontend uses a React context (`LogtoContext`) to provide global access to authentication state and methods:

```tsx
// Use the LogtoContext to access authentication state and methods
import { useLogtoContext } from "../contexts/logto-provider";

function MyComponent() {
  const { isAuthenticated, user, roles, signIn, signOut } = useLogtoContext();

  // Use authentication state and methods in your component
}
```

### Key Features

- Global authentication state management
- User information and role access
- Seamless sign-in and sign-out functionality
- Token refresh handling
- Loading and error states

### Setup

1. Add the Logto provider to your app root:

```tsx
// main.tsx
import { LogtoProvider } from "./contexts/logto-provider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LogtoProvider>
      <App />
    </LogtoProvider>
  </React.StrictMode>
);
```

2. Configure Logto credentials in your `.env.local` file:

```
VITE_LOGTO_ENDPOINT=https://logto.dev
VITE_LOGTO_APP_ID=your-logto-app-id
VITE_LOGTO_RESOURCES=your-resources
```

## Backend Implementation

### Authentication Flow

The backend handles OAuth2 PKCE flow with the following endpoints:

- **GET /api/v1/auth/signin**: Initiates the Logto sign-in flow
- **GET /api/v1/auth/callback**: Handles the callback from Logto
- **GET /api/v1/auth/signout**: Signs out the current user
- **GET /api/v1/auth/refresh**: Refreshes the access token
- **GET /api/v1/auth/me**: Gets information about the current user

### Role-Based Access Control

Protected routes use the `has_role` dependency for role-based access control:

```python
@router.get("/protected")
async def protected_route(user: TokenData = Depends(has_role(["admin"]))):
    return {"message": "You have access to this protected resource", "user_id": user.sub}
```

### Setup

1. Configure Logto credentials in your `.env` file:

```
LOGTO_ENDPOINT=https://logto.dev
LOGTO_APP_ID=your-logto-app-id
LOGTO_APP_SECRET=your-logto-app-secret
LOGTO_REDIRECT_URI=http://localhost:3000/auth/callback
```

2. Configure JWT settings for token handling:

```
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## Security Considerations

- All sensitive data is transmitted over HTTPS
- Tokens are stored securely (using HTTP-only cookies or in-memory storage)
- Role-based access control is enforced on protected endpoints
- All authentication events are logged for audit purposes
- Token expiration and refresh is handled automatically

## Logto Setup

To use this authentication system, you need to:

1. Create an account on [Logto](https://logto.io/)
2. Register a new application in the Logto console
3. Configure the application with the correct redirect URI (`http://localhost:3000/auth/callback` for development)
4. Copy the application ID and secret to your environment files
5. Configure the sign-in experience in the Logto console to match your branding

## Testing Authentication

You can test the authentication flow by:

1. Starting the frontend and backend applications
2. Clicking the "Sign In" button in the UI
3. Completing the authentication flow on the Logto sign-in page
4. Being redirected back to the application as an authenticated user

## Troubleshooting

- **Authentication fails**: Check that your Logto credentials are correct in the environment files
- **Redirect issues**: Ensure the redirect URI matches what's configured in Logto
- **Token refresh errors**: Check that the token endpoint is accessible and the refresh flow is working
- **Role enforcement issues**: Verify that roles are being correctly assigned in Logto and passed to your application
