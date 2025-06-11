# @alphab/scripts

Shared build scripts for the Alphab monorepo. This package provides standardized build, test, lint, and development commands that work across all packages and applications in the monorepo.

## Features

- 🔍 **Auto-detection**: Automatically detects package type (TypeScript app/library, Python app/library, config package)
- 🎯 **Consistent Interface**: Same commands work across all package types
- 🚀 **Preserves Existing Functionality**: Maintains all current build processes and commands
- 🎨 **Beautiful Output**: Colorful, informative console output
- ⚡ **Fast**: Optimized for monorepo workflows with Turbo

## Supported Package Types

- **TypeScript Applications** (`typescript-app`): React apps with Vite
- **TypeScript Libraries** (`typescript-library`): Reusable TypeScript packages
- **Python Applications** (`python-app`): FastAPI apps with Poetry
- **Python Libraries** (`python-library`): Reusable Python packages with Poetry
- **Config Packages** (`config-package`): Configuration-only packages

## Available Commands

- `alphab-build` - Build the package
- `alphab-test` - Run tests
- `alphab-lint` - Run linting
- `alphab-dev` - Start development mode
- `alphab-clean` - Clean build artifacts
- `alphab-format` - Format code
- `alphab-type-check` - Run type checking

## Package Type Detection

The scripts automatically detect your package type based on:

1. **Explicit declaration**: `"packageType"` field in package.json
2. **File presence**: Checks for `vite.config.ts`, `pyproject.toml`, etc.
3. **Directory location**: `/apps/` vs `/packages/`
4. **Dependencies**: Analyzes package.json dependencies

### Auto-detection Rules

- **TypeScript App**: Has `vite.config.ts` OR is in `/apps/` with `tsconfig.app.json`
- **TypeScript Library**: Has `tsconfig.json` or `tsconfig.app.json` in `/packages/`
- **Python App**: Has `pyproject.toml` in `/apps/`
- **Python Library**: Has `pyproject.toml` in `/packages/`
- **Config Package**: Package name starts with `@alphab/config-`

## Usage

### In Package Scripts

Add to your package.json:

```json
{
  "scripts": {
    "build": "alphab-build",
    "test": "alphab-test",
    "lint": "alphab-lint",
    "dev": "alphab-dev",
    "clean": "alphab-clean",
    "format": "alphab-format",
    "type-check": "alphab-type-check"
  },
  "devDependencies": {
    "@alphab/scripts": "workspace:*"
  }
}
```

### With Turbo

Works seamlessly with your existing Turbo configuration:

```bash
# Build all packages
turbo run build

# Test all packages
turbo run test

# Start dev mode for specific app
turbo run dev --filter=particle0-web
```

## Command Mapping

### TypeScript Applications

- **build**: `tsc --project tsconfig.app.json && vite build`
- **dev**: `vite --port 3000 --host 0.0.0.0`
- **test**: `vitest run`
- **lint**: `eslint . --max-warnings 20`
- **format**: `eslint . --fix && prettier --write .`

### TypeScript Libraries

- **build**: `tsc --project tsconfig.app.json`
- **dev**: `tsc --project tsconfig.app.json --watch`
- **test**: `vitest run`
- **lint**: `eslint src`
- **format**: `eslint src --fix`

### Python Applications

- **build**: `poetry build`
- **dev**: `poetry run uvicorn {module}.main:app --reload --port 8000 --host 0.0.0.0`
- **test**: `poetry run python -m pytest`
- **lint**: `poetry run black .`
- **format**: `poetry run black . && poetry run isort .`

### Python Libraries

- **build**: `poetry build`
- **test**: `python -m pytest`
- **lint**: `ruff check .` or `black .` (auto-detected)
- **format**: `ruff check . --fix` or `black .` (auto-detected)

## Explicit Package Type Declaration

You can override auto-detection by adding a `packageType` field to your package.json:

```json
{
  "name": "my-package",
  "packageType": "typescript-library",
  "scripts": {
    "build": "alphab-build"
  }
}
```

## Error Handling

- Clear, colorful error messages
- Proper exit codes for CI/CD
- Detailed logging of executed commands
- Graceful handling of missing dependencies

## Development

To modify or extend the scripts:

1. Edit the appropriate builder in `lib/builders/`
2. Update package detection logic in `lib/utils/package-detector.js`
3. Test with a sample package

## Migration Guide

To migrate an existing package:

1. Add `@alphab/scripts` as a devDependency
2. Replace existing scripts with alphab commands
3. Test that functionality is preserved
4. Optionally add explicit `packageType` for clarity

## Troubleshooting

### Package Type Not Detected

Add explicit `packageType` to package.json or ensure your package structure matches the detection rules.

### Command Not Found

Ensure `@alphab/scripts` is installed as a devDependency and run `pnpm install`.

### Different Behavior

The scripts preserve existing functionality. If behavior differs, please file an issue with details about your current setup.
