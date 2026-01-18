import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Check, ChevronDown, X } from 'lucide-react';
import api from '../../lib/api';

interface Branch {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
}

interface BranchSelectFieldProps {
  value: number[];
  onChange: (branchIds: number[]) => void;
  multiple?: boolean;
  required?: boolean;
  label?: string;
  error?: string;
  disabled?: boolean;
  preSelectActive?: boolean;
  className?: string;
}

const BranchSelectField: React.FC<BranchSelectFieldProps> = ({
  value = [],
  onChange,
  multiple = true,
  required = false,
  label,
  error,
  disabled = false,
  preSelectActive = true,
  className = '',
}) => {
  const { t } = useTranslation();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    // Pre-select active branch if no value and preSelectActive is true
    if (preSelectActive && value.length === 0 && branches.length > 0) {
      loadCurrentBranch();
    }
  }, [branches, preSelectActive]);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tenant/products/available-branches');
      const branchesData = response.data?.branches || [];
      setBranches(branchesData);
    } catch (error) {
      console.error('Failed to load branches:', error);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentBranch = async () => {
    try {
      const response = await api.get('/business/branches/current');
      const currentBranch = response.data?.branch;
      if (currentBranch && value.length === 0) {
        onChange([currentBranch.id]);
      }
    } catch (error) {
      // If no current branch, select first available
      if (branches.length > 0 && value.length === 0) {
        onChange([branches[0].id]);
      }
    }
  };

  const handleToggleBranch = (branchId: number) => {
    if (disabled) return;

    if (multiple) {
      if (value.includes(branchId)) {
        // Don't allow removing if it's the last one and required
        if (required && value.length === 1) return;
        onChange(value.filter(id => id !== branchId));
      } else {
        onChange([...value, branchId]);
      }
    } else {
      onChange([branchId]);
      setIsOpen(false);
    }
  };

  const handleRemoveBranch = (branchId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (required && value.length === 1) return;
    onChange(value.filter(id => id !== branchId));
  };

  const selectedBranches = branches.filter(b => value.includes(b.id));

  if (loading) {
    return (
      <div className={`${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Selected branches display / trigger */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full min-h-[48px] px-3 py-2 border rounded-lg cursor-pointer transition-colors flex flex-wrap items-center gap-2 ${
          disabled
            ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
            : error
            ? 'border-red-500 focus:ring-red-200'
            : 'border-gray-300 hover:border-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200'
        }`}
      >
        {selectedBranches.length > 0 ? (
          <>
            {selectedBranches.map(branch => (
              <span
                key={branch.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-md text-sm"
              >
                <Building2 className="w-3 h-3" />
                {branch.name}
                {multiple && (!required || value.length > 1) && (
                  <button
                    type="button"
                    onClick={(e) => handleRemoveBranch(branch.id, e)}
                    className="ml-1 hover:text-primary-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </>
        ) : (
          <span className="text-gray-400">
            {t('common.selectBranch', 'Select branch...')}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 ml-auto text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
            {branches.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                {t('common.noBranchesAvailable', 'No branches available')}
              </div>
            ) : (
              branches.map(branch => (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => handleToggleBranch(branch.id)}
                  disabled={!branch.is_active}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                    value.includes(branch.id)
                      ? 'bg-primary-50 text-primary-700'
                      : branch.is_active
                      ? 'text-gray-700 hover:bg-gray-50'
                      : 'text-gray-400 cursor-not-allowed bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4" />
                    <div className="text-left">
                      <div className="font-medium">{branch.name}</div>
                      <div className="text-xs text-gray-500">{branch.code}</div>
                    </div>
                  </div>
                  {value.includes(branch.id) && (
                    <Check className="w-4 h-4 text-primary-600" />
                  )}
                </button>
              ))
            )}
          </div>
        </>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}

      {/* Helper text */}
      {multiple && !error && (
        <p className="mt-1 text-xs text-gray-500">
          {t('common.selectMultipleBranches', 'You can select multiple branches')}
        </p>
      )}
    </div>
  );
};

export default BranchSelectField;
