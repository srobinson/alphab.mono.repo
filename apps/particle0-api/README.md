# Particle0 Backend

This is the backend service for the Particle0 application, built with FastAPI and using the `logto-auth` package for authentication.

## Features

- FastAPI-based REST API
- Authentication via Logto
- Role-based access control
- API documentation with Swagger UI
- Environment-based configuration

## Installation

```bash
# From the root of the monorepo
cd packages/particle0-api

# Create a virtual environment
python -m venv .venv

# Activate the virtual environment
# On macOS/Linux:
source .venv/bin/activate
# On Windows:
# .venv\Scripts\activate

# Install dependencies
pip install -e .
```

## Configuration

Create a `.env` file in the `packages/particle0-api` directory with the following content:

```
# Application Settings
PROJECT_NAME=Particle0
API_V1_STR=/api/v1
BACKEND_CORS_ORIGINS=["http://localhost:3000","https://particle0.vercel.app"]

# JWT Settings
JWT_SECRET_KEY=change-this-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Logto Settings
LOGTO_ENDPOINT=https://logto.dev
LOGTO_APP_ID=your-logto-app-id
LOGTO_APP_SECRET=your-logto-app-secret
LOGTO_REDIRECT_URI=http://localhost:3000/auth/callback
```

## Development

To run the development server:

```bash
# From the root of the monorepo
pnpm run dev:particle0-api

# Or directly
cd packages/particle0-api
python -m uvicorn app.main:app --reload --port 8000
```

The API will be available at:

- API: http://localhost:8000
- Interactive documentation: http://localhost:8000/docs

## API Endpoints

### Health Check

- `GET /api/v1/health` - Check if the API is running

### Example

- `GET /api/v1/example` - Example endpoint (requires authentication)

## Authentication

Authentication is handled by the `logto-auth` package. The following endpoints are available:

- `GET /api/v1/auth/signin` - Redirect to Logto for authentication
- `GET /api/v1/auth/callback` - Handle the authentication callback from Logto
- `GET /api/v1/auth/signout` - Sign out the user
- `GET /api/v1/auth/session` - Get the current session information
- `GET /api/v1/auth/refresh` - Refresh the access token
- `GET /api/v1/auth/validate-token` - Validate the access token

## Testing

To run the tests:

```bash
# From the root of the monorepo
pnpm run test:particle0-api

# Or directly
cd packages/particle0-api
python -m pytest
```

## License

MIT
