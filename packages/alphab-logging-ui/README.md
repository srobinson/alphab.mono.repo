# @alphab/logging-ui

Simple, elegant logging for TypeScript/JavaScript frontends with structured output and development-friendly formatting.

## Features

- 🎯 **KISS principle** - just `createLogger(name)` and go!
- 📝 **Structured logging** with context and timestamps
- 😀 **Emoji indicators** for easy visual scanning
- 🔍 **Automatic log levels** (DEBUG in development, INFO in production)
- ⚡ **Zero dependencies** - pure TypeScript
- 🌐 **Browser-first** design for frontend applications

## Installation

```bash
npm install @alphab/logging-ui
# or
pnpm add @alphab/logging-ui
```

## Usage

### Basic Usage

```typescript
import { createLogger } from "@alphab/logging-ui";

const logger = createLogger("MyComponent");

logger.info("User logged in", { userId: "123", email: "user@example.com" });
logger.warn("Rate limit approaching", { current: 95, limit: 100 });
logger.error("API request failed", new Error("Network timeout"));
```

### Output Example

```
ℹ️ [2025-06-11T15:30:45.123Z] [INFO] [MyComponent] User logged in | {"userId":"123","email":"user@example.com"}
⚠️ [2025-06-11T15:30:46.456Z] [WARN] [MyComponent] Rate limit approaching | {"current":95,"limit":100}
❌ [2025-06-11T15:30:47.789Z] [ERROR] [MyComponent] API request failed | {"error_message":"Network timeout","error_stack":"Error: Network timeout..."}
```

### Context Management

```typescript
const logger = createLogger("AuthService").setContext({ service: "auth", version: "1.0" });

logger.info("Processing login request", { method: "email" });
// Output includes both service context and method

logger.clearContext();
logger.info("Context cleared"); // Only message, no context
```

### Log Levels

- 🔍 **DEBUG** - Development details (localhost only)
- ℹ️ **INFO** - General information
- ⚠️ **WARN** - Warning conditions
- ❌ **ERROR** - Error conditions with stack traces

**Automatic environment detection:**

- **Development** (localhost): Shows DEBUG and above
- **Production** (deployed): Shows INFO and above

## API Reference

### `createLogger(component: string)`

Creates a logger instance for the specified component.

```typescript
const logger = createLogger("ComponentName");
```

### Logger Methods

- `debug(message, context?)` - Debug information
- `info(message, context?)` - General information
- `warn(message, context?)` - Warning conditions
- `error(message, error?, context?)` - Error conditions
- `setContext(context)` - Add persistent context
- `clearContext()` - Remove persistent context

### Types

```typescript
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogContext {
  [key: string]: any;
}
```

## Why Choose This Logger?

✅ **Simple** - One function: `createLogger(name)`
✅ **No configuration** - Works out of the box
✅ **Development-friendly** - Emoji visual indicators
✅ **Production-ready** - Structured JSON-like context
✅ **TypeScript native** - Full type safety
✅ **Lightweight** - Zero external dependencies

## License

MIT
