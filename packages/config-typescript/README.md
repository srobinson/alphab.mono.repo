# @alphab/typescript-config

Shared TypeScript configurations for the Alphab monorepo with world-class type safety and optimized settings for different package types.

## ✨ Features

- 🎯 **Multiple Configurations** - Optimized configs for libraries, apps, and Node.js packages
- 🛡️ **Strict Type Safety** - Maximum type safety with `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`
- ⚡ **Performance Optimized** - Fast compilation with incremental builds and proper module resolution
- 🔧 **Framework Support** - Specialized configs for React, Vite, and Node.js environments
- 📦 **Monorepo Ready** - Designed for Turborepo with proper dependency tracking
- 🎨 **Modern Standards** - Latest TypeScript features with ES2022 target

## Available Configurations

### `library.json` - TypeScript Libraries

For reusable TypeScript packages and libraries:

```json
{
  "extends": "@alphab/typescript-config/library"
}
```

**Features:**

- ES modules with bundler resolution
- Declaration files generation
- React JSX support
- Strict type checking
- DOM and ES2022 lib support

### `node.json` - Node.js Packages

For Node.js applications and CLI tools:

```json
{
  "extends": "@alphab/typescript-config/node"
}
```

**Features:**

- CommonJS modules
- Node.js module resolution
- ES2022 target without DOM
- Optimized for server environments

### `base.json` - Base Configuration

Shared base configuration with common settings:

```json
{
  "extends": "@alphab/typescript-config/base"
}
```

**Features:**

- Core TypeScript settings
- Strict type checking
- Modern ES features
- Consistent formatting

## Quick Start

### Installation

```bash
pnpm add -D @alphab/typescript-config
```

### Usage

Create a `tsconfig.json` in your package:

```json
{
  "extends": "@alphab/typescript-config/library",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### For Build Configurations

Create `tsconfig.app.json` for build-specific settings:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false
  },
  "include": ["src/**/*"],
  "exclude": ["**/*.test.*", "**/*.spec.*"]
}
```

## Configuration Details

### Library Configuration

Perfect for TypeScript libraries and UI components:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "jsx": "react-jsx",
    "verbatimModuleSyntax": true,
    "moduleDetection": "force"
  }
}
```

### Node.js Configuration

Optimized for Node.js applications and CLI tools:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "CommonJS",
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true
  }
}
```

### Base Configuration

Shared strict settings for all configurations:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  }
}
```

## Package-Specific Examples

### React Component Library

```json
{
  "extends": "@alphab/typescript-config/library",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "jsx": "react-jsx"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.stories.*"]
}
```

### Node.js CLI Tool

```json
{
  "extends": "@alphab/typescript-config/node",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Vite Application

```json
{
  "extends": "@alphab/typescript-config/library",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "types": ["vite/client"]
  },
  "include": ["src/**/*", "vite.config.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## Turborepo Integration

These configurations work seamlessly with Turborepo:

```json
{
  "tasks": {
    "type-check": {
      "dependsOn": ["^bootstrap"],
      "inputs": ["src/**", "tsconfig*.json"],
      "cache": true
    },
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "tsconfig*.json"],
      "outputs": ["dist/**"],
      "cache": true
    }
  }
}
```

## Best Practices

### Project Structure

```
your-package/
├── src/
│   ├── index.ts
│   └── components/
├── tsconfig.json          # Development config
├── tsconfig.app.json      # Build config
└── package.json
```

### Development vs Build Configs

- **`tsconfig.json`** - For development with `noEmit: true`
- **`tsconfig.app.json`** - For building with `noEmit: false`

### Strict Type Safety

All configurations enable maximum type safety:

```typescript
// ✅ Good - handles undefined properly
function getUser(id?: string): User | undefined {
  if (!id) return undefined;
  return users[id]; // TypeScript knows this could be undefined
}

// ❌ Bad - would cause TypeScript error with our strict settings
function getUser(id: string): User {
  return users[id]; // Error: could be undefined
}
```

### Module Resolution

- **Libraries**: Use `bundler` resolution for modern bundlers
- **Node.js**: Use `node` resolution for Node.js compatibility
- **Apps**: Use `bundler` resolution with Vite/Webpack

## Troubleshooting

### Common Issues

**Module not found errors:**

```bash
# Make sure you have the right module resolution
# For libraries: "moduleResolution": "bundler"
# For Node.js: "moduleResolution": "node"
```

**JSX errors:**

```bash
# Ensure JSX is configured properly
"jsx": "react-jsx"  # For React 17+
"jsx": "react"      # For React 16
```

**Declaration file issues:**

```bash
# Check your build config excludes test files
"exclude": ["**/*.test.*", "**/*.spec.*"]
```

### Performance Tips

1. **Use project references** for large monorepos
2. **Enable incremental compilation** with `tsBuildInfoFile`
3. **Exclude unnecessary files** from compilation
4. **Use `skipLibCheck`** to speed up builds

## Migration Guide

### From Custom Configs

1. Install the package:

   ```bash
   pnpm add -D @alphab/typescript-config
   ```

2. Update your `tsconfig.json`:

   ```json
   {
     "extends": "@alphab/typescript-config/library",
     "compilerOptions": {
       "outDir": "dist",
       "rootDir": "src"
     }
   }
   ```

3. Remove redundant options from your config

### From Other Shared Configs

Our configurations are more strict and modern. You may need to:

1. Fix type errors revealed by strict checking
2. Update import/export patterns for ES modules
3. Add proper type annotations for better inference

## Contributing

When updating these configurations:

1. **Test thoroughly** - Changes affect all packages
2. **Document breaking changes** - Update migration guides
3. **Consider backwards compatibility** - Avoid unnecessary breaking changes
4. **Update examples** - Keep documentation current

## Related Packages

- **`@alphab/eslint-config`** - ESLint configurations
- **`@alphab/scripts`** - Build scripts that use these configs
- **`@alphab/jest-presets`** - Jest configurations for testing

## License

MIT
