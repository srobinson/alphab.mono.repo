# @alphab/db-scripts

**🚀 Familiar Database CLI - Clear Commands Everyone Knows**

Simple, world-class database CLI with familiar commands like Rails, Laravel, and Prisma.

## ⚡ Quick Start

### 🎯 **Essential Commands (Familiar!)**

```bash
# Setup & Test
db ping                    # Test database connection
db env:setup              # Setup environment

# Migrations (like Rails!)
db migrate                # Run pending migrations
db rollback               # Rollback last migration
db rollback --steps 3     # Rollback 3 migrations
db status                 # Show migration status
db create add_users       # Create new migration

# Help
db help                   # Show all commands
```

### 🔨 **Quick Setup**

```bash
# 1. Build the CLI
cd packages/alphab-db-scripts
npm run build

# 2. Test it works
db help

# 3. Setup your environment
db env:setup

# 4. Test connection
db ping

# 5. Check migration status
db status
```

---

## ✨ **What Makes This Special**

### 🎯 **Instantly Familiar**

```bash
db migrate     # Like rails db:migrate
db rollback    # Like rails db:rollback
db status      # Like prisma migrate status
```

### 🏗️ **Crystal Clear Flow**

```
CLI Commands → MigrationService → DatabaseClient → Supabase
     ↓              ↓                ↓
   db migrate    migrate.up()     client.sql()
   db rollback   migrate.down()   client.ping()
   db status     migrate.status() client.users.findMany()
```

### 📦 **Clean Architecture**

```
packages/alphab-db-scripts/
├── src/
│   ├── cli/           # Familiar CLI commands
│   ├── services/      # Clean service layer
│   └── providers/     # Database-specific logic
├── bin/
│   └── alphab-migrate # Executable (supports both 'db' and 'alphab-migrate')
└── dist/              # Compiled output
```

---

## 🎯 **Command Reference**

### **Connection Commands**

```bash
db ping                    # Test database connection
```

### **Migration Commands**

```bash
db migrate                 # Run all pending migrations
db rollback                # Rollback last migration
db rollback --steps 3      # Rollback 3 migrations
db status                  # Show migration status
db create add_users_table  # Create new migration file
```

### **Environment Commands**

```bash
db env:setup               # Setup environment configuration
```

### **Help Commands**

```bash
db help                    # Show help with examples
db --help                  # Show detailed help
```

---

## 🏗️ **Architecture Details**

### **Clear Service Layer**

```typescript
// CLI → Service → Database
const client = createClient(); // For app usage
const migration = createMigrationService(); // For migrations

// Familiar API
await client.ping(); // Test connection
await client.users.findMany(); // Query users
await migration.up(); // Run migrations
```

### **Environment Auto-Detection**

```bash
# Automatically loads from .env.local:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

### **Provider Support**

- ✅ **Supabase** (current)
- 🔄 **PostgreSQL** (planned)
- 🔄 **MySQL** (planned)
- 🔄 **MongoDB** (planned)

---

## 🔧 **Development Workflow**

### **Essential Steps After Code Changes**

```bash
# 1. Build (always required)
npm run build

# 2. Test CLI works
db help

# 3. Test specific commands
db ping
db status
```

### **Development Commands**

```bash
# Development with hot reload
npm run dev

# Type checking
npm run type-check

# Test CLI after build
npm run test:cli
```

---

## 📁 **File Structure**

### **Migration Files**

```
migrations/
├── 20240113_001_initial_schema.sql
├── 20240114_002_add_user_preferences.sql
└── 20240115_003_create_analytics.sql
```

### **Migration File Format**

```sql
-- Migration: Add user preferences
-- Version: 20240114_002
-- Description: Add user preferences table

-- +migrate Up
CREATE TABLE alphab.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES alphab.users(id),
  preferences JSONB DEFAULT '{}'
);

-- +migrate Down
DROP TABLE IF EXISTS alphab.user_preferences;
```

---

## 🚀 **Advanced Usage**

### **Programmatic Usage**

```typescript
import { createClient, createMigrationService } from "@alphab/db-scripts/services";

// Database operations
const db = createClient();
const users = await db.users.findMany();

// Migration operations
const migration = createMigrationService();
const status = await migration.status();
```

### **Custom Configuration**

```typescript
const migration = createMigrationService({
  provider: "supabase",
  supabaseUrl: "your-url",
  supabaseKey: "your-key",
  migrationsPath: "./custom/migrations",
});
```

---

## 🔒 **Security Features**

### **Environment Safety**

- ✅ Auto-loads from `.env.local`
- ✅ Never logs credentials
- ✅ Validates required variables
- ✅ Supports multiple environments

### **Schema Isolation**

- ✅ Uses `alphab` schema by default
- ✅ Proper RLS policies
- ✅ Audit logging built-in

---

## 🧪 **Testing**

### **Manual Testing**

```bash
# Full test workflow
npm run build
db help
db ping
db status
db create test_migration
```

### **Automated Testing (Coming Soon)**

```bash
npm test
npm run test:integration
```

---

## 🔄 **Migration Guide**

### **From Old Commands**

```bash
# OLD (confusing)
alphab-migrate test-connection --provider supabase
alphab-migrate env:setup --provider supabase
alphab-migrate status --provider supabase

# NEW (familiar)
db ping
db env:setup
db status
```

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### 1. "Command not found: db"

```bash
# Solution: Build the CLI first
npm run build
```

#### 2. "Database connection failed"

```bash
# Solution: Check environment variables
db env:setup
```

#### 3. "Migration failed"

```bash
# Solution: Check migration file syntax
cat migrations/your-migration.sql
```

### **Debug Mode**

```bash
# Enable verbose logging
DEBUG=alphab:* db migrate
```

---

## 🤝 **Contributing**

### **Code Style**

- ✅ Familiar patterns (Rails, Prisma, Laravel)
- ✅ Clear naming (no abbreviations)
- ✅ TypeScript strict mode
- ✅ Comprehensive error handling

### **Adding New Commands**

```typescript
// 1. Add to CLI
program.command("new-command").action(async () => {
  const service = createMigrationService();
  await service.newMethod();
});

// 2. Add to service
class MigrationService {
  async newMethod(): Promise<void> {
    // Implementation
  }
}
```

---

**🎯 Remember**: This CLI uses **familiar patterns** that developers already know. Every command should feel instantly recognizable!

```bash
db migrate    # ← Everyone knows this pattern
db rollback   # ← Rails developers especially
db status     # ← Prisma developers especially
```
