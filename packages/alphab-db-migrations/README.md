# @alphab/db-migrations

Database migration framework with TypeScript support for Alphab applications. Provides versioned, reversible migrations with comprehensive audit logging and rollback capabilities.

## Features

- 🔄 **Versioned Migrations** - Track and apply database changes incrementally
- ↩️ **Rollback Support** - Safely revert to previous database states
- 🛡️ **Locking Mechanism** - Prevent concurrent migration execution
- 📊 **Audit Logging** - Complete history of all migration operations
- 🎯 **Multi-Provider** - Support for Supabase, PostgreSQL, and more
- 🔍 **Schema Validation** - Verify database integrity
- 📝 **TypeScript First** - Full type safety and IntelliSense support

## Installation

```bash
pnpm add @alphab/db-migrations
```

## Quick Start

### Basic Usage

```typescript
import { migrate } from "@alphab/db-migrations";

const runner = migrate("supabase");

await runner.initialize({
  provider: "supabase",
  project: "particle0",
  environment: "development",
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_KEY,
});

// Run pending migrations
const results = await runner.migrate();
console.log(`Applied ${results.length} migrations`);

// Check status
const status = await runner.getStatus();
status.forEach((s) => {
  console.log(`${s.version} - ${s.status} (${s.name})`);
});

await runner.cleanup();
```

### CLI Usage

```bash
# Set environment variables
export SUPABASE_URL="your_supabase_url"
export SUPABASE_SERVICE_KEY="your_service_key"
export PROJECT_NAME="particle0"

# Check migration status
alphab-migrate status

# Run pending migrations
alphab-migrate migrate

# Create new migration
alphab-migrate create "add_user_preferences"

# Rollback to specific version
alphab-migrate rollback 20240113_001
```

## Migration File Format

Migration files follow a specific naming convention and structure:

### Naming Convention

```
YYYYMMDD_NNN_description.sql
```

Examples:

- `20240113_001_initial_schema.sql`
- `20240114_002_add_user_preferences.sql`
- `20240115_003_create_analytics_tables.sql`

### File Structure

```sql
-- Migration: Add user preferences
-- Version: 20240114_002
-- Description: Add user preferences table and related indexes
-- Author: developer@alphab.dev
-- Created: 2024-01-14T10:30:00Z

-- +migrate Up
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- +migrate Down
DROP INDEX IF EXISTS idx_user_preferences_user_id;
DROP TABLE IF EXISTS user_preferences;
```

## Configuration

### Environment Variables

```bash
# Required for Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_service_role_key

# Optional
PROJECT_NAME=particle0
NODE_ENV=development
```

### Programmatic Configuration

```typescript
const config = {
  provider: "supabase",
  project: "particle0",
  environment: "development",
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_KEY,
  migrationsPath: "./db/migrations", // Optional: custom path
  schemasPath: "./db/schemas", // Optional: custom path
};

await runner.initialize(config);
```

## API Reference

### MigrationRunner

```typescript
class MigrationRunner {
  // Initialize with configuration
  async initialize(config: MigrationConfig): Promise<void>;

  // Get migration status
  async getStatus(): Promise<MigrationStatus[]>;

  // Get migration statistics
  async getStats(): Promise<MigrationStats>;

  // Create migration plan
  async createPlan(targetVersion?: string): Promise<MigrationPlan>;

  // Create rollback plan
  async createRollbackPlan(targetVersion: string): Promise<RollbackPlan>;

  // Execute migrations
  async migrate(targetVersion?: string, dryRun?: boolean): Promise<MigrationResult[]>;

  // Rollback migrations
  async rollback(targetVersion: string, dryRun?: boolean): Promise<MigrationResult[]>;

  // Create new migration file
  async createMigration(name: string, description?: string): Promise<string>;

  // Validate schema integrity
  async validateSchema(): Promise<boolean>;

  // Get available migrations
  async getAvailableMigrations(): Promise<Migration[]>;

  // Get current version
  async getCurrentVersion(): Promise<string | null>;

  // Check database connection
  async isConnected(): Promise<boolean>;

  // Clean up resources
  async cleanup(): Promise<void>;
}
```

### Types

