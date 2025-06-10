# Testing Strategy for Authentication Packages

This document outlines the testing strategy for the `auth-backend` and `auth-frontend` packages, focusing on ensuring robust, secure, and reliable authentication functionality.

## 1. Auth Backend Testing

### 1.1 Unit Tests

Unit tests should cover individual components of the authentication system:

```bash
# Run unit tests
cd packages/auth-backend
python -m pytest tests/unit
```

#### Key Components to Test:

- **PKCE Utilities**

  - Test code verifier generation
  - Test code challenge generation
  - Test verification of code challenge/verifier pairs

- **HTTP Client**

  - Test proper resource management
  - Test timeout handling
  - Test connection pooling

- **Rate Limiter**

  - Test rate limiting functionality
  - Test IP-based limiting
  - Test reset behavior

- **Token Service**

  - Test token validation
  - Test token creation
  - Test token refresh
  - Test token expiration handling

- **Auth Service**

  - Test authentication flow
  - Test error handling
  - Test user information retrieval

- **Dependencies**
  - Test dependency injection
  - Test role-based access control

### 1.2 Integration Tests

Integration tests should verify that components work together correctly:

```bash
# Run integration tests
cd packages/auth-backend
python -m pytest tests/integration
```

#### Key Scenarios to Test:

- **Authentication Flow**

  - Test complete sign-in flow
  - Test callback handling
  - Test token exchange

- **Token Management**

  - Test token refresh flow
  - Test token validation flow
  - Test session management

- **Error Handling**
  - Test invalid token scenarios
  - Test expired token scenarios
  - Test rate limiting scenarios

### 1.3 API Tests

API tests should verify that the authentication endpoints work correctly:

```bash
# Run API tests
cd packages/auth-backend
python -m pytest tests/api
```

#### Key Endpoints to Test:

- **Sign-in Endpoint**

  - Test successful redirection
  - Test parameter handling
  - Test error scenarios

- **Callback Endpoint**

  - Test successful callback
  - Test error handling
  - Test PKCE validation

- **Session Endpoint**

  - Test session retrieval
  - Test unauthenticated scenarios

- **Token Validation Endpoint**
  - Test valid token scenarios
  - Test invalid token scenarios
  - Test token renewal

### 1.4 Security Tests

Security tests should verify that the authentication system is secure:

```bash
# Run security tests
cd packages/auth-backend
python -m pytest tests/security
```

#### Key Security Aspects to Test:

- **Token Security**

  - Test token signing
  - Test token validation
  - Test token expiration

- **PKCE Security**

  - Test PKCE challenge/verifier validation
  - Test protection against code interception attacks

- **Rate Limiting**

  - Test protection against brute force attacks
  - Test protection against DoS attacks

- **Error Handling**
  - Test that error responses don't leak sensitive information

### 1.5 Mocking Logto

For testing without a real Logto instance:

```python
# Example of mocking Logto in tests
@pytest.fixture
def mock_logto(monkeypatch):
    async def mock_get_user_info(*args, **kwargs):
        return {
            "sub": "test-user-id",
            "name": "Test User",
            "email": "test@example.com",
            "roles": ["user"]
        }

    monkeypatch.setattr("logto_auth.services.auth_service.get_user_info", mock_get_user_info)
```

## 2. Auth Frontend Testing

### 2.1 Unit Tests with Jest

Unit tests should cover individual components and utilities:

```bash
# Run unit tests
cd packages/auth-frontend
pnpm run test
```

#### Key Components to Test:

- **AuthService**

  - Test token management
  - Test authentication state
  - Test storage handling
  - Test token refresh

- **Hooks**

  - Test useAuth hook
  - Test authentication state management

- **Utilities**
  - Test token parsing
  - Test storage utilities

### 2.2 Component Tests

Component tests should verify that React components work correctly:

```bash
# Run component tests
cd packages/auth-frontend
pnpm run test:components
```

#### Key Components to Test:

- **AuthProvider**

  - Test context provision
  - Test authentication state management
  - Test child rendering

- **AuthCallbackHandler**

  - Test token processing
  - Test redirection
  - Test error handling

- **ProtectedRoute**
  - Test authenticated user access
  - Test unauthenticated user redirection
  - Test role-based access control

### 2.3 Integration Tests

Integration tests should verify that components work together:

```bash
# Run integration tests
cd packages/auth-frontend
pnpm run test:integration
```

