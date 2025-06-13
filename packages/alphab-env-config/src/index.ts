/**
 * @alphab/env-config - Centralized environment configuration for Alphab monorepo
 *
 * This package provides a centralized way to manage environment variables across
 * the entire monorepo, following Turborepo best practices.
 */

export * from "./types";
export * from "./loader";
export { setupEnvironment } from "./setup";
// Re-export commonly used functions for convenience
export { getEnvironmentConfig, validateEnvironment } from "./loader";
