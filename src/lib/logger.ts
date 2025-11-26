/**
 * Production-ready logging utility using LogTape
 *
 * Features:
 * - Structured logging with data redaction for security
 * - Multiple log levels (trace, debug, info, warn, error, fatal)
 * - Hierarchical categories for organized logging
 * - Environment-based configuration (dev vs production)
 * - Lazy evaluation for performance
 * - TypeScript-first with full type safety
 */

import { configure, getConsoleSink, getLogger, type LogRecord } from "@logtape/logtape";
import { getFileSink } from "@logtape/file";
import { redactByField } from "@logtape/redaction";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Log levels supported by LogTape
 */
export type LogLevel = "fatal" | "error" | "warning" | "info" | "debug" | "trace";

/**
 * Sensitive fields that should be automatically redacted from logs
 */
export const SENSITIVE_FIELDS = [
  'password',
  'token',
  'access_token',
  'refresh_token',
  'authorization',
  'api_key',
  'secret',
  'private_key',
  'session_id',
  'cookie',
  'email', // Always treat email as sensitive for privacy
] as const;

/**
 * Mutable version for LogTape compatibility
 */
const SENSITIVE_FIELDS_MUTABLE = [...SENSITIVE_FIELDS];

/**
 * Type for sensitive field names
 */
export type SensitiveField = typeof SENSITIVE_FIELDS[number];

/**
 * Structured log properties - any serializable data except sensitive fields
 */
export type LogProperties = Record<string, any> & {
  [K in SensitiveField]?: never; // Prevent sensitive fields at compile time
};

/**
 * Safe logging utility that converts typed properties to LogTape-compatible format
 * This eliminates the need for ugly 'as unknown as Record<string, unknown>' casts
 */
export function toLogProperties<T extends Record<string, any>>(properties: T): Record<string, unknown> {
  return properties;
}


/**
 * Creates a support ticket identifier for exceptional user assistance
 * Use only when trace ID correlation is insufficient for debugging
 */
export function createSupportTicketId(userId: string): string {
  // Use environment-specific salt for consistency
  const salt = process.env.LOG_SALT || 'ytinsights_default_salt_2024';

  // Create deterministic hash for support ticket
  const input = `${salt}:support:${userId}:${Date.now()}`;
  let hash = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  const hashStr = Math.abs(hash).toString(36).toUpperCase();
  return `SUPPORT_${hashStr.slice(0, 8)}`;
}


/**
 * Logger categories for different application modules
 */
export type LoggerCategory =
  | ["ytinsights"]
  | ["ytinsights", "auth"]
  | ["ytinsights", "api"]
  | ["ytinsights", "db"]
  | ["ytinsights", "external"];

/**
 * Security event types for structured logging
 */
export type SecurityEventType =
  | "auth_success"
  | "auth_failure"
  | "rate_limit_exceeded"
  | "suspicious_activity"
  | "data_access_violation";

/**
 * Performance monitoring data
 */
export interface PerformanceData {
  operation: string;
  duration: number;
  threshold?: number;
  performance_issue?: boolean;
}

/**
 * API access logging data
 */
export interface ApiAccessData {
  method: string;
  path: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  statusCode?: number;
}

/**
 * Error context for structured error logging
 */
export interface ErrorContext {
  component?: string;
  operation?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  traceId?: string; // AWS X-Ray style trace ID
  retryCount?: number;
  endpoint?: string;
  [key: string]: any;
}

// Custom filter to exclude debug logs in production
const excludeDebugInProduction = (record: LogRecord): boolean => {
  return !(record.level === "debug" && process.env.NODE_ENV === "production");
};

// Initialize logging configuration
let isLoggingConfigured = false;

export async function initializeLogging(): Promise<void> {
  if (isLoggingConfigured) return;

  const isDevelopment = process.env.NODE_ENV !== "production";
  const isTest = process.env.NODE_ENV === "test";

  // Skip file logging in test environment
  const sinks: Record<string, any> = {
    console: redactByField(getConsoleSink(), SENSITIVE_FIELDS_MUTABLE),
  };

  if (!isTest) {
    sinks.file = redactByField(
      getFileSink(isDevelopment ? "logs/dev.log" : "logs/prod.log"),
      SENSITIVE_FIELDS_MUTABLE
    );
  }

  await configure({
    sinks,
    filters: {
      excludeDebugInProduction,
    },
    loggers: [
      // Main application logger
      {
        category: ["ytinsights"],
        lowestLevel: isDevelopment ? "debug" : "info",
        sinks: isDevelopment ? ["console", "file"] : ["file"],
        filters: isTest ? [] : ["excludeDebugInProduction"],
      },
      // Authentication logger (more security-focused)
      {
        category: ["ytinsights", "auth"],
        lowestLevel: "info", // Always log auth events at info level or higher
        sinks: ["console", "file"], // Always log auth to both console and file
      },
      // API logger
      {
        category: ["ytinsights", "api"],
        lowestLevel: isDevelopment ? "debug" : "info",
        sinks: isDevelopment ? ["console", "file"] : ["file"],
      },
      // Database logger
      {
        category: ["ytinsights", "db"],
        lowestLevel: isDevelopment ? "debug" : "warning",
        sinks: ["console", "file"],
      },
      // External API logger (YouTube, OpenRouter)
      {
        category: ["ytinsights", "external"],
        lowestLevel: isDevelopment ? "debug" : "info",
        sinks: isDevelopment ? ["console", "file"] : ["file"],
      },
    ],
  });

  isLoggingConfigured = true;

  // Log initialization
  const logger = getLogger(["ytinsights"]);
  logger.info("Logging system initialized", {
    environment: process.env.NODE_ENV || "development",
    sinks: Object.keys(sinks),
  });
}

