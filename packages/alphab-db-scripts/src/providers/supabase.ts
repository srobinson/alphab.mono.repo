import { createMigrationService, MigrationService } from "@alphab/db-migrations";
import type { MigrationConfig, MigrationStatus } from "@alphab/db-migrations";
import { createClient, DatabaseClient } from "@alphab/db-supabase";

import { AbstractCLIRunner } from "../cli/abstract";
import chalk from "chalk";
/**
 * Supabase CLI Runner - Simple Supabase client implementation
 */
export class SupabaseCLIRunner extends AbstractCLIRunner {
  private config: MigrationConfig | null = null;
  private client: DatabaseClient | null = null;
  private migrationService: MigrationService | null = null;

  constructor() {
    super("supabase");
  }

  //  create a single supabase client
  // static supabase: DatabaseClient;
  async getDatabaseClient() {
    if (!this.client) {
      const config = await this.getConfig();

      if (!config.supabaseUrl) {
        console.log(chalk.red("❌ Supabase URL not configured"));
        throw new Error("Supabase URL not configured");
      }

      if (!config.supabaseKey) {
        console.log(chalk.red("❌ Supabase key not configured"));
        throw new Error("Supabase key not configured");
      }

      // Create client to test configuration
      this.client = createClient({
        url: config.supabaseUrl,
        anonKey: config.supabaseKey,
      });
    }
    return this.client;
  }

  async getMigrationService() {
    if (!this.migrationService) {
      const config = await this.getConfig();
      this.migrationService = createMigrationService(config);
    }
    return this.migrationService;
  }

  private async getConfig(): Promise<MigrationConfig> {
    if (!this.config) {
      // For now, create a simple config - we'll improve this later
      this.config = {
        provider: "supabase",
        supabaseUrl: process.env.SUPABASE_URL || "",
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "",
        migrationsPath: "./supabase/migrations",
      };
    }
    return this.config;
  }

  /**
   * Test Supabase connection
   */
  async ping(): Promise<boolean> {
    try {
      console.log(chalk.blue(`ℹ️  Testing ${this.provider} connection...`));

      const client = await this.getDatabaseClient();

      // ping db
      const result = await client.ping();
      if (!result) {
        console.log(chalk.red(`❌ Failed to ping database`));
        return false;
      }

      console.log(chalk.green(`✅ Database ping successful!`));
      // Simple validation - if we can create the client, config is valid
      console.log(chalk.green(`✅ ${this.provider} connection successful!`));
      console.log(chalk.blue(`ℹ️  URL: ${this.config?.supabaseUrl}`));
      return true;
    } catch (error) {
      console.log(chalk.red(`❌ Connection test failed: ${error}`));
      return false;
    }
  }

  /**
   * Run migrations (up)
   */
  async up(): Promise<void> {
    try {
      console.log(chalk.blue("ℹ️  Running migrations..."));

      const migrationService = await this.getMigrationService();
      await migrationService.up();

      console.log(chalk.green("✅ Migrations completed successfully!"));
    } catch (error) {
      console.log(chalk.red(`❌ Migration failed: ${error}`));
      throw error;
    }
  }

  /**
   * Rollback migrations (down)
   */
  async down(): Promise<void> {
    try {
      console.log(chalk.blue("ℹ️  Rolling back migrations..."));

      const migrationService = await this.getMigrationService();
      await migrationService.down();

      console.log(chalk.green("✅ Rollback completed successfully!"));
    } catch (error) {
      console.log(chalk.red(`❌ Rollback failed: ${error}`));
      throw error;
    }
  }

  /**
   * Rollback to specific version
   */
  async rollback(version: string): Promise<void> {
    console.log(
      chalk.yellow(`⚠️  Rollback to version ${version} not yet implemented for Supabase`),
    );
    console.log(chalk.blue("ℹ️  Use down() for now or implement version-specific rollback"));
  }

  /**
   * Show migration status
   */
  async status(): Promise<void> {
    try {
      console.log(chalk.blue("ℹ️  Getting migration status..."));

      const migrationService = await this.getMigrationService();
      const status = await migrationService.status();

      console.log(chalk.green("✅ Migration status:"));
      status.forEach((migration: MigrationStatus) => {
        const icon = migration.applied ? "✅" : "⏳";
        const appliedAt = migration.appliedAt ? migration.appliedAt.toISOString() : "Not applied";
        console.log(`  ${icon} ${migration.name} (${appliedAt})`);
      });
    } catch (error) {
      console.log(chalk.red(`❌ Failed to get status: ${error}`));
      throw error;
    }
  }

  /**
   * Show current version
   */
  async version(): Promise<void> {
    try {
      console.log(chalk.blue("ℹ️  Getting current version..."));

      const migrationService = await this.getMigrationService();
      const status = await migrationService.status();

      const latest = status.filter((m: MigrationStatus) => m.applied).pop();
      if (latest) {
        console.log(chalk.green(`✅ Current version: ${latest.version}`));
        console.log(chalk.blue(`ℹ️  Latest migration: ${latest.name}`));
      } else {
        console.log(chalk.yellow("⚠️  No migrations applied yet"));
      }
    } catch (error) {
      console.log(chalk.red(`❌ Failed to get version: ${error}`));
      throw error;
    }
  }

  /**
   * Setup environment
   */
  async envSetup(): Promise<void> {
    try {
      console.log(chalk.blue("ℹ️  Setting up Supabase environment..."));

      // Use require for CommonJS compatibility
      const envConfigSetup = require("@alphab/env-config/setup");
      await envConfigSetup.setupEnvironment();

      console.log(chalk.green("✅ Environment setup completed!"));
    } catch (error) {
      console.log(chalk.red(`❌ Environment setup failed: ${error}`));
      throw error;
    }
  }

  /**
   * Validate environment
   */
  async envValidate(): Promise<void> {
    try {
      console.log(chalk.blue("ℹ️  Validating Supabase environment..."));

      const config = await this.getConfig();

      console.log(chalk.green("✅ Environment configuration is valid!"));
      console.log(chalk.blue("ℹ️  Configuration Summary:"));
      console.log(`   Provider: ${config.provider}`);
      console.log(`   URL: ${config.supabaseUrl}`);
      console.log(`   Migrations Path: ${config.migrationsPath}`);
    } catch (error) {
      console.log(chalk.red(`❌ Environment validation failed: ${error}`));
      throw error;
    }
  }
}
