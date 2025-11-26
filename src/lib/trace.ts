/**
 * Browser-safe tracing utilities for distributed request tracking
 * 
 * This module provides AWS X-Ray style trace IDs that work in both
 * browser and Node.js environments without requiring Node.js-specific modules.
 */

/**
 * Creates an AWS X-Ray style trace ID (x-amzn-trace-id header format)
 * Format: 1-{timestamp}-{random_hex_24}
 * Example: 1-58406520-a006649127e371903a2de979
 *
 * This matches the standard AWS X-Ray trace ID format used in distributed tracing
 */
export function createAwsTraceId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  const randomPart = crypto.randomUUID().replace(/-/g, '').substring(0, 24);
  return `1-${timestamp}-${randomPart}`;
}

/**
 * Validates if a string is a valid AWS X-Ray trace ID format
 */
export function isValidAwsTraceId(traceId: string): boolean {
  const awsTracePattern = /^1-[0-9a-f]{8}-[0-9a-f]{24}$/;
  return awsTracePattern.test(traceId);
}

/**
 * Extracts or creates AWS X-Ray trace ID from request headers
 * Checks for x-amzn-trace-id header, creates new one if not present
 */
export function getAwsTraceId(headers?: Record<string, string>): string {
  const existingTraceId = headers?.['x-amzn-trace-id'];
  if (existingTraceId && isValidAwsTraceId(existingTraceId)) {
    return existingTraceId;
  }
  return createAwsTraceId();
}

/**
 * Creates headers for outbound requests with AWS X-Ray trace ID
 * This ensures trace ID is propagated to downstream services
 */
export function createTraceHeaders(traceId?: string): Record<string, string> {
  const currentTraceId = traceId || createAwsTraceId();
  return {
    'x-amzn-trace-id': currentTraceId,
  };
}

/**
 * Adds trace ID to existing headers object
 */
export function addTraceIdToHeaders(headers: Record<string, string>, traceId?: string): Record<string, string> {
  return {
    ...headers,
    ...createTraceHeaders(traceId),
  };
}

