import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useModuleAccess } from '../hooks/useModuleAccess';
import { useSupabaseSettings } from '../hooks/useSupabaseSettings';
import { MODULES, ModuleId, ALL_MODULE_IDS } from '../types/modules';
import { OnboardingWidget } from '../components/onboarding/OnboardingWidget';

// ============================================================================
// MODULE CARD COMPONENT
// ============================================================================
interface ModuleCardProps {
  moduleId: ModuleId;
  hasAccess: boolean;
  isComingSoon: boolean;
  onClick: () => void;
}

const ModuleCard: React.FC<ModuleCardProps> = ({
  moduleId,
  hasAccess,
  isComingSoon,
  onClick,
}) => {
  const module = MODULES[moduleId];
  const isClickable = hasAccess && !isComingSoon;

  return (
    <button
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      className={`
        relative flex flex-col items-start p-6 rounded-2xl border-2 transition-all duration-300 text-left
        ${isClickable
          ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-orange-500 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1 cursor-pointer'
          : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 cursor-not-allowed opacity-60'
        }
      `}
    >
      {/* Status Badges */}
      <div className="absolute top-4 right-4 flex gap-2">
        {isComingSoon && (
          <span className="text-[10px] uppercase tracking-wide bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full font-semibold">
            Coming Soon
          </span>
        )}
        {!hasAccess && !isComingSoon && (
          <span className="text-[10px] uppercase tracking-wide bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full font-semibold">
            Upgrade
          </span>
        )}
        {hasAccess && !isComingSoon && (
          <span className="text-[10px] uppercase tracking-wide bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-full font-semibold">
            Active
          </span>
        )}
      </div>

      {/* Icon */}
      <div className={`
        w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-4
        ${isClickable
          ? 'bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/20'
          : 'bg-gray-200 dark:bg-gray-700'
        }
      `}>
        {module.icon}
      </div>

      {/* Content */}
      <h3 className={`text-lg font-bold mb-2 ${isClickable ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
        {module.name}
      </h3>
      <p className={`text-sm leading-relaxed ${isClickable ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
        {module.description}
      </p>

      {/* Action indicator */}
      {isClickable && (
        <div className="mt-4 flex items-center gap-2 text-orange-500 font-medium text-sm group-hover:gap-3 transition-all">
          <span>Open</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      )}
    </button>
  );
};

// ============================================================================
// MAIN MODULE DASHBOARD
// ============================================================================
const ModuleDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { companyId, signOut, user } = useAuth();
  const { settings, loading: settingsLoading } = useSupabaseSettings(companyId);
  const { hasAccess, getAccessibleModules, isComingSoon, companyType, managedByPracticeName, isBetaTester } = useModuleAccess(settings);

  // Get accessible modules
  const accessibleModules = getAccessibleModules();
  const accessibleActiveModules = accessibleModules.filter(id => !isComingSoon(id));

  // For non-beta users, only show WIP module (temporary until ChainLink CFO launches)
  const visibleModules: ModuleId[] = isBetaTester
    ? ALL_MODULE_IDS
    : ['wip'];

  const handleModuleClick = (moduleId: ModuleId) => {
    navigate(`/app/${moduleId}`);
  };

  // Show loading state
  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <img
            src="/images/chainlink-cfo-logo.png"
            alt="ChainLink CFO"
            className="h-64 w-auto mx-auto mb-4 animate-pulse"
          />
          <p className="text-gray-600 dark:text-gray-400">Loading your modules...</p>
        </div>
      </div>
    );
  }

  // Order modules: accessible first, then coming soon, then locked
  const sortedModules = [...visibleModules].sort((a, b) => {
    const aAccessible = hasAccess(a) && !isComingSoon(a);
    const bAccessible = hasAccess(b) && !isComingSoon(b);
    const aComingSoon = isComingSoon(a);
    const bComingSoon = isComingSoon(b);

    if (aAccessible && !bAccessible) return -1;
    if (!aAccessible && bAccessible) return 1;
    if (!aComingSoon && bComingSoon) return -1;
    if (aComingSoon && !bComingSoon) return 1;
    return 0;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/images/chainlink-cfo-logo.png"
              alt="ChainLink CFO"
              className="h-48 w-auto"
            />
            {settings?.companyName && (
              <div className="border-l border-gray-200 dark:border-gray-700 pl-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">{settings.companyName}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {managedByPracticeName && (
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                Managed by {managedByPracticeName}
              </span>
            )}
            <button
              onClick={signOut}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {companyType === 'managed'
              ? `Your CFO has granted you access to ${accessibleModules.length} module${accessibleModules.length !== 1 ? 's' : ''}.`
              : `You have access to ${accessibleActiveModules.length} active module${accessibleActiveModules.length !== 1 ? 's' : ''}.`
            }
          </p>
        </div>

        {/* Onboarding Widget (Visible only if applicable) */}
        <OnboardingWidget />

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-orange-500">{accessibleActiveModules.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Modules</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{ALL_MODULE_IDS.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total in Suite</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {ALL_MODULE_IDS.filter(id => isComingSoon(id)).length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Coming Soon</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold capitalize text-gray-900 dark:text-white">{companyType}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Account Type</p>
          </div>
        </div>

        {/* Module Grid */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Modules</h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sortedModules.map((moduleId) => (
              <ModuleCard
                key={moduleId}
                moduleId={moduleId}
                hasAccess={hasAccess(moduleId)}
                isComingSoon={isComingSoon(moduleId)}
                onClick={() => handleModuleClick(moduleId)}
              />
            ))}
          </div>
        </div>

        {/* Upgrade CTA (for direct companies without full access) */}
        {companyType === 'direct' && accessibleModules.length < ALL_MODULE_IDS.length && (
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-2">Unlock More Power</h3>
            <p className="text-white/80 mb-6 max-w-xl mx-auto">
              Upgrade your plan to access more financial tools and take complete control of your construction business.
            </p>
            <button className="bg-white text-orange-500 font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors">
              View Plans
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} ChainLink CFO</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Support</a>
            <a href="#" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div >
  );
};

export default ModuleDashboard;

