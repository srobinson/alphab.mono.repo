import { config } from "dotenv";
import { resolve, join } from "path";
import { existsSync } from "fs";
import type {
  EnvironmentConfig,
  EnvironmentVariables,
  ValidationResult,
  ValidationError,
} from "./types";

/**
 * Environment variable loader following Turborepo best practices
 *
 * Loading order (highest to lowest priority):
 * 1. Process environment variables
 * 2. Package-specific .env.local
 * 3. Package-specific .env
 * 4. Root .env.local
 * 5. Root .env
 */
export class EnvironmentLoader {
  private static instance: EnvironmentLoader;
  private loadedConfig: EnvironmentConfig | null = null;
  private packagePath: string;
  private rootPath: string;

  constructor(packagePath?: string) {
    this.packagePath = packagePath || process.cwd();
    this.rootPath = this.findMonorepoRoot();
  }

  static getInstance(packagePath?: string): EnvironmentLoader {
    if (!EnvironmentLoader.instance) {
      EnvironmentLoader.instance = new EnvironmentLoader(packagePath);
    }
    return EnvironmentLoader.instance;
  }

  /**
   * Load environment variables following Turborepo best practices
   */
  loadEnvironment(): EnvironmentConfig {
    if (this.loadedConfig) {
      return this.loadedConfig;
    }

    // Load environment files in order of precedence
    this.loadEnvFiles();

    // Parse and validate environment variables
    const rawEnv = process.env as EnvironmentVariables;
    this.loadedConfig = this.parseEnvironmentVariables(rawEnv);

    return this.loadedConfig;
  }

  /**
   * Validate environment configuration
   */
  validate(config?: EnvironmentConfig): ValidationResult {
    const envConfig = config || this.loadedConfig || this.loadEnvironment();
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Required Supabase variables
    if (!envConfig.supabase.url) {
      errors.push({
        variable: "SUPABASE_URL",
        message: "Supabase URL is required",
        required: true,
      });
    }

    if (!envConfig.supabase.serviceRoleKey) {
      errors.push({
        variable: "SUPABASE_SERVICE_ROLE_KEY",
        message: "Supabase service role key is required for database operations",
        required: true,
      });
    }

    // Validate URL format
    if (envConfig.supabase.url && !this.isValidUrl(envConfig.supabase.url)) {
      errors.push({
        variable: "SUPABASE_URL",
        message: "SUPABASE_URL must be a valid URL",
        required: true,
      });
    }

    // Validate environment
    if (!["development", "staging", "production"].includes(envConfig.nodeEnv)) {
      warnings.push({
        variable: "NODE_ENV",
        message: "NODE_ENV should be one of: development, staging, production",
        required: false,
      });
    }

    // Production-specific validations
    if (envConfig.nodeEnv === "production") {
      if (envConfig.auth.jwtSecretKey === "your-jwt-secret-key-here") {
        errors.push({
          variable: "JWT_SECRET_KEY",
          message: "JWT_SECRET_KEY must be changed from default value in production",
          required: true,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get configuration for specific service
   */
  getSupabaseConfig(): EnvironmentConfig["supabase"] {
    return this.loadEnvironment().supabase;
  }

  getDatabaseConfig(): EnvironmentConfig["database"] {
    return this.loadEnvironment().database;
  }

  getApiConfig(): EnvironmentConfig["api"] {
    return this.loadEnvironment().api;
  }

  getAuthConfig(): EnvironmentConfig["auth"] {
    return this.loadEnvironment().auth;
  }

  /**
   * Check if running in specific environment
   */
  isDevelopment(): boolean {
    return this.loadEnvironment().nodeEnv === "development";
  }

  isProduction(): boolean {
    return this.loadEnvironment().nodeEnv === "production";
  }

  isStaging(): boolean {
    return this.loadEnvironment().nodeEnv === "staging";
  }

  private findMonorepoRoot(): string {
    let currentPath = this.packagePath;

    while (currentPath !== "/") {
      if (
        existsSync(join(currentPath, "pnpm-workspace.yaml")) ||
        existsSync(join(currentPath, "turbo.json"))
      ) {
        return currentPath;
      }
      currentPath = resolve(currentPath, "..");
    }

    return this.packagePath; // Fallback to package path
  }

  private loadEnvFiles(): void {
    const envFiles = [
      // Root level (lowest priority)
      join(this.rootPath, ".env"),
      join(this.rootPath, ".env.local"),

      // Package level (highest priority)
      join(this.packagePath, ".env"),
      join(this.packagePath, ".env.local"),
    ];

    for (const envFile of envFiles) {
      if (existsSync(envFile)) {
        config({ path: envFile, override: false });
      }
    }
  }

  private parseEnvironmentVariables(env: EnvironmentVariables): EnvironmentConfig {
    return {
      nodeEnv: (env.NODE_ENV as any) || "development",

      supabase: {
        url: env.SUPABASE_URL || "",
        anonKey: env.SUPABASE_ANON_KEY || "",
        serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || "",
      },

      database: {
        projectName: env.PROJECT_NAME || "particle0",
        poolSize: parseInt(env.DB_POOL_SIZE || "10"),
        timeout: parseInt(env.DB_TIMEOUT || "30000"),
      },

      api: {
        v1Str: env.API_V1_STR || "/api/v1",
        corsOrigins: env.BACKEND_CORS_ORIGINS?.split(",") || ["http://localhost:3000"],
      },

      auth: {
        jwtSecretKey: env.JWT_SECRET_KEY || "",
        jwtAlgorithm: env.JWT_ALGORITHM || "HS256",
        accessTokenExpireMinutes: parseInt(env.ACCESS_TOKEN_EXPIRE_MINUTES || "30"),
        logtoEndpoint: env.LOGTO_ENDPOINT || "",
        logtoAppId: env.LOGTO_APP_ID || "",
        logtoAppSecret: env.LOGTO_APP_SECRET || "",
        logtoRedirectUri: env.LOGTO_REDIRECT_URI || "",
        logtoM2mAppId: env.LOGTO_M2M_APP_ID || "",
        logtoM2mAppSecret: env.LOGTO_M2M_APP_SECRET || "",
      },

      development: {
        verbose: env.VERBOSE === "true",
        debug: env.DEBUG === "true",
      },
    };
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Convenience function to get environment configuration
 */
export function getEnvironmentConfig(packagePath?: string): EnvironmentConfig {
  return EnvironmentLoader.getInstance(packagePath).loadEnvironment();
}

/**
 * Convenience function to validate environment
 */
export function validateEnvironment(packagePath?: string): ValidationResult {
  return EnvironmentLoader.getInstance(packagePath).validate();
}