#### Key Scenarios to Test:

- **Authentication Flow**

  - Test sign-in flow
  - Test callback handling
  - Test sign-out flow

- **Protected Routes**

  - Test access control
  - Test role-based protection

- **Token Refresh**
  - Test automatic token refresh
  - Test expired token handling

### 2.4 UI Testing with React Testing Library

UI tests should verify that components render correctly:

```bash
# Run UI tests
cd packages/auth-frontend
pnpm run test:ui
```

#### Key UI Aspects to Test:

- **AuthStatus Component**

  - Test authenticated state rendering
  - Test unauthenticated state rendering
  - Test loading state rendering

- **Protected Content**
  - Test content visibility based on authentication
  - Test content visibility based on roles

### 2.5 End-to-End Testing with Cypress

End-to-end tests should verify the complete authentication flow:

```bash
# Run E2E tests
cd packages/auth-frontend
pnpm run test:e2e
```

#### Key E2E Scenarios to Test:

- **Sign-in Flow**

  - Test complete sign-in flow with mock Logto
  - Test error handling
  - Test redirection

- **Protected Routes**

  - Test access to protected routes
  - Test redirection to login

- **Sign-out Flow**
  - Test sign-out functionality
  - Test state clearing
  - Test redirection

### 2.6 Mocking the Backend

For testing without a real backend:

```typescript
// Example of mocking the backend in tests
const mockAuthService = {
  signIn: jest.fn(),
  signOut: jest.fn(),
  getUser: jest.fn().mockReturnValue({
    id: "test-user-id",
    name: "Test User",
    email: "test@example.com",
    roles: ["user"],
  }),
  getIsAuthenticated: jest.fn().mockReturnValue(true),
  refreshUser: jest.fn(),
};

jest.mock("../src/services/authService", () => ({
  AuthService: jest.fn().mockImplementation(() => mockAuthService),
}));
```

## 3. Test Coverage

Aim for high test coverage for both packages:

```bash
# Backend coverage
cd packages/auth-backend
python -m pytest --cov=logto_auth

# Frontend coverage
cd packages/auth-frontend
pnpm run test:coverage
```

Target coverage metrics:

- **Statements**: 90%+
- **Branches**: 85%+
- **Functions**: 90%+
- **Lines**: 90%+

## 4. Continuous Integration

Set up CI workflows to run tests automatically:

```yaml
# Example GitHub Actions workflow
name: Test Authentication Packages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: "3.9"
      - name: Install dependencies
        run: |
          cd packages/auth-backend
          pip install -e .
          pip install pytest pytest-cov
      - name: Run tests
        run: |
          cd packages/auth-backend
          python -m pytest --cov=logto_auth

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: "18"
      - name: Install dependencies
        run: |
          cd packages/auth-frontend
          npm install
      - name: Run tests
        run: |
          cd packages/auth-frontend
          npm run test:coverage
```

## 5. Recommended Testing Tools

### 5.1 Backend Testing

- **pytest**: Main testing framework
- **pytest-asyncio**: For testing async functions
- **pytest-cov**: For coverage reporting
- **pytest-mock**: For mocking dependencies
- **httpx**: For testing HTTP requests
- **respx**: For mocking HTTP responses

### 5.2 Frontend Testing

- **Jest**: Main testing framework
- **React Testing Library**: For testing React components
- **MSW (Mock Service Worker)**: For mocking API requests
- **Cypress**: For end-to-end testing
- **jest-localstorage-mock**: For mocking localStorage
- **@testing-library/user-event**: For simulating user interactions

## 6. Implementation Plan

1. **Set up testing infrastructure**:

   - Configure Jest for frontend
   - Configure pytest for backend
   - Set up coverage reporting

2. **Implement unit tests**:

   - Start with core utilities and services
   - Move to components and hooks

3. **Implement integration tests**:

   - Test authentication flows
   - Test token management

4. **Implement UI and E2E tests**:

   - Test component rendering
   - Test complete authentication flows

5. **Set up CI pipeline**:
   - Configure GitHub Actions
   - Set up test reporting

## 7. Conclusion

A comprehensive testing strategy is essential for ensuring the reliability and security of authentication packages. By implementing the testing approach outlined in this document, we can have confidence in the quality of our authentication system.

Remember that authentication is a critical security component, so thorough testing is non-negotiable. Prioritize security tests and ensure that all edge cases are covered.
