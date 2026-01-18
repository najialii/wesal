import { z } from "zod"

// Common validation schemas
export const emailSchema = z.string().email("Please enter a valid email address")
export const phoneSchema = z.string().optional().refine(
  (val) => !val || /^[\+]?[1-9][\d]{0,15}$/.test(val),
  "Please enter a valid phone number"
)
export const requiredStringSchema = z.string().min(1, "This field is required")
export const optionalStringSchema = z.string().optional()
export const numberSchema = z.number().min(0, "Must be a positive number")
export const positiveNumberSchema = z.number().min(0.01, "Must be greater than 0")

// Form error handling utilities
export function getFieldError(errors: any, fieldName: string): string | undefined {
  const error = errors[fieldName]
  return error?.message || error
}

export function hasFieldError(errors: any, fieldName: string): boolean {
  return !!errors[fieldName]
}

// API error mapping utilities
export function mapApiErrorsToForm(apiErrors: Record<string, string[]>): Record<string, string> {
  const formErrors: Record<string, string> = {}
  
  Object.entries(apiErrors).forEach(([field, messages]) => {
    if (Array.isArray(messages) && messages.length > 0) {
      formErrors[field] = messages[0]
    }
  })
  
  return formErrors
}

// Loading state management
export function createLoadingState() {
  return {
    isLoading: false,
    error: null as string | null,
    setLoading: (loading: boolean) => ({ isLoading: loading, error: null }),
    setError: (error: string) => ({ isLoading: false, error }),
    setSuccess: () => ({ isLoading: false, error: null })
  }
}

// Form submission wrapper
export async function handleFormSubmission<T>(
  submitFn: () => Promise<T>,
  onSuccess?: (result: T) => void,
  onError?: (error: string) => void
): Promise<{ success: boolean; error?: string; result?: T }> {
  try {
    const result = await submitFn()
    onSuccess?.(result)
    return { success: true, result }
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "An error occurred"
    onError?.(errorMessage)
    return { success: false, error: errorMessage }
  }
}