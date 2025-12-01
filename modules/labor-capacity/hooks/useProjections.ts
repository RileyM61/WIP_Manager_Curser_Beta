// ============================================================================
// USE PROJECTIONS HOOK
// ============================================================================

import { useMemo } from 'react';
import { Employee, Department, DepartmentAllocation, CapacitySummary, MonthlyProjection } from '../types';
import {
  calculateEmployeeMetrics,
  calculateDepartmentSummary,
  generateMonthlyProjections,
  isEmployeeCurrentlyActive,
} from '../lib/calculations';

export function useProjections(
  employees: Employee[],
  departments: Department[],
  allocations: DepartmentAllocation[],
  monthsAhead: number = 12
) {
  // Calculate capacity summary
  const summary = useMemo<CapacitySummary>(() => {
    // Only include employees who are currently active (not future hires)
    const activeEmployees = employees.filter(e => isEmployeeCurrentlyActive(e));
    
    // Calculate totals
    let totalFte = 0;
    let totalHourlyRate = 0;
    let totalLoadedRate = 0;
    let totalBurden = 0;
    let totalAnnualCost = 0;
    let totalAnnualHours = 0;
    let productiveHours = 0;

    activeEmployees.forEach(emp => {
      const metrics = calculateEmployeeMetrics(emp);
      totalFte += emp.fte;
      totalHourlyRate += emp.hourlyRate;
      totalLoadedRate += metrics.loadedCostPerHour;
      totalBurden += emp.burdenMultiplier;
      totalAnnualCost += metrics.annualLoadedCost;
      totalAnnualHours += metrics.annualAvailableHours;
    });

    const count = activeEmployees.length;
    const averageHourlyRate = count > 0 ? totalHourlyRate / count : 0;
    const averageLoadedRate = count > 0 ? totalLoadedRate / count : 0;
    const averageBurdenMultiplier = count > 0 ? totalBurden / count : 0;

    // Calculate department summaries
    const departmentSummaries = departments.map(dept => 
      calculateDepartmentSummary(dept, employees, allocations)
    );

    // Calculate productive capacity (from productive departments only)
    departmentSummaries.forEach(ds => {
      if (ds.isProductive) {
        productiveHours += ds.totalHours;
      }
    });

    // Generate monthly projections
    const monthlyProjections = generateMonthlyProjections(
      employees,
      departments,
      allocations,
      monthsAhead
    );

    return {
      totalEmployees: employees.length,
      activeEmployees: count,
      totalFte,
      averageHourlyRate,
      averageLoadedRate,
      averageBurdenMultiplier,
      totalAnnualCost,
      totalAnnualHours,
      productiveCapacityHours: productiveHours,
      departments: departmentSummaries,
      monthlyProjections,
    };
  }, [employees, departments, allocations, monthsAhead]);

  // Get projections for a specific month
  const getMonthProjection = (monthStr: string): MonthlyProjection | undefined => {
    return summary.monthlyProjections.find(p => p.month === monthStr);
  };

  // Get total cost for next N months
  const getTotalCostForPeriod = (months: number): number => {
    return summary.monthlyProjections
      .slice(0, months)
      .reduce((sum, p) => sum + p.totalCost, 0);
  };

  // Get department cost breakdown
  const getDepartmentCostBreakdown = (): { name: string; cost: number; percent: number }[] => {
    const total = summary.departments.reduce((sum, d) => sum + d.totalCost, 0);
    return summary.departments.map(d => ({
      name: d.departmentName,
      cost: d.totalCost,
      percent: total > 0 ? (d.totalCost / total) * 100 : 0,
    }));
  };

  return {
    summary,
    getMonthProjection,
    getTotalCostForPeriod,
    getDepartmentCostBreakdown,
  };
}

