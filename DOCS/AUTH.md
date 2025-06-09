# Authentication System Documentation

## Overview

This document provides a comprehensive guide to the authentication system implemented in the Particle0 application. The system uses Logto as the authentication provider and implements a complete authentication flow with token verification, user profile management, and session handling.

## Architecture

The authentication system consists of two main components:

1. **Backend (FastAPI)**: Handles token verification, user session management, and provides authentication endpoints.
2. **Frontend (React)**: Manages the user interface for authentication, stores tokens, and provides authentication context to the application.

## Authentication Flow

### Sign-In Flow

1. User clicks "Sign In" button in the UI
2. Frontend redirects to the backend's `/api/v1/auth/signin` endpoint
3. Backend generates PKCE code verifier and challenge
4. Backend redirects to Logto's authorization URL with the PKCE challenge
5. User authenticates with Logto (username/password or social login)
6. Logto redirects back to the backend's `/api/v1/auth/callback` endpoint with an authorization code
7. Backend exchanges the code for tokens using the PKCE verifier
8. Backend redirects to the frontend's `/auth/callback` endpoint with the access token
9. Frontend stores the token and updates the authentication state
10. Frontend fetches user information from the backend's `/api/v1/auth/session` endpoint

### Token Verification Flow

1. Frontend includes the token in the Authorization header for API requests
2. Backend verifies the token using Logto's JWKS endpoint
3. If verification fails, backend attempts to get user info directly from Logto
4. Backend extracts user information from the token or Logto response
5. Backend uses the user information to authorize the request

### Sign-Out Flow

1. User clicks "Sign Out" button in the UI
2. Frontend clears local authentication state
3. Frontend redirects to the backend's `/api/v1/auth/signout` endpoint
4. Backend logs the sign-out event
5. Backend redirects back to the frontend's home page

## Key Components

### Backend Components

#### Core Authentication Module (`backend/app/core/auth.py`)

- **LogtoSettings**: Configuration for Logto integration
- **TokenData**: Model for JWT token data
- **CustomOAuth2PasswordBearer**: Custom OAuth2 scheme that handles CORS preflight requests
- **verify_token**: Function to verify JWT tokens from Logto
- **get_user_info_from_logto**: Function to get user info directly from Logto
- **get_current_user**: Dependency to get the current authenticated user
- **has_role**: Dependency for role-based access control

#### Authentication Endpoints (`backend/app/api/v1/endpoints/auth.py`)

- **/signin**: Initiates the Logto sign-in flow with PKCE
- **/callback**: Handles the callback from Logto after authentication
- **/signout**: Signs out the current user
- **/refresh**: Refreshes the access token
- **/me**: Returns information about the current user
- **/session**: Returns the current session information
- **/token**: Returns the current access token

### Frontend Components

#### Authentication Client (`frontend/src/lib/authClient.ts`)

- **User**: Interface for user data
- **AuthClient**: Class that manages authentication state and provides methods for authentication operations
- **signIn**: Method to initiate the sign-in flow
- **signOut**: Method to sign out the user
- **refreshUser**: Method to refresh user data
- **fetchWithAuth**: Method to make authenticated API requests

#### Authentication Context (`frontend/src/contexts/logto-provider.tsx`)

- **AuthContext**: React context for authentication state
- **LogtoProvider**: Provider component for the authentication context
- **useLogtoContext**: Hook to access the authentication context

#### Authentication UI Components

- **AuthStatus**: Component that displays the current authentication status and provides sign-in/sign-out buttons
- **AuthCallbackHandler**: Component that handles the callback from the authentication flow
- **ProfilePage**: Component that displays the user's profile information

## Implementation Requirements

### Backend Requirements

1. **FastAPI**: Web framework for building the API
2. **httpx**: HTTP client for making requests to Logto
3. **python-jose**: Library for JWT handling
4. **pydantic**: Data validation and settings management

### Frontend Requirements

1. **React**: UI library
2. **React Router**: For routing and navigation
3. **Tailwind CSS**: For styling
4. **Local Storage**: For storing authentication state

