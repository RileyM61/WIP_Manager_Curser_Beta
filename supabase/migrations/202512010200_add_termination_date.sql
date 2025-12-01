-- ============================================================================
-- ADD TERMINATION DATE TO EMPLOYEES
-- ============================================================================
-- Adds termination_date column to track when employees leave
-- If NULL, employee is considered currently employed
-- ============================================================================

-- Add termination_date column
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS termination_date DATE;

-- Add comment for documentation
COMMENT ON COLUMN public.employees.termination_date IS 
  'Date employee was terminated. NULL means still employed. Employees are excluded from projections after this date.';

-- Create index for querying active employees by termination date
CREATE INDEX IF NOT EXISTS idx_employees_termination_date 
  ON public.employees(termination_date) 
  WHERE termination_date IS NOT NULL;

