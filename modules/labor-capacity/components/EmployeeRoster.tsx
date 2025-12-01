// ============================================================================
// EMPLOYEE ROSTER COMPONENT
// ============================================================================

import React, { useState, useMemo } from 'react';
import { Employee, Department, DepartmentAllocation } from '../types';
import { CURRENCY_FORMAT_DECIMAL, HOURS_FORMAT, PERCENT_FORMAT } from '../constants';
import { calculateEmployeeMetrics } from '../lib/calculations';

interface EmployeeRosterProps {
  employees: Employee[];
  departments: Department[];
  allocations: DepartmentAllocation[];
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onEditAllocations: (employee: Employee) => void;
}

type SortField = 'name' | 'role' | 'fte' | 'hourlyRate' | 'loadedRate' | 'annualCost';
type SortDirection = 'asc' | 'desc';

const EmployeeRoster: React.FC<EmployeeRosterProps> = ({
  employees,
  departments,
  allocations,
  onEdit,
  onDelete,
  onEditAllocations,
}) => {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('active');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter and sort employees
  const filteredEmployees = useMemo(() => {
    let result = [...employees];

    // Filter by active status
    if (filterActive === 'active') {
      result = result.filter(e => e.isActive);
    } else if (filterActive === 'inactive') {
      result = result.filter(e => !e.isActive);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(e =>
        e.name.toLowerCase().includes(term) ||
        (e.role && e.role.toLowerCase().includes(term))
      );
    }

    // Sort
    result.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'role':
          aVal = (a.role || '').toLowerCase();
          bVal = (b.role || '').toLowerCase();
          break;
        case 'fte':
          aVal = a.fte;
          bVal = b.fte;
          break;
        case 'hourlyRate':
          aVal = a.hourlyRate;
          bVal = b.hourlyRate;
          break;
        case 'loadedRate':
          aVal = calculateEmployeeMetrics(a).loadedCostPerHour;
          bVal = calculateEmployeeMetrics(b).loadedCostPerHour;
          break;
        case 'annualCost':
          aVal = calculateEmployeeMetrics(a).annualLoadedCost;
          bVal = calculateEmployeeMetrics(b).annualLoadedCost;
          break;
        default:
          aVal = a.name;
          bVal = b.name;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [employees, filterActive, searchTerm, sortField, sortDirection]);

  // Get allocation summary for an employee
  const getAllocationSummary = (employeeId: string): string => {
    const empAllocations = allocations.filter(a => a.employeeId === employeeId);
    if (empAllocations.length === 0) return 'Not assigned';

    return empAllocations
      .map(a => {
        const dept = departments.find(d => d.id === a.departmentId);
        return `${dept?.name || 'Unknown'}: ${a.allocationPercent}%`;
      })
      .join(', ');
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return (
      <span className="ml-1">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Employee Roster
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({filteredEmployees.length} of {employees.length})
            </span>
          </h3>

          <div className="flex gap-3 w-full sm:w-auto">
            {/* Search */}
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 sm:w-48 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
            />

            {/* Filter */}
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as any)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              <th 
                className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('name')}
              >
                Name <SortIcon field="name" />
              </th>
              <th 
                className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('role')}
              >
                Role <SortIcon field="role" />
              </th>
              <th 
                className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-right"
                onClick={() => handleSort('fte')}
              >
                FTE <SortIcon field="fte" />
              </th>
              <th 
                className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-right"
                onClick={() => handleSort('hourlyRate')}
              >
                Hourly <SortIcon field="hourlyRate" />
              </th>
              <th 
                className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-right"
                onClick={() => handleSort('loadedRate')}
              >
                Loaded <SortIcon field="loadedRate" />
              </th>
              <th 
                className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-right"
                onClick={() => handleSort('annualCost')}
              >
                Annual Cost <SortIcon field="annualCost" />
              </th>
              <th className="px-4 py-3">Departments</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredEmployees.map((employee) => {
              const metrics = calculateEmployeeMetrics(employee);
              return (
                <tr 
                  key={employee.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 ${!employee.isActive ? 'opacity-50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-medium text-sm">
                        {employee.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{employee.name}</p>
                        {employee.yearsOfService && employee.yearsOfService > 0 && (
                          <p className="text-xs text-gray-500">{employee.yearsOfService} years</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {employee.role || '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                    {employee.fte.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                    {CURRENCY_FORMAT_DECIMAL.format(employee.hourlyRate)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                    {CURRENCY_FORMAT_DECIMAL.format(metrics.loadedCostPerHour)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-orange-600 dark:text-orange-400">
                    {CURRENCY_FORMAT_DECIMAL.format(metrics.annualLoadedCost)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onEditAllocations(employee)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline max-w-[200px] truncate block"
                      title={getAllocationSummary(employee.id)}
                    >
                      {getAllocationSummary(employee.id)}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => onEdit(employee)}
                        className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(employee)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredEmployees.length === 0 && (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            {employees.length === 0 ? (
              <p>No employees yet. Add your first employee to get started.</p>
            ) : (
              <p>No employees match your filters.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeRoster;

