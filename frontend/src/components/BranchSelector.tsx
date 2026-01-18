import React, { useState } from 'react';
import { ChevronDown, Building2, Check } from 'lucide-react';
import { useBranch } from '../contexts/BranchContext';
import { handleBranchSwitchError } from '../lib/branchErrors';
import { toast } from 'sonner';
import { useTranslation } from '../lib/translation';
import { authService } from '../services/auth';

interface BranchSelectorProps {
  onBranchChange?: () => void;
}

const BranchSelector: React.FC<BranchSelectorProps> = ({ onBranchChange }) => {
  const { t } = useTranslation('common');
  const { currentBranch, branches, switchBranch } = useBranch();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Debug logging (commented out for production)
  // console.log('BranchSelector Debug:', {
  //   currentBranch,
  //   branches,
  //   branchesLength: branches?.length,
  //   branchesIsArray: Array.isArray(branches)
  // });

  // Add user debug info for troubleshooting
  const user = authService.getCurrentUser();
  if (!Array.isArray(branches) || branches.length <= 1) {
    console.log('BranchSelector not showing multiple branches:', {
      user,
      roles: user?.roles,
      role: user?.role,
      branches: branches,
      branchesLength: branches?.length
    });
  }

  const handleBranchSwitch = async (branchId: number) => {
    if (loading || branchId === currentBranch?.id) return;

    setLoading(true);
    try {
      await switchBranch(branchId);
      setIsOpen(false);
      toast.success(t('success'));

      // Trigger callback to refresh page data
      if (onBranchChange) {
        onBranchChange();
      }
    } catch (error) {
      console.error('Failed to switch branch:', error);
      handleBranchSwitchError(error, t);
    } finally {
      setLoading(false);
    }
  };

  // Don't show if user has only one branch or no branches
  if (!Array.isArray(branches) || branches.length <= 1) {
    // For debugging - show a simple indicator when there's only one branch
    if (branches.length === 1) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg">
          <Building2 className="w-4 h-4" />
          <span>{branches[0]?.name || t('currentBranch')}</span>
        </div>
      );
    }
    
    // Show a debug message when no branches are found - but make it clickable to refresh
    return (
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
      >
        <Building2 className="w-4 h-4" />
        <span>No branches (Click to refresh)</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={loading}
      >
        <Building2 className="w-4 h-4" />
        <span>{currentBranch?.name || t('selectBranch')}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                {t('selectBranch')}
              </div>
              {Array.isArray(branches) && branches.map((branch) => (
                <button
                  key={branch.id}
                  onClick={() => handleBranchSwitch(branch.id)}
                  disabled={loading || !branch.is_active}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                    branch.id === currentBranch?.id
                      ? 'bg-blue-50 text-blue-700'
                      : branch.is_active
                      ? 'text-gray-700 hover:bg-gray-50'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <div className="text-left">
                      <div className="font-medium">{branch.name}</div>
                      <div className="text-xs text-gray-500">{branch.code}</div>
                    </div>
                  </div>
                  {branch.id === currentBranch?.id && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BranchSelector;
