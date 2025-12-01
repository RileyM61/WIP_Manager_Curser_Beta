// ============================================================================
// USE CAPACITY FOR WIP HOOK
// Provides Labor Capacity data in a format compatible with WIP Insights
// ============================================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { Employee, Department, DepartmentAllocation } from '../types';
import {
  calculateMonthlyAvailableHours,
  isEmployeeCurrentlyActive,
} from '../lib/calculations';

interface CapacityForWIP {
  weeklyProductiveHours: number;
  monthlyProductiveHours: number;
  productiveFte: number;
  lastUpdated: string | null;
  departmentBreakdown: {
    name: string;
    weeklyHours: number;
    fte: number;
  }[];
}

interface UseCapacityForWIPReturn {
  capacity: CapacityForWIP | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch Labor Capacity data formatted for WIP Insights
 * Returns weekly productive hours that can be used in the Gantt heatmap
 */
export function useCapacityForWIP(companyId: string | null): UseCapacityForWIPReturn {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allocations, setAllocations] = useState<DepartmentAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!companyId || !supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [employeesRes, departmentsRes, allocationsRes] = await Promise.all([
        supabase
          .from('employees')
          .select('*')
          .eq('company_id', companyId)
          .eq('is_active', true),
        supabase
          .from('departments')
          .select('*')
          .eq('company_id', companyId)
          .order('sort_order'),
        supabase
          .from('employee_department_allocations')
          .select('*'),
      ]);

      if (employeesRes.error) throw employeesRes.error;
      if (departmentsRes.error) throw departmentsRes.error;
      if (allocationsRes.error) throw allocationsRes.error;

      // Transform database rows to app types
      const emps: Employee[] = (employeesRes.data || []).map((row: any) => ({
        id: row.id,
        companyId: row.company_id,
        name: row.name,
        role: row.role,
        fte: Number(row.fte),
        hourlyRate: Number(row.hourly_rate),
        burdenMultiplier: Number(row.burden_multiplier),
        annualPtoHours: row.annual_pto_hours,
        hireDate: row.hire_date,
        terminationDate: row.termination_date,
        utilizationTarget: Number(row.utilization_target),
        isActive: row.is_active,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      const depts: Department[] = (departmentsRes.data || []).map((row: any) => ({
        id: row.id,
        companyId: row.company_id,
        name: row.name,
        isProductive: row.is_productive,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      const allocs: DepartmentAllocation[] = (allocationsRes.data || []).map((row: any) => ({
        id: row.id,
        employeeId: row.employee_id,
        departmentId: row.department_id,
        allocationPercent: Number(row.allocation_percent),
        effectiveDate: row.effective_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      setEmployees(emps);
      setDepartments(depts);
      setAllocations(allocs);
      setLastFetched(new Date().toISOString());
    } catch (err: any) {
      console.error('[useCapacityForWIP] Error fetching:', err);
      setError(err.message || 'Failed to fetch capacity data');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate capacity metrics
  const capacity = useMemo<CapacityForWIP | null>(() => {
    if (employees.length === 0 || departments.length === 0) {
      return null;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // Get productive departments
    const productiveDepts = departments.filter(d => d.isProductive);
    
    // Calculate hours per productive department
    const departmentBreakdown: CapacityForWIP['departmentBreakdown'] = [];
    let totalMonthlyProductiveHours = 0;
    let totalProductiveFte = 0;

    productiveDepts.forEach(dept => {
      // Get allocations for this department
      const deptAllocations = allocations.filter(a => a.departmentId === dept.id);
      const employeeIds = new Set(deptAllocations.map(a => a.employeeId));

      // Get active employees in this department
      const deptEmployees = employees.filter(
        e => employeeIds.has(e.id) && isEmployeeCurrentlyActive(e)
      );

      let deptMonthlyHours = 0;
      let deptFte = 0;

      deptEmployees.forEach(emp => {
        const allocation = deptAllocations.find(a => a.employeeId === emp.id);
        if (!allocation) return;

        const allocationFactor = allocation.allocationPercent / 100;
        const monthlyHours = calculateMonthlyAvailableHours(
          emp.fte,
          emp.annualPtoHours,
          year,
          month
        );

        deptMonthlyHours += monthlyHours * allocationFactor;
        deptFte += emp.fte * allocationFactor;
      });

      if (deptMonthlyHours > 0) {
        departmentBreakdown.push({
          name: dept.name,
          weeklyHours: Math.round(deptMonthlyHours / 4.33), // Approximate weeks per month
          fte: Math.round(deptFte * 100) / 100,
        });
      }

      totalMonthlyProductiveHours += deptMonthlyHours;
      totalProductiveFte += deptFte;
    });

    // Convert monthly to weekly (average ~4.33 weeks per month)
    const weeklyProductiveHours = Math.round(totalMonthlyProductiveHours / 4.33);

    return {
      weeklyProductiveHours,
      monthlyProductiveHours: Math.round(totalMonthlyProductiveHours),
      productiveFte: Math.round(totalProductiveFte * 100) / 100,
      lastUpdated: lastFetched,
      departmentBreakdown,
    };
  }, [employees, departments, allocations, lastFetched]);

  return {
    capacity,
    loading,
    error,
    refetch: fetchData,
  };
}

export default useCapacityForWIP;

