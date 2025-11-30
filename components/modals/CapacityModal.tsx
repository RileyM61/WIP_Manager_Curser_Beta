import React, { useEffect, useMemo, useState } from 'react';
import { CapacityPlan, CapacityRow, CapacityDiscipline, StaffingDiscipline } from '../../types';
import { XIcon, PlusIcon } from '../shared/icons';
import InfoTooltip from '../help/InfoTooltip';

interface CapacityModalProps {
  isOpen: boolean;
  onClose: () => void;
  capacityPlan: CapacityPlan;
  onSave: (plan: CapacityPlan) => void;
}

const disciplineOptions: CapacityDiscipline[] = [
  StaffingDiscipline.ProjectManagement,
  StaffingDiscipline.Superintendents,
  StaffingDiscipline.Engineering,
  StaffingDiscipline.FieldLabor,
  StaffingDiscipline.Foreman,
  StaffingDiscipline.Shop,
  StaffingDiscipline.Safety,
  'Custom',
];

const hoursFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

const clonePlan = (plan: CapacityPlan): CapacityPlan => ({
  ...plan,
  rows: plan.rows.map(row => ({ ...row })),
});

const generateRowId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `cap-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

const createEmptyRow = (): CapacityRow => ({
  id: generateRowId(),
  discipline: 'Custom',
  label: 'New Discipline',
  headcount: 1,
  hoursPerPerson: 40,
  committedHours: 0,
});

const CapacityModal: React.FC<CapacityModalProps> = ({ isOpen, onClose, capacityPlan, onSave }) => {
  const [draftPlan, setDraftPlan] = useState<CapacityPlan>(() => clonePlan(capacityPlan));

  useEffect(() => {
    if (isOpen) {
      setDraftPlan(clonePlan(capacityPlan));
    }
  }, [capacityPlan, isOpen]);

  const totals = useMemo(() => {
    const totalAvailable = draftPlan.rows.reduce((sum, row) => sum + row.headcount * row.hoursPerPerson, 0);
    const totalCommitted = draftPlan.rows.reduce((sum, row) => sum + row.committedHours, 0);
    const balance = totalAvailable - totalCommitted;
    const utilization = totalAvailable > 0 ? (totalCommitted / totalAvailable) * 100 : 0;
    return {
      totalAvailable,
      totalCommitted,
      balance,
      utilization,
    };
  }, [draftPlan.rows]);

  const handlePlanningHorizonChange = (value: string) => {
    const numeric = Number(value);
    setDraftPlan(prev => ({
      ...prev,
      planningHorizonWeeks: Number.isFinite(numeric) ? numeric : prev.planningHorizonWeeks,
    }));
  };

  const handleNotesChange = (value: string) => {
    setDraftPlan(prev => ({
      ...prev,
      notes: value,
    }));
  };

  const handleDisciplineChange = (rowId: string, value: CapacityDiscipline) => {
    setDraftPlan(prev => ({
      ...prev,
      rows: prev.rows.map(row =>
        row.id === rowId
          ? {
              ...row,
              discipline: value,
              label: value === 'Custom' ? row.label : value,
            }
          : row
      ),
    }));
  };

  const handleRowFieldChange = (rowId: string, field: keyof CapacityRow, value: string) => {
    setDraftPlan(prev => ({
      ...prev,
      rows: prev.rows.map(row => {
        if (row.id !== rowId) return row;

        if (field === 'label') {
          return { ...row, label: value };
        }

        const numeric = Number(value);
        return {
          ...row,
          [field]: Number.isFinite(numeric) ? numeric : (row[field] as number),
        } as CapacityRow;
      }),
    }));
  };

  const handleRemoveRow = (rowId: string) => {
    setDraftPlan(prev => ({
      ...prev,
      rows: prev.rows.filter(row => row.id !== rowId),
    }));
  };

  const handleAddRow = () => {
    setDraftPlan(prev => ({
      ...prev,
      rows: [...prev.rows, createEmptyRow()],
    }));
  };

  const handleSave = () => {
    const sanitizedRows = draftPlan.rows.map(row => {
      const headcount = Math.max(0, Number(row.headcount) || 0);
      const hoursPerPerson = Math.max(0, Number(row.hoursPerPerson) || 0);
      const committedHours = Math.max(0, Number(row.committedHours) || 0);
      const defaultLabel = row.discipline === 'Custom' ? 'Custom Discipline' : row.label;
      const label = row.label.trim() || defaultLabel;

      return {
        ...row,
        headcount,
        hoursPerPerson,
        committedHours,
        label,
      };
    });

    const sanitizedPlan: CapacityPlan = {
      ...draftPlan,
      planningHorizonWeeks: Math.max(1, Math.round(Number(draftPlan.planningHorizonWeeks) || 1)),
      rows: sanitizedRows,
      notes: draftPlan.notes?.trim() || undefined,
      lastUpdated: new Date().toISOString(),
    };

    onSave(sanitizedPlan);
  };

  if (!isOpen) {
    return null;
  }

  const capacityBalanceColor = totals.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const utilizationColor = totals.utilization <= 100 ? 'text-brand-blue dark:text-brand-light-blue' : 'text-red-600 dark:text-red-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-5xl max-h-full flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Staffing Capacity Planner</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Adjust resource availability and commitments for the upcoming backlog.</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            aria-label="Close capacity planner"
          >
            <XIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Available Hours</p>
                <InfoTooltip
                  title="Total Available Hours"
                  shortText="The maximum hours your team can work in a week."
                  detailedText="Total Available Hours represents your team's maximum weekly capacity. It's calculated by multiplying the headcount in each discipline by their expected hours per person, then summing across all disciplines. This is your theoretical ceiling for how much work your team can handle."
                  formula="Available = Σ (Headcount × Hours per Person)"
                  example="If you have 3 Project Managers at 40 hrs each and 5 Field Laborers at 45 hrs each:\n3 × 40 + 5 × 45 = 120 + 225 = 345 total available hours"
                />
              </div>
              <p className="mt-2 text-2xl font-bold text-brand-blue dark:text-brand-light-blue">{hoursFormatter.format(totals.totalAvailable)} hrs</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Across {draftPlan.rows.length} discipline{draftPlan.rows.length === 1 ? '' : 's'}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Committed Hours</p>
                <InfoTooltip
                  title="Committed Hours"
                  shortText="Hours already allocated to active and upcoming projects."
                  detailedText="Committed Hours represents the labor hours you've already promised to active and pipeline jobs. This should reflect realistic estimates of the weekly effort needed across all your current commitments. Compare this to Available Hours to understand if you're over or under capacity."
                  formula="Committed = Σ (Committed Hours per Discipline)"
                  example="If your Project Managers are committed to 100 hrs of work and Field Labor to 200 hrs:\nTotal Committed = 100 + 200 = 300 hours"
                />
              </div>
              <p className="mt-2 text-2xl font-bold text-yellow-600 dark:text-yellow-400">{hoursFormatter.format(totals.totalCommitted)} hrs</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Within {draftPlan.planningHorizonWeeks || 1}-week plan</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Capacity Balance</p>
                <InfoTooltip
                  title="Capacity Balance"
                  shortText="Available hours minus committed hours. Positive = room for more work."
                  detailedText="Capacity Balance shows whether you have spare capacity or are overcommitted. A positive balance (green) means you have room to take on additional work. A negative balance (red) indicates you've committed more hours than your team can deliver, which may lead to overtime, delays, or quality issues."
                  formula="Balance = Available Hours − Committed Hours"
                  example="If you have 345 available hours and 300 committed:\nBalance = 345 − 300 = +45 hours (room for more work)\n\nIf committed is 400:\nBalance = 345 − 400 = −55 hours (overcommitted)"
                />
              </div>
              <p className={`mt-2 text-2xl font-bold ${capacityBalanceColor}`}>{hoursFormatter.format(totals.balance)} hrs</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Positive indicates slack capacity</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Utilization</p>
                <InfoTooltip
                  title="Utilization Rate"
                  shortText="Percentage of available capacity that's committed to work."
                  detailedText="Utilization measures how much of your available capacity is being used. 100% means you're fully booked with no slack. Above 100% (red) means you're overcommitted. Most healthy organizations target 75-90% utilization to leave buffer for unexpected issues, administrative work, and employee development."
                  formula="Utilization = (Committed Hours ÷ Available Hours) × 100%"
                  example="If you have 300 committed hours and 345 available:\nUtilization = (300 ÷ 345) × 100% = 87%\n\n• 70-85%: Healthy with buffer\n• 85-95%: Fully loaded\n• >100%: Overcommitted"
                />
              </div>
              <p className={`mt-2 text-2xl font-bold ${utilizationColor}`}>{totals.utilization.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Target &lt;= 100%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <label htmlFor="planningHorizon" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Planning Horizon (weeks)</label>
              <input
                id="planningHorizon"
                type="number"
                min={1}
                value={draftPlan.planningHorizonWeeks}
                onChange={(event) => handlePlanningHorizonChange(event.target.value)}
                className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-blue focus:border-brand-blue dark:bg-gray-800 dark:text-gray-200"
              />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="capacityNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Planner Notes</label>
              <textarea
                id="capacityNotes"
                rows={3}
                value={draftPlan.notes || ''}
                onChange={(event) => handleNotesChange(event.target.value)}
                placeholder="Document hiring plans, contractor usage, or constraints."
                className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-blue focus:border-brand-blue dark:bg-gray-800 dark:text-gray-200"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Discipline Breakdown</h3>
              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
              >
                <PlusIcon />
                <span className="ml-1">Add Discipline</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/80">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Discipline</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Label</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Headcount</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Hours / Person</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Available</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Committed</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {draftPlan.rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        No disciplines configured yet. Use "Add Discipline" to get started.
                      </td>
                    </tr>
                  )}
                  {draftPlan.rows.map((row) => {
                    const available = row.headcount * row.hoursPerPerson;

                    return (
                      <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                        <td className="px-4 py-3 align-top">
                          <select
                            value={row.discipline}
                            onChange={(event) => handleDisciplineChange(row.id, event.target.value as CapacityDiscipline)}
                            className="block w-full border border-gray-300 dark:border-gray-700 rounded-md py-2 px-2 focus:outline-none focus:ring-brand-blue focus:border-brand-blue dark:bg-gray-800 dark:text-gray-200"
                          >
                            {disciplineOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <input
                            type="text"
                            value={row.label}
                            onChange={(event) => handleRowFieldChange(row.id, 'label', event.target.value)}
                            className="block w-full border border-gray-300 dark:border-gray-700 rounded-md py-2 px-2 focus:outline-none focus:ring-brand-blue focus:border-brand-blue dark:bg-gray-800 dark:text-gray-200"
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            value={row.headcount}
                            onChange={(event) => handleRowFieldChange(row.id, 'headcount', event.target.value)}
                            className="block w-full text-right border border-gray-300 dark:border-gray-700 rounded-md py-2 px-2 focus:outline-none focus:ring-brand-blue focus:border-brand-blue dark:bg-gray-800 dark:text-gray-200"
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={row.hoursPerPerson}
                            onChange={(event) => handleRowFieldChange(row.id, 'hoursPerPerson', event.target.value)}
                            className="block w-full text-right border border-gray-300 dark:border-gray-700 rounded-md py-2 px-2 focus:outline-none focus:ring-brand-blue focus:border-brand-blue dark:bg-gray-800 dark:text-gray-200"
                          />
                        </td>
                        <td className="px-4 py-3 align-top text-right text-sm font-semibold text-gray-700 dark:text-gray-200">
                          {hoursFormatter.format(available)}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={row.committedHours}
                            onChange={(event) => handleRowFieldChange(row.id, 'committedHours', event.target.value)}
                            className="block w-full text-right border border-gray-300 dark:border-gray-700 rounded-md py-2 px-2 focus:outline-none focus:ring-brand-blue focus:border-brand-blue dark:bg-gray-800 dark:text-gray-200"
                          />
                        </td>
                        <td className="px-4 py-3 align-top text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(row.id)}
                            className="text-sm font-medium text-red-500 hover:text-red-600 dark:hover:text-red-400"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Last balanced capacity: {capacityPlan.lastUpdated ? new Date(capacityPlan.lastUpdated).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Not recorded'}
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-md bg-brand-blue text-sm font-medium text-white hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
            >
              Save Capacity Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapacityModal;

