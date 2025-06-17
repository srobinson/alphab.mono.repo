/**
 * Migration configuration
 */
export interface MigrationConfig<TProviderConfig = unknown> {
  provider: "supabase" | "postgres" | "mysql" | "mongodb";
  project: string;
  environment: "development" | "staging" | "production";
  migrationsPath?: string;
  schemasPath?: string;
  providerConfig: TProviderConfig;
}

// Provider-specific configurations
export interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
  anonKey?: string;
}

export interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

export interface MongoConfig {
  connectionString: string;
  database: string;
}

// Type-safe provider configs
export type SupabaseMigrationConfig = MigrationConfig<SupabaseConfig>;
export type PostgresMigrationConfig = MigrationConfig<PostgresConfig>;
export type MongoMigrationConfig = MigrationConfig<MongoConfig>;

/**
 * Migration metadata
 */
export interface Migration {
  id: string;
  version: string;
  name: string;
  description?: string;
  author?: string;
  createdAt: Date;
  appliedAt?: Date;
  appliedBy?: string;
  checksum: string;
  filePath: string;
  upSql: string;
  downSql?: string;
}

/**
 * Migration execution result
 */
export interface MigrationResult {
  success: boolean;
  migration: Migration;
  executionTime: number;
  error?: Error;
  output?: string;
}

/**
 * Migration status
 */
export interface MigrationStatus {
  version: string;
  name: string;
  appliedAt: Date | undefined;
  appliedBy: string | undefined;
  status: "pending" | "applied" | "failed" | "rolled_back";
}

/**
 * Migration plan
 */
export interface MigrationPlan {
  migrationsToApply: Migration[];
  currentVersion: string | undefined;
  targetVersion: string;
  estimatedTime: number;
}

/**
 * Rollback plan
 */
export interface RollbackPlan {
  migrationsToRollback: Migration[];
  currentVersion: string;
  targetVersion: string;
  estimatedTime: number;
}

/**
 * Migration audit log entry
 */
export interface MigrationAuditLog {
  id: string;
  migrationVersion: string;
  action: "apply" | "rollback" | "failed";
  executedAt: Date;
  executedBy?: string;
  executionTime: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Database connection info
 */
export interface DatabaseInfo {
  provider: string;
  version: string;
  host: string;
  database: string;
  connected: boolean;
  lastChecked: Date;
}

/**
 * Migration lock
 */
export interface MigrationLock {
  id: string;
  lockedBy: string;
  lockedAt: Date;
  operation: "migrate" | "rollback";
  metadata?: Record<string, unknown>;
}

/**
 * Schema validation result
 */
export interface SchemaValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  checkedAt: Date;
}

/**
 * Migration statistics
 */
export interface MigrationStats {
  totalMigrations: number;
  appliedMigrations: number;
  pendingMigrations: number;
  failedMigrations: number;
  lastMigrationAt: Date | undefined;
  averageExecutionTime: number;
}
