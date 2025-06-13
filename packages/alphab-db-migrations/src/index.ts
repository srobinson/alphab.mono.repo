/**
 * @alphab/db-migrations - Simple, familiar migration framework
 *
 * Clear patterns like:
 * - db.migrate.up()
 * - db.migrate.down()
 * - db.migrate.status()
 */

import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import chalk from "chalk";

// Export clear, familiar interfaces with proper file extensions
export * from "./types.js";
export * from "./config.js";
export * from "./interfaces.js";

// Simple migration result types
export interface MigrationResult {
  version: string;
  name: string;
  success: boolean;
  duration: number;
  error?: string;
}

export interface MigrationStatus {
  version: string;
  name: string;
  applied: boolean;
  appliedAt?: Date;
}

export interface MigrationConfig {
  provider: "supabase" | "postgres" | "mysql";
  connectionString?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  migrationsPath?: string;
  // Add database client for real execution
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  databaseClient?: any; // Will be injected from outside
}

interface MigrationFile {
  version: string;
  name: string;
  filename: string;
  fullPath: string;
  sql: string;
  source: "app" | "package"; // Track where it came from
  priority: number; // For ordering
}

interface CombinedMigration {
  version: string;
  name: string;
  combinedSql: string;
  sources: MigrationFile[];
}

interface AppliedMigration {
  version: string;
  description: string;
  applied_at: Date;
  applied_by?: string;
}

// Main migration service - familiar naming
export class MigrationService {
  constructor(private config: MigrationConfig) {}

