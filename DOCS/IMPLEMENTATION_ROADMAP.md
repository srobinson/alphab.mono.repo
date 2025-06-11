# Implementation Roadmap - Supabase Schema Management

_Practical guide for implementing the Enhanced Supabase Schema feature_

## 🎯 Feature Overview

**Goal**: Implement "Supabase Schema Initialization and Evolution - Enhanced"

**Current Status**: Foundation is solid, database layer needs implementation

**Timeline**: 4 weeks to MVP, 8 weeks to full feature

---

## 🚀 Week 1: Foundation & Critical Fixes

### **Day 1-2: Critical Security & Dependencies**

#### **Security Fix (Critical)**

```python
# packages/particle0/particle0/core/config.py
# BEFORE (INSECURE)
JWT_SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION"

# AFTER (SECURE)
JWT_SECRET_KEY: str = Field(..., env="JWT_SECRET_KEY")
SUPABASE_URL: str = Field(..., env="SUPABASE_URL")
SUPABASE_ANON_KEY: str = Field(..., env="SUPABASE_ANON_KEY")
SUPABASE_SERVICE_KEY: str = Field(..., env="SUPABASE_SERVICE_KEY")
```

#### **Dependency Simplification**

- [ ] Apply [Dependency Simplification Guide](DEPENDENCY_SIMPLIFICATION_GUIDE.md)
- [ ] Test all packages after simplification
- [ ] Update CI/CD scripts

### **Day 3-5: Supabase Integration**

#### **New Package: alphab-supabase**

```bash
mkdir -p packages/alphab-supabase/alphab_supabase
cd packages/alphab-supabase
```

```toml
# packages/alphab-supabase/pyproject.toml
[tool.poetry]
name = "alphab-supabase"
version = "0.1.0"
description = "Supabase client and utilities for Alphab applications"

[tool.poetry.dependencies]
python = ">=3.11,<3.13"
supabase = ">=2.0.0"
asyncpg = ">=0.29.0"
sqlalchemy = ">=2.0.0"
alembic = ">=1.13.0"
```

#### **Core Database Classes**

```python
# packages/alphab-supabase/alphab_supabase/client.py
from supabase import create_client, Client
from typing import Optional

class SupabaseManager:
    def __init__(self, url: str, key: str, service_key: Optional[str] = None):
        self.client: Client = create_client(url, key)
        self.service_client: Optional[Client] = None
        if service_key:
            self.service_client = create_client(url, service_key)

    async def health_check(self) -> bool:
        """Check if Supabase connection is healthy"""
        # Implementation here

    async def get_migration_table_status(self) -> dict:
        """Check migration table status"""
        # Implementation here
```

---

## 🗄️ Week 2: Migration System

### **New Package: alphab-migrations**

#### **Migration Manager**

```python
# packages/alphab-migrations/alphab_migrations/manager.py
from dataclasses import dataclass
from typing import List, Optional
from enum import Enum

class MigrationStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"

@dataclass
class MigrationResult:
    migration_id: str
    status: MigrationStatus
    executed_at: datetime
    duration_ms: int
    error_message: Optional[str] = None

class MigrationManager:
    def __init__(self, supabase_manager: SupabaseManager):
        self.db = supabase_manager

    async def apply_migration(self, migration_file: str) -> MigrationResult:
        """Apply a single migration with full logging"""
        # Implementation with:
        # - Pre-migration backup
        # - SQL execution
        # - Error handling
        # - Audit logging

    async def rollback_migration(self, migration_id: str) -> MigrationResult:
        """Rollback a migration safely"""
        # Implementation here

    async def get_migration_status(self) -> List[MigrationResult]:
        """Get all migration statuses"""
        # Implementation here
```

#### **Schema Definitions**

```sql
-- packages/particle0/supabase/migrations/001_initial_schema.sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    roles TEXT[] DEFAULT '{"user"}'::TEXT[]
);

-- Vaults (knowledge containers)
CREATE TABLE IF NOT EXISTS vaults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artifacts
CREATE TABLE IF NOT EXISTS artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_id UUID REFERENCES vaults(id),
    name TEXT NOT NULL,
    content JSONB,
    metadata JSONB,
    content_hash TEXT,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration audit log
CREATE TABLE IF NOT EXISTS migration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_id TEXT NOT NULL,
    status TEXT NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    duration_ms INTEGER,
    executed_by TEXT,
    error_message TEXT,
    rollback_info JSONB
);
```

---

## 🖥️ Week 3: Admin Interface

### **New Components for particle0-ui**

#### **Migration Status Dashboard**

```typescript
// packages/particle0-ui/src/components/admin/MigrationDashboard.tsx
interface MigrationStatus {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  executedAt: string;
  duration: number;
  errorMessage?: string;
}

export function MigrationDashboard() {
  const [migrations, setMigrations] = useState<MigrationStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Real-time updates via WebSocket or polling
  useEffect(() => {
    const fetchStatus = async () => {
      const response = await fetch("/api/v1/admin/migrations/status");
      const data = await response.json();
      setMigrations(data);
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Migration Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusCard
          title="Pending"
          count={migrations.filter((m) => m.status === "pending").length}
          color="yellow"
        />
        <StatusCard
          title="Completed"
          count={migrations.filter((m) => m.status === "completed").length}
          color="green"
        />
        <StatusCard
          title="Failed"
          count={migrations.filter((m) => m.status === "failed").length}
          color="red"
        />
      </div>

      <MigrationTable migrations={migrations} />
      <ManualTriggerPanel />
    </div>
  );
}
```

