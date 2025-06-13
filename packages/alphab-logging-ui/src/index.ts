// eslint-disable indent
/**
 * @alphab/logging-ui - Simple, elegant logging for TypeScript/JavaScript frontends
 *
 * Structured logging with emojis, context, and development-friendly output.
 * Follows KISS principles for easy maintenance and usage.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  [key: string]: any;
}

class FrontendLogger {
  private context: LogContext = {};
  private level: LogLevel = LogLevel.INFO;

  constructor(private component: string) {
    // Set log level based on environment - development mode for localhost
    const isDev =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    this.level = isDev ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const emoji = this.getEmoji(level);
    const contextStr = context ? ` | ${JSON.stringify(context)}` : "";
    return `${emoji} [${timestamp}] [${level.toUpperCase()}] [${
      this.component
    }] ${message}${contextStr}`;
  }

  private getEmoji(level: string): string {
    switch (level.toLowerCase()) {
      case "debug":
        return "🔍";
      case "info":
        return "ℹ️";
      case "warn":
        return "⚠️";
      case "error":
        return "❌";
      default:
        return "📝";
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage("debug", message, { ...this.context, ...context }));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage("info", message, { ...this.context, ...context }));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage("warn", message, { ...this.context, ...context }));
    }
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
       
      const errorContext = error
        ? // eslint-disable-next-line indent
          {
          // eslint-disable-next-line indent
            error_message: error instanceof Error ? error.message : String(error),
          // eslint-disable-next-line indent
            error_stack: error instanceof Error ? error.stack : undefined,
          // eslint-disable-next-line indent
            ...context,
        }
        : context;

      console.error(this.formatMessage("error", message, { ...this.context, ...errorContext }));
    }
  }

  setContext(context: LogContext): FrontendLogger {
    this.context = { ...this.context, ...context };
    return this;
  }

  clearContext(): FrontendLogger {
    this.context = {};
    return this;
  }
}

/**
 * Create a logger for a specific component or service.
 *
 * KISS principle - just provide the component name!
 */
export function createLogger(component: string): FrontendLogger {
  return new FrontendLogger(component);
}
