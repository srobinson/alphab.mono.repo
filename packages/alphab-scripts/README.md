# @alphab/scripts

Shared build scripts for the Alphab monorepo. This package provides standardized build, test, lint, and development commands that work across all packages and applications in the monorepo.

## ✨ Features

- 🧠 **Smart State Detection**: Automatically detects repository health and provides helpful suggestions
- 🔧 **Self-Healing**: Can automatically fix common issues like missing dependencies
- 🎯 **Universal Command System**: Eliminates code duplication with a single, maintainable architecture
- 📊 **Repository Diagnostics**: Shows clear status of pnpm-lock.yaml, node_modules, and package state
- 🚀 **Enhanced Root Package Support**: Special handling for monorepo root operations
- 💡 **Helpful Suggestions**: Provides actionable advice when issues are detected

## Additional Features

- 🔍 **Auto-detection**: Automatically detects package type (TypeScript app/library, Python app/library, config package)
- 🎯 **Consistent Interface**: Same commands work across all package types
- 🎨 **Beautiful Output**: Colorful, informative console output with emojis
- ⚡ **Fast**: Optimized for monorepo workflows with Turbo
- 🛡️ **Error Resilient**: Graceful error handling with helpful diagnostics

## Supported Package Types

- **TypeScript Applications** (`typescript-app`): React apps with Vite
- **TypeScript Libraries** (`typescript-library`): Reusable TypeScript packages
- **Python Applications** (`python-app`): FastAPI apps with Poetry
- **Python Libraries** (`python-library`): Reusable Python packages with Poetry
- **Config Packages** (`config-package`): Configuration-only packages
- **Root Package** (`root-package`): Monorepo root with special handling

## Available Commands

- `alphab-build` - Build the package
- `alphab-test` - Run tests
- `alphab-lint` - Run linting
- `alphab-dev` - Start development mode
- `alphab-clean` - Clean build artifacts
- `alphab-format` - Format code
- `alphab-type-check` - Run type checking
- `alphab-bootstrap` - Bootstrap package dependencies
- `alphab-test-coverage` - Run tests with coverage

### Command Flags

- `--with-dev` - Include development dependencies (for bootstrap)
- `--deep` - Deep clean including lock files and node_modules (for clean)
- `--verbose` - Verbose output

## Smart State Detection

The new system automatically analyzes your repository state and provides helpful feedback:

```bash
🚀 Running build...

🔍 Repository State Issues Detected:
  ❌ Root pnpm-lock.yaml is missing
  ❌ Root node_modules is missing

💡 Suggestions:
  💡 Run 'pnpm install' from the root directory

📦 Package: @alphab/logging-ui (typescript-library)
```

### What It Detects

- Missing `pnpm-lock.yaml` in monorepo root
- Missing `node_modules` in root or package directories
- Repository health status
- Package-specific dependency issues

### Auto-Healing

The bootstrap command can automatically fix common issues:

```bash
# From root - automatically runs pnpm install if needed
pnpm run bootstrap

# Deep clean and rebuild
pnpm run clean --deep
pnpm run bootstrap
```

## Package Type Detection

The scripts automatically detect your package type based on:

1. **Explicit declaration**: `"packageType"` field in package.json
2. **File presence**: Checks for `vite.config.ts`, `pyproject.toml`, etc.
3. **Directory location**: `/apps/` vs `/packages/`
4. **Dependencies**: Analyzes package.json dependencies

### Auto-detection Rules

- **Root Package**: Contains `pnpm-workspace.yaml`
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
    "type-check": "alphab-type-check",
    "bootstrap": "alphab-bootstrap",
    "test:coverage": "alphab-test-coverage"
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

# Bootstrap all packages
turbo run bootstrap

# Deep clean everything
pnpm run clean --deep
```

### Root Package Operations

Special commands for the monorepo root:

```bash
# Bootstrap with automatic dependency installation
pnpm run bootstrap

# Deep clean (removes pnpm-lock.yaml and node_modules)
pnpm run clean --deep

# Regular clean (removes build artifacts only)
pnpm run clean
```

## Command Mapping

### TypeScript Applications

- **build**: `tsc --project tsconfig.app.json && vite build`
- **dev**: `vite --port 3000 --host 0.0.0.0`
- **test**: `vitest run`
- **lint**: `eslint . --max-warnings 20`
- **format**: `eslint . --fix && prettier --write .`
- **bootstrap**: `pnpm install && tsc && vite build`

### TypeScript Libraries

- **build**: `tsc --project tsconfig.app.json`
- **dev**: `tsc --project tsconfig.app.json --watch`
- **test**: `vitest run`
- **lint**: `eslint src`
- **format**: `eslint src --fix`
- **bootstrap**: `pnpm install && tsc`

### Python Applications

- **build**: `poetry build`
- **dev**: `poetry run uvicorn {module}.main:app --reload --port 8000 --host 0.0.0.0`
- **test**: `poetry run python -m pytest`
- **lint**: `poetry run black .`
- **format**: `poetry run black . && poetry run isort .`
- **bootstrap**: `python -m venv .venv && poetry lock && poetry install --with dev`

### Python Libraries

- **build**: `poetry build`
- **test**: `python -m pytest`
- **lint**: `ruff check .` or `black .` (auto-detected)
- **format**: `ruff check . --fix` or `black .` (auto-detected)
- **bootstrap**: `python -m venv .venv && poetry lock && poetry install`

### Root Package

- **bootstrap**: Automatically runs `pnpm install` if repository state issues are detected
- **clean**: Regular clean removes `dist`, `build`, `.turbo`
- **clean --deep**: Deep clean removes `node_modules`, `pnpm-lock.yaml`

## Architecture

The system eliminates code duplication and provides a maintainable foundation:

### Core Components

- **SmartCommandRunner**: Handles state detection, error handling, and command execution
- **Universal Command System**: Single template for all bin scripts
- **Package Detector**: Intelligent package type detection
- **Builder Classes**: Specialized builders for each package type

### Benefits

- **90% Less Code**: Reduced from ~500 lines of duplicated code to ~150 lines of reusable logic
- **Consistent Behavior**: All commands share the same error handling and state detection
- **Easy Maintenance**: Single source of truth for command behavior
- **Better UX**: Clear diagnostics and helpful suggestions

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

## Error Handling & Diagnostics

- 🎨 **Clear, colorful error messages** with emojis
- 🔍 **Repository state diagnostics** before each command
- 💡 **Actionable suggestions** for common issues
- 🛡️ **Graceful error handling** for edge cases
- 📊 **Proper exit codes** for CI/CD
- 📝 **Detailed logging** of executed commands

## Troubleshooting

### Repository State Issues

If you see state detection warnings:

```bash
🔍 Repository State Issues Detected:
  ❌ Root pnpm-lock.yaml is missing

💡 Suggestions:
  💡 Run 'pnpm install' from the root directory
```

**Solution**: Run `pnpm install` from the monorepo root, or use `pnpm run bootstrap` for automatic fixing.

### Package Type Not Detected

Add explicit `packageType` to package.json or ensure your package structure matches the detection rules.

### Command Not Found

Ensure `@alphab/scripts` is installed as a devDependency and run `pnpm install`.

### Different Behavior

If you encounter unexpected behavior, please file an issue with details about your setup.

## Development

To modify or extend the scripts:

1. Edit `lib/core/smart-command-runner.js` for core functionality
2. Update builders in `lib/builders/` for package-specific behavior
3. Modify `lib/utils/package-detector.js` for detection logic
4. Test with sample packages

The architecture makes it easy to add features and maintain consistency across all commands.