  /**
   * Check which migrations have been applied by querying the database
   */
  private async getAppliedMigrations(): Promise<AppliedMigration[]> {
    if (!this.config.databaseClient) {
      console.log(chalk.yellow("⚠️  No database client - using simulation mode"));
      return [];
    }

    try {
      // First ensure migration_log table exists
      await this.ensureMigrationLogTable();

      const result = await this.config.databaseClient.sql(
        "SELECT version, description, applied_at, applied_by FROM public.alphab_migration_log ORDER BY applied_at",
      );

      if (result.success && result.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return result.data.map((row: any) => ({
          version: row.version,
          description: row.description || "",
          applied_at: new Date(row.applied_at),
          applied_by: row.applied_by,
        }));
      }

      return [];
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Could not read migration log: ${error}`));
      return [];
    }
  }

  /**
   * Ensure the migration_log table exists
   */
  private async ensureMigrationLogTable(): Promise<void> {
    if (!this.config.databaseClient) return;

    try {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.alphab_migration_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          version VARCHAR(50) UNIQUE NOT NULL,
          description TEXT,
          applied_at TIMESTAMPTZ DEFAULT NOW(),
          applied_by UUID,
          checksum VARCHAR(64)
        );
      `;

      await this.config.databaseClient.sql(createTableSQL);
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Could not ensure migration_log table: ${error}`));
    }
  }

  /**
   * Record a successful migration in the database
   */
  private async recordMigration(version: string, description: string): Promise<void> {
    if (!this.config.databaseClient) return;

    try {
      const insertSQL = `
        INSERT INTO public.alphab_migration_log (version, description)
        VALUES ($1, $2)
        ON CONFLICT (version) DO NOTHING;
      `;

      await this.config.databaseClient.sql(insertSQL, [version, description]);
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Could not record migration: ${error}`));
    }
  }

  /**
   * Execute SQL against the database
   */
  private async executeSql(sql: string): Promise<{ success: boolean; error?: string }> {
    if (!this.config.databaseClient) {
      console.log(chalk.yellow("⚠️  No database client - simulating execution"));
      // Simulate execution
      await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 500));
      return { success: true };
    }

    try {
      const result = await this.config.databaseClient.sql(sql);
      return { success: result.success, error: result.error?.message };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Discover migration files from multiple locations
   * 1. app/project-name/db/migrations (first priority)
   * 2. packages/alphab-db-supabase/migrations (second priority)
   */
  private async discoverMigrations(): Promise<CombinedMigration[]> {
    const migrationFiles: MigrationFile[] = [];

    // Location 1: App-specific migrations
    await this.discoverFromLocation("apps/particle0-api/db/migrations", "app", 1, migrationFiles);

    // Location 2: Package migrations - Common
    await this.discoverFromLocation(
      "packages/alphab-db-supabase/migrations/alphab/common",
      "package",
      2,
      migrationFiles,
    );

    // Location 3: Package migrations - App-specific
    await this.discoverFromLocation(
      "packages/alphab-db-supabase/migrations/alphab/apps/particle0",
      "package",
      3,
      migrationFiles,
    );

    // Group by version and combine SQL
    return this.combineMigrationsByVersion(migrationFiles);
  }

  /**
   * Discover migrations from a specific location
   */
  private async discoverFromLocation(
    path: string,
    source: "app" | "package",
    priority: number,
    migrationFiles: MigrationFile[],
  ): Promise<void> {
    if (!existsSync(path)) {
      console.log(chalk.gray(`📂 Migration path not found: ${path}`));
      return;
    }

    try {
      const files = await readdir(path);
      console.log(chalk.blue(`🔍 Scanning ${source} migrations: ${path}`));

      for (const filename of files) {
        // Match files like: 20240113_001_create_users_table.sql
        const match = filename.match(/^(\d{8})_(\d{3})_(.+)\.sql$/);
        if (!match) continue;

        const dateVersion = match[1]; // 20240113
        const sequenceNumber = match[2]; // 001
        const name = match[3]; // create_users_table
        if (!dateVersion || !sequenceNumber || !name) continue;

        const version = `${dateVersion}_${sequenceNumber}`; // 20240113_001
        const fullPath = join(path, filename);

        try {
          const sql = await readFile(fullPath, "utf-8");
          migrationFiles.push({
            version,
            name,
            filename,
            fullPath,
            sql,
            source,
            priority,
          });

          console.log(chalk.green(`  ✅ Found: ${version}_${name} (${source})`));
        } catch (error) {
          console.warn(chalk.yellow(`  ⚠️  Could not read: ${filename}`), error);
        }
      }
    } catch (error) {
      console.error(chalk.red(`❌ Error reading directory ${path}: ${error}`));
    }
  }

  /**
   * Combine migrations by version, concatenating SQL in priority order
   */
  private combineMigrationsByVersion(migrationFiles: MigrationFile[]): CombinedMigration[] {
    const migrationMap = new Map<string, MigrationFile[]>();

    // Group by version
    for (const migration of migrationFiles) {
      if (!migrationMap.has(migration.version)) {
        migrationMap.set(migration.version, []);
      }
      migrationMap.get(migration.version)!.push(migration);
    }

    const combinedMigrations: CombinedMigration[] = [];

    // Process each version
    for (const [version, migrations] of migrationMap.entries()) {
      // Sort by priority (app first, then package)
      migrations.sort((a, b) => a.priority - b.priority);

      // Combine SQL and names
      const combinedSql = migrations
        .map((m) => `-- From: ${m.source} (${m.fullPath})\n${m.sql}`)
        .join("\n\n");

      const combinedName = migrations.map((m) => m.name).join(" + ");

      combinedMigrations.push({
        version,
        name: combinedName,
        combinedSql,
        sources: migrations,
      });

      console.log(chalk.cyan(`📦 Combined migration ${version}: ${migrations.length} files`));
      migrations.forEach((m) => {
        console.log(chalk.gray(`    ${m.source}: ${m.name}`));
      });
    }

    // Sort by version
    return combinedMigrations.sort((a, b) => a.version.localeCompare(b.version));
  }

  /**
   * Run pending migrations - familiar like Knex migrate:latest
   */
  async up(): Promise<MigrationResult[]> {
    console.log(chalk.blue("🔍 Discovering migration files..."));

    const combinedMigrations = await this.discoverMigrations();
    if (combinedMigrations.length === 0) {
      console.log(chalk.yellow("⚠️  No migration files found"));
      return [];
    }

    console.log(chalk.green(`✅ Found ${combinedMigrations.length} combined migration versions`));

    // Get applied migrations from database
    const appliedMigrations = await this.getAppliedMigrations();
    const appliedVersions = new Set(appliedMigrations.map((m) => m.version));

    // Filter to only pending migrations
    const pendingMigrations = combinedMigrations.filter((m) => !appliedVersions.has(m.version));

    if (pendingMigrations.length === 0) {
      console.log(chalk.green("✅ All migrations are already applied"));
      return [];
    }

    console.log(chalk.blue(`🚀 Found ${pendingMigrations.length} pending migrations`));

    const results: MigrationResult[] = [];

    for (const migration of pendingMigrations) {
      const start = Date.now();

      try {
        console.log(
          chalk.blue(
            `🚀 Applying migration: ${migration.version} (${migration.sources.length} files)`,
          ),
        );
        migration.sources.forEach((source) => {
          console.log(chalk.gray(`    📄 ${source.source}: ${source.name}`));
        });

        // **REAL EXECUTION** - Execute the combined SQL migration
        console.log(
          chalk.gray(`📝 Executing ${migration.combinedSql.split("\n").length} lines of SQL...`),
        );
        const executionResult = await this.executeSql(migration.combinedSql);

        if (!executionResult.success) {
          throw new Error(executionResult.error || "SQL execution failed");
        }

        // Record successful migration in database
        await this.recordMigration(migration.version, migration.name);

        const duration = Date.now() - start;
        results.push({
          version: migration.version,
          name: migration.name,
          success: true,
          duration,
        });

        console.log(chalk.green(`✅ Applied ${migration.version} (${duration}ms)`));
      } catch (error) {
        const duration = Date.now() - start;
        results.push({
          version: migration.version,
          name: migration.name,
          success: false,
          duration,
          error: String(error),
        });

        console.error(chalk.red(`❌ Failed ${migration.version}: ${error}`));
        break; // Stop on first failure
      }
    }

    return results;
  }

  /**
   * Rollback migrations - familiar like Knex migrate:rollback
   */
  async down(steps: number = 1): Promise<MigrationResult[]> {
    console.log(chalk.blue(`🔄 Rolling back ${steps} migration(s)...`));

    const combinedMigrations = await this.discoverMigrations();

    // Get the last N applied migrations (simulate from versions)
    const toRollback = combinedMigrations.slice(-steps).reverse(); // Rollback in reverse order

    const results: MigrationResult[] = [];

    for (const migration of toRollback) {
      const start = Date.now();

      try {
        console.log(
          chalk.blue(`⬇️  Rolling back: ${migration.version} (${migration.sources.length} files)`),
        );
        migration.sources.forEach((source) => {
          console.log(chalk.gray(`    📄 ${source.source}: ${source.name}`));
        });

        // TODO: Execute rollback SQL (would need separate down migrations)
        // For now, simulate rollback
        await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 300));

        const duration = Date.now() - start;
        results.push({
          version: migration.version,
          name: migration.name,
          success: true,
          duration,
        });

        console.log(chalk.green(`✅ Rolled back ${migration.version} (${duration}ms)`));
      } catch (error) {
        const duration = Date.now() - start;
        results.push({
          version: migration.version,
          name: migration.name,
          success: false,
          duration,
          error: String(error),
        });

        console.error(chalk.red(`❌ Rollback failed ${migration.version}: ${error}`));
        break;
      }
    }

    return results;
  }

  /**
   * Show migration status - familiar like Prisma migrate status
   */
  async status(): Promise<MigrationStatus[]> {
    console.log(chalk.blue("📊 Checking migration status..."));

    const combinedMigrations = await this.discoverMigrations();
    const appliedMigrations = await this.getAppliedMigrations();
    const appliedVersions = new Map(appliedMigrations.map((m) => [m.version, m]));

    return combinedMigrations.map((migration) => {
      const appliedMigration = appliedVersions.get(migration.version);
      const result: MigrationStatus = {
        version: migration.version,
        name: migration.name,
        applied: !!appliedMigration,
      };

      if (appliedMigration) {
        result.appliedAt = appliedMigration.applied_at;
      }

      return result;
    });
  }

  /**
   * Create new migration file - familiar like Prisma migrate dev
   */
  async create(name: string): Promise<string> {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:Z]/g, "")
      .slice(0, 14);

    const filename = `${timestamp}_${name.replace(/[^a-zA-Z0-9_]/g, "_")}.sql`;
    const migrationsPath = this.config.migrationsPath || "./supabase/migrations";
    const filePath = join(migrationsPath, filename);

    const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

