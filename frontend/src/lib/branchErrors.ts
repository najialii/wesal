import { toast } from 'sonner';

export interface BranchError {
  code: string;
  message: string;
  details?: any;
}

export const handleBranchError = (error: any, t: (key: string) => string) => {
  // Extract error information
  const errorData = error?.response?.data;
  const errorCode = errorData?.error?.code || errorData?.code;
  const errorMessage = errorData?.error?.message || errorData?.message || error.message;

  // Map error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    'BRANCH_ACCESS_DENIED': t('common.errors.branchAccessDenied'),
    'NO_BRANCH_ACCESS': t('common.errors.branchAccessDenied'),
    'INSUFFICIENT_STOCK': t('common.errors.insufficientStock'),
    'INACTIVE_BRANCH': t('common.errors.inactiveBranch'),
    'INACTIVE_BRANCH_TRANSACTION': t('common.errors.inactiveBranch'),
    'BRANCH_REQUIRED': t('common.errors.branchRequired'),
    'SAME_BRANCH_TRANSFER': t('stockTransfers.sameBranchError'),
    'TRANSFER_NOT_FOUND': t('common.error'),
    'TRANSFER_ALREADY_COMPLETED': t('common.error'),
    'BRANCH_NOT_FOUND': t('common.error'),
    'CROSS_TENANT_ASSIGNMENT': t('common.errors.branchAccessDenied'),
  };

  // Get the appropriate error message
  const displayMessage = errorCode && errorMessages[errorCode]
    ? errorMessages[errorCode]
    : errorMessage || t('common.error');

  // Show error toast
  toast.error(displayMessage);

  return {
    code: errorCode,
    message: displayMessage,
    details: errorData?.error?.details || errorData?.details
  };
};

export const handleBranchSwitchError = (error: any, t: (key: string) => string) => {
  const errorData = error?.response?.data;
  const errorMessage = errorData?.message || error.message;

  toast.error(t('common.errors.branchSwitchFailed') + ': ' + errorMessage);

  // Optionally reload the page after a delay
  setTimeout(() => {
    window.location.reload();
  }, 2000);
};

export const handleStockTransferError = (error: any, t: (key: string) => string) => {
  const errorData = error?.response?.data;
  const errorCode = errorData?.error?.code || errorData?.code;

  if (errorCode === 'INSUFFICIENT_STOCK') {
    const details = errorData?.error?.details || errorData?.details;
    const message = details
      ? `${t('common.errors.insufficientStock')} (Available: ${details.available}, Requested: ${details.requested})`
      : t('common.errors.insufficientStock');
    
    toast.error(message);
    return;
  }

  handleBranchError(error, t);
};

export const retryBranchOperation = async (
  operation: () => Promise<any>,
  maxRetries: number = 2,
  delay: number = 1000
): Promise<any> => {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Don't retry on certain errors
      const errorCode = error?.response?.data?.error?.code || error?.response?.data?.code;
      const noRetryErrors = [
        'BRANCH_ACCESS_DENIED',
        'NO_BRANCH_ACCESS',
        'INSUFFICIENT_STOCK',
        'CROSS_TENANT_ASSIGNMENT',
        'SAME_BRANCH_TRANSFER'
      ];

      if (noRetryErrors.includes(errorCode)) {
        throw error;
      }

      // Wait before retrying
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
      }
    }
  }

  throw lastError;
};

export const validateBranchAccess = (branchId: number | null, userBranches: number[]): boolean => {
  if (!branchId) return false;
  return userBranches.includes(branchId);
};

export const getBranchErrorMessage = (errorCode: string, t: (key: string) => string): string => {
  const errorMessages: Record<string, string> = {
    'BRANCH_ACCESS_DENIED': t('common.errors.branchAccessDenied'),
    'NO_BRANCH_ACCESS': t('common.errors.branchAccessDenied'),
    'INSUFFICIENT_STOCK': t('common.errors.insufficientStock'),
    'INACTIVE_BRANCH': t('common.errors.inactiveBranch'),
    'BRANCH_REQUIRED': t('common.errors.branchRequired'),
    'SAME_BRANCH_TRANSFER': t('stockTransfers.sameBranchError'),
  };

  return errorMessages[errorCode] || t('common.error');
};
