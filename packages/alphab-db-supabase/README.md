# @alphab/db-supabase

World-class Supabase database client for TypeScript with comprehensive type safety, audit logging, and KISS principles.

## ✨ Features

- 🎯 **World-Class TypeScript Support** - Full type safety with Supabase's generated types
- 🛡️ **Comprehensive Error Handling** - Structured error responses with proper typing
- 📝 **Automatic Audit Logging** - Built-in audit trails for all database operations
- 🔐 **Permission Management** - Role-based access control with fine-grained permissions
- 🔍 **Vector Search Support** - AI embeddings and similarity search capabilities
- ⚡ **Performance Optimized** - Connection pooling, retry logic, and batch operations
- 🧪 **Testing Utilities** - Built-in utilities for schema validation and connection testing
- 📊 **Real-time Subscriptions** - Type-safe real-time data subscriptions

## Quick Start

### Installation

```bash
pnpm add @alphab/db-supabase
```

### Basic Usage

```typescript
import { createClient, createDAO } from "@alphab/db-supabase";

// Client-side usage (with anon key)
const client = createClient({
  url: process.env.SUPABASE_URL!,
  anonKey: process.env.SUPABASE_ANON_KEY!,
});

// Server-side usage (with service key)
const serviceClient = createDAO({
  url: process.env.SUPABASE_URL!,
  anonKey: process.env.SUPABASE_ANON_KEY!,
  serviceKey: process.env.SUPABASE_SERVICE_KEY!,
});

// Test connection
const result = await client.ping();
if (result.success) {
  console.log("✅ Connected to database");
}
```

## Database Schema

The client supports a comprehensive database schema with the following tables:

### Core Tables

- **`users`** - User accounts and profiles
- **`vaults`** - Data containers with access control
- **`artifacts`** - Content items with metadata and embeddings
- **`content_products`** - Structured content with versioning

### System Tables

- **`analytics_events`** - User interaction tracking
- **`audit_logs`** - Complete audit trail of all operations
- **`permissions`** - Fine-grained access control

## API Reference

### SupabaseClientWrapper

The main client class providing type-safe database operations:

```typescript
// CRUD operations
const users = await client.users.findMany({ active: true });
const user = await client.users.findById("user-id");
const newUser = await client.users.create({ email: "user@example.com" });
const updated = await client.users.update("user-id", { name: "New Name" });
await client.users.delete("user-id"); // Soft delete

// Batch operations
const results = await client.users.batchCreate([
  { email: "user1@example.com" },
  { email: "user2@example.com" },
]);

// Advanced queries
const artifacts = await client.artifacts.findMany({
  vault_id: "vault-123",
  created_at: { gte: new Date("2024-01-01") },
});

// Real-time subscriptions
const subscription = client.artifacts.subscribe({ vault_id: "vault-123" }, (payload) => {
  console.log("Real-time update:", payload);
});
```

### Audit Logging

Automatic audit logging for all operations:

```typescript
import { AuditLogger, withAudit } from "@alphab/db-supabase";

const auditLogger = new AuditLogger(client.supabase);

// Manual audit logging
await auditLogger.log({
  action: "user_login",
  table_name: "users",
  record_id: "user-123",
  user_id: "user-123",
  metadata: { ip_address: "192.168.1.1" },
});

// Automatic audit logging with wrapper
const result = await withAudit(client.users.update("user-id", { name: "New Name" }), {
  action: "update_profile",
  user_id: "current-user-id",
  metadata: { field: "name" },
});
```

### Permission Management

Role-based access control:

```typescript
import { PermissionManager, checkPermissions } from "@alphab/db-supabase";

const permissionManager = new PermissionManager(client.supabase);

// Check permissions
const hasAccess = await checkPermissions(client.supabase, "user-123", "read", "vault", "vault-456");

// Grant permissions
await permissionManager.grantPermission({
  user_id: "user-123",
  permission_type: "read",
  resource_type: "vault",
  resource_id: "vault-456",
});

// Permission-protected operations
const protectedOperation = requirePermission(
  "write",
  "vault",
  "vault-456",
)(async () => {
  return await client.artifacts.create({
    vault_id: "vault-456",
    content: "Protected content",
  });
});
```

