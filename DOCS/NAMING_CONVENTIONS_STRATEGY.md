# Naming Conventions & Package Structure Strategy

**Project**: Alphab Monorepo
**Date**: December 6, 2025
**Scope**: Comprehensive naming conventions following 2025 industry best practices

## Executive Summary

This document establishes standardized naming conventions for the Alphab monorepo, addressing inconsistencies in package names, directory structures, and module organization. The strategy follows modern industry best practices for 2025, emphasizing clarity, consistency, and scalability.

## Current State Analysis

### 🔴 Critical Naming Issues Identified

#### Package Naming Inconsistencies

```
Current Structure:
├── packages/
│   ├── auth-backend/           # kebab-case
│   ├── auth-frontend/          # kebab-case
│   ├── particle0-backend/      # kebab-case with number
│   └── particle0-frontend/     # kebab-case with number

Issues:
- Inconsistent with Python package naming (should use underscores)
- "particle0" suggests this is the only project (it's not)
- Generic "auth" doesn't indicate it's Logto-specific
- No clear organization/scoping strategy
```

#### Module Structure Inconsistencies

```python
# Backend packages use different patterns:
packages/auth-backend/logto_auth/          # snake_case (correct for Python)
packages/particle0-backend/particle0_backend/  # snake_case but redundant naming
```

#### Source Directory Inconsistencies

```
auth-backend/logto_auth/           # Direct module
particle0-backend/particle0_backend/  # Direct module
auth-frontend/src/                 # Has src/ directory
particle0-frontend/src/            # Has src/ directory
```

## 2025 Industry Best Practices

### 1. Monorepo Package Naming Standards

#### Recommended Pattern: Scoped Packages

```
@alphab/auth-logto-backend
@alphab/logto-ui
@alphab/particle0-backend
@alphab/particle0-frontend
@alphab/shared-types
@alphab/shared-utils
```

#### Benefits:

- **Namespace Protection**: Prevents naming conflicts
- **Clear Ownership**: Immediately identifies Alphab packages
- **Scalability**: Easy to add new projects/domains
- **Industry Standard**: Follows npm scoped package conventions

### 2. Directory Structure Standards

#### Backend Packages (Python)

```
packages/
├── auth-logto-backend/
│   ├── pyproject.toml
│   ├── README.md
│   ├── alphab_logto/          # Main module (snake_case)
│   │   ├── __init__.py
│   │   ├── services/
│   │   ├── models/
│   │   ├── utils/
│   │   └── exceptions/
│   ├── tests/
│   └── examples/
```

#### Frontend Packages (TypeScript)

```
packages/
├── auth-logto-frontend/
│   ├── package.json
│   ├── README.md
│   ├── src/                        # Standard src/ directory
│   │   ├── index.ts               # Main export
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── dist/                      # Build output
│   └── tests/
```

### 3. Application Packages

```
packages/
├── particle0-backend/
│   ├── pyproject.toml
│   ├── alphab_particle0/          # Main module
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI app
│   │   ├── api/
│   │   ├── core/
│   │   └── models/
│   └── tests/
├── particle0-frontend/
│   ├── package.json
│   ├── src/
│   │   ├── main.tsx              # Entry point
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── utils/
│   └── dist/
```

## Proposed Naming Convention Standards

### 1. Package Names

#### Format: `{domain}-{technology}-{type}`

```yaml
# Shared/Library Packages
auth-logto-backend: # Authentication using Logto for backend
auth-logto-frontend: # Authentication using Logto for frontend
ui-components: # Shared UI components
shared-types: # Shared TypeScript types
shared-utils: # Shared utilities

# Application Packages
particle0-backend: # Particle0 application backend
particle0-frontend: # Particle0 application frontend
analytics-backend: # Future analytics application backend
analytics-frontend: # Future analytics application frontend

# Infrastructure Packages
deploy-scripts: # Deployment scripts
dev-tools: # Development tools
```

### 2. Python Module Names

#### Convention: `alphab_{domain}_{technology}`

```python
# Library modules
alphab_logto/      # Authentication with Logto
alphab_ui_components/   # UI components (if Python-based)
alphab_shared_utils/    # Shared utilities

# Application modules
alphab_particle0/       # Particle0 application
alphab_analytics/       # Analytics application
```

### 3. TypeScript Package Names

#### Convention: `@alphab/{domain}-{technology}-{type}`

```json
{
  "name": "@alphab/logto-ui",
  "name": "@alphab/particle0-frontend",
  "name": "@alphab/shared-types",
  "name": "@alphab/ui-components"
}
```

### 4. File and Directory Naming

#### Python (snake_case)

```python
# Files
auth_service.py
token_service.py
user_models.py

# Directories
services/
models/
utils/
exceptions/
```

#### TypeScript (camelCase for files, kebab-case for directories)

```typescript
// Files
AuthService.ts
TokenService.ts
userModels.ts

// Directories
components/
services/
utils/
types/
```

### 5. Class and Function Naming

#### Python (PascalCase for classes, snake_case for functions)

```python
class AuthService:
    def initiate_signin(self):
        pass

class TokenService:
    def validate_token(self):
        pass
```

#### TypeScript (PascalCase for classes/components, camelCase for functions)

```typescript
class AuthService {
  initiateSignin(): void {}
}

export function validateToken(): boolean {}

// React Components (PascalCase)
export function AuthProvider(): JSX.Element {}
export function ProtectedRoute(): JSX.Element {}
```

