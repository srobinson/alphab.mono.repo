#!/bin/bash

# Alphab Monorepo Naming Convention Migration Script
# This script implements the complete naming convention strategy

set -e # Exit on any error

echo "🚀 Starting Alphab Monorepo Naming Convention Migration..."

# Phase 1: Rename Python modules
echo "📦 Phase 1: Renaming Python modules..."

# Rename logto_auth to alphab_logto
if [ -d "packages/auth-logto-backend/logto_auth" ]; then
  echo "  ✅ Renaming logto_auth → alphab_logto"
  mv packages/auth-logto-backend/logto_auth packages/auth-logto-backend/alphab_logto
fi

# Rename particle0_backend to alphab_particle0
if [ -d "packages/particle0-backend/particle0_backend" ]; then
  echo "  ✅ Renaming particle0_backend → alphab_particle0"
  mv packages/particle0-backend/particle0_backend packages/particle0-backend/alphab_particle0
fi

# Phase 2: Update package.json files
echo "📝 Phase 2: Updating package.json files..."

# Update auth-logto-frontend package.json
cat > packages/auth-logto-frontend/package.json << 'EOF'
{
  "name": "@alphab/logto-ui",
  "version": "0.1.0",
  "description": "Reusable Logto authentication components for React applications",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist"
  ],
  "scripts": {
    "bootstrap": "pnpm install",
    "build": "tsc",
    "lint": "eslint src --ext .ts,.tsx",
    "test": "jest"
  },
  "keywords": [
    "alphab",
    "authentication",
    "logto",
    "react"
  ],
  "author": "Alphab <info@alphab.dev>",
  "license": "MIT",
  "peerDependencies": {
    "react": ">=16.8.0",
    "react-dom": ">=16.8.0",
    "react-router-dom": ">=6.0.0"
  },
  "dependencies": {
    "jwt-decode": "^3.1.2",
    "tailwindcss": ">=3.0.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/react": "^18.0.28",
    "@types/react-dom": "^18.0.11",
    "@typescript-eslint/eslint-plugin": "^5.57.1",
    "@typescript-eslint/parser": "^5.57.1",
    "eslint": "^8.38.0",
    "eslint-plugin-react": "^7.32.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "jest": "^29.5.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.10.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.4"
  }
}
EOF