### Vector Search & Embeddings

AI-powered content search:

```typescript
import {
  generateEmbedding,
  storeArtifactWithEmbedding,
  searchArtifactsBySimilarity,
} from "@alphab/db-supabase";

// Store content with embeddings
await storeArtifactWithEmbedding(client, {
  vault_id: "vault-123",
  title: "AI Research Paper",
  content: "Comprehensive analysis of machine learning...",
  content_type: "document",
});

// Search by similarity
const similarArtifacts = await searchArtifactsBySimilarity(client, "machine learning algorithms", {
  vault_id: "vault-123",
  limit: 10,
  threshold: 0.8,
});
```

## Environment Variables

Following [Turborepo best practices](https://turborepo.com/docs/crafting-your-repository/using-environment-variables):

```bash
# packages/alphab-db-supabase/.env.local
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Optional settings
DB_POOL_SIZE=10
DB_TIMEOUT=30000
NODE_ENV=development
```

## Error Handling

Comprehensive error handling with structured responses:

```typescript
const result = await client.users.findById("invalid-id");

if (!result.success) {
  console.error("Error:", result.error);
  // Error object includes:
  // - message: Human-readable error message
  // - code: Error code for programmatic handling
  // - details: Additional error context
}
```

## Testing Utilities

Built-in utilities for testing and validation:

```typescript
import { validateConnection, tableExists, validateSchema } from "@alphab/db-supabase";

// Connection testing
const isConnected = await validateConnection(client.supabase);

// Schema validation
const hasUsersTable = await tableExists(client.supabase, "users");
const schemaValid = await validateSchema(client.supabase, expectedSchema);
```

## Real-time Subscriptions

Type-safe real-time data subscriptions:

```typescript
// Subscribe to table changes
const subscription = client.artifacts.subscribe({ vault_id: "vault-123" }, (payload) => {
  switch (payload.eventType) {
    case "INSERT":
      console.log("New artifact:", payload.new);
      break;
    case "UPDATE":
      console.log("Updated artifact:", payload.new);
      break;
    case "DELETE":
      console.log("Deleted artifact:", payload.old);
      break;
  }
});

// Unsubscribe
subscription.unsubscribe();
```

## Performance & Best Practices

### Connection Management

```typescript
// Use connection pooling for high-traffic applications
const client = createClient({
  url: process.env.SUPABASE_URL!,
  anonKey: process.env.SUPABASE_ANON_KEY!,
  options: {
    db: {
      poolSize: 10,
    },
  },
});
```

### Batch Operations

```typescript
// Efficient batch operations
const results = await client.artifacts.batchCreate(artifacts, {
  batchSize: 100,
  onProgress: (completed, total) => {
    console.log(`Progress: ${completed}/${total}`);
  },
});
```

### Retry Logic

```typescript
import { retry } from "@alphab/db-supabase";

// Automatic retry with exponential backoff
const result = await retry(() => client.users.create(userData), {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 5000,
});
```

## Architecture

This package follows the Alphab database architecture:

- **World-Class TypeScript** - Full type safety with Supabase's generated types
- **KISS Principles** - Simple, maintainable code without over-engineering
- **Comprehensive Features** - Everything needed for production applications
- **Performance First** - Optimized for real-world usage patterns

## Related Packages

- **`@alphab/db-migrations`** - Database migration framework
- **`@alphab/db-scripts`** - CLI tools for database management

## Contributing

When contributing to this package:

1. Maintain world-class TypeScript standards
2. Follow KISS principles - simple and maintainable
3. Add comprehensive tests for new features
4. Update this README with new functionality
5. Ensure all operations support audit logging

## License

MIT
