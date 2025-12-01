// ============================================================================
// LABOR CAPACITY MODULE TYPES
// ============================================================================

export interface Department {
  id: string;
  companyId: string;
  name: string;
  isProductive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  companyId: string;
  name: string;
  role: string | null;
  fte: number; // 0.5, 0.75, 1.0, etc.
  hourlyRate: number;
  burdenMultiplier: number; // Default 1.16 (16% burden)
  annualPtoHours: number;
  hireDate: string | null;
  terminationDate: string | null; // If set, employee is terminated on this date
  utilizationTarget: number; // 0.85 = 85%
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  // Calculated fields (not stored)
  loadedCostPerHour?: number;
  annualAvailableHours?: number;
  annualLoadedCost?: number;
  yearsOfService?: number;
  // Joined data
  allocations?: DepartmentAllocation[];
}

export interface DepartmentAllocation {
  id: string;
  employeeId: string;
  departmentId: string;
  allocationPercent: number; // 60 = 60%
  effectiveDate: string;
  createdAt: string;
  updatedAt: string;
  // Joined data
  department?: Department;
}

export interface LaborCostProjection {
  id: string;
  companyId: string;
  month: string; // YYYY-MM-DD (first of month)
  departmentId: string | null;
  projectedHours: number;
  projectedCost: number;
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
  // Joined data
  department?: Department;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface EmployeeFormData {
  name: string;
  role: string;
  fte: number;
  hourlyRate: number;
  burdenMultiplier: number;
  annualPtoHours: number;
  hireDate: string;
  terminationDate: string; // Empty string if not terminated
  utilizationTarget: number;
  isActive: boolean;
  notes: string;
}

export interface DepartmentFormData {
  name: string;
  isProductive: boolean;
  sortOrder: number;
}

export interface AllocationFormData {
  departmentId: string;
  allocationPercent: number;
}

// ============================================================================
// CALCULATION TYPES
// ============================================================================

export interface EmployeeMetrics {
  loadedCostPerHour: number;
  annualAvailableHours: number;
  annualLoadedCost: number;
  monthlyAvailableHours: number;
  monthlyLoadedCost: number;
  billableHours: number;
  yearsOfService: number;
}

export interface DepartmentSummary {
  departmentId: string;
  departmentName: string;
  isProductive: boolean;
  employeeCount: number;
  totalFte: number;
  totalHours: number;
  totalCost: number;
  averageLoadedRate: number;
}

export interface MonthlyProjection {
  month: string;
  departments: {
    departmentId: string;
    departmentName: string;
    hours: number;
    cost: number;
    employeeCount: number;
  }[];
  totalHours: number;
  totalCost: number;
  totalEmployees: number;
}

export interface CapacitySummary {
  totalEmployees: number;
  activeEmployees: number;
  totalFte: number;
  averageHourlyRate: number;
  averageLoadedRate: number;
  averageBurdenMultiplier: number;
  totalAnnualCost: number;
  totalAnnualHours: number;
  productiveCapacityHours: number;
  departments: DepartmentSummary[];
  monthlyProjections: MonthlyProjection[];
}

// ============================================================================
// DATABASE ROW TYPES (for Supabase)
// ============================================================================

export interface DbDepartment {
  id: string;
  company_id: string;
  name: string;
  is_productive: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbEmployee {
  id: string;
  company_id: string;
  name: string;
  role: string | null;
  fte: number;
  hourly_rate: number;
  burden_multiplier: number;
  annual_pto_hours: number;
  hire_date: string | null;
  termination_date: string | null;
  utilization_target: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbDepartmentAllocation {
  id: string;
  employee_id: string;
  department_id: string;
  allocation_percent: number;
  effective_date: string;
  created_at: string;
  updated_at: string;
}

export interface DbLaborCostProjection {
  id: string;
  company_id: string;
  month: string;
  department_id: string | null;
  projected_hours: number;
  projected_cost: number;
  employee_count: number;
  created_at: string;
  updated_at: string;
}

