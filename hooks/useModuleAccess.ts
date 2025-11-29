import { useMemo } from 'react';
import { Settings, ModuleId, SubscriptionTier, MODULES, TIER_MODULES, isModuleInTier } from '../types';

interface UseModuleAccessReturn {
  hasAccess: (moduleId: ModuleId) => boolean;
  getAccessibleModules: () => ModuleId[];
  isComingSoon: (moduleId: ModuleId) => boolean;
  tier: SubscriptionTier | null;
  companyType: 'managed' | 'direct';
  managedByPracticeName: string | null;
}

/**
 * Hook to check module access based on company type
 * 
 * For managed companies: checks grantedModules from CFO
 * For direct companies: checks subscription tier
 * 
 * @param settings - Company settings
 */
export function useModuleAccess(settings: Settings | null): UseModuleAccessReturn {
  const companyType = settings?.companyType || 'direct';
  const managedByPracticeName = settings?.managedByPracticeName || null;
  
  // Determine subscription tier (only relevant for direct companies)
  const tier: SubscriptionTier | null = useMemo(() => {
    if (!settings) return null;
    if (companyType === 'managed') return null; // Managed companies don't have tiers
    return settings.subscriptionTier || 'starter';
  }, [settings, companyType]);

  // Check if user has access to a specific module
  const hasAccess = useMemo(() => {
    return (moduleId: ModuleId): boolean => {
      if (!settings) return false;
      
      // Managed company: check grantedModules from CFO
      if (companyType === 'managed') {
        const grantedModules = settings.grantedModules || [];
        return grantedModules.includes(moduleId);
      }
      
      // Direct company: check subscription tier
      const currentTier = settings.subscriptionTier || 'starter';
      return isModuleInTier(moduleId, currentTier);
    };
  }, [settings, companyType]);

  // Get all modules the user can access
  const getAccessibleModules = useMemo(() => {
    return (): ModuleId[] => {
      if (!settings) return [];
      
      // Managed company: return grantedModules
      if (companyType === 'managed') {
        return settings.grantedModules || [];
      }
      
      // Direct company: return modules for their tier
      const currentTier = settings.subscriptionTier || 'starter';
      return TIER_MODULES[currentTier] || [];
    };
  }, [settings, companyType]);

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
  };
}

export default useModuleAccess;

