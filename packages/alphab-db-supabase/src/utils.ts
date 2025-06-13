import type { SupabaseClient } from "@supabase/supabase-js";
import type { DatabaseResult, SchemaValidationResult } from "./types";

/**
 * Validate database connection
 */
export async function validateConnection(client: SupabaseClient): Promise<boolean> {
  try {
    const { error } = await client.from("users").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Check if a table exists
 */
export async function tableExists(client: SupabaseClient, tableName: string): Promise<boolean> {
  try {
    const { error } = await client.from(tableName).select("*").limit(1);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Get table schema information
 */
export async function getTableSchema(
  client: SupabaseClient,
  tableName: string,
): Promise<DatabaseResult<unknown[]>> {
  try {
    const { data, error } = await client.rpc("get_table_schema", { table_name: tableName });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

/**
 * Validate schema against expected structure
 */
export function validateSchema(
  actualSchema: unknown[],
  expectedSchema: unknown[],
): SchemaValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic validation logic
  if (!Array.isArray(actualSchema)) {
    errors.push("Actual schema is not an array");
  }

  if (!Array.isArray(expectedSchema)) {
    errors.push("Expected schema is not an array");
  }

  // Add more sophisticated validation logic here
  // This is a simplified version

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generate UUID v4
 */
export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Format timestamp for database
 */
export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}

/**
 * Parse database timestamp
 */
export function parseTimestamp(timestamp: string): Date {
  return new Date(timestamp);
}

/**
 * Sanitize table/column names
 */
export function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
}

/**
 * Build WHERE clause from filters
 */
export function buildWhereClause(filters: Record<string, unknown>): string {
  const conditions = Object.entries(filters)
    .map(([key, value]) => {
      const sanitizedKey = sanitizeName(key);
      if (typeof value === "string") {
        return `${sanitizedKey} = '${value.replace(/'/g, "''")}'`;
      }
      return `${sanitizedKey} = ${value}`;
    })
    .join(" AND ");

  return conditions ? `WHERE ${conditions}` : "";
}

/**
 * Escape SQL string
 */
export function escapeSQL(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Check if value is a valid UUID
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      result[key] = deepMerge(
        result[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>,
      ) as T[Extract<keyof T, string>];
    } else {
      result[key] = source[key] as T[Extract<keyof T, string>];
    }
  }

  return result;
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Batch process array in chunks
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize = 10,
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }

  return results;
}
