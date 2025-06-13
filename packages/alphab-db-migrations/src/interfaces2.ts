/**
 * Database provider enumeration
 */
export enum DBProvider {
  SUPABASE = "supabase",
  POSTGRES = "postgres",
  MONGODB = "mongodb",
}

// // Local type definitions (since they're not exported from db-migrations)
// interface MigrationConfig<TProviderConfig = unknown> {
//   provider: "supabase" | "postgres" | "mysql" | "mongodb";
//   project: string;
//   environment: "development" | "staging" | "production";
//   migrationsPath?: string;
//   schemasPath?: string;
//   providerConfig: TProviderConfig;
// }

// interface SupabaseConfig {
//   url: string;
//   serviceRoleKey: string;
//   anonKey?: string;
// }

// interface PostgresConfig {
//   host: string;
//   port: number;
//   database: string;
//   username: string;
//   password: string;
//   ssl?: boolean;
// }

// interface MongoConfig {
//   connectionString: string;
//   database: string;
// }

// export type { MigrationConfig, SupabaseConfig, PostgresConfig, MongoConfig };
