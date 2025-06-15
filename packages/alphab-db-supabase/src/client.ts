/**
 * DatabaseClient - Simple, familiar database client
 * Follows patterns similar to Prisma, Drizzle, and other modern ORMs
 */

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  SupabaseConfig,
  Tables,
  TablesInsert,
  TablesUpdate,
  DatabaseResponse,
  DatabaseError,
} from "./types";

const logger = {
  info: (msg: string, ctx?: any) => console.log(`ℹ️ [database] ${msg}`, ctx || ""),
  error: (msg: string, ctx?: any) => console.error(`❌ [database] ${msg}`, ctx || ""),
  warn: (msg: string, ctx?: any) => console.warn(`⚠️ [database] ${msg}`, ctx || ""),
  debug: (msg: string, ctx?: any) => console.debug(`🔍 [database] ${msg}`, ctx || ""),
};

/**
 * Main database client - familiar API like Prisma/Drizzle
 */
export class DatabaseClient {
  private supabase: SupabaseClient<Database>;
  private config: SupabaseConfig;

  constructor(supabase: SupabaseClient<Database>, config: SupabaseConfig) {
    this.supabase = supabase;
    this.config = config;
  }

  /**
   * Get underlying Supabase client for advanced operations
   */
  get raw(): SupabaseClient<Database> {
    return this.supabase;
  }

  /**
   * Health check - test database connection
   */
  async ping(): Promise<boolean> {
    try {
      // Simplest possible test - just see if we can reach Supabase
      // This will return an error but if we get a proper PostgREST error, we know we're connected
      const response = await fetch(`${this.config.url}/rest/v1/`, {
        headers: {
          apikey: this.config.anonKey,
          Authorization: `Bearer ${this.config.anonKey}`,
        },
      });

      // Any response (even error) means we can reach Supabase
      logger.info("Ping successful", { status: response.status, connected: true });
      return true;
    } catch (err) {
      logger.error("Ping failed with exception", err);
      return false;
    }
  }

