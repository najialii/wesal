import { toast } from 'sonner';

interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
}

/**
 * Retry mechanism with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    onRetry,
    shouldRetry = (error) => isRetryableError(error),
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry if this is the last attempt or error is not retryable
      if (attempt === maxAttempts || !shouldRetry(lastError)) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      );

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: Error): boolean {
  // Network errors
  if (error.name === 'NetworkError' || error.message.includes('fetch')) {
    return true;
  }

  // Axios errors
  if ('response' in error) {
    const axiosError = error as any;
    const status = axiosError.response?.status;
    
    // Retry on server errors (5xx) and some client errors
    return status >= 500 || status === 408 || status === 429;
  }

  // Timeout errors
  if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
    return true;
  }

  return false;
}

/**
 * Retry wrapper for API calls with user feedback
 */
export async function retryApiCall<T>(
  operation: () => Promise<T>,
  operationName: string = 'Operation',
  options: RetryOptions = {}
): Promise<T> {
  return withRetry(operation, {
    ...options,
    onRetry: (attempt, error) => {
      console.warn(`${operationName} failed (attempt ${attempt}):`, error.message);
      
      if (attempt === 1) {
        toast.warning(`${operationName} failed, retrying...`);
      }
      
      // Call custom onRetry if provided
      if (options.onRetry) {
        options.onRetry(attempt, error);
      }
    },
  });
}

/**
 * Circuit breaker pattern for preventing cascading failures
 */
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureThreshold: number;
  private recoveryTimeout: number;

  constructor(
    failureThreshold = 5,
    recoveryTimeout = 60000 // 1 minute
  ) {
    this.failureThreshold = failureThreshold;
    this.recoveryTimeout = recoveryTimeout;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return this.state;
  }
}

// Global circuit breaker instance for API calls
export const apiCircuitBreaker = new CircuitBreaker();

/**
 * Enhanced API call with circuit breaker and retry
 */
export async function resilientApiCall<T>(
  operation: () => Promise<T>,
  operationName: string = 'API Call'
): Promise<T> {
  return apiCircuitBreaker.execute(async () => {
    return retryApiCall(operation, operationName);
  });
}

/**
 * Validation error handler
 */
export function handleValidationErrors(error: any): Record<string, string[]> {
  if (error.response?.status === 422 && error.response?.data?.errors) {
    return error.response.data.errors;
  }
  
  if (error.response?.status === 400 && error.response?.data?.message) {
    return { general: [error.response.data.message] };
  }
  
  return { general: ['An unexpected error occurred'] };
}

/**
 * Generic error message extractor
 */
export function getErrorMessage(error: any): string {
  // API error with message
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  // Network error
  if (error.code === 'NETWORK_ERROR' || !error.response) {
    return 'Network error. Please check your connection and try again.';
  }
  
  // HTTP status errors
  if (error.response?.status) {
    switch (error.response.status) {
      case 401:
        return 'Authentication required. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return `Request failed with status ${error.response.status}`;
    }
  }
  
  // Fallback to error message or generic message
  return error.message || 'An unexpected error occurred';
}