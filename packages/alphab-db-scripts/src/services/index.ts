/**
 * Services layer - clear interface between CLI and implementations
 * Familiar pattern: CLI → Service → Database
 *
 * REAL POWER! 🚀
 */

import { createClient as createDatabaseClient, createAdminClient } from "@alphab/db-supabase";
import type { DatabaseClient } from "@alphab/db-supabase";
import {
  DBProvider,
  createMigrationService as createRealMigrationService,
  getMigrationConfig,
} from "@alphab/db-migrations";
import type { MigrationService } from "@alphab/db-migrations";
import { getEnvironmentConfig } from "@alphab/env-config";
import chalk from "chalk";

/**
 * Enhanced DatabaseClient wrapper with additional CLI-friendly methods
 */
class EnhancedDatabaseClient {
  constructor(private client: DatabaseClient) {}

  // Delegate core methods
  async ping(): Promise<boolean> {
    return this.client.ping();
  }
  async sql(query: string, params?: unknown[]) {
    return this.client.sql(query, params);
  }
  get users() {
    return this.client.users as unknown as typeof this.client.users;
  }
  get vaults() {
    return this.client.vaults as unknown as typeof this.client.vaults;
  }
  get artifacts() {
    return this.client.artifacts as unknown as typeof this.client.artifacts;
  }
  get audit_logs() {
    return this.client.audit_logs as unknown as typeof this.client.audit_logs;
  }

  // Additional CLI-friendly methods
  async healthCheck(): Promise<{
    connected: boolean;
    version: string | undefined;
    latency: number | undefined;
  }> {
    const start = Date.now();
    const connected = await this.ping();
    const latency = Date.now() - start;

    if (!connected) {
      return { connected: false, version: undefined, latency: undefined };
    }

    try {
      // Try to get database version
      const result = await this.sql("SELECT version() as version");
      return {
        connected: true,
        latency,
        version: result.success ? "Supabase PostgreSQL" : undefined,
      };
    } catch (_: unknown) {
      return { connected: true, latency, version: undefined };
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
    latest: { version: string; name: string; appliedAt: Date | undefined } | undefined;
  }> {
    const status = await this.status();
    const applied = status.filter((m: { applied: boolean }) => m.applied);
    const pending = status.filter((m: { applied: boolean }) => !m.applied);
    // const latest = applied.sort(
    //   (a: { appliedAt: Date | undefined }, b: { appliedAt: Date | undefined }) =>
    //     (b.appliedAt?.getTime() || 0) - (a.appliedAt?.getTime() || 0),
    // )[0];
    const latest = applied.sort(
      (a, b) => (b.appliedAt?.getTime() || 0) - (a.appliedAt?.getTime() || 0),
    )[0];

    return {
      total: status.length,
      applied: applied.length,
      pending: pending.length,
      latest: latest
        ? {
            version: latest.version,
            name: latest.name,
            appliedAt: latest.appliedAt,
          }
        : undefined,
    };
  }

  async validateMigrations(): Promise<{ valid: boolean; issues: string[] }> {
    try {
      const status = await this.status();
      const issues: string[] = [];

      // Check for gaps in migration sequence
      const applied = status
        .filter((m: { applied: boolean }) => m.applied)
        .sort((a: { version: string }, b: { version: string }) =>
          a.version.localeCompare(b.version),
        );

      // Add more sophisticated validation logic here in the future
      if (applied.length === 0) {
        issues.push("No migrations have been applied yet");
      }

      return { valid: issues.length === 0, issues };
    } catch (error: unknown) {
      return { valid: false, issues: [`Validation failed: ${error}`] };
    }
  }
}

/**
 * 🔥 Service factory with environment auto-detection
 */
export function createDatabaseService(): {
  client: EnhancedDatabaseClient;
  admin: EnhancedDatabaseClient | null;
  migration: EnhancedMigrationService;
} {
  console.log(chalk.blue("🔧 Creating database service..."));

  try {
    // Use our world-class env-config!
    const envConfig = getEnvironmentConfig();

    // PREFER environment variables over config file for real deployments
    const supabaseUrl = process.env.SUPABASE_URL || envConfig.supabase.url;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || envConfig.supabase.anonKey;
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || envConfig.supabase.serviceRoleKey;

    console.log(chalk.gray(`   Supabase URL: ${supabaseUrl || "Not configured"}`));
    console.log(chalk.gray(`   Project: ${envConfig.database.projectName}`));
    console.log(chalk.gray(`   Service Key: ${supabaseServiceKey ? "SET" : "NOT SET"}`));

    // Create real Supabase clients
    const clientConfig = {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    };

    const adminConfig = supabaseServiceKey
      ? {
          url: supabaseUrl,
          anonKey: supabaseAnonKey,
          serviceKey: supabaseServiceKey,
        }
      : null;

    // Create real migration service with injected ADMIN database client (for SQL execution)
    const migrationDatabaseClient = adminConfig
      ? new EnhancedDatabaseClient(createAdminClient(adminConfig)) // Use service role for migrations
      : new EnhancedDatabaseClient(createDatabaseClient(clientConfig)); // Fallback to anon key

    const migrationConfig = {
      ...getMigrationConfig(DBProvider.SUPABASE as any),
      databaseClient: migrationDatabaseClient, // Inject admin client for SQL execution!
    };
    const migrationService = createRealMigrationService(migrationConfig);

    // Create regular client for general operations
    const regularClient = new EnhancedDatabaseClient(createDatabaseClient(clientConfig));

    console.log(chalk.green("✅ Database service created"));

    return {
      client: regularClient, // Regular client for general operations
      admin: adminConfig ? new EnhancedDatabaseClient(createAdminClient(adminConfig)) : null,
      migration: new EnhancedMigrationService(migrationService),
    };
  } catch (error: unknown) {
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