## Migration Strategy

### Phase 1: Package Renaming (Week 1)

#### Step 1: Rename Package Directories

```bash
# Current → New
packages/auth-backend/           → packages/auth-logto-backend/
packages/auth-frontend/          → packages/auth-logto-frontend/
packages/particle0-backend/      → packages/particle0-backend/ (keep)
packages/particle0-frontend/     → packages/particle0-frontend/ (keep)
```

#### Step 2: Update Python Module Names

```bash
# Inside auth-logto-backend/
logto_auth/                      → alphab_logto/

# Inside particle0-backend/
particle0_backend/               → alphab_particle0/
```

#### Step 3: Update Package Configurations

**Python packages (pyproject.toml):**

```toml
[project]
name = "alphab-auth-logto"
# Update all imports and references
```

**TypeScript packages (package.json):**

```json
{
  "name": "@alphab/logto-ui",
  "main": "dist/index.js",
  "types": "dist/index.d.ts"
}
```

### Phase 2: Source Structure Standardization (Week 2)

#### Backend Structure Standardization

```bash
# Ensure all Python packages follow:
packages/{package-name}/
├── pyproject.toml
├── README.md
├── alphab_{module_name}/        # Main module
│   ├── __init__.py
│   └── ...
├── tests/
└── examples/
```

#### Frontend Structure Standardization

```bash
# Ensure all TypeScript packages follow:
packages/{package-name}/
├── package.json
├── README.md
├── src/                         # Always use src/
│   ├── index.ts                # Main export
│   └── ...
├── dist/                       # Build output
└── tests/
```

### Phase 3: Import Updates (Week 3)

#### Update All Import Statements

```python
# Old imports
from logto_auth.services import AuthService
from particle0_backend.main import app

# New imports
from alphab_logto.services import AuthService
from alphab_particle0.main import app
```

```typescript
// Old imports
import { AuthService } from "auth-frontend";

// New imports
import { AuthService } from "@alphab/logto-ui";
```

#### Update Configuration Files

```json
// package.json workspace configuration
{
  "workspaces": ["packages/*"],
  "dependencies": {
    "@alphab/logto-ui": "workspace:*"
  }
}
```

## Implementation Checklist

### ✅ Package Structure

- [ ] Rename package directories following new convention
- [ ] Update Python module names to use `alphab_` prefix
- [ ] Standardize src/ directory usage in frontend packages
- [ ] Update all pyproject.toml and package.json files

### ✅ Import Updates

- [ ] Update all Python imports to use new module names
- [ ] Update all TypeScript imports to use scoped package names
- [ ] Update workspace dependencies in root package.json
- [ ] Update import statements in documentation

### ✅ Configuration Updates

- [ ] Update CI/CD scripts with new package names
- [ ] Update deployment configurations
- [ ] Update development scripts in package.json
- [ ] Update IDE configurations and settings

### ✅ Documentation Updates

- [ ] Update README files with new package names
- [ ] Update API documentation
- [ ] Update developer setup instructions
- [ ] Update architecture diagrams

## Benefits of New Naming Convention

### 1. **Clarity and Consistency**

- Immediately identifies Alphab packages vs external dependencies
- Consistent naming patterns across all packages
- Clear separation between library and application packages

### 2. **Scalability**

- Easy to add new domains (auth, analytics, ml, etc.)
- Clear technology indicators (logto, postgres, redis, etc.)
- Supports multiple applications in the monorepo

### 3. **Developer Experience**

- Predictable import paths
- Clear package purposes from names
- Easier IDE autocomplete and navigation

### 4. **Industry Alignment**

- Follows npm scoped package conventions
- Aligns with Python PEP 8 naming guidelines
- Matches modern monorepo best practices

## Future Package Examples

### Potential New Packages

```
# Authentication domain
@alphab/logto-ui
@alphab/auth-logto-backend
@alphab/auth-oauth-backend
@alphab/auth-saml-backend

# UI domain
@alphab/ui-components
@alphab/ui-themes
@alphab/ui-icons

# Data domain
@alphab/data-postgres-backend
@alphab/data-redis-backend
@alphab/data-analytics-frontend

# Applications
@alphab/particle0-frontend
@alphab/particle0-backend
@alphab/analytics-frontend
@alphab/analytics-backend
@alphab/admin-frontend
@alphab/admin-backend
```

## Validation Rules

### Package Name Validation

```regex
# Package directory names
^[a-z0-9]+(-[a-z0-9]+)*$

# Python module names
^alphab_[a-z0-9]+(_[a-z0-9]+)*$

# TypeScript scoped package names
^@alphab/[a-z0-9]+(-[a-z0-9]+)*$
```

### File Name Validation

```regex
# Python files
^[a-z0-9]+(_[a-z0-9]+)*\.py$

# TypeScript files
^[a-zA-Z0-9]+([A-Z][a-z0-9]*)*\.(ts|tsx)$
```

## Conclusion

This naming convention strategy provides a solid foundation for scaling the Alphab monorepo while maintaining clarity and consistency. The phased migration approach minimizes disruption while establishing industry-standard practices that will serve the organization well as it grows.

The key benefits include:

- **Immediate clarity** about package ownership and purpose
- **Scalable structure** that supports multiple projects and domains
- **Industry alignment** with modern monorepo best practices
- **Developer-friendly** patterns that improve productivity

Implementation should begin immediately with the package renaming phase, followed by systematic updates to imports and configurations.
