# Turborepo Migration Guide

This document outlines the migration to an optimized Turborepo setup for the Alphab monorepo.

## 🚀 What Changed

### Directory Structure

```
Before:
packages/
├── particle0/           # Backend API
├── particle0-ui/        # Frontend App
├── alphab-logto/        # Auth backend package
├── alphab-logto-ui/     # Auth frontend package
└── ...

After:
apps/                    # Applications (deployable)
├── particle0-api/       # Backend API (moved from packages/particle0)
├── particle0-web/       # Frontend App (moved from packages/particle0-ui)
└── ...

packages/                # Shared libraries/packages
├── alphab-logto/        # Auth backend package
├── alphab-logto-ui/     # Auth frontend package
└── ...
```

### Key Improvements

1. **Clear Separation**: Apps vs Packages

   - `apps/` - Deployable applications
   - `packages/` - Reusable libraries and shared code

2. **Enhanced Caching**: Optimized turbo.json with better cache strategies
3. **Better Scripts**: Organized npm scripts with filtering capabilities
4. **Generators**: Turbo generators for creating new apps/packages
5. **Improved Dependencies**: Better dependency tracking and build optimization

## 🛠 Migration Steps

### 1. Update Dependencies

```bash
pnpm install
```

### 2. Update Package Names

The following packages were renamed:

- `@alphab.project/particle0` → `@alphab.project/particle0-api`
- `@alphab.project/particle0-ui` → `@alphab.project/particle0-web`

### 3. Update Import Statements

If you have any imports referencing the old package names, update them:

```typescript
// Before
import { something } from "@alphab.project/particle0";

// After
import { something } from "@alphab.project/particle0-api";
```

## 📋 New Scripts

### Development

```bash
# Start all apps in development mode
pnpm dev

# Start only UI apps
pnpm dev:ui

# Start only API apps
pnpm dev:api

# Start specific app
pnpm dev:particle0
```

### Building

```bash
# Build all apps and packages
pnpm build

# Build only UI apps
pnpm build:ui

# Build only API apps
pnpm build:api
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run only UI tests
pnpm test:ui

# Run only API tests
pnpm test:api
```

### Code Quality

```bash
# Lint all code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format all code
pnpm format

# Type check TypeScript
pnpm type-check
```

### Utilities

```bash
# Clean all build artifacts
pnpm clean

# Reset entire monorepo
pnpm reset

# Generate dependency graph
pnpm graph

# Dry run builds
pnpm dry-run
```

## 🏗 Creating New Apps/Packages

Use Turbo generators to create new apps or packages:

```bash
# Create a new React app
pnpm turbo gen react-app

# Create a new React package
pnpm turbo gen react-package

# Create a new Python API
pnpm turbo gen python-api

# Create a new Python package
pnpm turbo gen python-package
```

## 🎯 Turborepo Features

### Caching

- Intelligent caching based on inputs and outputs
- Remote caching support (when configured)
- Signature-based cache validation

### Filtering

```bash
# Run commands on specific packages
turbo build --filter="@alphab.project/particle0-*"

# Run commands excluding certain packages
turbo test --filter="!*-ui"

# Run commands on changed packages only
turbo build --filter="...[HEAD^]"
```

### Parallel Execution

- Tasks run in parallel when possible
- Dependency-aware execution order
- Configurable concurrency limits

## 🔧 Configuration Files

### turbo.json

Enhanced with:

- Global dependencies tracking
- Environment variable handling
- Better input/output definitions
- Optimized caching strategies

### package.json

- Organized scripts with clear categories
- Better filtering capabilities
- Improved lint-staged configuration

### pnpm-workspace.yaml

- Clear separation of apps and packages
- Simplified workspace configuration

## 📊 Performance Benefits

1. **Faster Builds**: Better caching and parallel execution
2. **Smarter Dependencies**: Only rebuild what changed
3. **Better DX**: Clear scripts and organized structure
4. **Scalability**: Easy to add new apps/packages

## 🚨 Breaking Changes

1. **Package Names**: Update any references to renamed packages
2. **Import Paths**: Update imports if using internal package references
3. **Scripts**: Some package-specific scripts moved to turbo commands

## 🔍 Verification

After migration, verify everything works:

```bash
# Install dependencies
pnpm install

# Bootstrap all packages
pnpm bootstrap

# Run tests
pnpm test

# Build everything
pnpm build

# Start development
pnpm dev
```

## 📚 Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Turbo Generators](https://turbo.build/repo/docs/core-concepts/monorepos/code-generation)

## 🆘 Troubleshooting

### Common Issues

1. **Cache Issues**: Run `pnpm clean` to clear all caches
2. **Dependency Issues**: Run `pnpm reset` to reinstall everything
3. **Build Failures**: Check the dependency graph with `pnpm graph`

### Getting Help

If you encounter issues:

1. Check the Turborepo documentation
2. Review the generated dependency graph
3. Use `turbo build --dry-run` to debug build issues
