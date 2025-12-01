// ============================================================================
// USE EMPLOYEES HOOK
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  Employee,
  DbEmployee,
  DepartmentAllocation,
  DbDepartmentAllocation,
  EmployeeFormData,
  AllocationFormData,
} from '../types';
import { calculateEmployeeMetrics } from '../lib/calculations';

// Transform database row to app type
function dbToEmployee(row: DbEmployee): Employee {
  const employee: Employee = {
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
  };

  // Add calculated metrics
  const metrics = calculateEmployeeMetrics(employee);
  employee.loadedCostPerHour = metrics.loadedCostPerHour;
  employee.annualAvailableHours = metrics.annualAvailableHours;
  employee.annualLoadedCost = metrics.annualLoadedCost;
  employee.yearsOfService = metrics.yearsOfService;

  return employee;
}

function dbToAllocation(row: DbDepartmentAllocation): DepartmentAllocation {
  return {
    id: row.id,
    employeeId: row.employee_id,
    departmentId: row.department_id,
    allocationPercent: Number(row.allocation_percent),
    effectiveDate: row.effective_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useEmployees(companyId: string | null) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allocations, setAllocations] = useState<DepartmentAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    if (!companyId || !supabase) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', companyId)
        .order('name');

      if (fetchError) throw fetchError;

      const mapped = (data || []).map(dbToEmployee);
      setEmployees(mapped);
    } catch (err: any) {
      console.error('[useEmployees] Error fetching:', err);
      setError(err.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  // Fetch allocations for all employees
  const fetchAllocations = useCallback(async () => {
    if (!companyId || !supabase) return;

    try {
      // Get all employee IDs for this company first
      const { data: empData } = await supabase
        .from('employees')
        .select('id')
        .eq('company_id', companyId);

      if (!empData || empData.length === 0) {
        setAllocations([]);
        return;
      }

      const employeeIds = empData.map(e => e.id);

      const { data, error: fetchError } = await supabase
        .from('employee_department_allocations')
        .select('*')
        .in('employee_id', employeeIds);

      if (fetchError) throw fetchError;

      setAllocations((data || []).map(dbToAllocation));
    } catch (err: any) {
      console.error('[useEmployees] Error fetching allocations:', err);
    }
  }, [companyId]);

  // Create employee
  const createEmployee = useCallback(async (formData: EmployeeFormData): Promise<Employee | null> => {
    if (!companyId || !supabase) return null;

    try {
      const { data, error: insertError } = await supabase
        .from('employees')
        .insert({
          company_id: companyId,
          name: formData.name,
          role: formData.role || null,
          fte: formData.fte,
          hourly_rate: formData.hourlyRate,
          burden_multiplier: formData.burdenMultiplier,
          annual_pto_hours: formData.annualPtoHours,
          hire_date: formData.hireDate || null,
          termination_date: formData.terminationDate || null,
          utilization_target: formData.utilizationTarget,
          is_active: formData.isActive,
          notes: formData.notes || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newEmployee = dbToEmployee(data);
      setEmployees(prev => [...prev, newEmployee].sort((a, b) => a.name.localeCompare(b.name)));
      return newEmployee;
    } catch (err: any) {
      console.error('[useEmployees] Error creating:', err);
      setError(err.message || 'Failed to create employee');
      return null;
    }
  }, [companyId]);

  // Update employee
  const updateEmployee = useCallback(async (id: string, formData: Partial<EmployeeFormData>): Promise<boolean> => {
    if (!supabase) return false;

    try {
      const updateData: Partial<DbEmployee> = {};
      if (formData.name !== undefined) updateData.name = formData.name;
      if (formData.role !== undefined) updateData.role = formData.role || null;
      if (formData.fte !== undefined) updateData.fte = formData.fte;
      if (formData.hourlyRate !== undefined) updateData.hourly_rate = formData.hourlyRate;
      if (formData.burdenMultiplier !== undefined) updateData.burden_multiplier = formData.burdenMultiplier;
      if (formData.annualPtoHours !== undefined) updateData.annual_pto_hours = formData.annualPtoHours;
      if (formData.hireDate !== undefined) updateData.hire_date = formData.hireDate || null;
      if (formData.terminationDate !== undefined) updateData.termination_date = formData.terminationDate || null;
      if (formData.utilizationTarget !== undefined) updateData.utilization_target = formData.utilizationTarget;
      if (formData.isActive !== undefined) updateData.is_active = formData.isActive;
      if (formData.notes !== undefined) updateData.notes = formData.notes || null;

      const { data, error: updateError } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      const updated = dbToEmployee(data);
      setEmployees(prev => prev.map(e => e.id === id ? updated : e));
      return true;
    } catch (err: any) {
      console.error('[useEmployees] Error updating:', err);
      setError(err.message || 'Failed to update employee');
      return false;
    }
  }, []);

  // Delete employee
  const deleteEmployee = useCallback(async (id: string): Promise<boolean> => {
    if (!supabase) return false;

    try {
      const { error: deleteError } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setEmployees(prev => prev.filter(e => e.id !== id));
      setAllocations(prev => prev.filter(a => a.employeeId !== id));
      return true;
    } catch (err: any) {
      console.error('[useEmployees] Error deleting:', err);
      setError(err.message || 'Failed to delete employee');
      return false;
    }
  }, []);

  // Update employee allocations
  const updateAllocations = useCallback(async (
    employeeId: string,
    newAllocations: AllocationFormData[]
  ): Promise<boolean> => {
    if (!supabase) return false;

    try {
      // Delete existing allocations for this employee
      await supabase
        .from('employee_department_allocations')
        .delete()
        .eq('employee_id', employeeId);

      // Insert new allocations
      if (newAllocations.length > 0) {
        const { error: insertError } = await supabase
          .from('employee_department_allocations')
          .insert(
            newAllocations.map(a => ({
              employee_id: employeeId,
              department_id: a.departmentId,
              allocation_percent: a.allocationPercent,
              effective_date: new Date().toISOString().slice(0, 10),
            }))
          );

        if (insertError) throw insertError;
      }

      // Refresh allocations
      await fetchAllocations();
      return true;
    } catch (err: any) {
      console.error('[useEmployees] Error updating allocations:', err);
      setError(err.message || 'Failed to update allocations');
      return false;
    }
  }, [fetchAllocations]);

  // Initial fetch
  useEffect(() => {
    fetchEmployees();
    fetchAllocations();
  }, [fetchEmployees, fetchAllocations]);

  return {
    employees,
    allocations,
    loading,
    error,
    refresh: () => {
      fetchEmployees();
      fetchAllocations();
    },
    createEmployee,
    updateEmployee,
    deleteEmployee,
    updateAllocations,
  };
}

