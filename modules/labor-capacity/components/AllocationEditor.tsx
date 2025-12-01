// ============================================================================
// ALLOCATION EDITOR MODAL
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { Employee, Department, DepartmentAllocation, AllocationFormData } from '../types';
import { validateAllocations } from '../lib/calculations';

interface AllocationEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employeeId: string, allocations: AllocationFormData[]) => Promise<boolean>;
  employee: Employee | null;
  departments: Department[];
  currentAllocations: DepartmentAllocation[];
}

const AllocationEditor: React.FC<AllocationEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  employee,
  departments,
  currentAllocations,
}) => {
  const [allocations, setAllocations] = useState<AllocationFormData[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize allocations when modal opens
  useEffect(() => {
    if (isOpen && employee) {
      const empAllocations = currentAllocations.filter(a => a.employeeId === employee.id);
      
      // Create allocation for each department
      const initial = departments.map(dept => {
        const existing = empAllocations.find(a => a.departmentId === dept.id);
        return {
          departmentId: dept.id,
          allocationPercent: existing?.allocationPercent || 0,
        };
      });
      
      setAllocations(initial);
      setError(null);
    }
  }, [isOpen, employee, departments, currentAllocations]);

  // Validation
  const validation = useMemo(() => {
    const nonZero = allocations.filter(a => a.allocationPercent > 0);
    return validateAllocations(nonZero);
  }, [allocations]);

  // Total percentage
  const totalPercent = useMemo(() => {
    return allocations.reduce((sum, a) => sum + a.allocationPercent, 0);
  }, [allocations]);

  const handlePercentChange = (departmentId: string, value: number) => {
    setAllocations(prev =>
      prev.map(a =>
        a.departmentId === departmentId
          ? { ...a, allocationPercent: Math.max(0, Math.min(100, value)) }
          : a
      )
    );
  };

  const handleSliderChange = (departmentId: string, value: number) => {
    // When adjusting one slider, keep the proportion of others if we're over 100%
    const newAllocations = allocations.map(a =>
      a.departmentId === departmentId ? { ...a, allocationPercent: value } : a
    );
    setAllocations(newAllocations);
  };

  const handleDistributeEvenly = () => {
    const count = departments.length;
    if (count === 0) return;
    
    const perDept = Math.floor(100 / count);
    const remainder = 100 - (perDept * count);
    
    setAllocations(
      departments.map((dept, i) => ({
        departmentId: dept.id,
        allocationPercent: perDept + (i === 0 ? remainder : 0),
      }))
    );
  };

  const handleClear = () => {
    setAllocations(
      departments.map(dept => ({
        departmentId: dept.id,
        allocationPercent: 0,
      }))
    );
  };

  const handleSubmit = async () => {
    if (!employee) return;

    // Only save non-zero allocations
    const nonZero = allocations.filter(a => a.allocationPercent > 0);
    
    // Validate
    const v = validateAllocations(nonZero);
    if (!v.isValid && nonZero.length > 0) {
      setError(v.message);
      return;
    }

    setSaving(true);
    setError(null);

    const success = await onSave(employee.id, nonZero);
    
    setSaving(false);
    if (success) {
      onClose();
    } else {
      setError('Failed to save allocations');
    }
  };

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Department Allocation
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {employee.name} — Set how time is split across departments
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Quick Actions */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={handleDistributeEvenly}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              Distribute Evenly
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              Clear All
            </button>
          </div>

          {/* Department Allocations */}
          <div className="space-y-4">
            {departments.map(dept => {
              const allocation = allocations.find(a => a.departmentId === dept.id);
              const percent = allocation?.allocationPercent || 0;
              
              return (
                <div key={dept.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {dept.name}
                      </span>
                      {dept.isProductive && (
                        <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                          Productive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={percent}
                        onChange={(e) => handlePercentChange(dept.id, parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 text-right text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <span className="text-gray-500 text-sm">%</span>
                    </div>
                  </div>
                  
                  {/* Slider */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={percent}
                    onChange={(e) => handleSliderChange(dept.id, parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className={`mt-6 p-4 rounded-lg ${
            validation.isValid || totalPercent === 0
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700 dark:text-gray-300">Total Allocation</span>
              <span className={`text-2xl font-bold ${
                validation.isValid || totalPercent === 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {totalPercent}%
              </span>
            </div>
            {!validation.isValid && totalPercent > 0 && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {validation.message}
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || (!validation.isValid && totalPercent > 0)}
            className="px-6 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving ? 'Saving...' : 'Save Allocations'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AllocationEditor;

