# particle0

```
make beautiful things
```

A next-generation AI-powered platform with a microservices architecture, featuring a Python FastAPI backend and a React + TypeScript frontend. This monorepo contains the Alphab Molecule/Vault POC implementation.

## Features

- **Modern Authentication** - Secure authentication with Logto SSO integration, OAuth2 PKCE flows, and role-based access control
- **React Frontend** - TypeScript-based React application with a modern component library
- **FastAPI Backend** - High-performance Python API with automatic documentation
- **Responsive Design** - Mobile-first design approach with Tailwind CSS

## Project Structure

```
particle0/
├── packages/                  # Reusable packages
│   ├── auth-backend/          # Reusable authentication backend package
│   ├── auth-frontend/         # Reusable authentication frontend package
│   ├── particle0-api/     # Migrated backend using auth-backend
│   └── particle0-frontend/    # Migrated frontend using auth-frontend
├── .vscode/                   # VSCode workspace settings
├── .github/                   # GitHub Actions workflows
└── DOCS/                      # Project documentation
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

2. **Quick Start (Recommended):**

   ```bash
   # Bootstrap everything automatically
   pnpm run bootstrap

   # Start development
   pnpm run dev:packages
   ```

3. **Manual Setup:**

   ```bash
   # From project root
   pnpm install

   # For original frontend
   pnpm run dev:frontend

   # For new packages
   pnpm run dev:packages
   ```

4. **Backend Setup:**

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

   # Or for the new backend package
   # cd ..
   # pnpm run dev:particle0-api
   ```

   The backend API will be available at:

   - API: http://localhost:8000
   - Interactive documentation: http://localhost:8000/docs

5. **Running both concurrently:**
   ```bash
   # From project root after setting up backend venv
   pnpm run dev:all
   ```

## Available Scripts

### Root Level

- `pnpm run dev:all` - Run both original frontend and backend concurrently
- `pnpm run dev:packages` - Run both new frontend and backend packages concurrently
- `pnpm run lint` - Lint all code
- `pnpm run format` - Format all code
- `pnpm run build` - Build all packages with smart state detection
- `pnpm run test` - Test all packages
- `pnpm run bootstrap` - Bootstrap all packages with automatic dependency installation
- `pnpm run clean` - Clean build artifacts
- `pnpm run clean --deep` - Deep clean including pnpm-lock.yaml and node_modules

### Smart Build System

The project now includes an intelligent build system that:

- 🧠 **Detects repository state** and provides helpful suggestions
- 🔧 **Auto-fixes common issues** like missing dependencies
- 💡 **Provides actionable advice** when problems are detected
- 🎯 **Works consistently** across all package types

Example output:

```bash
🚀 Running build...

🔍 Repository State Issues Detected:
  ❌ Root pnpm-lock.yaml is missing

💡 Suggestions:
  💡 Run 'pnpm install' from the root directory

📦 Package: @alphab/logging-ui (typescript-library)
```

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

For detailed documentation, see the `DOCS/` directory:

- Architecture overview
- [Authentication system](DOCS/AUTHENTICATION.md)
- [Authentication refactoring](DOCS/AUTH_REFACTORING.md)
- [Testing strategy](DOCS/TESTING_STRATEGY.md)
- API documentation
- Development guidelines
- Deployment procedures

## Packages

The project includes several reusable packages:

### auth-backend

A reusable authentication package for FastAPI applications using Logto as the authentication provider.

[View auth-backend documentation](packages/auth-backend/README.md)

### auth-frontend

A reusable authentication package for React applications using Logto as the authentication provider.

[View auth-frontend documentation](packages/auth-frontend/README.md)

### particle0-api

The backend service for the Particle0 application, built with FastAPI and using the `auth-backend` package.

[View particle0-api documentation](packages/particle0-api/README.md)

### particle0-frontend

The frontend application for the Particle0 platform, built with React, TypeScript, and Vite, using the `auth-frontend` package.

[View particle0-frontend documentation](packages/particle0-frontend/README.md)

## Migration to Packages Structure

The project is being migrated from the original structure (with separate `frontend` and `backend` directories) to a packages-based structure. This migration provides several benefits:

1. **Reusable Components**: Common functionality like authentication is extracted into reusable packages
2. **Better Organization**: Related code is grouped together in dedicated packages
3. **Easier Maintenance**: Each package has its own tests, documentation, and dependencies
4. **Improved Collaboration**: Teams can work on different packages independently

### Migration Process

To migrate the codebase to the new structure:

1. Run the migration script:

   ```bash
   ./migrate-to-packages.sh
   ```

2. Review the migrated code and fix any import issues

3. Test the new package structure:

   ```bash
   pnpm run dev:packages
   ```

4. Once everything is working, you can remove the old frontend and backend directories

### Post-Migration Structure

After migration, the project structure will be:

```
particle0/
├── packages/                  # All code lives here
│   ├── auth-backend/          # Reusable authentication backend package
│   ├── auth-frontend/         # Reusable authentication frontend package
│   ├── particle0-api/     # Main backend application
│   └── particle0-frontend/    # Main frontend application
├── DOCS/                      # Project documentation
└── ... (configuration files)
```

## License

[License information]

## Advanced Usage

### Test specific packages

```bash
pnpm run test --filter="@alphab/logging*"
```

### Test by type

```bash
# Test UI packages only
pnpm run test --filter="*-ui"

# Test non-UI packages
pnpm run test --filter="!*-ui"
```

### Test specific apps

```bash
pnpm run test --filter="@alphab.project/particle0*"
```

### Bootstrap with dev dependencies for Python packages

```bash
pnpm run bootstrap --with-dev --filter="@alphab/logging" --filter="@alphab/http-client"
```

### Troubleshooting

If you encounter dependency issues:

```bash
# Deep clean and rebuild everything
pnpm run clean --deep
pnpm run bootstrap

# Or for specific packages
pnpm run clean --filter="@alphab/logging-ui"
pnpm run bootstrap --filter="@alphab/logging-ui"
```

The smart build system will automatically detect and suggest fixes for common issues.
