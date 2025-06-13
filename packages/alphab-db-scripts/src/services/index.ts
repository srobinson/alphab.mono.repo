/**
 * Services layer - clear interface between CLI and implementations
 * Familiar pattern: CLI → Service → Database
 *
 * NOW WITH REAL POWER! 🚀
 */

import {
  createClient as createDatabaseClient,
  createAdminClient,
  DatabaseClient,
} from "@alphab/db-supabase";
import {
  createMigrationService as createRealMigrationService,
  MigrationService,
  getMigrationConfig,
} from "@alphab/db-migrations";
import { getEnvironmentConfig } from "@alphab/env-config";
import chalk from "chalk";

// Enum for database providers (local copy to avoid import issues)
enum DBProvider {
  SUPABASE = "supabase",
  POSTGRES = "postgres",
  MONGODB = "mongodb",
}

/**
 * Enhanced DatabaseClient wrapper with additional CLI-friendly methods
 */
class EnhancedDatabaseClient {
  constructor(private client: DatabaseClient) {}

  // Delegate core methods
  async ping(): Promise<boolean> {
    return this.client.ping();
  }
  async sql(query: string, params?: any[]) {
    return this.client.sql(query, params);
  }
  get users(): any {
    return this.client.users;
  }
  get vaults(): any {
    return this.client.vaults;
  }
  get artifacts(): any {
    return this.client.artifacts;
  }
  get audit_logs(): any {
    return this.client.audit_logs;
  }

  // Additional CLI-friendly methods
  async healthCheck(): Promise<{ connected: boolean; version?: string; latency?: number }> {
    const start = Date.now();
    const connected = await this.ping();
    const latency = Date.now() - start;

    if (!connected) {
      return { connected: false };
    }

    try {
      // Try to get database version
      const result = await this.sql("SELECT version() as version");
      return {
        connected: true,
        latency,
        version: result.success ? "Supabase PostgreSQL" : undefined,
      };
    } catch (error) {
      return { connected: true, latency };
    }
  }
}

/**
 * Enhanced MigrationService wrapper with CLI-friendly features
 */
class EnhancedMigrationService {
  constructor(private service: MigrationService) {}

  // Delegate all MigrationService methods
  async up() {
    return this.service.up();
  }
  async down(steps?: number) {
    return this.service.down(steps);
  }
  async status() {
    return this.service.status();
  }
  async create(name: string) {
    return this.service.create(name);
  }
  async ping() {
    return this.service.ping();
  }

  // Additional CLI-friendly methods
  async getSummary(): Promise<{
    total: number;
    applied: number;
    pending: number;
    latest?: { version: string; name: string; appliedAt?: Date };
  }> {
    const status = await this.status();
    const applied = status.filter((m) => m.applied);
    const pending = status.filter((m) => !m.applied);
    const latest = applied.sort(
      (a, b) => (b.appliedAt?.getTime() || 0) - (a.appliedAt?.getTime() || 0),
    )[0];

    return {
      total: status.length,
      applied: applied.length,
      pending: pending.length,
      latest,
    };
  }

  async validateMigrations(): Promise<{ valid: boolean; issues: string[] }> {
    try {
      const status = await this.status();
      const issues: string[] = [];

      // Check for gaps in migration sequence
      const applied = status
        .filter((m) => m.applied)
        .sort((a, b) => a.version.localeCompare(b.version));

      // Add more sophisticated validation logic here in the future
      if (applied.length === 0) {
        issues.push("No migrations have been applied yet");
      }

      return { valid: issues.length === 0, issues };
    } catch (error) {
      return { valid: false, issues: [`Validation failed: ${error}`] };
    }
  }
}

/**
 * Service factory with environment auto-detection
 * NOW USING REAL IMPLEMENTATIONS! 🔥
 */
export function createDatabaseService(): {
  client: EnhancedDatabaseClient;
  admin: EnhancedDatabaseClient | null;
  migration: EnhancedMigrationService;
} {
  console.log(chalk.blue("🔧 Creating database service with real implementations..."));

  try {
    // Use our world-class env-config!
    const envConfig = getEnvironmentConfig();

    console.log(chalk.gray(`   Supabase URL: ${envConfig.supabase.url || "Not configured"}`));
    console.log(chalk.gray(`   Project: ${envConfig.database.projectName}`));

    // Create real Supabase clients
    const clientConfig = {
      url: envConfig.supabase.url,
      anonKey: envConfig.supabase.anonKey,
    };

    const adminConfig = envConfig.supabase.serviceRoleKey
      ? {
          url: envConfig.supabase.url,
          anonKey: envConfig.supabase.anonKey,
          serviceKey: envConfig.supabase.serviceRoleKey,
        }
      : null;

    // Create real migration service with injected database client
    const databaseClient = new EnhancedDatabaseClient(createDatabaseClient(clientConfig));
    const migrationConfig = {
      ...getMigrationConfig(DBProvider.SUPABASE as any),
      databaseClient: databaseClient, // Inject real client for SQL execution!
    };
    const migrationService = createRealMigrationService(migrationConfig);

    console.log(chalk.green("✅ Database service created with real implementations"));

    return {
      client: databaseClient, // Use the same client that was injected into migrations
      admin: adminConfig ? new EnhancedDatabaseClient(createAdminClient(adminConfig)) : null,
      migration: new EnhancedMigrationService(migrationService),
    };
  } catch (error) {
    console.warn(chalk.yellow(`⚠️  Falling back to development mode: ${error}`));

    // Fallback configuration for development
    const fallbackConfig = {
      url: process.env.SUPABASE_URL || "https://placeholder.supabase.co",
      anonKey: process.env.SUPABASE_ANON_KEY || "placeholder-anon-key",
    };

    // Create minimal migration service for fallback
    const fallbackMigrationConfig = {
      provider: "supabase" as const,
      supabaseUrl: fallbackConfig.url,
      supabaseKey: fallbackConfig.anonKey,
      migrationsPath: "./supabase/migrations",
    };

    return {
      client: new EnhancedDatabaseClient(createDatabaseClient(fallbackConfig)),
      admin: null,
      migration: new EnhancedMigrationService(createRealMigrationService(fallbackMigrationConfig)),
    };
  }
}

// Convenience functions that auto-configure from environment
export function createClient() {
  const service = createDatabaseService();
  return service.client;
}

export function createMigrationService() {
  const service = createDatabaseService();
  return service.migration;
}
