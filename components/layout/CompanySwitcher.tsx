import React, { useState, useRef, useEffect } from 'react';
import { ManagedCompany, Settings } from '../../types';
import { ChevronDownIcon } from '../shared/icons';

interface CompanySwitcherProps {
  currentCompanyId: string;
  currentCompanyName: string;
  currentSettings: Settings | null;
  managedCompanies: ManagedCompany[];
  loading: boolean;
  onSwitchCompany: (companyId: string) => void;
  onAddClient: () => void;
}

const CompanySwitcher: React.FC<CompanySwitcherProps> = ({
  currentCompanyId,
  currentCompanyName,
  currentSettings,
  managedCompanies,
  loading,
  onSwitchCompany,
  onAddClient,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine if current user is a CFO (has managed companies)
  const isCfo = managedCompanies.length > 0;
  
  // Determine if current company is managed
  const isManaged = currentSettings?.companyType === 'managed';
  const managedByName = currentSettings?.managedByPracticeName;

  // Don't show switcher if not a CFO and not viewing a managed company
  if (!isCfo && !isManaged) {
    return (
      <div className="flex items-center">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {currentCompanyName}
        </span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current Company Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🏢</span>
          <div className="text-left">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {currentCompanyName}
            </div>
            {isManaged && managedByName && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Managed by {managedByName}
              </div>
            )}
          </div>
        </div>
        <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          {loading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Loading...
            </div>
          ) : (
            <>
              {/* My Practice Section */}
              {isCfo && (
                <>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      My Practice
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      // Switch back to CFO's own company
                      // This assumes the CFO's company is not in the managed list
                      // We'd need the CFO's company ID passed in
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                      !isManaged ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <span className="text-lg">🏠</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {currentSettings?.managedByPracticeName || 'My Company'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Your practice
                      </div>
                    </div>
                    {!isManaged && (
                      <span className="ml-auto text-xs text-blue-600 dark:text-blue-400 font-medium">
                        Current
                      </span>
                    )}
                  </button>
                </>
              )}

              {/* Client Companies Section */}
              {managedCompanies.length > 0 && (
                <>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Client Companies ({managedCompanies.length})
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {managedCompanies.map((company) => {
                      const isCurrentCompany = company.id === currentCompanyId;
                      return (
                        <button
                          key={company.id}
                          onClick={() => {
                            if (!isCurrentCompany) {
                              onSwitchCompany(company.id);
                            }
                            setIsOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                            isCurrentCompany ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          <span className="text-lg">🏢</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {company.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {company.grantedModules.length} module{company.grantedModules.length !== 1 ? 's' : ''} enabled
                            </div>
                          </div>
                          {isCurrentCompany && (
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                              Current
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Add Client Button */}
              {isCfo && (
                <div className="border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => {
                      onAddClient();
                      setIsOpen(false);
                    }}
                    className="w-full px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-blue-600 dark:text-blue-400"
                  >
                    <span className="text-lg">➕</span>
                    <span className="text-sm font-medium">Add Client Company</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanySwitcher;

