/**
 * Environment variable types for the Alphab monorepo
 * This serves as the single source of truth for all environment variables
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

export interface DatabaseConfig {
  projectName: string;
  poolSize: number;
  timeout: number;
}

export interface ApiConfig {
  v1Str: string;
  corsOrigins: string[];
}

export interface AuthConfig {
  jwtSecretKey: string;
  jwtAlgorithm: string;
  accessTokenExpireMinutes: number;
  logtoEndpoint: string;
  logtoAppId: string;
  logtoAppSecret: string;
  logtoRedirectUri: string;
  logtoM2mAppId: string;
  logtoM2mAppSecret: string;
}

export interface DevelopmentConfig {
  verbose: boolean;
  debug: boolean;
}

export interface EnvironmentConfig {
  nodeEnv: "development" | "staging" | "production";
  supabase: SupabaseConfig;
  database: DatabaseConfig;
  api: ApiConfig;
  auth: AuthConfig;
  development: DevelopmentConfig;
}

export interface EnvironmentVariables {
  // Core
  NODE_ENV?: string;

  // Supabase
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;

  // Database
  PROJECT_NAME?: string;
  DB_POOL_SIZE?: string;
  DB_TIMEOUT?: string;

  // API
  API_V1_STR?: string;
  BACKEND_CORS_ORIGINS?: string;

  // Auth
  JWT_SECRET_KEY?: string;
  JWT_ALGORITHM?: string;
  ACCESS_TOKEN_EXPIRE_MINUTES?: string;
  LOGTO_ENDPOINT?: string;
  LOGTO_APP_ID?: string;
  LOGTO_APP_SECRET?: string;
  LOGTO_REDIRECT_URI?: string;
  LOGTO_M2M_APP_ID?: string;
  LOGTO_M2M_APP_SECRET?: string;

  // Development
  VERBOSE?: string;
  DEBUG?: string;
}

export interface ValidationError {
  variable: string;
  message: string;
  required: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}
