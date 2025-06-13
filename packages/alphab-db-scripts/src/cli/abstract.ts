/**
 * CLI Interface - Clean contract for database operations
 */
export interface ICLIRunner {
  /**
   * Test database connection
   */
  ping(): Promise<boolean>;

  /**
   * Run migrations (up)
   */
  up(): Promise<void>;

  /**
   * Rollback migrations (down)
   */
  down(): Promise<void>;

  /**
   * Rollback to specific version
   */
  rollback(version: string): Promise<void>;

  /**
   * Show migration status
   */
  status(): Promise<void>;

  /**
   * Show current version
   */
  version(): Promise<void>;

  /**
   * Setup environment
   */
  envSetup(): Promise<void>;

  /**
   * Validate environment
   */
  envValidate(): Promise<void>;
}

/**
 * Abstract CLI Runner - Common functionality for all database providers
 */
export abstract class AbstractCLIRunner implements ICLIRunner {
  protected provider: string;

  constructor(provider: string) {
    this.provider = provider;
  }

  /**
   * Abstract methods that must be implemented by providers
   */
  abstract ping(): Promise<boolean>;
  abstract up(): Promise<void>;
  abstract down(): Promise<void>;
  abstract rollback(version: string): Promise<void>;
  abstract status(): Promise<void>;
  abstract version(): Promise<void>;
  abstract envSetup(): Promise<void>;
  abstract envValidate(): Promise<void>;
}
