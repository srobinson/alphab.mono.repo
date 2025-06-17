# @alphab/jest-presets

Shared Jest configurations and presets for the Alphab monorepo with TypeScript support, coverage reporting, and optimized testing environments.

## ✨ Features

- 🎯 **TypeScript Support** - Full TypeScript testing with ts-jest
- 📊 **Coverage Reporting** - Comprehensive coverage with HTML and text reports
- ⚡ **Performance Optimized** - Fast test execution with proper caching
- 🔧 **Multiple Presets** - Configurations for different package types
- 📦 **Monorepo Ready** - Designed for Turborepo with proper isolation
- 🧪 **Modern Testing** - Support for ES modules, async/await, and modern JS features

## Available Presets

### `typescript.js` - TypeScript Projects

For TypeScript libraries and applications:

```javascript
module.exports = {
  preset: "@alphab/jest-presets/typescript",
};
```

### `react.js` - React Components

For React component libraries and applications:

```javascript
module.exports = {
  preset: "@alphab/jest-presets/react",
};
```

### `node.js` - Node.js Projects

For Node.js applications and CLI tools:

```javascript
module.exports = {
  preset: "@alphab/jest-presets/node",
};
```

## Quick Start

### Installation

```bash
pnpm add -D @alphab/jest-presets jest
```

### Usage

Create a `jest.config.js` in your package:

```javascript
module.exports = {
  preset: "@alphab/jest-presets/typescript",
  // Add package-specific overrides here
};
```

### Running Tests

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

## Configuration Details

### TypeScript Preset

Perfect for TypeScript libraries and utilities:

```javascript
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/**/*.test.ts", "!src/**/*.spec.ts"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### React Preset

Optimized for React component testing:

```javascript
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  testMatch: ["**/__tests__/**/*.{ts,tsx}", "**/?(*.)+(spec|test).{ts,tsx}"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  moduleNameMapping: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.{test,spec}.{ts,tsx}",
    "!src/**/*.stories.{ts,tsx}",
  ],
};
```

### Node.js Preset

For Node.js applications and CLI tools:

```javascript
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
  extensionsToTreatAsEsm: [".ts"],
};
```

## Package-Specific Examples

### TypeScript Library

```javascript
// jest.config.js
module.exports = {
  preset: "@alphab/jest-presets/typescript",
  displayName: "my-library",
  testTimeout: 10000,
};
```

### React Component Library

```javascript
// jest.config.js
module.exports = {
  preset: "@alphab/jest-presets/react",
  displayName: "ui-components",
  setupFilesAfterEnv: ["<rootDir>/src/test-setup.ts"],
};
```

### Node.js CLI Tool

```javascript
// jest.config.js
module.exports = {
  preset: "@alphab/jest-presets/node",
  displayName: "cli-tool",
  testEnvironment: "node",
};
```

## Testing Patterns

### Unit Tests

```typescript
// src/utils.test.ts
import { formatDate, validateEmail } from "./utils";

describe("Utils", () => {
  describe("formatDate", () => {
    it("should format date correctly", () => {
      const date = new Date("2024-01-01");
      expect(formatDate(date)).toBe("2024-01-01");
    });

    it("should handle invalid dates", () => {
      expect(() => formatDate(null as any)).toThrow();
    });
  });

  describe("validateEmail", () => {
    it("should validate correct emails", () => {
      expect(validateEmail("user@example.com")).toBe(true);
    });

    it("should reject invalid emails", () => {
      expect(validateEmail("invalid-email")).toBe(false);
    });
  });
});
```

### React Component Tests

```typescript
// src/Button.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("should render with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("should handle click events", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText("Click me"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should be disabled when loading", () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
```

### Integration Tests

```typescript
// src/api.test.ts
import { createClient } from "./api";

