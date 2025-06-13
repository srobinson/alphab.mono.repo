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

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
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
      // Test connection to alphab schema
      const { error } = await this.supabase.schema("alphab").from("users").select("id").limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Execute raw SQL (for migrations, admin operations)
   */
  async sql(query: string, params?: any[]): Promise<DatabaseResponse<any> | DatabaseError> {
    try {
      const { data, error } = await this.supabase.rpc("exec_sql", {
        query,
        params: params || [],
      });

      if (error) {
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
   * Table access - familiar pattern like db.users.findMany()
   */
  get users() {
    return new TableClient<"users">(this.supabase, "users");
  }

  get vaults() {
    return new TableClient<"vaults">(this.supabase, "vaults");
  }

  get artifacts() {
    return new TableClient<"artifacts">(this.supabase, "artifacts");
  }

  get audit_logs() {
    return new TableClient<"audit_logs">(this.supabase, "audit_logs");
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
class TableClient<T extends keyof Database["alphab"]["Tables"]> {
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
      // Use alphab schema
      let query = this.supabase
        .schema("alphab")
        .from(this.tableName)
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
        .schema("alphab")
        .from(this.tableName)
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
        .schema("alphab")
        .from(this.tableName)
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
        .schema("alphab")
        .from(this.tableName)
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
      schema: "alphab", // Use alphab schema by default
      ...config.options?.db,
    },
  });
  return new DatabaseClient(supabase);
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
      schema: "alphab", // Use alphab schema by default
      ...config.options?.db,
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      ...config.options?.auth,
    },
  });

  return new DatabaseClient(supabase);
}