## Implementation Details

### PKCE Implementation

Proof Key for Code Exchange (PKCE) is implemented to secure the authorization code flow:

1. Generate a random code verifier
2. Create a code challenge by hashing the verifier with SHA-256
3. Send the code challenge to Logto during authorization
4. Send the code verifier to Logto during token exchange

### Token Verification

The token verification process includes:

1. Check if the token has the correct JWT format (3 parts separated by dots)
2. Extract the key ID (kid) from the token header
3. Fetch the JSON Web Key Set (JWKS) from Logto
4. Find the key matching the key ID
5. Verify the token signature using the key
6. Check token expiration
7. If any step fails, fall back to getting user info directly from Logto

### Error Handling

The authentication system includes comprehensive error handling:

1. CORS preflight request handling
2. Token verification failures
3. Network errors
4. Invalid tokens
5. Expired tokens
6. Missing authentication credentials

### Security Considerations

1. HTTPS for all communication
2. PKCE for authorization code flow
3. JWT verification with JWKS
4. Token expiration checking
5. CORS configuration to prevent cross-site request forgery

## Common Issues and Solutions

### CORS Errors

**Issue**: Cross-Origin Resource Sharing (CORS) errors when making requests from the frontend to the backend.

**Solution**:

- Add OPTIONS endpoints for all authentication endpoints
- Configure CORS middleware in the backend
- Set the appropriate CORS headers in the backend responses
- Use the correct CORS origins in the backend configuration

### Token Verification Failures

**Issue**: JWT token verification fails due to various reasons (invalid format, missing key ID, etc.).

**Solution**:

- Implement a fallback mechanism to get user info directly from Logto
- Add detailed logging for token verification failures
- Handle different types of token verification errors separately

### Authentication State Management

**Issue**: Authentication state is lost on page refresh or when opening a new tab.

**Solution**:

- Store authentication state in local storage
- Implement cross-tab synchronization using the storage event
- Refresh user data when the page becomes visible

## Future Improvements

1. **HTTP-only Cookies**: Use HTTP-only cookies for more secure token storage
2. **Refresh Token Rotation**: Implement refresh token rotation for better security
3. **Role-Based Access Control**: Enhance the role-based access control system
4. **Multi-Factor Authentication**: Add support for multi-factor authentication
5. **Session Management**: Implement more robust session management
6. **Audit Logging**: Enhance audit logging for authentication events
7. **Rate Limiting**: Add rate limiting for authentication endpoints
8. **Account Linking**: Support linking multiple social accounts to a single user account

## Prompt for Recreating the Authentication System

```
Create a complete authentication system for a web application using Logto as the authentication provider. The system should include:

1. Backend (FastAPI):
   - Implement PKCE (Proof Key for Code Exchange) for secure authorization code flow
   - Create endpoints for sign-in, callback, sign-out, session, and token
   - Implement JWT verification using Logto's JWKS endpoint
   - Add a fallback mechanism to get user info directly from Logto if token verification fails
   - Handle CORS preflight requests for all authentication endpoints
   - Implement role-based access control
   - Add detailed logging for authentication events

2. Frontend (React):
   - Create an authentication client for managing authentication state
   - Implement an authentication context provider
   - Create UI components for authentication status and user profile
   - Store authentication state in local storage
   - Implement cross-tab synchronization
   - Add a "Switch Account" feature to allow users to sign in with a different account
   - Handle authentication errors gracefully

3. Authentication Flow:
   - Implement the complete authentication flow with PKCE
   - Handle token verification and user session management
   - Implement sign-out flow with proper state cleanup
   - Add profile page to display user information

4. Error Handling:
   - Handle CORS errors
   - Handle token verification failures
   - Handle network errors
   - Handle invalid or expired tokens

The system should be secure, user-friendly, and follow best practices for web authentication.
```

## Conclusion

This authentication system provides a robust, secure, and user-friendly way to authenticate users in the Particle0 application. By following the implementation details and best practices outlined in this document, you can recreate this authentication system in your own application or extend it to meet your specific requirements.