describe("API Client", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    client = createClient({ baseURL: "http://localhost:3000" });
  });

  it("should fetch users", async () => {
    const users = await client.getUsers();
    expect(users).toHaveLength(2);
    expect(users[0]).toHaveProperty("id");
    expect(users[0]).toHaveProperty("email");
  });

  it("should handle errors gracefully", async () => {
    await expect(client.getUser("invalid-id")).rejects.toThrow("User not found");
  });
});
```

## Coverage Configuration

### Coverage Thresholds

```javascript
module.exports = {
  preset: "@alphab/jest-presets/typescript",
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    "./src/critical/": {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
```

### Coverage Reports

```javascript
module.exports = {
  preset: "@alphab/jest-presets/typescript",
  coverageReporters: [
    "text", // Console output
    "lcov", // For CI/CD
    "html", // HTML report
    "json-summary", // Summary JSON
  ],
  coverageDirectory: "coverage",
};
```

## Turborepo Integration

These presets work seamlessly with Turborepo:

```json
{
  "tasks": {
    "test": {
      "dependsOn": ["^bootstrap"],
      "inputs": ["src/**", "test/**", "jest.config.*"],
      "cache": true
    },
    "test:coverage": {
      "dependsOn": ["^bootstrap"],
      "inputs": ["src/**", "test/**", "jest.config.*"],
      "outputs": ["coverage/**"],
      "cache": true
    }
  }
}
```

## Best Practices

### Test Organization

```
src/
├── components/
│   ├── Button.tsx
│   ├── Button.test.tsx
│   └── __tests__/
│       └── Button.integration.test.tsx
├── utils/
│   ├── helpers.ts
│   └── helpers.test.ts
└── __tests__/
    └── setup.ts
```

### Test Naming

```typescript
// ✅ Good - descriptive test names
describe("UserService", () => {
  describe("when creating a new user", () => {
    it("should return user with generated ID", () => {
      // test implementation
    });

    it("should throw error for invalid email", () => {
      // test implementation
    });
  });
});

// ❌ Bad - vague test names
describe("UserService", () => {
  it("should work", () => {
    // test implementation
  });
});
```

### Mocking

```typescript
// Mock external dependencies
jest.mock("@alphab/http-client", () => ({
  createClient: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
  })),
}));

// Mock environment variables
const mockEnv = {
  API_URL: "http://localhost:3000",
  API_KEY: "test-key",
};

beforeEach(() => {
  process.env = { ...process.env, ...mockEnv };
});
```

## Troubleshooting

### Common Issues

**TypeScript compilation errors:**

```bash
# Make sure ts-jest is configured properly
"transform": {
  "^.+\\.ts$": "ts-jest"
}
```

**Module resolution issues:**

```bash
# Add module name mapping for aliases
"moduleNameMapping": {
  "^@/(.*)$": "<rootDir>/src/$1"
}
```

**Coverage not working:**

```bash
# Check collectCoverageFrom patterns
"collectCoverageFrom": [
  "src/**/*.{ts,tsx}",
  "!src/**/*.d.ts"
]
```

### Performance Tips

1. **Use `--maxWorkers`** to control parallel execution
2. **Enable `cache`** for faster subsequent runs
3. **Use `--onlyChanged`** for incremental testing
4. **Configure `testPathIgnorePatterns`** to skip unnecessary files

## Migration Guide

### From Custom Jest Configs

1. Install the preset:

   ```bash
   pnpm add -D @alphab/jest-presets
   ```

2. Update your `jest.config.js`:

   ```javascript
   module.exports = {
     preset: "@alphab/jest-presets/typescript",
     // Keep only package-specific overrides
   };
   ```

3. Remove redundant configuration options

### From Other Presets

Our presets are optimized for TypeScript and monorepos. You may need to:

1. Update test file patterns
2. Adjust coverage thresholds
3. Update mock configurations

## Contributing

When updating these presets:

1. **Test across all package types** - Ensure compatibility
2. **Maintain backwards compatibility** - Avoid breaking changes
3. **Update documentation** - Keep examples current
4. **Consider performance impact** - Optimize for speed

## Related Packages

- **`@alphab/typescript-config`** - TypeScript configurations
- **`@alphab/eslint-config`** - ESLint configurations
- **`@alphab/scripts`** - Build scripts that run tests

## License

MIT
