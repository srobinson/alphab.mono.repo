# Migration Guide: Moving to Packages Structure

This document provides a detailed guide for migrating the Particle0 project from its original structure (with separate `frontend` and `backend` directories) to a packages-based monorepo structure.

## Table of Contents

1. [Overview](#overview)
2. [Benefits of Migration](#benefits-of-migration)
3. [Migration Process](#migration-process)
4. [Manual Migration Steps](#manual-migration-steps)
5. [Troubleshooting](#troubleshooting)
6. [Post-Migration Tasks](#post-migration-tasks)

## Overview

The migration involves moving all code from:

- `frontend/` → `packages/particle0-frontend/`
- `backend/` → `packages/particle0-api/`

And using the reusable packages:

- `packages/auth-backend/`
- `packages/auth-frontend/`

## Benefits of Migration

1. **Reusable Components**: Common functionality like authentication is extracted into reusable packages that can be used across multiple projects.

2. **Better Organization**: Related code is grouped together in dedicated packages, making it easier to understand the codebase.

3. **Easier Maintenance**: Each package has its own tests, documentation, and dependencies, making maintenance more manageable.

4. **Improved Collaboration**: Teams can work on different packages independently, reducing merge conflicts and improving development velocity.

5. **Consistent Practices**: Shared packages enforce consistent practices across different parts of the application.

## Migration Process

### Automated Migration

The easiest way to migrate is to use the provided migration script:

```bash
# Make the script executable
chmod +x migrate-to-packages.sh

# Run the migration script
./migrate-to-packages.sh
```

The script will:

1. Copy all files from `frontend/` to `packages/particle0-frontend/`
2. Copy all files from `backend/` to `packages/particle0-api/`
3. Update imports to use the new package structure
4. Add dependencies on the auth packages

### Testing the Migration

After running the migration script, test the new package structure:

```bash
# Install dependencies
pnpm install

# Run the development servers
pnpm run dev:packages
```

## Manual Migration Steps

If you prefer to migrate manually or need to customize the migration process, follow these steps:

### 1. Frontend Migration

1. **Copy configuration files**:

   ```bash
   cp frontend/*.json packages/particle0-frontend/
   cp frontend/*.js packages/particle0-frontend/
   cp frontend/*.mjs packages/particle0-frontend/
   cp frontend/*.ts packages/particle0-frontend/
   cp frontend/*.md packages/particle0-frontend/
   cp frontend/.env* packages/particle0-frontend/
   ```

2. **Copy source files**:

   ```bash
   cp -r frontend/src/* packages/particle0-frontend/src/
   ```

3. **Copy public assets**:

   ```bash
   cp -r frontend/public/* packages/particle0-frontend/public/
   ```

4. **Update package.json**:
   Add dependency on `auth-frontend`:

   ```json
   "dependencies": {
     "auth-frontend": "workspace:*",
     // other dependencies...
   }
   ```

5. **Update imports**:
   Replace imports from local auth components with imports from the auth-frontend package:

   ```typescript
   // Before
   import { useAuth } from "../contexts/logto-provider";

   // After
   import { useAuth } from "auth-frontend";
   ```

### 2. Backend Migration

1. **Copy configuration files**:

   ```bash
   cp backend/*.toml packages/particle0-api/
   cp backend/*.txt packages/particle0-api/
   cp backend/*.json packages/particle0-api/
   cp backend/*.md packages/particle0-api/
   cp backend/.env* packages/particle0-api/
   ```

2. **Copy app files**:

   ```bash
   cp -r backend/app/__init__.py packages/particle0-api/app/
   cp -r backend/app/core packages/particle0-api/app/
   ```

3. **Copy API endpoints**:

   ```bash
   cp backend/app/api/__init__.py packages/particle0-api/app/api/
   cp backend/app/api/v1/__init__.py packages/particle0-api/app/api/v1/
   cp backend/app/api/v1/endpoints/__init__.py packages/particle0-api/app/api/v1/endpoints/
   cp backend/app/api/v1/endpoints/example.py packages/particle0-api/app/api/v1/endpoints/
   cp backend/app/api/v1/endpoints/health.py packages/particle0-api/app/api/v1/endpoints/
   ```

4. **Copy models and schemas**:

   ```bash
   cp -r backend/app/models/* packages/particle0-api/app/models/
   cp -r backend/app/schemas/* packages/particle0-api/app/schemas/
   ```

5. **Copy tests**:

   ```bash
   cp -r backend/app/tests/* packages/particle0-api/app/tests/
   cp -r backend/tests/* packages/particle0-api/tests/
   ```

6. **Update pyproject.toml**:
   Add dependency on `logto-auth`:

   ```toml
   [tool.poetry.dependencies]
   python = "^3.9"
   logto-auth = {path = "../auth-backend", develop = true}
   # other dependencies...
   ```

7. **Update imports**:
   Replace imports from local auth module with imports from the logto_auth package:

   ```python
   # Before
   from app.core.auth import get_current_user

   # After
   from logto_auth.dependencies import get_current_user
   ```

## Troubleshooting

### Import Errors

If you encounter import errors after migration:

1. **Check the import paths**: Make sure all imports are updated to use the new package structure.

2. **Check package dependencies**: Ensure all required dependencies are listed in the package.json or pyproject.toml files.

3. **Check for circular dependencies**: Make sure there are no circular dependencies between packages.

### Missing Files

If you notice missing files after migration:

1. **Check the migration script output**: Look for any errors or warnings during the migration process.

2. **Compare directory structures**: Compare the original and migrated directories to identify missing files.

3. **Copy missing files manually**: Copy any missing files manually to the appropriate location.

## Post-Migration Tasks

After successfully migrating to the new package structure:

1. **Update documentation**: Update all documentation to reflect the new package structure.

2. **Update CI/CD pipelines**: Update CI/CD pipelines to build and test the new package structure.

3. **Clean up old code**: Once everything is working, remove the old frontend and backend directories.

4. **Add tests for new packages**: Add tests for the new packages to ensure they work correctly.

5. **Optimize build process**: Optimize the build process to take advantage of the new package structure.

## Conclusion

Migrating to a packages-based monorepo structure is a significant change, but it provides numerous benefits for maintainability, reusability, and collaboration. By following this guide, you can successfully migrate your project and take advantage of these benefits.
