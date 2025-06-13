/**
 * @alphab/db-supabase - Simple, elegant Supabase database client for TypeScript
 *
 * A lightweight database client with proper error handling, audit logging, and TypeScript types.
 * Follows KISS principles for easy maintenance and usage.
 */

// Core exports
export * from "./client";
export * from "./types";
export * from "./utils";
export * from "./audit";
export * from "./permissions";
export * from "./embeddings";

// Re-export Supabase types for convenience
// export type {
//   SupabaseClient,
//   PostgrestResponse,
//   PostgrestError,
//   RealtimeChannel,
//   User,
//   Session,
//   AuthError,
// } from "@supabase/supabase-js";

// export { SupabaseClientWrapper };
