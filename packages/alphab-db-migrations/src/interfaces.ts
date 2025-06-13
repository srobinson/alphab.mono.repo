import type {
  Migration,
  MigrationResult,
  MigrationStatus,
  MigrationStats,
  DatabaseInfo,
} from "./types";

/**
 * Database provider enumeration
 */
export enum DBProvider {
  SUPABASE = "supabase",
  POSTGRES = "postgres",
  MONGODB = "mongodb",
}

/**
 * Repository Pattern: Migration Runner Interface
 *
 * This interface defines the contract for database migration operations
 * using specific methods rather than a generic execute approach.
 * Each method has a clear purpose and type-safe return values.
 */
export interface IMigrationRunner {
  /**
   * Initialize the migration runner with configuration
   */
  // initialize(config: MigrationConfig<TProviderConfig>): Promise<void>;

  /**
   * Test database connection (ping)
   * @returns Promise<boolean> - true if connection successful
   */
  ping(): Promise<boolean>;

  /**
   * Get database connection information
   */
  getDatabaseInfo(): Promise<DatabaseInfo>;

  /**
   * Get current migration status for all migrations
   */
  getStatus(): Promise<MigrationStatus[]>;

  /**
   * Get migration statistics (counts, last migration, etc.)
   */
  getStats(): Promise<MigrationStats>;

  /**
   * Execute pending migrations (up)
   * @param targetVersion - Optional target version to migrate to
   * @returns Array of migration results
   */
  up(targetVersion?: string): Promise<MigrationResult[]>;

  /**
   * Rollback migrations (down)
   * @param targetVersion - Target version to rollback to
   * @returns Array of rollback results
   */
  down(targetVersion: string): Promise<MigrationResult[]>;

  /**
   * Get available migrations that can be applied
   */
  getAvailableMigrations(): Promise<Migration[]>;

  /**
   * Create a new migration file
   * @param name - Migration name
   * @param description - Optional description
   * @returns Path to created migration file
   */
  create(name: string, description?: string): Promise<string>;

  /**
   * Validate current database schema
   */
  validate(): Promise<{ valid: boolean; errors: string[] }>;

  /**
   * Clean up resources and close connections
   */
  cleanup(): Promise<void>;
}

/**
 * Migration Discovery Service Interface
 *
 * Separate service for discovering migration files from various locations
 */
export interface IMigrationDiscovery {
  /**
   * Discover migrations from all configured locations
   * @param projectName - Project name for scoped discovery
   * @returns Array of discovered migrations
   */
  discoverMigrations(projectName: string): Promise<Migration[]>;

  /**
   * Get migration sources/locations
   */
  getMigrationSources(projectName: string): Promise<
    Array<{
      path: string;
      location: string;
      exists: boolean;
    }>
  >;

  /**
   * Concatenate multiple migrations into a single SQL string
   * @param migrations - Array of migrations to concatenate
   * @returns Concatenated SQL string
   */
  concatenateMigrations(migrations: Migration[]): Promise<string>;
}

/**
 * Provider-specific capabilities interface
 *
 * Different database providers have different capabilities
 */
export interface IProviderCapabilities {
  /**
   * Does the provider support transactions?
   */
  supportsTransactions: boolean;

  /**
   * Does the provider support rollbacks?
   */
  supportsRollbacks: boolean;

  /**
   * Does the provider support schema validation?
   */
  supportsSchemaValidation: boolean;

  /**
   * Does the provider support concurrent migrations?
   */
  supportsConcurrentMigrations: boolean;

  /**
   * Maximum migration file size (in bytes)
   */
  maxMigrationSize?: number;

  /**
   * Supported SQL features
   */
  supportedFeatures: string[];
}

/**
 * Extended Migration Runner with Provider Capabilities
 */
export interface IMigrate extends IMigrationRunner {
  /**
   * Get provider-specific capabilities
   */
  getCapabilities(): IProviderCapabilities;

  /**
   * Execute custom SQL (for advanced users)
   * @param sql - SQL to execute
   * @param options - Execution options
   */
  executeSql(
    sql: string,
    options?: {
      transaction?: boolean;
      timeout?: number;
    },
  ): Promise<unknown>;

  /**
   * Backup database before migration (if supported)
   */
  backup(): Promise<{ success: boolean; backupId?: string; error?: string }>;

  /**
   * Restore from backup (if supported)
   */
  restore(backupId: string): Promise<{ success: boolean; error?: string }>;
}