#### **Backend Admin Endpoints**

```python
# packages/particle0/particle0/api/v1/endpoints/admin.py
from fastapi import APIRouter, Depends, HTTPException
from alphab_logto.dependencies import get_current_user, require_role
from alphab_migrations import MigrationManager

router = APIRouter()

@router.get("/migrations/status")
async def get_migration_status(
    current_user = Depends(get_current_user),
    _admin = Depends(require_role("admin")),
    migration_manager: MigrationManager = Depends()
):
    """Get current migration status - admin only"""
    return await migration_manager.get_migration_status()

@router.post("/migrations/trigger")
async def trigger_migration(
    migration_id: str,
    current_user = Depends(get_current_user),
    _admin = Depends(require_role("admin")),
    migration_manager: MigrationManager = Depends()
):
    """Manually trigger a migration - admin only"""
    result = await migration_manager.apply_migration(migration_id)
    if result.status == MigrationStatus.FAILED:
        raise HTTPException(500, detail=result.error_message)
    return result
```

---

## ⚙️ Week 4: CI/CD Integration

### **GitHub Actions Workflow**

```yaml
# .github/workflows/migrations.yml
name: Database Migrations

on:
  push:
    branches: [main, staging]
    paths: ["packages/particle0/supabase/migrations/**"]

jobs:
  migrate-staging:
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
      - name: Install dependencies
        run: pnpm install
      - name: Run migrations (staging)
        run: pnpm migrate:staging
        env:
          SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.STAGING_SUPABASE_SERVICE_KEY }}

  migrate-production:
    if: github.ref == 'refs/heads/main'
    needs: [migrate-staging]
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Create backup
        run: pnpm migrate:backup
      - name: Run migrations (production)
        run: pnpm migrate:production
        env:
          SUPABASE_URL: ${{ secrets.PROD_SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.PROD_SUPABASE_SERVICE_KEY }}
      - name: Rollback on failure
        if: failure()
        run: pnpm migrate:rollback
```

### **Package Scripts**

```json
{
  "scripts": {
    "migrate:staging": "cd packages/particle0 && python -m alphab_migrations apply --env staging",
    "migrate:production": "cd packages/particle0 && python -m alphab_migrations apply --env production",
    "migrate:rollback": "cd packages/particle0 && python -m alphab_migrations rollback --env production",
    "migrate:backup": "cd packages/particle0 && python -m alphab_migrations backup --env production"
  }
}
```

---

## 🧪 Testing Strategy

### **Migration Tests**

```python
# packages/alphab-migrations/tests/test_migrations.py
import pytest
from alphab_migrations import MigrationManager
from alphab_supabase import SupabaseManager

@pytest.mark.asyncio
class TestMigrationSystem:
    async def test_migration_idempotency(self):
        """Test migrations can be run multiple times safely"""
        # Implementation

    async def test_rollback_scenarios(self):
        """Test rollback works in various failure scenarios"""
        # Implementation

    async def test_backup_restore(self):
        """Test backup and restore procedures"""
        # Implementation

    async def test_concurrent_migrations(self):
        """Test handling of concurrent migration attempts"""
        # Implementation

    async def test_audit_logging(self):
        """Test all migration events are properly logged"""
        # Implementation
```

---

## 📋 Implementation Checklist

### **Week 1**

- [ ] Fix JWT secret security issue
- [ ] Simplify dependency structure
- [ ] Create alphab-supabase package
- [ ] Implement basic Supabase connection
- [ ] Create initial schema migration

### **Week 2**

- [ ] Create alphab-migrations package
- [ ] Implement MigrationManager class
- [ ] Create migration execution system
- [ ] Implement rollback procedures
- [ ] Add comprehensive audit logging

### **Week 3**

- [ ] Build admin dashboard UI components
- [ ] Create migration status API endpoints
- [ ] Implement real-time status updates
- [ ] Add manual migration triggers
- [ ] Create audit trail displays

### **Week 4**

- [ ] Setup CI/CD migration workflows
- [ ] Implement automated backups
- [ ] Add production deployment safeguards
- [ ] Configure monitoring and alerting
- [ ] Complete end-to-end testing

---

## 🎯 Success Criteria

### **Technical Requirements**

- ✅ All migrations are idempotent and reversible
- ✅ Downtime is less than 1 minute per migration
- ✅ Complete audit trail for all operations
- ✅ Automated backup before each migration
- ✅ Real-time status updates in admin interface

### **Security Requirements**

- ✅ All admin operations require proper authentication
- ✅ Migration triggers are rate-limited
- ✅ Sensitive data is properly handled during migrations
- ✅ Audit logs are immutable and accessible

### **Compliance Requirements**

- ✅ All migration events are logged with timestamps
- ✅ User identity is tracked for manual operations
- ✅ Rollback events are fully documented
- ✅ Reports available for compliance reviews

---

_This roadmap provides a practical, week-by-week implementation plan for the Supabase Schema Management feature, building on the solid foundation already in place._
