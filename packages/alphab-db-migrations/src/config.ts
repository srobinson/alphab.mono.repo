import { DBProvider } from "./interfaces.js";
import type { MigrationConfig } from "./index.js";
import { getEnvironmentConfig, validateEnvironment } from "@alphab/env-config";
import chalk from "chalk";

/**
 * Generic migration config factory using @alphab/env-config
 */
export function getMigrationConfig(provider: DBProvider): MigrationConfig {
  switch (provider) {
    case DBProvider.SUPABASE:
      return getSupabaseMigrationConfig();
    case DBProvider.POSTGRES:
      return getPostgresMigrationConfig();
    case DBProvider.MONGODB:
      return getMongoMigrationConfig();
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Supabase-specific configuration using env-config
 */
export function getSupabaseMigrationConfig(): MigrationConfig {
  try {
    // Use the world-class env-config package!
    const envConfig = getEnvironmentConfig();
    const validation = validateEnvironment();

    // Show validation warnings but don't fail
    if (validation.warnings.length > 0) {
      console.warn(chalk.yellow("⚠️  Environment warnings:"));
      validation.warnings.forEach((warning) => {
        console.warn(chalk.yellow(`   ${warning.variable}: ${warning.message}`));
      });
    }

    // Fail on validation errors
    if (!validation.isValid) {
      console.error(chalk.red("❌ Environment validation failed:"));
      validation.errors.forEach((error) => {
        console.error(chalk.red(`   ${error.variable}: ${error.message}`));
      });
      throw new Error("Environment configuration is invalid. Run 'pnpm setup' to fix.");
    }

    return {
      provider: "supabase",
      supabaseUrl: envConfig.supabase.url,
      supabaseKey: envConfig.supabase.serviceRoleKey || envConfig.supabase.anonKey,
      migrationsPath: "./supabase/migrations",
    };
  } catch (error) {
    // Fallback for development/testing
    console.warn(chalk.yellow(`⚠️  Using fallback config: ${error}`));
    return {
      provider: "supabase",
      supabaseUrl: process.env.SUPABASE_URL || "",
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "",
      migrationsPath: "./supabase/migrations",
    };
  }
}

/**
 * PostgreSQL-specific configuration
 */
export function getPostgresMigrationConfig(): MigrationConfig {
  return {
    provider: "postgres",
    connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/mydb",
    migrationsPath: "./migrations",
  };
}

/**
 * MongoDB-specific configuration
 */
export function getMongoMigrationConfig(): MigrationConfig {
  return {
    provider: "mysql", // Will change to mongodb when we add support
    connectionString: process.env.MONGODB_URL || "mongodb://localhost:27017/mydb",
    migrationsPath: "./migrations",
  };
}

/**
 * Get provider from string with validation
 */
export function getProviderFromString(providerStr: string): DBProvider {
  const provider = Object.values(DBProvider).find((p) => p === providerStr);
  if (!provider) {
    throw new Error(
      `Invalid provider: ${providerStr}. Supported providers: ${Object.values(DBProvider).join(", ")}`,
    );
  }
  return provider;
}
