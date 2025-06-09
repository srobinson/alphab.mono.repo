# Particle0 Backend

This is the FastAPI backend for the Particle0 project, a next-generation AI-powered platform.

## Setup Instructions

### Prerequisites

- Python 3.9+ installed
- pip (Python package manager)
- virtualenv or venv for Python environment management

### Installation

1. **Create a virtual environment**:

   ```bash
   # Using venv (built into Python 3)
   python -m venv venv

   # Activate the virtual environment
   # On macOS/Linux:
   source venv/bin/activate

   # On Windows:
   venv\Scripts\activate
   ```

2. **Install dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables** (optional):

   Create a `.env` file in the backend directory with:

   ```
   PROJECT_NAME=Particle0
   BACKEND_CORS_ORIGINS=["http://localhost:3000","https://particle0.vercel.app"]
   ```

## Running the Application

### Development Server

Start the development server with hot reloading:

```bash
# From the backend directory
uvicorn app.main:app --reload --port 8000

# From the project root using pnpm
pnpm run dev:backend
```

The API will be available at:

- API: http://localhost:8000
- Interactive documentation: http://localhost:8000/docs
- Alternative documentation: http://localhost:8000/redoc

### Testing

Run the tests with:

```bash
# Run all tests
pytest

# Run with coverage report
pytest --cov=app
```

## Project Structure

```
backend/
├── app/                  # Application code
│   ├── api/              # API endpoints
│   │   └── v1/           # API version 1
│   │       ├── endpoints/    # API routes by resource
│   │       └── api.py        # API router
│   ├── core/             # Core application components
│   │   ├── config.py     # Application settings
│   │   └── ...
│   ├── models/           # Data models
│   ├── schemas/          # Pydantic schemas for validation
│   └── main.py           # Application entry point
├── tests/                # Test files
├── requirements.txt      # Python dependencies
└── pyproject.toml        # Python project configuration
```

## API Endpoints

- **GET /**: Root endpoint, returns a welcome message
- **GET /health**: Health check endpoint
- **GET /api/v1/health**: API health check endpoint
- **GET /api/v1/examples**: List example items
- **GET /api/v1/examples/{example_id}**: Get a specific example by ID

## Development Guidelines

- Use Black for code formatting
- Use Flake8 for linting
- Write tests for all new endpoints
- Follow FastAPI best practices

## Deployment

The backend is configured for deployment to Vercel as serverless functions. The deployment is handled automatically through GitHub Actions when code is merged to the main branch.