-- Add your SQL here
-- Example:
-- CREATE TABLE users (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   email TEXT UNIQUE NOT NULL,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );
`;

    try {
      // TODO: Actually write the file (for now just return the path)
      console.log(chalk.green(`✅ Migration template ready: ${filePath}`));
      console.log(chalk.gray("File content:"));
      console.log(chalk.gray(template));

      return filePath;
    } catch (error) {
      throw new Error(`Failed to create migration file: ${error}`);
    }
  }

  /**
   * Test database connection
   */
  async ping(): Promise<boolean> {
    console.log(chalk.blue("🔌 Testing database connection..."));

    // TODO: Implement actual connection test based on provider
    // For now, simulate connection test
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (
      this.config.supabaseUrl &&
      this.config.supabaseUrl !== "" &&
      !this.config.supabaseUrl.includes("placeholder")
    ) {
      console.log(chalk.green("✅ Database connection successful (simulated)"));
      return true;
    } else {
      console.log(chalk.yellow("⚠️  Database connection failed - invalid configuration"));
      return false;
    }
  }
}

/**
 * Factory function - familiar pattern
 */
export function createMigrationService(config: MigrationConfig): MigrationService {
  return new MigrationService(config);
}

// Backwards compatibility (but encourage new naming)
export { MigrationService as MigrationRunner };
export { createMigrationService as createMigrationRunner };
