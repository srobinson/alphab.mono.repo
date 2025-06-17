# Logto Auth Package - Example Application

This directory contains a runnable FastAPI application that demonstrates how to use the `logto_auth` library.

## How to Run

### 1. Prerequisites

- Python 3.8+
- [Poetry](https://python-poetry.org/) for dependency management.

### 2. Installation

From the root of the `auth-backend` package (`packages/auth-backend`), install the necessary dependencies:

```bash
poetry install
```

This will install FastAPI, Uvicorn, `python-dotenv`, and other required packages.

### 3. Environment Configuration

The example application is configured using environment variables.

First, copy the example environment file to a new `.env` file within this `example` directory:

```bash
cp .env.example .env
```

Next, open the `.env` file and fill in the placeholder values with your actual Logto application details. You can find these values in your Logto console.

- **`LOGTO_ENDPOINT`**: The issuer URL for your Logto tenant (e.g., `https://<your-tenant-id>.logto.app/oidc`).
- **`LOGTO_APP_ID`**: The App ID of your Logto application.
- **`LOGTO_APP_SECRET`**: The App Secret for your Logto application.
- **`LOGTO_API_RESOURCE`**: The API Identifier (Audience) for the API Resource you want to protect. This is crucial for obtaining JWTs.
- **`JWT_SECRET_KEY`**: A strong secret key used by this application for signing its own tokens. You can generate one with `openssl rand -hex 32`.

### 4. Running the Server

Once your `.env` file is configured, you can run the example server from within the `packages/auth-backend/example` directory using `uvicorn`:

```bash
uvicorn main:app --reload
```

The server will start, typically on `http://localhost:8000`.

### 5. Testing the Endpoints

- **Public Endpoint**: Navigate to `http://localhost:8000/` in your browser. You should see `{"message":"Welcome to the Logto Auth Example"}`.
- **Authentication Flow**:
  - Go to `http://localhost:8000/auth/signin` to initiate the Logto login flow.
  - After logging in, you will be redirected back, and the frontend (if running) will handle the token.
- **Protected Endpoint**:
  - To test the JWT-protected route, obtain a JWT by completing the sign-in flow (making sure `LOGTO_API_RESOURCE` is set).
  - Use a tool like `curl` or Postman to make a request to `http://localhost:8000/protected`, including the `Authorization: Bearer <your-jwt>` header.
