# Development Guide

This document provides guidelines and instructions for developing the Particle0 project.

## Setting Up the Development Environment

### Prerequisites

- Node.js 18.18.0 or later
- pnpm 8.0.0 or later
- Python 3.9 or later
- Git

### First-time Setup

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd particle0
   ```

2. Set up frontend dependencies:

   ```bash
   pnpm install
   ```

3. Set up backend dependencies:

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   cd ..
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your specific values
   ```

## Development Workflow

### Running the Applications

#### Frontend (React + TypeScript)

```bash
# From the root directory
pnpm run dev:frontend

# Or directly from the frontend directory
cd frontend
pnpm run dev
```

The frontend will be available at http://localhost:3000.

#### Backend (FastAPI)

```bash
# From the root directory
pnpm run dev:backend

# Or directly from the backend directory
cd backend
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

The backend will be available at http://localhost:8000.

#### Both Frontend and Backend

```bash
# From the root directory
pnpm run dev:all
```

### Code Quality Tools

#### Linting

```bash
# Lint frontend
pnpm run lint:frontend

# Lint backend
pnpm run lint:backend

# Lint both
pnpm run lint
```

#### Formatting

```bash
# Format frontend
pnpm run format:frontend

# Format backend
pnpm run format:backend

# Format both
pnpm run format
```

#### Testing

```bash
# Test frontend
pnpm run test:frontend

# Test backend
pnpm run test:backend

# Test both
pnpm run test
```

## Project Structure

```
particle0/
├── frontend/          # React + TypeScript application
│   ├── public/        # Static assets
│   ├── src/           # Source code
│   └── ...
├── backend/           # Python FastAPI application
│   ├── app/           # Application code
│   │   ├── api/       # API endpoints
│   │   ├── core/      # Core functionality
│   │   ├── models/    # Data models
│   │   └── schemas/   # Pydantic schemas
│   ├── tests/         # Test files
│   └── ...
├── .vscode/           # VSCode workspace settings
├── .github/           # GitHub Actions workflows
└── docs/              # Project documentation
```

## Deployment

The project is configured for deployment to Vercel:

- Frontend: Automatically deployed from the `main` branch
- Backend: Deployed as serverless functions

For more details, see the CI/CD configuration in `.github/workflows/`.

## Troubleshooting

### Common Issues

1. **Port Already in Use**:

   - Frontend: Change the port by setting `PORT=3001` in your `.env` file
   - Backend: Use `--port 8001` when starting uvicorn

2. **Module Not Found Errors in Backend**:

   - Ensure your virtual environment is activated
   - Verify that all dependencies are installed: `pip install -r requirements.txt`
   - Check that the Python path is set correctly

3. **CORS Issues**:
   - Verify that the `BACKEND_CORS_ORIGINS` setting includes your frontend URL

For more troubleshooting information, see the official documentation for [FastAPI](https://fastapi.tiangolo.com/) and [Vite](https://vitejs.dev/).
