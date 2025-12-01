import { useMemo } from 'react';
import { Settings, ModuleId, SubscriptionTier, MODULES, TIER_MODULES, isModuleInTier, ALL_MODULE_IDS } from '../types';
import { isEmailAllowed } from '../constants';
import { useAuth } from '../context/AuthContext';

interface UseModuleAccessReturn {
  hasAccess: (moduleId: ModuleId) => boolean;
  getAccessibleModules: () => ModuleId[];
  isComingSoon: (moduleId: ModuleId) => boolean;
  tier: SubscriptionTier | null;
  companyType: 'managed' | 'direct';
  managedByPracticeName: string | null;
  isBetaTester: boolean;
}

/**
 * Hook to check module access based on company type
 * 
 * For beta testers: full access to all non-coming-soon modules
 * For managed companies: checks grantedModules from CFO
 * For direct companies: checks subscription tier
 * 
 * @param settings - Company settings
 */
export function useModuleAccess(settings: Settings | null): UseModuleAccessReturn {
  const { user } = useAuth();
  const companyType = settings?.companyType || 'direct';
  const managedByPracticeName = settings?.managedByPracticeName || null;
  
  // Check if current user is a beta tester
  const isBetaTester = useMemo(() => {
    if (!user?.email) return false;
    return isEmailAllowed(user.email);
  }, [user?.email]);
  
  // Determine subscription tier (only relevant for direct companies)
  const tier: SubscriptionTier | null = useMemo(() => {
    if (!settings) return null;
    if (companyType === 'managed') return null; // Managed companies don't have tiers
    // Beta testers get cfo-suite tier
    if (isBetaTester) return 'cfo-suite';
    return settings.subscriptionTier || 'starter';
  }, [settings, companyType, isBetaTester]);

  // Check if user has access to a specific module
  const hasAccess = useMemo(() => {
    return (moduleId: ModuleId): boolean => {
      if (!settings) return false;
      
      // Beta testers get access to ALL modules (except coming soon - that's checked separately)
      if (isBetaTester) {
        return true;
      }
      
      // Managed company: check grantedModules from CFO
      if (companyType === 'managed') {
        const grantedModules = settings.grantedModules || [];
        return grantedModules.includes(moduleId);
      }
      
      // Direct company: check subscription tier
      const currentTier = settings.subscriptionTier || 'starter';
      return isModuleInTier(moduleId, currentTier);
    };
  }, [settings, companyType, isBetaTester]);

  // Get all modules the user can access
  const getAccessibleModules = useMemo(() => {
    return (): ModuleId[] => {
      if (!settings) return [];
      
      // Beta testers get access to all modules
      if (isBetaTester) {
        return ALL_MODULE_IDS;
      }
      
      // Managed company: return grantedModules
      if (companyType === 'managed') {
        return settings.grantedModules || [];
      }
      
      // Direct company: return modules for their tier
      const currentTier = settings.subscriptionTier || 'starter';
      return TIER_MODULES[currentTier] || [];
    };
  }, [settings, companyType, isBetaTester]);

  // Check if a module is marked as coming soon
  const isComingSoon = useMemo(() => {
    return (moduleId: ModuleId): boolean => {
      return MODULES[moduleId]?.comingSoon ?? true;
    };
  }, []);

  return {
    hasAccess,
    getAccessibleModules,
    isComingSoon,
    tier,
    companyType,
    managedByPracticeName,
    isBetaTester,
  };
}

export default useModuleAccess;

