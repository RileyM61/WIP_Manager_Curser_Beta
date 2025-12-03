// ============================================================================
// LABOR CAPACITY PAGE - Main Dashboard
// ============================================================================

import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useEmployees } from '../hooks/useEmployees';
import { useDepartments } from '../hooks/useDepartments';
import { useProjections } from '../hooks/useProjections';
import { Employee, EmployeeFormData, AllocationFormData } from '../types';
import { CURRENCY_FORMAT, HOURS_FORMAT, PERCENT_FORMAT } from '../constants';
import EmployeeRoster from './EmployeeRoster';
import EmployeeFormModal from './EmployeeFormModal';
import DepartmentManager from './DepartmentManager';
import AllocationEditor from './AllocationEditor';
import CostProjectionChart from './CostProjectionChart';
import DashboardNavButton from '../../../components/layout/DashboardNavButton';

type TabId = 'dashboard' | 'employees' | 'departments';

const LaborCapacityPage: React.FC = () => {
  const { companyId } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [allocatingEmployee, setAllocatingEmployee] = useState<Employee | null>(null);
  const [chartMode, setChartMode] = useState<'cost' | 'hours'>('cost');

  // Data hooks
  const {
    employees,
    allocations,
    loading: employeesLoading,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    updateAllocations,
  } = useEmployees(companyId);

  const {
    departments,
    loading: departmentsLoading,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    initializeDefaults,
  } = useDepartments(companyId);

  const { summary } = useProjections(employees, departments, allocations);

  const loading = employeesLoading || departmentsLoading;

  // Handlers
  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setShowEmployeeModal(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowEmployeeModal(true);
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    if (!confirm(`Delete ${employee.name}? This cannot be undone.`)) return;
    await deleteEmployee(employee.id);
  };

  // Get current department for an employee
  const getEmployeePrimaryDepartment = (employeeId: string): string | undefined => {
    const empAllocations = allocations.filter(a => a.employeeId === employeeId);
    if (empAllocations.length === 0) return undefined;
    // Return the department with highest allocation
    const sorted = [...empAllocations].sort((a, b) => b.allocationPercent - a.allocationPercent);
    return sorted[0]?.departmentId;
  };

  const handleSaveEmployee = async (data: EmployeeFormData, departmentId?: string): Promise<boolean> => {
    if (editingEmployee) {
      const updated = await updateEmployee(editingEmployee.id, data);
      // If department changed, update allocation
      if (updated && departmentId) {
        await updateAllocations(editingEmployee.id, [
          { departmentId, allocationPercent: 100 }
        ]);
      }
      return updated;
    } else {
      const result = await createEmployee(data);
      if (result && departmentId) {
        // Create 100% allocation to selected department
        await updateAllocations(result.id, [
          { departmentId, allocationPercent: 100 }
        ]);
      }
      return result !== null;
    }
  };

  const handleSaveAllocations = async (employeeId: string, allocs: AllocationFormData[]): Promise<boolean> => {
    return await updateAllocations(employeeId, allocs);
  };

  if (loading) {
    return (
      <>
        <DashboardNavButton floating />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading labor data...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <DashboardNavButton />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Labor Capacity
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage workforce, costs, and projections
                </p>
              </div>
            </div>
            <button
              onClick={handleAddEmployee}
              className="px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Employee
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 -mb-px">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'employees', label: `Employees (${summary.activeEmployees})` },
              { id: 'departments', label: `Departments (${departments.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
                  activeTab === tab.id
                    ? 'bg-gray-50 dark:bg-gray-900 text-orange-600 border-t-2 border-orange-500'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryCard
                label="Active Employees"
                value={summary.activeEmployees.toString()}
                subtext={`${summary.totalFte.toFixed(1)} FTE`}
                icon="👥"
              />
              <SummaryCard
                label="Average Loaded Rate"
                value={CURRENCY_FORMAT.format(summary.averageLoadedRate)}
                subtext={`/hour (${PERCENT_FORMAT.format(summary.averageBurdenMultiplier - 1)} burden)`}
                icon="💰"
              />
              <SummaryCard
                label="Annual Labor Cost"
                value={CURRENCY_FORMAT.format(summary.totalAnnualCost)}
                subtext={`${HOURS_FORMAT.format(summary.totalAnnualHours)} available hours`}
                icon="📊"
                highlight
              />
              <SummaryCard
                label="Productive Capacity"
                value={HOURS_FORMAT.format(summary.productiveCapacityHours)}
                subtext="hours/year from productive depts"
                icon="⚡"
              />
            </div>

            {/* Department Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Department Breakdown
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {summary.departments.map((dept) => (
                  <div
                    key={dept.departmentId}
                    className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${dept.isProductive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <h4 className="font-medium text-gray-900 dark:text-white">{dept.departmentName}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Employees</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{dept.employeeCount}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">FTE</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{dept.totalFte.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Annual Hours</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{HOURS_FORMAT.format(dept.totalHours)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Annual Cost</p>
                        <p className="font-semibold text-orange-600">{CURRENCY_FORMAT.format(dept.totalCost)}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {summary.departments.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <p>No departments configured yet.</p>
                    <button
                      onClick={() => setActiveTab('departments')}
                      className="mt-2 text-orange-600 hover:underline"
                    >
                      Set up departments →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Projection Chart */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  12-Month Forecast
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setChartMode('cost')}
                    className={`px-3 py-1.5 text-sm rounded-lg transition ${
                      chartMode === 'cost'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    Cost
                  </button>
                  <button
                    onClick={() => setChartMode('hours')}
                    className={`px-3 py-1.5 text-sm rounded-lg transition ${
                      chartMode === 'hours'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    Hours
                  </button>
                </div>
              </div>
              <CostProjectionChart
                projections={summary.monthlyProjections}
                departments={departments}
                showHours={chartMode === 'hours'}
              />
            </div>
          </div>
        )}

        {/* Employees Tab */}
        {activeTab === 'employees' && (
          <EmployeeRoster
            employees={employees}
            departments={departments}
            allocations={allocations}
            onEdit={handleEditEmployee}
            onDelete={handleDeleteEmployee}
            onEditAllocations={(emp) => setAllocatingEmployee(emp)}
          />
        )}

        {/* Departments Tab */}
        {activeTab === 'departments' && (
          <DepartmentManager
            departments={departments}
            onCreate={createDepartment}
            onUpdate={updateDepartment}
            onDelete={deleteDepartment}
            onInitializeDefaults={initializeDefaults}
          />
        )}
      </main>

      {/* Modals */}
      <EmployeeFormModal
        isOpen={showEmployeeModal}
        onClose={() => {
          setShowEmployeeModal(false);
          setEditingEmployee(null);
        }}
        onSave={handleSaveEmployee}
        employee={editingEmployee}
        departments={departments}
        currentDepartmentId={editingEmployee ? getEmployeePrimaryDepartment(editingEmployee.id) : undefined}
      />

      <AllocationEditor
        isOpen={allocatingEmployee !== null}
        onClose={() => setAllocatingEmployee(null)}
        onSave={handleSaveAllocations}
        employee={allocatingEmployee}
        departments={departments}
        currentAllocations={allocations}
      />
    </div>
  );
};

// Summary Card Component
interface SummaryCardProps {
  label: string;
  value: string;
  subtext: string;
  icon: string;
  highlight?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, subtext, icon, highlight }) => (
  <div className={`p-4 rounded-xl border ${
    highlight
      ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
  }`}>
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xl">{icon}</span>
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
    </div>
    <p className={`text-2xl font-bold ${highlight ? 'text-orange-600' : 'text-gray-900 dark:text-white'}`}>
      {value}
    </p>
    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtext}</p>
  </div>
);

export default LaborCapacityPage;

