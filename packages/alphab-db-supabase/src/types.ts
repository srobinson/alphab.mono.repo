/**
 * World-class TypeScript types for Supabase database client
 * Following Supabase's proven patterns with KISS principles
 */

import type {
  SupabaseClientOptions,
  PostgrestError,
  RealtimeChannelOptions,
} from "@supabase/supabase-js";

// Database schema types (generated from Supabase)
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      alphab_users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          preferences: Json | null;
          status: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          // Additional columns from particle0 and customizations
          full_name?: string | null;
          api_key?: string | null;
          subscription_tier?: string | null;
          api_rate_limit?: number | null;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          preferences?: Json | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          full_name?: string | null;
          api_key?: string | null;
          subscription_tier?: string | null;
          api_rate_limit?: number | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          preferences?: Json | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          full_name?: string | null;
          api_key?: string | null;
          subscription_tier?: string | null;
          api_rate_limit?: number | null;
        };
      };
      alphab_vaults: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          owner_id: string;
          is_public: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          owner_id: string;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          owner_id?: string;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      alphab_artifacts: {
        Row: {
          id: string;
          vault_id: string;
          name: string;
          type: string;
          content: Json | null;
          metadata: Json | null;
          content_hash: string | null;
          file_size: number | null;
          file_url: string | null;
          processing_status: "pending" | "processing" | "completed" | "failed";
          embedding: number[] | null;
          embedding_small: number[] | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          vault_id: string;
          name: string;
          type: string;
          content?: Json | null;
          metadata?: Json | null;
          content_hash?: string | null;
          file_size?: number | null;
          file_url?: string | null;
          processing_status?: "pending" | "processing" | "completed" | "failed";
          embedding?: number[] | null;
          embedding_small?: number[] | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          vault_id?: string;
          name?: string;
          type?: string;
          content?: Json | null;
          metadata?: Json | null;
          content_hash?: string | null;
          file_size?: number | null;
          file_url?: string | null;
          processing_status?: "pending" | "processing" | "completed" | "failed";
          embedding?: number[] | null;
          embedding_small?: number[] | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      alphab_audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          table_name: string;
          record_id: string | null;
          old_values: Json | null;
          new_values: Json | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          table_name: string;
          record_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          table_name?: string;
          record_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      alphab_migration_log: {
        Row: {
          id: string;
          version: string;
          description: string | null;
          applied_at: string;
          applied_by: string | null;
          checksum: string | null;
        };
        Insert: {
          id?: string;
          version: string;
          description?: string | null;
          applied_at?: string;
          applied_by?: string | null;
          checksum?: string | null;
        };
        Update: {
          id?: string;
          version?: string;
          description?: string | null;
          applied_at?: string;
          applied_by?: string | null;
          checksum?: string | null;
        };
      };
      alphab_project_settings: {
        Row: {
          id: string;
          setting_key: string;
          setting_value: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          setting_key: string;
          setting_value: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          setting_key?: string;
          setting_value?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      processing_status: "pending" | "processing" | "completed" | "failed";
    };
  };
}

// Helper types following Supabase patterns
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Query result types from Supabase docs
export type QueryResult<T> = T extends PromiseLike<infer U> ? U : never;
export type QueryData<T> = T extends PromiseLike<{ data: infer U }> ? Exclude<U, null> : never;
export type QueryError = PostgrestError;

// Configuration interface
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceKey?: string;
  options?: SupabaseClientOptions<"public">;
}

// Client operation options
export interface SelectOptions {
  select?: string;
  where?: Record<string, any>;
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
  offset?: number;
}

export interface InsertOptions {
  returning?: string;
  onConflict?: string;
  ignoreDuplicates?: boolean;
}

export interface UpdateOptions {
  where?: Record<string, any>;
  returning?: string;
}

export interface DeleteOptions {
  where?: Record<string, any>;
  hard?: boolean;
  returning?: string;
}

export interface SubscriptionOptions extends RealtimeChannelOptions {
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  schema?: string;
  filter?: string;
}

// Response types
export interface DatabaseResponse<T = any> {
  data: T;
  error: null;
  success: true;
}

export interface DatabaseError {
  data: null;
  error: any;
  success: false;
}

/**
 * Simple, clean types for the database client
 * No complex generics, just what we need
 */

/**
 * Database connection configuration
 */
export interface DatabaseConfig {
  project: string;
  environment: "development" | "staging" | "production";
  supabase: SupabaseConfig;
}

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  id: string;
  table_name: string;
  record_id: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  user_id: string | null;
  created_at: string;
}

/**
 * Permission entry structure
 */
export interface Permission {
  id: string;
  resource_type: string;
  resource_id: string;
  user_id: string;
  permission_type: string;
  granted_by: string | null;
  granted_at: string;
  expires_at: string | null;
}

/**
 * Database operation result
 */
export interface DatabaseResult<T = unknown> {
  data: T | null;
  error: Error | null;
  count?: number;
}

/**
 * Schema validation result
 */
export interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Common database table structure
 */
export interface BaseTable {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

/**
 * User table structure
 */
export interface User extends BaseTable {
  email: string;
  name?: string;
  avatar_url?: string;
  preferences?: Record<string, unknown>;
  status: string;
}

/**
 * Vault table structure
 */
export interface Vault extends BaseTable {
  name: string;
  description?: string;
  owner_id: string;
  is_public: boolean;
}

/**
 * Content product table structure
 */
export interface ContentProduct extends BaseTable {
  vault_id: string;
  title: string;
  description?: string;
  content?: Record<string, unknown>;
  status: "draft" | "published" | "archived";
  published_at?: string;
  created_by: string;
}

/**
 * Analytics event structure
 */
export interface AnalyticsEvent extends BaseTable {
  entity_type: string;
  entity_id: string;
  event_type: string;
  event_data?: Record<string, unknown>;
  user_id?: string;
  session_id?: string;
}

/**
 * Database schema definition
 */
export interface DatabaseSchema {
  tables: Record<string, TableSchema>;
  views?: Record<string, ViewSchema>;
  functions?: Record<string, FunctionSchema>;
}

/**
 * Table schema definition
 */
export interface TableSchema {
  name: string;
  columns: Record<string, ColumnSchema>;
  constraints?: ConstraintSchema[];
  indexes?: IndexSchema[];
}

/**
 * Column schema definition
 */
export interface ColumnSchema {
  type: string;
  nullable: boolean;
  default?: unknown;
  primaryKey?: boolean;
  unique?: boolean;
  references?: {
    table: string;
    column: string;
  };
}

/**
 * View schema definition
 */
export interface ViewSchema {
  name: string;
  definition: string;
  columns: Record<string, ColumnSchema>;
}

/**
 * Function schema definition
 */
export interface FunctionSchema {
  name: string;
  parameters: Record<string, string>;
  returnType: string;
  definition: string;
}

/**
 * Constraint schema definition
 */
export interface ConstraintSchema {
  name: string;
  type: "PRIMARY KEY" | "FOREIGN KEY" | "UNIQUE" | "CHECK";
  columns: string[];
  references?: {
    table: string;
    columns: string[];
  };
}

/**
 * Index schema definition
 */
export interface IndexSchema {
  name: string;
  columns: string[];
  unique: boolean;
  type?: "btree" | "hash" | "gin" | "gist";
}