```typescript
interface MigrationConfig {
  provider: "supabase" | "postgres" | "mysql" | "mongodb";
  project: string;
  environment: "development" | "staging" | "production";
  connectionString?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  migrationsPath?: string;
  schemasPath?: string;
}

interface MigrationStatus {
  version: string;
  name: string;
  appliedAt: Date | undefined;
  appliedBy: string | undefined;
  status: "pending" | "applied" | "failed" | "rolled_back";
}

interface MigrationResult {
  success: boolean;
  migration: Migration;
  executionTime: number;
  error?: Error;
  output?: string;
}
```

## Directory Structure

```
apps/particle0-api/
├── db/
│   ├── migrations/           # Migration files
│   │   ├── 20240113_001_initial_schema.sql
│   │   ├── 20240114_002_add_user_preferences.sql
│   │   └── ...
│   ├── schemas/             # Schema definitions
│   │   ├── 001_users.sql
│   │   ├── 002_vaults.sql
│   │   └── ...
│   └── seeds/               # Seed data
│       ├── dev/
│       ├── staging/
│       └── prod/
```

## Best Practices

### 1. Migration Safety

- **Always test migrations** in development and staging first
- **Use transactions** for atomic operations
- **Include rollback SQL** for all migrations
- **Backup before production** migrations

### 2. Naming Conventions

- Use descriptive names: `add_user_preferences` not `update_users`
- Include the action: `create_`, `add_`, `remove_`, `modify_`
- Be specific: `add_email_index` not `add_index`

### 3. Schema Changes

```sql
-- ✅ Good: Additive changes
ALTER TABLE users ADD COLUMN preferences JSONB;

-- ⚠️ Careful: Destructive changes
ALTER TABLE users DROP COLUMN old_field;

-- ✅ Good: Safe column removal
-- Step 1: Stop using column in code
-- Step 2: Deploy code changes
-- Step 3: Remove column in migration
```

### 4. Data Migrations

```sql
-- ✅ Good: Handle existing data
ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';
UPDATE users SET status = 'active' WHERE status IS NULL;
ALTER TABLE users ALTER COLUMN status SET NOT NULL;

-- ✅ Good: Batch large updates
UPDATE users SET status = 'active'
WHERE id IN (
  SELECT id FROM users
  WHERE status IS NULL
  LIMIT 1000
);
```

## Error Handling

The migration framework provides comprehensive error handling:

```typescript
try {
  const results = await runner.migrate();

  // Check for failures
  const failed = results.filter((r) => !r.success);
  if (failed.length > 0) {
    console.error("Some migrations failed:");
    failed.forEach((f) => {
      console.error(`${f.migration.version}: ${f.error?.message}`);
    });
  }
} catch (error) {
  console.error("Migration execution failed:", error.message);

  // Check if it's a lock error
  if (error.message.includes("migration lock")) {
    console.log("Another migration is in progress. Please wait and try again.");
  }
}
```

## Monitoring & Observability

### Migration Logs

All migrations are logged with:

- Execution time
- User who ran the migration
- Success/failure status
- Error details (if any)

### Database Tables

The framework creates these tables:

- `_migrations` - Applied migration history
- `_migration_locks` - Concurrent execution prevention

### Audit Trail

```typescript
// Get migration history
const status = await runner.getStatus();

// Get statistics
const stats = await runner.getStats();
console.log(`Total: ${stats.totalMigrations}`);
console.log(`Applied: ${stats.appliedMigrations}`);
console.log(`Pending: ${stats.pendingMigrations}`);
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Database Migration
on:
  push:
    branches: [main]
    paths: ["apps/*/db/migrations/**"]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: pnpm install

      - name: Run migrations
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        run: |
          pnpm alphab-migrate status
          pnpm alphab-migrate migrate
```

## Troubleshooting

### Common Issues

1. **Migration Lock Error**

   ```
   Error: Could not acquire migration lock
   ```

   - Another migration is running
   - Wait for completion or check for stuck processes

2. **Connection Error**

   ```
   Error: Failed to connect to database
   ```

   - Check environment variables
   - Verify database credentials
   - Ensure database is accessible

3. **Migration File Error**
   ```
   Error: Invalid migration filename format
   ```
   - Use correct naming: `YYYYMMDD_NNN_description.sql`
   - Ensure files are in migrations directory

### Debug Mode

```bash
# Enable verbose logging
DEBUG=alphab:* alphab-migrate migrate

# Check connection
alphab-migrate status
```

## Contributing

See the main repository [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT - see [LICENSE](../../LICENSE) for details.
