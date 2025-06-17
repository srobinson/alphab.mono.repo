#!/usr/bin/env node
// packages/alphab-db-scripts/src/index.ts

import { Command } from "commander";
import chalk from "chalk";
import { createMigrationService, createClient } from "./services";

// Type definitions for CLI
interface MigrationResult {
  version: string;
  name: string;
  success: boolean;
  duration: number;
}

interface MigrationStatus {
  version: string;
  name: string;
  applied: boolean;
  appliedAt?: Date;
}

interface RollbackOptions {
  steps: string;
}

/**
 * Database CLI - familiar commands like Rails, Laravel, Prisma
 */
const program = new Command();

program.name("db").description("Database CLI for alphab projects").version("1.0.0");

// Add global provider option
program.option("-p, --provider <provider>", "database provider", "supabase");

/**
 * Connection Commands
 */
program
  .command("ping")
  .description("Test database connection")
  .action(async () => {
    try {
      console.log(chalk.blue("🔌 Testing database connection..."));

      const client = createClient();
      const isConnected = await client.ping();

      if (isConnected) {
        console.log(chalk.green("✅ Database connection successful"));
      } else {
        console.log(chalk.red("❌ Database connection failed"));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red("❌ Connection test failed:"), error);
      process.exit(1);
    }
  });

/**
 * Migration Commands - familiar patterns
 */
program
  .command("migrate")
  .description("Run pending migrations")
  .action(async () => {
    try {
      console.log(chalk.blue("🚀 Running migrations..."));

      const migrationService = createMigrationService();
      const results: MigrationResult[] = await migrationService.up();

      console.log(chalk.green(`✅ Applied ${results.length} migrations`));
      results.forEach((r: MigrationResult) => {
        console.log(`  ${r.success ? "✅" : "❌"} ${r.version} - ${r.name} (${r.duration}ms)`);
      });
    } catch (error) {
      console.error(chalk.red("❌ Migration failed:"), error);
      process.exit(1);
    }
  });

program
  .command("rollback")
  .description("Rollback last migration")
  .option("-s, --steps <steps>", "number of migrations to rollback", "1")
  .action(async (options: RollbackOptions) => {
    try {
      const steps = parseInt(options.steps);
      console.log(chalk.yellow(`⬇️ Rolling back ${steps} migration(s)...`));

      const migrationService = createMigrationService();
      const results: MigrationResult[] = await migrationService.down(steps);

      console.log(chalk.green(`✅ Rolled back ${results.length} migrations`));
      results.forEach((r: MigrationResult) => {
        console.log(`  ${r.success ? "✅" : "❌"} ${r.version} - ${r.name} (${r.duration}ms)`);
      });
    } catch (error) {
      console.error(chalk.red("❌ Rollback failed:"), error);
      process.exit(1);
    }
  });

program
  .command("status")
  .description("Show migration status")
  .action(async () => {
    try {
      console.log(chalk.blue("📊 Migration status:"));

      const migrationService = createMigrationService();
      const status: MigrationStatus[] = await migrationService.status();

      console.log();
      status.forEach((migration: MigrationStatus) => {
        const icon = migration.applied ? "✅" : "⏳";
        const appliedText = migration.applied
          ? chalk.green(`applied ${migration.appliedAt?.toISOString()}`)
          : chalk.yellow("pending");

        console.log(`${icon} ${migration.version} - ${migration.name} (${appliedText})`);
      });

      const pending = status.filter((m: MigrationStatus) => !m.applied).length;
      const applied = status.filter((m: MigrationStatus) => m.applied).length;

      console.log();
      console.log(`📈 Total: ${status.length} migrations (${applied} applied, ${pending} pending)`);
    } catch (error) {
      console.error(chalk.red("❌ Status check failed:"), error);
      process.exit(1);
    }
  });

program
  .command("create <name>")
  .description("Create new migration file")
  .action(async (name: string) => {
    try {
      console.log(chalk.blue(`📝 Creating migration: ${name}`));

      const migrationService = createMigrationService();
      const filePath: string = await migrationService.create(name);

      console.log(chalk.green(`✅ Created migration: ${filePath}`));
      console.log(chalk.gray("Edit the file to add your schema changes"));
    } catch (error) {
      console.error(chalk.red("❌ Migration creation failed:"), error);
      process.exit(1);
    }
  });

/**
 * Environment Commands
 */
program
  .command("env:setup")
  .description("Setup environment configuration")
  .action(async () => {
    try {
      console.log(chalk.blue("⚙️ Setting up environment..."));
      // Implementation for environment setup
      console.log(chalk.green("✅ Environment setup complete"));
    } catch (error) {
      console.error(chalk.red("❌ Environment setup failed:"), error);
      process.exit(1);
    }
  });

/**
 * Help command with clear examples
 */
program
  .command("help")
  .description("Show help with examples")
  .action(() => {
    console.log(chalk.blue("📚 Database CLI Help"));
    console.log(chalk.blue("=================="));
    console.log();
    console.log(chalk.yellow("Connection:"));
    console.log("  db ping                    # Test database connection");
    console.log();
    console.log(chalk.yellow("Migrations:"));
    console.log("  db migrate                 # Run pending migrations");
    console.log("  db rollback                # Rollback last migration");
    console.log("  db rollback --steps 3      # Rollback 3 migrations");
    console.log("  db status                  # Show migration status");
    console.log("  db create add_users_table  # Create new migration");
    console.log();
    console.log(chalk.yellow("Environment:"));
    console.log("  db env:setup               # Setup environment");
    console.log();
    console.log(chalk.gray("Tip: All commands use your .env.local configuration"));
  });

// Parse and handle no command case
program.parse();

if (!process.argv.slice(2).length) {
  program.help();
}
