/**
 * Value Builder Module - Main Page
 */

import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useValuations } from '../hooks/useValuations';
import { useValueHistory } from '../hooks/useValueHistory';
import { Valuation, ValuationFormData } from '../types';
import ValuationDashboard from './ValuationDashboard';
import ScenarioList from './ScenarioList';
import ScenarioForm from './ScenarioForm';
import ScenarioComparison from './ScenarioComparison';

type TabId = 'dashboard' | 'scenarios' | 'compare';

const ValueBuilderPage: React.FC = () => {
  const { companyId } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingValuation, setEditingValuation] = useState<Valuation | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const {
    valuations,
    currentValuation,
    loading: valuationsLoading,
    error: valuationsError,
    createValuation,
    updateValuation,
    deleteValuation,
    setAsCurrent,
    duplicateValuation,
  } = useValuations(companyId ?? undefined);

  const {
    history,
    loading: historyLoading,
    valueGrowth,
    recordValue,
  } = useValueHistory(companyId ?? undefined);

  // Handle form submit
  const handleFormSubmit = async (data: ValuationFormData) => {
    if (editingValuation) {
      const success = await updateValuation(editingValuation.id, data);
      if (success) {
        setIsFormOpen(false);
        setEditingValuation(null);
      }
    } else {
      const newValuation = await createValuation(data);
      if (newValuation) {
        setIsFormOpen(false);
      }
    }
  };

  // Handle edit
  const handleEdit = (valuation: Valuation) => {
    setEditingValuation(valuation);
    setIsFormOpen(true);
  };

  // Handle duplicate
  const handleDuplicate = async (valuation: Valuation) => {
    const newName = `${valuation.name} (Copy)`;
    await duplicateValuation(valuation.id, newName);
  };

  // Handle delete
  const handleDelete = async (valuation: Valuation) => {
    if (window.confirm(`Delete "${valuation.name}"? This cannot be undone.`)) {
      await deleteValuation(valuation.id);
    }
  };

  // Handle compare selection
  const handleToggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id]; // Max 3, remove oldest
      }
      return [...prev, id];
    });
  };

  // Handle record to history
  const handleRecordValue = async () => {
    if (currentValuation) {
      await recordValue(currentValuation);
    }
  };

  const loading = valuationsLoading || historyLoading;

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'scenarios', label: 'Scenarios', icon: '📋' },
    { id: 'compare', label: 'Compare', icon: '⚖️' },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="text-3xl">💎</span>
                Value Builder
              </h1>
              <p className="text-slate-400 mt-1">
                Track your business value and model scenarios
              </p>
            </div>
            <button
              onClick={() => {
                setEditingValuation(null);
                setIsFormOpen(true);
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Scenario
            </button>
          </div>

          {/* Tabs */}
          <nav className="flex gap-1 mt-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {tab.id === 'compare' && compareIds.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-emerald-500 text-white rounded-full">
                    {compareIds.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Loading valuations...</p>
            </div>
          </div>
        ) : valuationsError ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
            <p className="text-red-400">{valuationsError}</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <ValuationDashboard
                currentValuation={currentValuation}
                history={history}
                valueGrowth={valueGrowth}
                onRecordValue={handleRecordValue}
                onEditCurrent={() => currentValuation && handleEdit(currentValuation)}
                onCreateFirst={() => setIsFormOpen(true)}
              />
            )}

            {activeTab === 'scenarios' && (
              <ScenarioList
                valuations={valuations}
                compareIds={compareIds}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onSetCurrent={setAsCurrent}
                onToggleCompare={handleToggleCompare}
                onViewCompare={() => setActiveTab('compare')}
              />
            )}

            {activeTab === 'compare' && (
              <ScenarioComparison
                valuations={valuations}
                selectedIds={compareIds}
                onToggleSelect={handleToggleCompare}
                onClearSelection={() => setCompareIds([])}
              />
            )}
          </>
        )}
      </main>

      {/* Scenario Form Modal */}
      {isFormOpen && (
        <ScenarioForm
          valuation={editingValuation}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setIsFormOpen(false);
            setEditingValuation(null);
          }}
        />
      )}
    </div>
  );
};

export default ValueBuilderPage;

