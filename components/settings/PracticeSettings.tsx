import React, { useState } from 'react';
import { Settings, ManagedCompany, ModuleId, MODULES } from '../../types';

interface PracticeSettingsProps {
  settings: Settings;
  managedCompanies: ManagedCompany[];
  managedCompaniesLoading: boolean;
  onAddClient: () => void;
  onUpdateClientModules: (companyId: string, modules: ModuleId[]) => Promise<void>;
}

const PracticeSettings: React.FC<PracticeSettingsProps> = ({
  settings,
  managedCompanies,
  managedCompaniesLoading,
  onAddClient,
  onUpdateClientModules,
}) => {
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editingModules, setEditingModules] = useState<ModuleId[]>([]);
  const [saving, setSaving] = useState(false);

  const isManaged = settings.companyType === 'managed';
  // Only true if user actually has managed companies (is a real CFO)
  const isCfo = managedCompanies.length > 0;

  // If this is a managed company, show who manages it
  if (isManaged) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">CFO Practice</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your company is managed by a CFO practice.
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🏢</div>
            <div>
              <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">
                Managed by {settings.managedByPracticeName || 'CFO Practice'}
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Your company's access to this platform is provided through your CFO's services.
                Contact them for any questions about your subscription or module access.
              </p>

              {/* Show granted modules */}
              {settings.grantedModules && settings.grantedModules.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Your enabled modules:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {settings.grantedModules.map(moduleId => {
                      const module = MODULES[moduleId];
                      return (
                        <span
                          key={moduleId}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 rounded-lg text-sm"
                        >
                          <span>{module?.icon || '📦'}</span>
                          <span>{module?.shortName || moduleId}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CFO view - manage clients
  const handleEditModules = (company: ManagedCompany) => {
    setEditingCompanyId(company.id);
    setEditingModules([...company.grantedModules]);
  };

  const handleModuleToggle = (moduleId: ModuleId) => {
    setEditingModules(prev => {
      if (prev.includes(moduleId)) {
        if (moduleId === 'wip') return prev; // Can't remove WIP
        return prev.filter(m => m !== moduleId);
      }
      return [...prev, moduleId];
    });
  };

  const handleSaveModules = async () => {
    if (!editingCompanyId) return;
    setSaving(true);
    try {
      await onUpdateClientModules(editingCompanyId, editingModules);
      setEditingCompanyId(null);
      setEditingModules([]);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCompanyId(null);
    setEditingModules([]);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">CFO Practice</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage your client companies and their module access.
        </p>
      </div>

      {/* Practice Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏠</span>
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
                {settings.companyName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your CFO Practice • {managedCompanies.length} client{managedCompanies.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onAddClient}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>➕</span>
            Add Client
          </button>
        </div>
      </div>

      {/* Client Companies */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Client Companies</h3>
        </div>

        {managedCompaniesLoading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Loading clients...
          </div>
        ) : managedCompanies.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              You haven't added any client companies yet.
            </p>
            <button
              onClick={onAddClient}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Add Your First Client
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {managedCompanies.map(company => {
              const isEditing = editingCompanyId === company.id;

              return (
                <div key={company.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🏢</span>
                      <div>
                        <h4 className="text-base font-medium text-gray-900 dark:text-white">
                          {company.name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {company.grantedModules.length} module{company.grantedModules.length !== 1 ? 's' : ''} enabled
                        </p>
                      </div>
                    </div>

                    {!isEditing && (
                      <button
                        onClick={() => handleEditModules(company)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        Edit Modules
                      </button>
                    )}
                  </div>

                  {/* Module badges (view mode) */}
                  {!isEditing && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {company.grantedModules.map(moduleId => {
                        const module = MODULES[moduleId];
                        return (
                          <span
                            key={moduleId}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                          >
                            <span>{module?.icon || '📦'}</span>
                            <span>{module?.shortName || moduleId}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Module editor (edit mode) */}
                  {isEditing && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Select modules for {company.name}:
                      </p>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {Object.values(MODULES).map(module => {
                          const isEnabled = editingModules.includes(module.id);
                          const isWip = module.id === 'wip';

                          return (
                            <label
                              key={module.id}
                              className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${isEnabled
                                  ? 'bg-blue-100 dark:bg-blue-900/30'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                                } ${isWip ? 'opacity-75' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={() => handleModuleToggle(module.id)}
                                disabled={isWip || saving}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <span>{module.icon}</span>
                              <span className="text-sm text-gray-900 dark:text-white">
                                {module.shortName}
                              </span>
                              {module.comingSoon && (
                                <span className="text-xs text-amber-600 dark:text-amber-400">Soon</span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleCancelEdit}
                          disabled={saving}
                          className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveModules}
                          disabled={saving}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Future Features */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-6">
        <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">Coming Soon</h3>
        <ul className="text-sm text-gray-400 dark:text-gray-500 space-y-1">
          <li>• Client activity dashboard</li>
          <li>• Aggregate reporting across clients</li>
          <li>• White-label branding options</li>
          <li>• Client billing management</li>
        </ul>
      </div>
    </div>
  );
};

export default PracticeSettings;