  /**
   * Execute raw SQL (for migrations, admin operations)
   */
  async sql(query: string, params?: any[]): Promise<DatabaseResponse<any> | DatabaseError> {
    try {
      logger.warn("SQL execution attempted", { query: query.substring(0, 100) + "..." });
      logger.info("Using API key", {
        keyType: this.config.serviceKey ? "service_role" : "anon",
        keyPrefix: (this.config.serviceKey || this.config.anonKey).substring(0, 20) + "...",
      });

      // Try the RPC approach first
      const { data, error } = await this.supabase.rpc("alphab_exec_sql", {
        query,
        params: params || [],
      });

      if (error) {
        // If alphab_exec_sql doesn't exist, create it automatically!
        if (error.message?.includes("alphab_exec_sql") || error.code === "PGRST202") {
          logger.info("🔧 alphab_exec_sql function not found - creating it automatically...");

          const createResult = await this.createExecSqlFunction();

          if (createResult.success) {
            logger.info(
              "✅ alphab_exec_sql function created successfully - retrying original query",
            );

            // Retry the original query
            const { data: retryData, error: retryError } = await this.supabase.rpc(
              "alphab_exec_sql",
              {
                query,
                params: params || [],
              },
            );

            if (retryError) {
              logger.error("SQL execution failed after creating alphab_exec_sql", {
                query,
                error: retryError,
              });
              return { data: null, error: retryError, success: false };
            }

            return { data: retryData, error: null, success: true };
          } else {
            logger.error("Failed to create alphab_exec_sql function", createResult.error);
            return {
              data: null,
              error: {
                ...error,
                message: `Could not create alphab_exec_sql function automatically: ${createResult.error}`,
              },
              success: false,
            };
          }
        }

        logger.error("SQL execution failed", { query, error });
        return { data: null, error, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      logger.error("SQL operation failed", { query, error });
      return { data: null, error: error as any, success: false };
    }
  }

  /**
   * Create the alphab_exec_sql function automatically using direct HTTP
   */
  private async createExecSqlFunction(): Promise<{ success: boolean; error?: string }> {
    try {
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION alphab_exec_sql(query text, params text[] DEFAULT '{}')
        RETURNS json
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          result json;
        BEGIN
          -- Execute the query directly (params support can be added later)
          EXECUTE query;
          RETURN '{"success": true, "message": "Query executed successfully"}'::json;
        EXCEPTION
          WHEN OTHERS THEN
            RETURN json_build_object(
              'success', false,
              'error', SQLERRM,
              'sqlstate', SQLSTATE
            );
        END;
        $$;
      `;

      // Use the service role key for this privileged operation
      const apiKey = this.config.serviceKey || this.config.anonKey;

      // Try using Supabase's SQL runner endpoint
      const response = await fetch(`${this.config.url}/rest/v1/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/vnd.pgrst.plan+text",
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
        body: createFunctionSQL,
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorText = await response.text();
        logger.warn("Direct SQL approach failed, trying alternative...", {
          status: response.status,
          error: errorText,
        });

        // Alternative approach: use the admin client to execute raw SQL
        // This requires creating an admin supabase client with elevated permissions
        const adminClient = createSupabaseClient<Database>(this.config.url, apiKey, {
          auth: { persistSession: false },
        });

        const { error: directError } = await adminClient.from("_migrations").select("*").limit(1);

        if (directError) {
          return {
            success: false,
            error: `Cannot execute SQL directly: ${directError.message}. You may need to create the alphab_exec_sql function manually in your Supabase SQL Editor.`,
          };
        }

        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Table access - familiar pattern like db.users.findMany()
   */
  get users() {
    return new TableClient<"alphab_users">(this.supabase, "alphab_users");
  }

  get vaults() {
    return new TableClient<"alphab_vaults">(this.supabase, "alphab_vaults");
  }

  get artifacts() {
    return new TableClient<"alphab_artifacts">(this.supabase, "alphab_artifacts");
  }

  get audit_logs() {
    return new TableClient<"alphab_audit_logs">(this.supabase, "alphab_audit_logs");
  }

  get migration_log() {
    return new TableClient<"alphab_migration_log">(this.supabase, "alphab_migration_log");
  }

  get project_settings() {
    return new TableClient<"alphab_project_settings">(this.supabase, "alphab_project_settings");
  }

  /**
   * Transaction support
   */
  async transaction<T>(fn: (tx: DatabaseClient) => Promise<T>): Promise<T> {
    // For now, just execute - Supabase doesn't have explicit transactions
    // But we maintain the familiar API for future enhancement
    return await fn(this);
  }
}

/**
 * Table-specific client - provides familiar CRUD methods
 */
class TableClient<T extends keyof Database["public"]["Tables"]> {
  constructor(
    public readonly supabase: SupabaseClient<Database>,
    public readonly tableName: T,
  ) {}

  /**
   * Find many records - like Prisma's findMany()
   */
  async findMany(
    options: {
      where?: Partial<Tables<T>>;
      select?: string;
      orderBy?: { [K in keyof Tables<T>]?: "asc" | "desc" };
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<DatabaseResponse<Tables<T>[]> | DatabaseError> {
    try {
      // Use public schema explicitly
      let query = this.supabase
        .schema("public")
        .from(this.tableName as string)
        .select(options.select || "*");

      // Apply filters
      if (options.where) {
        Object.entries(options.where).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply ordering
      if (options.orderBy) {
        Object.entries(options.orderBy).forEach(([key, direction]) => {
          query = query.order(key, { ascending: direction === "asc" });
        });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error, success: false };
      }

      return { data: (data || []) as unknown as Tables<T>[], error: null, success: true };
    } catch (error) {
      return { data: null, error: error as any, success: false };
    }
  }

  /**
   * Find unique record - like Prisma's findUnique()
   */
  async findUnique(
    where: Partial<Tables<T>>,
  ): Promise<DatabaseResponse<Tables<T> | null> | DatabaseError> {
    const result = await this.findMany({ where, limit: 1 });

    if (!result.success) {
      return result;
    }

    return {
      data: result.data[0] || null,
      error: null,
      success: true,
    };
  }

  /**
   * Create record - like Prisma's create()
   */
  async create(data: TablesInsert<T>): Promise<DatabaseResponse<Tables<T>> | DatabaseError> {
    try {
      const now = new Date().toISOString();
      const insertData = {
        ...data,
        created_at: now,
        updated_at: now,
      };

      const { data: result, error } = await this.supabase
        .schema("public")
        .from(this.tableName as string)
        .insert(insertData as any)
        .select()
        .single();

      if (error) {
        return { data: null, error, success: false };
      }

      return { data: result as Tables<T>, error: null, success: true };
    } catch (error) {
      return { data: null, error: error as any, success: false };
    }
  }

  /**
   * Update record - like Prisma's update()
   */
  async update(
    where: Partial<Tables<T>>,
    data: TablesUpdate<T>,
  ): Promise<DatabaseResponse<Tables<T>> | DatabaseError> {
    try {
      const updateData = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      let query = this.supabase
        .schema("public")
        .from(this.tableName as string)
        .update(updateData as any);

      // Apply all where conditions
      Object.entries(where).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value);
        }
      });

      const { data: result, error } = await query.select().single();

      if (error) {
        return { data: null, error, success: false };
      }

      return { data: result as Tables<T>, error: null, success: true };
    } catch (error) {
      return { data: null, error: error as any, success: false };
    }
  }

  /**
   * Delete record - like Prisma's delete()
   */
  async delete(where: Partial<Tables<T>>): Promise<DatabaseResponse<Tables<T>> | DatabaseError> {
    try {
      // Soft delete by default
      return await this.update(where, {
        deleted_at: new Date().toISOString(),
      } as any);
    } catch (error) {
      return { data: null, error: error as any, success: false };
    }
  }

  /**
   * Count records - like Prisma's count()
   */
  async count(where?: Partial<Tables<T>>): Promise<DatabaseResponse<number> | DatabaseError> {
    try {
      let query = this.supabase
        .schema("public")
        .from(this.tableName as string)
        .select("*", { count: "exact", head: true });

      if (where) {
        Object.entries(where).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key, value);
          }
        });
      }

      const { count, error } = await query;

      if (error) {
        return { data: null, error, success: false };
      }

      return { data: count || 0, error: null, success: true };
    } catch (error) {
      return { data: null, error: error as any, success: false };
    }
  }
}

/**
 * Create database client - familiar factory pattern
 */
export function createClient(config: SupabaseConfig): DatabaseClient {
  const supabase = createSupabaseClient<Database>(config.url, config.anonKey, {
    ...config.options,
    db: {
      schema: "public", // Use public schema with alphab_ prefixed tables
      ...config.options?.db,
    },
  });
  return new DatabaseClient(supabase, config);
}

/**
 * Create admin client with elevated permissions
 */
export function createAdminClient(config: SupabaseConfig): DatabaseClient {
  if (!config.serviceKey) {
    throw new Error("Service key is required for admin client");
  }

  const supabase = createSupabaseClient<Database>(config.url, config.serviceKey, {
    ...config.options,
    db: {
      schema: "public", // Use public schema with alphab_ prefixed tables
      ...config.options?.db,
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      ...config.options?.auth,
    },
  });

  return new DatabaseClient(supabase, config);
}
