import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { authService } from '../services/auth';

interface Branch {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
}

interface BranchContextType {
  currentBranch: Branch | null;
  branches: Branch[];
  loading: boolean;
  switchBranch: (branchId: number) => Promise<void>;
  refreshBranch: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | null>(null);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false); // Changed from true to false
  const [isInitialized, setIsInitialized] = useState(false);

  const loadCurrentBranch = useCallback(async (branchesData?: Branch[]) => {
    try {
      const response = await api.get('/business/branches/current');
      const branch = response.data?.branch;
      if (branch) {
        setCurrentBranch(branch);
        return branch;
      }
    } catch (error: any) {
      // 404 means no current branch set
      if (error?.response?.status === 404) {
        // Set first available branch as current
        const availableBranches = branchesData || branches;
        if (availableBranches.length > 0) {
          try {
            await api.post('/business/branches/switch', { branch_id: availableBranches[0].id });
            setCurrentBranch(availableBranches[0]);
            return availableBranches[0];
          } catch (switchError) {
            console.error('Failed to set default branch:', switchError);
          }
        }
      }
    }
    return null;
  }, [branches]);

  const switchBranch = useCallback(async (branchId: number) => {
    try {
      await api.post('/business/branches/switch', { branch_id: branchId });
      const response = await api.get('/business/branches/current');
      setCurrentBranch(response.data?.branch || null);
    } catch (error) {
      console.error('Failed to switch branch:', error);
      throw error;
    }
  }, []);

  const refreshBranch = useCallback(async () => {
    console.log('🔄 refreshBranch called, loading:', loading);
    if (loading) {
      console.log('⏸️ Already loading, skipping...');
      return; // Prevent multiple simultaneous calls
    }
    
    // Check if user is authenticated before making API calls
    if (!authService.isAuthenticated()) {
      console.log('❌ User not authenticated, skipping branch refresh');
      return;
    }
    
    setLoading(true);
    try {
      console.log('🔄 Refreshing branches...');
      // Force fresh data by adding timestamp and using same endpoint as branches page
      const timestamp = Date.now();
      console.log('📡 Making API call to /business/branches?t=' + timestamp);
      const branchesRes = await api.get(`/business/branches?t=${timestamp}`);
      // console.log('✅ Fresh branches API response:', branchesRes.data);
      const branchesData = branchesRes.data?.branches || [];
      // Filter out inactive/deleted branches for the selector
      const activeBranches = branchesData.filter((branch: any) => branch.is_active);
      console.log('📊 Setting active branches:', activeBranches);
      setBranches(activeBranches);
      
      console.log('🔄 Loading current branch...');
      await loadCurrentBranch(activeBranches);
      // console.log('✅ Setting initialized to true');
      setIsInitialized(true);
    } catch (error: any) {
      console.error('❌ Failed to refresh branches:', error);
    } finally {
      // console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  }, [loadCurrentBranch, loading]);

  useEffect(() => {
    // console.log('🚀 BranchContext useEffect triggered, isInitialized:', isInitialized);
    if (!isInitialized) {
      // Only initialize branches if user is authenticated
      if (!authService.isAuthenticated()) {
        console.log('❌ User not authenticated, skipping branch initialization');
        return;
      }
      
      console.log('🔄 Starting branch initialization...');
      // Refresh user data first to ensure we have latest roles
      authService.refreshUser().then(() => {
        // console.log('✅ User refreshed, now loading branches...');
        refreshBranch();
      }).catch((error) => {
        console.error('❌ Failed to refresh user:', error);
        // Continue with branch loading even if user refresh fails
        console.log('🔄 Loading branches anyway...');
        refreshBranch();
      });
    }
  }, [isInitialized]);

  return (
    <BranchContext.Provider value={{ currentBranch, branches, loading, switchBranch, refreshBranch }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}

export function useCurrentBranchId(): number | null {
  const { currentBranch } = useBranch();
  return currentBranch?.id || null;
}
