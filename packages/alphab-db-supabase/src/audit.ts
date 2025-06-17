import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuditLogEntry } from "./types";
// Simple console logging for Node.js compatibility
const logger = {
  info: (msg: string, ctx?: any) => console.log(`ℹ️ [audit] ${msg}`, ctx || ""),
  error: (msg: string, ctx?: any) => console.error(`❌ [audit] ${msg}`, ctx || ""),
  warn: (msg: string, ctx?: any) => console.warn(`⚠️ [audit] ${msg}`, ctx || ""),
  debug: (msg: string, ctx?: any) => console.debug(`🔍 [audit] ${msg}`, ctx || ""),
};

/**
 * Audit logging functionality for Supabase
 */

export interface AuditData {
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Audit logger for database operations
 */
export class AuditLogger {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  /**
   * Log an audit entry
   */
  async log(entry: Omit<AuditLogEntry, "id" | "created_at">): Promise<void> {
    try {
      const { error } = await this.client.from("audit_logs").insert({
        table_name: entry.table_name,
        record_id: entry.record_id,
        action: entry.action,
        old_values: entry.old_values,
        new_values: entry.new_values,
        user_id: entry.user_id,
        created_at: new Date().toISOString(),
      });

      if (error) {
        logger.error("Failed to log audit entry", { entry, error });
        throw error;
      }
    } catch (error) {
      logger.error("Audit logging failed", { entry, error });
      throw error;
    }
  }

  /**
   * Log an INSERT operation
   */
  async logInsert(
    tableName: string,
    recordId: string,
    newValues: Record<string, unknown>,
    userId?: string,
  ): Promise<void> {
    return this.log({
      table_name: tableName,
      record_id: recordId,
      action: "INSERT",
      old_values: null,
      new_values: newValues,
      user_id: userId || null,
    });
  }

  /**
   * Log an UPDATE operation
   */
  async logUpdate(
    tableName: string,
    recordId: string,
    oldValues: Record<string, unknown>,
    newValues: Record<string, unknown>,
    userId?: string,
  ): Promise<void> {
    return this.log({
      table_name: tableName,
      record_id: recordId,
      action: "UPDATE",
      old_values: oldValues,
      new_values: newValues,
      user_id: userId || null,
    });
  }

  /**
   * Log a DELETE operation
   */
  async logDelete(
    tableName: string,
    recordId: string,
    oldValues: Record<string, unknown>,
    userId?: string,
  ): Promise<void> {
    return this.log({
      table_name: tableName,
      record_id: recordId,
      action: "DELETE",
      old_values: oldValues,
      new_values: null,
      user_id: userId || null,
    });
  }

  /**
   * Get audit logs for a specific table and record
   */
  async getAuditLogs(tableName: string, recordId?: string, limit = 100): Promise<AuditLogEntry[]> {
    try {
      let query = this.client
        .from("audit_logs")
        .select("*")
        .eq("table_name", tableName)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (recordId) {
        query = query.eq("record_id", recordId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error("Failed to fetch audit logs", { tableName, recordId, error });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error("Audit log retrieval failed", { tableName, recordId, error });
      throw error;
    }
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(userId: string, limit = 100): Promise<AuditLogEntry[]> {
    try {
      const { data, error } = await this.client
        .from("audit_logs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        logger.error("Failed to fetch user audit logs", { userId, error });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error("User audit log retrieval failed", { userId, error });
      throw error;
    }
  }

  /**
   * Clean up old audit logs (older than specified days)
   */
  async cleanupOldLogs(daysToKeep = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { data, error } = await this.client
        .from("audit_logs")
        .delete()
        .lt("created_at", cutoffDate.toISOString())
        .select("id");

      if (error) {
        logger.error("Failed to cleanup audit logs", { daysToKeep, error });
        throw error;
      }

      const deletedCount = data?.length || 0;
      logger.info("Cleaned up audit logs", { deletedCount, daysToKeep });

      return deletedCount;
    } catch (error) {
      logger.error("Audit log cleanup failed", { daysToKeep, error });
      throw error;
    }
  }
}

/**
 * Database trigger function for automatic audit logging
 */
export const createAuditTriggerFunction = `
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, user_id)
    VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), NULL, auth.uid());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, NULL, row_to_json(NEW), auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

/**
 * Create audit trigger for a table
 */
export const createAuditTrigger = (tableName: string) => `
CREATE TRIGGER audit_${tableName}_trigger
  AFTER INSERT OR UPDATE OR DELETE ON ${tableName}
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
`;

/**
 * Audit middleware for database operations
 */
export async function withAudit<T>(
  operation: () => Promise<T>,
  auditData: {
    tableName: string;
    recordId: string;
    action: "INSERT" | "UPDATE" | "DELETE";
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    userId?: string;
  },
  auditLogger: AuditLogger,
): Promise<T> {
  try {
    const result = await operation();

    // Log successful operation
    await auditLogger.log({
      table_name: auditData.tableName,
      record_id: auditData.recordId,
      action: auditData.action,
      old_values: auditData.oldValues || null,
      new_values: auditData.newValues || null,
      user_id: auditData.userId || null,
    });

    return result;
  } catch (error) {
    // Log failed operation
    await auditLogger.log({
      table_name: auditData.tableName,
      record_id: auditData.recordId,
      action: auditData.action,
      old_values: auditData.oldValues || null,
      new_values: { error: error instanceof Error ? error.message : "Unknown error" },
      user_id: auditData.userId || null,
    });

    throw error;
  }
}