# Update auth-logto-backend package.json
cat > packages/auth-logto-backend/package.json << 'EOF'
{
  "name": "@alphab/auth-logto-backend",
  "version": "0.1.0",
  "description": "Reusable Logto authentication package for FastAPI applications",
  "private": true,
  "scripts": {
    "bootstrap": "python -m venv .venv && source .venv/bin/activate && poetry lock && poetry install",
    "build": "poetry build",
    "lint": "flake8 . --count --show-source --statistics",
    "format": "black .",
    "test": "python -m pytest"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@9.15.0"
}
EOF

# Update particle0-frontend package.json
if [ -f "packages/particle0-frontend/package.json" ]; then
  # Read current package.json and update name
  python3 -c "
import json
import sys

with open('packages/particle0-frontend/package.json', 'r') as f:
    data = json.load(f)

data['name'] = '@alphab/particle0-frontend'
if 'keywords' not in data:
    data['keywords'] = []
if 'alphab' not in data['keywords']:
    data['keywords'].insert(0, 'alphab')

with open('packages/particle0-frontend/package.json', 'w') as f:
    json.dump(data, f, indent=2)
"
fi

# Update particle0-backend package.json
if [ -f "packages/particle0-backend/package.json" ]; then
  python3 -c "
import json

with open('packages/particle0-backend/package.json', 'r') as f:
    data = json.load(f)

data['name'] = '@alphab/particle0-backend'

with open('packages/particle0-backend/package.json', 'w') as f:
    json.dump(data, f, indent=2)
"
fi

# Phase 3: Update pyproject.toml files
echo "🐍 Phase 3: Updating pyproject.toml files..."

# Update auth-logto-backend pyproject.toml
cat > packages/auth-logto-backend/pyproject.toml << 'EOF'
[project]
name = "alphab-auth-logto"
version = "0.1.0"
description = "A reusable Logto authentication package for FastAPI applications"
readme = "README.md"
requires-python = ">=3.9,<3.13"
license = { text = "MIT" }
authors = [{ name = "Alphab", email = "info@alphab.io" }]
classifiers = [
  "Development Status :: 3 - Alpha",
  "Intended Audience :: Developers",
  "License :: OSI Approved :: MIT License",
  "Programming Language :: Python :: 3",
  "Programming Language :: Python :: 3.9",
  "Programming Language :: Python :: 3.10",
  "Programming Language :: Python :: 3.11",
]
dependencies = [
  "fastapi>=0.95.0",
  "httpx>=0.24.0",
  "pydantic>=2.0.0",
  "starlette>=0.27.0",
  "python-jose[cryptography] (>=3.5.0,<4.0.0)",
]

[project.optional-dependencies]
jwt = ["pyjwt>=2.6.0"]
dev = [
  "black>=23.3.0",
  "isort>=5.12.0",
  "mypy>=1.2.0",
  "pytest>=7.3.1",
  "pytest-asyncio>=0.21.0",
  "pytest-cov>=4.1.0",
]

[build-system]
requires = ["poetry-core>=2.0.0,<3.0.0"]
build-backend = "poetry.core.masonry.api"

[tool.poetry]
name = "alphab-auth-logto"
version = "0.1.0"

[tool.black]
line-length = 120
target-version = ["py38"]

[tool.isort]
profile = "black"
line_length = 120
multi_line_output = 3
include_trailing_comma = true
known_third_party = ["django", "flask"]
sections = ["FUTURE", "STDLIB", "THIRDPARTY", "FIRSTPARTY", "LOCALFOLDER"]

[tool.mypy]
python_version = "3.12"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
disallow_incomplete_defs = true

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = "test_*.py"
python_functions = "test_*"
EOF

# Update particle0-backend pyproject.toml
if [ -f "packages/particle0-backend/pyproject.toml" ]; then
  python3 -c "
import re

with open('packages/particle0-backend/pyproject.toml', 'r') as f:
    content = f.read()

# Update project name
content = re.sub(r'name = \".*\"', 'name = \"alphab-particle0\"', content)

with open('packages/particle0-backend/pyproject.toml', 'w') as f:
    f.write(content)
"
fi

# Phase 4: Update import statements
echo "🔄 Phase 4: Updating import statements..."

# Update Python imports in auth-logto-backend
find packages/auth-logto-backend -name "*.py" -type f -exec sed -i '' 's/from logto_auth\./from alphab_logto./g' {} \;
find packages/auth-logto-backend -name "*.py" -type f -exec sed -i '' 's/import logto_auth/import alphab_logto/g' {} \;

# Update Python imports in particle0-backend
find packages/particle0-backend -name "*.py" -type f -exec sed -i '' 's/from particle0_backend\./from alphab_particle0./g' {} \;
find packages/particle0-backend -name "*.py" -type f -exec sed -i '' 's/import particle0_backend/import alphab_particle0/g' {} \;
find packages/particle0-backend -name "*.py" -type f -exec sed -i '' 's/from logto_auth/from alphab_logto/g' {} \;

# Update TypeScript imports
find packages -name "*.ts" -o -name "*.tsx" -type f -exec sed -i '' "s/'auth-frontend'/'@alphab\/auth-logto-frontend'/g" {} \;

# Phase 5: Update root package.json
echo "📋 Phase 5: Updating root package.json..."

python3 -c "
import json

with open('package.json', 'r') as f:
    data = json.load(f)

# Update name and description
data['name'] = '@alphab/monorepo'
data['description'] = 'Alphab Monorepo - Multi-project workspace with shared packages'

# Update scripts to use new package names
if 'scripts' in data:
    scripts = data['scripts']

    # Update dev scripts
    if 'dev:particle0-backend' in scripts:
        scripts['dev:particle0-backend'] = 'cd packages/particle0-backend && python uvicorn alphab_particle0.main:app --reload --port 8000'

    # Update format scripts
    if 'format:auth-backend' in scripts:
        scripts['format:auth-logto-backend'] = scripts.pop('format:auth-backend')
        scripts['format:auth-logto-backend'] = 'cd packages/auth-logto-backend && black .'

    # Update test scripts
    if 'test:auth-backend' in scripts:
        scripts['test:auth-logto-backend'] = scripts.pop('test:auth-backend')
        scripts['test:auth-logto-backend'] = 'cd packages/auth-logto-backend && python -m pytest'

    if 'test:auth-frontend' in scripts:
        scripts['test:auth-logto-frontend'] = scripts.pop('test:auth-frontend')
        scripts['test:auth-logto-frontend'] = 'cd packages/auth-logto-frontend && pnpm run test'

with open('package.json', 'w') as f:
    json.dump(data, f, indent=2)
"

# Phase 6: Fix critical security issues
echo "🔒 Phase 6: Fixing critical security issues..."

# Remove console.log statements from auth service
if [ -f "packages/auth-logto-frontend/src/services/authService.ts" ]; then
  # Replace console.log with proper logging
  sed -i '' 's/console\.log(/\/\/ TODO: Replace with proper logging - console.log(/g' packages/auth-logto-frontend/src/services/authService.ts
  sed -i '' 's/console\.error(/\/\/ TODO: Replace with proper logging - console.error(/g' packages/auth-logto-frontend/src/services/authService.ts
fi

# Remove print statements from backend
find packages -name "*.py" -type f -exec sed -i '' 's/print(/# TODO: Replace with proper logging - print(/g' {} \;

# Phase 7: Update README files
echo "📚 Phase 7: Updating README files..."

# Update auth-logto-backend README
cat > packages/auth-logto-backend/README.md << 'EOF'
# @alphab/auth-logto-backend

A reusable Logto authentication package for FastAPI applications.

## Installation

```bash
pip install alphab-auth-logto
```

## Usage

```python
from fastapi import FastAPI
from alphab_logto import setup_auth, LogtoAuthConfig

app = FastAPI()

auth_config = LogtoAuthConfig(
    endpoint="https://your-logto-endpoint.com",
    app_id="your-app-id",
    app_secret="your-app-secret",
    redirect_uri="http://localhost:3000/auth/callback",
    jwt_secret_key="your-jwt-secret",
    cors_origins=["http://localhost:3000"]
)

setup_auth(app, auth_config)
```

## Features

- PKCE-based OAuth2 flow
- JWT token validation
- User session management
- Rate limiting
- Comprehensive error handling

## Development

```bash
# Install dependencies
poetry install

# Run tests
python -m pytest

# Format code
black .
```
EOF

# Update auth-logto-frontend README
cat > packages/auth-logto-frontend/README.md << 'EOF'
# @alphab/logto-ui

Reusable Logto authentication components for React applications.

## Installation

```bash
npm install @alphab/logto-ui
```

## Usage

```tsx
import { AuthProvider, useAuth, ProtectedRoute } from '@alphab/logto-ui';

function App() {
  const authConfig = {
    apiUrl: 'http://localhost:8000/api/v1',
    logtoEndpoint: 'https://your-logto-endpoint.com',
    appId: 'your-app-id',
  };

  return (
    <AuthProvider config={authConfig}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
```

## Features

- React Context-based authentication
- Protected routes with role-based access
- Automatic token refresh
- TypeScript support
- Tailwind CSS integration

## Development

```bash
# Install dependencies
pnpm install

# Build package
pnpm build

# Run tests
pnpm test
```
EOF

echo "✅ Migration completed successfully!"
echo ""
echo "📋 Summary of changes:"
echo "  ✅ Renamed packages to follow @alphab scoped naming"
echo "  ✅ Updated Python modules with alphab_ prefix"
echo "  ✅ Updated all package.json and pyproject.toml files"
echo "  ✅ Updated import statements across codebase"
echo "  ✅ Fixed critical security issues (debug logging)"
echo "  ✅ Updated README files with new package names"
echo ""
echo "🚀 Next steps:"
echo "  1. Run 'pnpm install' to update dependencies"
echo "  2. Test the applications to ensure everything works"
echo "  3. Commit the changes to version control"
echo "  4. Update CI/CD pipelines with new package names"
echo ""
echo "🎉 Your Alphab monorepo is now following 2025 industry best practices!"
