# particle0

A next-generation AI-powered platform with a microservices architecture, featuring a Python FastAPI backend and a React + TypeScript frontend. This monorepo contains the Alphab Molecule/Vault POC implementation.

## Project Structure

```
particle0/
├── frontend/        # React + TypeScript application
├── backend/         # Python FastAPI application
├── .vscode/         # VSCode workspace settings
├── .github/         # GitHub Actions workflows
└── docs/            # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (version specified in `.nvmrc`)
- Python 3.9+ (version specified in `backend/pyproject.toml`)
- pnpm 8.0.0+ (preferred package manager)
- VSCode with recommended extensions
- Git

### Development Setup

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd particle0
   ```

2. **Frontend Setup:**

   ```bash
   # From project root
   pnpm install
   pnpm run dev:frontend
   ```

3. **Backend Setup:**

   ```bash
   cd backend

   # Create a virtual environment
   python -m venv venv

   # Activate the virtual environment
   # On macOS/Linux:
   source venv/bin/activate
   # On Windows:
   # venv\Scripts\activate

   # Install dependencies
   pip install -r requirements.txt

   # Run the development server
   uvicorn app.main:app --reload --port 8000

   # Or go back to root and run
   # cd ..
   # pnpm run dev:backend
   ```

   The backend API will be available at:

   - API: http://localhost:8000
   - Interactive documentation: http://localhost:8000/docs

4. **Running both concurrently:**
   ```bash
   # From project root after setting up backend venv
   pnpm run dev:all
   ```

## Available Scripts

### Root Level

- `pnpm run dev:all` - Run both frontend and backend concurrently
- `pnpm run lint` - Lint all code
- `pnpm run format` - Format all code

### Frontend

- `pnpm run dev` - Start the development server
- `pnpm run build` - Build for production
- `pnpm run lint` - Lint frontend code
- `pnpm run format` - Format frontend code
- `pnpm run test` - Run tests

### Backend

- `uvicorn app.main:app --reload` - Start the development server
- `pytest` - Run tests
- `black .` - Format backend code
- `flake8` - Lint backend code

## IDE Setup

### VSCode Extensions

- ESLint
- Prettier
- Python
- Pylance
- GitLens
- cspell
- EditorConfig

Enable the provided workspace settings by opening the project in VSCode.

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run linting and tests
4. Submit a pull request

## CI/CD

The project uses GitHub Actions for CI/CD:

- Linting and testing on pull requests
- Automatic deployment to Vercel on main branch merges

## Documentation

For detailed documentation, see the `docs/` directory:

- Architecture overview
- API documentation
- Development guidelines
- Deployment procedures

## License

[License information]