// Main application logger
export const appLogger = getLogger(["ytinsights"]);

// Specialized loggers for different modules
export const authLogger = getLogger(["ytinsights", "auth"]);
export const apiLogger = getLogger(["ytinsights", "api"]);
export const dbLogger = getLogger(["ytinsights", "db"]);
export const externalLogger = getLogger(["ytinsights", "external"]);

// Security-focused logging functions
export const securityLogger = {
  /**
   * Log authentication events
   */
  auth: (message: string, properties?: LogProperties) => {
    authLogger.info(message, toLogProperties(properties || {}));
  },

  /**
   * Log authentication failures (rate limiting, invalid credentials, etc.)
   */
  authFailure: (message: string, properties?: LogProperties) => {
    authLogger.warning(message, toLogProperties(properties || {}));
  },

  /**
   * Log security-related events (suspicious activity, etc.)
   */
  security: (message: string, properties?: LogProperties) => {
    authLogger.error(message, toLogProperties(properties || {}));
  },

  /**
   * Log API access patterns for monitoring
   */
  apiAccess: (data: ApiAccessData) => {
    apiLogger.info(`API access: ${data.method} ${data.path} -> ${data.statusCode}`, toLogProperties({
      method: data.method,
      path: data.path,
      statusCode: data.statusCode,
      userId: data.userId,
      ip: data.ip,
    }));
  },

  /**
   * Log security events with structured data
   */
  logSecurityEvent: (eventType: SecurityEventType, message: string, properties?: LogProperties) => {
    const level = eventType.includes('failure') || eventType.includes('violation') ? 'warning' : 'info';
    authLogger[level](`Security event: ${eventType}`, toLogProperties({
      security_event_type: eventType,
      ...properties,
    }));
  },
};

// Performance logging
export const performanceLogger = {
  /**
   * Log slow operations
   */
  slowOperation: (data: PerformanceData) => {
    if (data.duration > (data.threshold || 1000)) {
      appLogger.warning("Slow operation detected", toLogProperties(data));
    }
  },

  /**
   * Log API response times
   */
  apiResponseTime: (method: string, path: string, duration: number, statusCode: number) => {
    const level = duration > 2000 ? "warning" : "debug";
    const data: PerformanceData = {
      operation: `${method} ${path}`,
      duration,
      threshold: 2000,
      performance_issue: duration > 2000,
    };
    apiLogger[level]("API response time", toLogProperties({ ...data, statusCode }));
  },

  /**
   * Log custom performance metrics
   */
  logPerformance: (data: PerformanceData) => {
    const level = data.performance_issue ? "warning" : "debug";
    appLogger[level]("Performance metric", toLogProperties(data));
  },
};

// Error logging with context
export const errorLogger = {
  /**
   * Log application errors with context
   */
  appError: (error: Error, context?: ErrorContext) => {
    appLogger.error("Application error", toLogProperties({
      error: error.message,
      stack: error.stack,
      ...context,
    }));
  },

  /**
   * Log API errors
   */
  apiError: (error: Error, method: string, path: string, statusCode?: number, context?: ErrorContext) => {
    apiLogger.error("API error", toLogProperties({
      error: error.message,
      stack: error.stack,
      method,
      path,
      statusCode,
      ...context,
    }));
  },

  /**
   * Log external API errors (YouTube, OpenRouter, etc.)
   */
  externalError: (service: string, error: Error, context?: ErrorContext) => {
    externalLogger.error("External API error", toLogProperties({
      service,
      error: error.message,
      stack: error.stack,
      ...context,
    }));
  },

  /**
   * Log database errors
   */
  dbError: (error: Error, operation: string, context?: ErrorContext) => {
    dbLogger.error("Database error", toLogProperties({
      error: error.message,
      stack: error.stack,
      operation,
      ...context,
    }));
  },

  /**
   * Log validation errors
   */
  validationError: (error: Error, field?: string, value?: any, context?: ErrorContext) => {
    appLogger.warning("Validation error", toLogProperties({
      error: error.message,
      field,
      value: typeof value === 'object' ? JSON.stringify(value) : value,
      ...context,
    }));
  },
};

// Re-export commonly used functions for convenience
export { getLogger } from "@logtape/logtape";
