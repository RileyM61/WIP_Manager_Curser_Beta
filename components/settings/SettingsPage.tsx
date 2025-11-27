import React, { useState } from 'react';
import { Settings, UserRole } from '../../types';
import { XIcon } from '../shared/icons';
import CompanySettings from './CompanySettings';
import UsersSettings from './UsersSettings';
import DefaultsSettings from './DefaultsSettings';
import AppearanceSettings from './AppearanceSettings';
import LegalSettings from './LegalSettings';
import ComingSoonSection from './ComingSoonSection';

type SettingsSection = 
  | 'company' 
  | 'users' 
  | 'defaults' 
  | 'appearance' 
  | 'notifications' 
  | 'integrations' 
  | 'reports' 
  | 'billing' 
  | 'legal';

interface SettingsPageProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (settings: Settings) => void;
  userRole: UserRole;
  companyId: string;
  currentUserId: string;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  userRole,
  companyId,
  currentUserId,
  theme,
  onThemeChange,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('company');
  const [currentSettings, setCurrentSettings] = useState<Settings>(settings);

  // Update currentSettings when settings prop changes
  React.useEffect(() => {
    setCurrentSettings(settings);
  }, [settings]);

  if (!isOpen) return null;

  const isOwner = userRole === 'owner';

  const handleSettingsChange = (newSettings: Partial<Settings>) => {
    setCurrentSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleSave = () => {
    onSave(currentSettings);
  };

  // Navigation items with access control
  const navItems: { id: SettingsSection; label: string; icon: string; ownerOnly: boolean }[] = [
    { id: 'company', label: 'Company', icon: '🏢', ownerOnly: true },
    { id: 'users', label: 'Users & Team', icon: '👥', ownerOnly: true },
    { id: 'defaults', label: 'Job Defaults', icon: '⚙️', ownerOnly: true },
    { id: 'appearance', label: 'Appearance', icon: '🎨', ownerOnly: false },
    { id: 'notifications', label: 'Notifications', icon: '🔔', ownerOnly: false },
    { id: 'integrations', label: 'Integrations', icon: '🔗', ownerOnly: true },
    { id: 'reports', label: 'Export & Reports', icon: '📊', ownerOnly: true },
    { id: 'billing', label: 'Billing', icon: '💳', ownerOnly: true },
    { id: 'legal', label: 'Legal', icon: '📜', ownerOnly: false },
  ];

  // Filter nav items based on user role
  const visibleNavItems = navItems.filter(item => !item.ownerOnly || isOwner);

  // If current section is owner-only and user is not owner, switch to first visible section
  React.useEffect(() => {
    const currentItem = navItems.find(item => item.id === activeSection);
    if (currentItem?.ownerOnly && !isOwner) {
      const firstVisible = visibleNavItems[0];
      if (firstVisible) {
        setActiveSection(firstVisible.id);
      }
    }
  }, [userRole, activeSection]);

  const renderContent = () => {
    switch (activeSection) {
      case 'company':
        return (
          <CompanySettings
            settings={currentSettings}
            onChange={handleSettingsChange}
            onSave={handleSave}
          />
        );
      case 'users':
        return (
          <UsersSettings
            companyId={companyId}
            currentUserId={currentUserId}
          />
        );
      case 'defaults':
        return (
          <DefaultsSettings
            settings={currentSettings}
            onChange={handleSettingsChange}
            onSave={handleSave}
          />
        );
      case 'appearance':
        return (
          <AppearanceSettings
            theme={theme}
            onThemeChange={onThemeChange}
          />
        );
      case 'notifications':
        return (
          <ComingSoonSection
            title="Notifications"
            description="Configure email alerts for job status changes, behind schedule warnings, and weekly WIP summaries."
            features={[
              'Email alerts when jobs go behind schedule',
              'Weekly WIP summary reports',
              'Job status change notifications',
              'Custom alert thresholds',
            ]}
          />
        );
      case 'integrations':
        return (
          <ComingSoonSection
            title="Integrations"
            description="Connect WIP Manager to your accounting and project management tools."
            features={[
              'QuickBooks Online integration',
              'QuickBooks Desktop sync',
              'Sage integration',
              'API access for custom integrations',
            ]}
          />
        );
      case 'reports':
        return (
          <ComingSoonSection
            title="Export & Reports"
            description="Customize your export formats and report templates."
            features={[
              'Custom PDF report templates',
              'Company branding on exports',
              'Scheduled report generation',
              'Excel/CSV format options',
            ]}
          />
        );
      case 'billing':
        return (
          <ComingSoonSection
            title="Billing & Subscription"
            description="Manage your subscription plan and payment methods."
            features={[
              'View current plan details',
              'Upgrade or downgrade subscription',
              'Update payment method',
              'Download invoices',
            ]}
          />
        );
      case 'legal':
        return <LegalSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Settings</h1>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <XIcon />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto flex-shrink-0">
          <div className="p-4 space-y-1">
            {visibleNavItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === item.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;

