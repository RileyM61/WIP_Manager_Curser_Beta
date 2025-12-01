-- Migration: Labor Capacity Module
-- Description: Create tables for employee tracking, departments, and cost projections

-- ============================================================================
-- DEPARTMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.settings(company_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_productive BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for company lookup
CREATE INDEX IF NOT EXISTS idx_departments_company ON public.departments(company_id);

-- RLS for departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view departments for their company"
  ON public.departments FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage departments for their company"
  ON public.departments FOR ALL
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- ============================================================================
-- EMPLOYEES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.settings(company_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  fte DECIMAL(3,2) NOT NULL DEFAULT 1.00 CHECK (fte > 0 AND fte <= 2),
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (hourly_rate >= 0),
  burden_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.16 CHECK (burden_multiplier >= 1),
  annual_pto_hours INTEGER NOT NULL DEFAULT 80 CHECK (annual_pto_hours >= 0),
  hire_date DATE,
  utilization_target DECIMAL(3,2) NOT NULL DEFAULT 0.85 CHECK (utilization_target >= 0 AND utilization_target <= 1),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for employees
CREATE INDEX IF NOT EXISTS idx_employees_company ON public.employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_active ON public.employees(company_id, is_active);

-- RLS for employees
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view employees for their company"
  ON public.employees FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage employees for their company"
  ON public.employees FOR ALL
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- ============================================================================
-- EMPLOYEE DEPARTMENT ALLOCATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.employee_department_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  allocation_percent DECIMAL(5,2) NOT NULL CHECK (allocation_percent >= 0 AND allocation_percent <= 100),
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Unique constraint to prevent duplicate allocations
  UNIQUE(employee_id, department_id, effective_date)
);

-- Indexes for allocations
CREATE INDEX IF NOT EXISTS idx_allocations_employee ON public.employee_department_allocations(employee_id);
CREATE INDEX IF NOT EXISTS idx_allocations_department ON public.employee_department_allocations(department_id);

-- RLS for allocations (inherit from employee access)
ALTER TABLE public.employee_department_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view allocations for their company employees"
  ON public.employee_department_allocations FOR SELECT
  USING (employee_id IN (
    SELECT e.id FROM public.employees e
    JOIN public.profiles p ON e.company_id = p.company_id
    WHERE p.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage allocations for their company employees"
  ON public.employee_department_allocations FOR ALL
  USING (employee_id IN (
    SELECT e.id FROM public.employees e
    JOIN public.profiles p ON e.company_id = p.company_id
    WHERE p.user_id = auth.uid()
  ));

-- ============================================================================
-- LABOR COST PROJECTIONS TABLE (for caching monthly calculations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.labor_cost_projections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.settings(company_id) ON DELETE CASCADE,
  month DATE NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  projected_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
  projected_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  employee_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- One projection per company/month/department
  UNIQUE(company_id, month, department_id)
);

-- Index for projections
CREATE INDEX IF NOT EXISTS idx_projections_company_month ON public.labor_cost_projections(company_id, month);

-- RLS for projections
ALTER TABLE public.labor_cost_projections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view projections for their company"
  ON public.labor_cost_projections FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage projections for their company"
  ON public.labor_cost_projections FOR ALL
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_departments_updated_at ON public.departments;
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employees_updated_at ON public.employees;
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_allocations_updated_at ON public.employee_department_allocations;
CREATE TRIGGER update_allocations_updated_at
  BEFORE UPDATE ON public.employee_department_allocations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projections_updated_at ON public.labor_cost_projections;
CREATE TRIGGER update_projections_updated_at
  BEFORE UPDATE ON public.labor_cost_projections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.departments IS 'Company departments or locations for labor allocation';
COMMENT ON TABLE public.employees IS 'Employee roster with pay rates and utilization targets';
COMMENT ON TABLE public.employee_department_allocations IS 'How employee time is split across departments (must total 100%)';
COMMENT ON TABLE public.labor_cost_projections IS 'Cached monthly labor cost projections by department';

