-- Migration: Audit Trail / Activity Log
-- Description: Create audit_log table with triggers to automatically capture
--              all changes to jobs and change_orders for accountability

-- ============================================================================
-- Create audit_log table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Entity information
  entity_type TEXT NOT NULL CHECK (entity_type IN ('job', 'change_order')),
  entity_id UUID NOT NULL,
  entity_name TEXT NOT NULL, -- Job name/number or CO description for display
  
  -- Change metadata
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_email TEXT, -- Denormalized for display performance
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Change details (array of field changes)
  changes JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- Indexes for efficient queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_audit_log_company_id ON public.audit_log(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type_id ON public.audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON public.audit_log(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_by ON public.audit_log(changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_log_company_changed_at ON public.audit_log(company_id, changed_at DESC);

-- ============================================================================
-- Helper function to get user email for audit log
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_email(user_id_param UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id_param;
  
  RETURN COALESCE(user_email, 'unknown');
END;
$$;

-- ============================================================================
-- Helper function to format field value for display
-- ============================================================================
CREATE OR REPLACE FUNCTION public.format_audit_value(field_name TEXT, field_value ANYELEMENT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Format numeric values as currency
  IF field_name LIKE '%_labor' OR field_name LIKE '%_material' OR field_name LIKE '%_other'
     OR field_name LIKE '%profit%' OR field_name LIKE '%budget%' OR field_name LIKE '%contract%'
     OR field_name LIKE '%cost%' THEN
    RETURN '$' || TO_CHAR(field_value::NUMERIC, 'FM999,999,999.00');
  END IF;
  
  -- Return as-is for other types
  RETURN field_value::TEXT;
END;
$$;

-- ============================================================================
-- Function to create audit log entry for jobs
-- ============================================================================
CREATE OR REPLACE FUNCTION public.audit_jobs_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  user_email TEXT;
  action_type TEXT;
  entity_name_val TEXT;
  changes_array JSONB := '[]'::jsonb;
  change_record JSONB;
  old_val TEXT;
  new_val TEXT;
BEGIN
  -- Get current user
  user_id := auth.uid();
  user_email := public.get_user_email(user_id);
  
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_type := 'create';
    entity_name_val := COALESCE(NEW.job_no, '') || ' - ' || COALESCE(NEW.job_name, 'New Job');
    
    -- Log all fields on create
    changes_array := jsonb_build_array(
      jsonb_build_object(
        'field', 'job_no',
        'label', 'Job Number',
        'old', NULL,
        'new', NEW.job_no
      ),
      jsonb_build_object(
        'field', 'job_name',
        'label', 'Job Name',
        'old', NULL,
        'new', NEW.job_name
      )
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'update';
    entity_name_val := COALESCE(NEW.job_no, '') || ' - ' || COALESCE(NEW.job_name, '');
    
    -- Check each field for changes
    -- Basic fields
    IF OLD.job_no IS DISTINCT FROM NEW.job_no THEN
      changes_array := changes_array || jsonb_build_object('field', 'job_no', 'label', 'Job Number', 'old', OLD.job_no, 'new', NEW.job_no);
    END IF;
    
    IF OLD.job_name IS DISTINCT FROM NEW.job_name THEN
      changes_array := changes_array || jsonb_build_object('field', 'job_name', 'label', 'Job Name', 'old', OLD.job_name, 'new', NEW.job_name);
    END IF;
    
    IF OLD.client IS DISTINCT FROM NEW.client THEN
      changes_array := changes_array || jsonb_build_object('field', 'client', 'label', 'Client', 'old', OLD.client, 'new', NEW.client);
    END IF;
    
    IF OLD.project_manager IS DISTINCT FROM NEW.project_manager THEN
      changes_array := changes_array || jsonb_build_object('field', 'project_manager', 'label', 'Project Manager', 'old', OLD.project_manager, 'new', NEW.project_manager);
    END IF;
    
    IF OLD.estimator IS DISTINCT FROM NEW.estimator THEN
      changes_array := changes_array || jsonb_build_object('field', 'estimator', 'label', 'Estimator', 'old', OLD.estimator, 'new', NEW.estimator);
    END IF;
    
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      changes_array := changes_array || jsonb_build_object('field', 'status', 'label', 'Status', 'old', OLD.status, 'new', NEW.status);
    END IF;
    
    -- Dates
    IF OLD.start_date IS DISTINCT FROM NEW.start_date THEN
      changes_array := changes_array || jsonb_build_object('field', 'start_date', 'label', 'Start Date', 'old', OLD.start_date, 'new', NEW.start_date);
    END IF;
    
    IF OLD.end_date IS DISTINCT FROM NEW.end_date THEN
      changes_array := changes_array || jsonb_build_object('field', 'end_date', 'label', 'End Date', 'old', OLD.end_date, 'new', NEW.end_date);
    END IF;
    
    IF OLD.target_end_date IS DISTINCT FROM NEW.target_end_date THEN
      changes_array := changes_array || jsonb_build_object('field', 'target_end_date', 'label', 'Target End Date', 'old', OLD.target_end_date, 'new', NEW.target_end_date);
    END IF;
    
    -- Financial fields - Contract
    IF OLD.contract_labor IS DISTINCT FROM NEW.contract_labor THEN
      changes_array := changes_array || jsonb_build_object('field', 'contract_labor', 'label', 'Contract Labor', 'old', OLD.contract_labor, 'new', NEW.contract_labor);
    END IF;
    
    IF OLD.contract_material IS DISTINCT FROM NEW.contract_material THEN
      changes_array := changes_array || jsonb_build_object('field', 'contract_material', 'label', 'Contract Material', 'old', OLD.contract_material, 'new', NEW.contract_material);
    END IF;
    
    IF OLD.contract_other IS DISTINCT FROM NEW.contract_other THEN
      changes_array := changes_array || jsonb_build_object('field', 'contract_other', 'label', 'Contract Other', 'old', OLD.contract_other, 'new', NEW.contract_other);
    END IF;
    
    -- Financial fields - Budget
    IF OLD.budget_labor IS DISTINCT FROM NEW.budget_labor THEN
      changes_array := changes_array || jsonb_build_object('field', 'budget_labor', 'label', 'Budget Labor', 'old', OLD.budget_labor, 'new', NEW.budget_labor);
    END IF;
    
    IF OLD.budget_material IS DISTINCT FROM NEW.budget_material THEN
      changes_array := changes_array || jsonb_build_object('field', 'budget_material', 'label', 'Budget Material', 'old', OLD.budget_material, 'new', NEW.budget_material);
    END IF;
    
    IF OLD.budget_other IS DISTINCT FROM NEW.budget_other THEN
      changes_array := changes_array || jsonb_build_object('field', 'budget_other', 'label', 'Budget Other', 'old', OLD.budget_other, 'new', NEW.budget_other);
    END IF;
    
    -- Financial fields - Costs
    IF OLD.cost_labor IS DISTINCT FROM NEW.cost_labor THEN
      changes_array := changes_array || jsonb_build_object('field', 'cost_labor', 'label', 'Cost Labor', 'old', OLD.cost_labor, 'new', NEW.cost_labor);
    END IF;
    
    IF OLD.cost_material IS DISTINCT FROM NEW.cost_material THEN
      changes_array := changes_array || jsonb_build_object('field', 'cost_material', 'label', 'Cost Material', 'old', OLD.cost_material, 'new', NEW.cost_material);
    END IF;
    
    IF OLD.cost_other IS DISTINCT FROM NEW.cost_other THEN
      changes_array := changes_array || jsonb_build_object('field', 'cost_other', 'label', 'Cost Other', 'old', OLD.cost_other, 'new', NEW.cost_other);
    END IF;
    
    -- Financial fields - Invoiced
    IF OLD.invoiced_labor IS DISTINCT FROM NEW.invoiced_labor THEN
      changes_array := changes_array || jsonb_build_object('field', 'invoiced_labor', 'label', 'Invoiced Labor', 'old', OLD.invoiced_labor, 'new', NEW.invoiced_labor);
    END IF;
    
    IF OLD.invoiced_material IS DISTINCT FROM NEW.invoiced_material THEN
      changes_array := changes_array || jsonb_build_object('field', 'invoiced_material', 'label', 'Invoiced Material', 'old', OLD.invoiced_material, 'new', NEW.invoiced_material);
    END IF;
    
    IF OLD.invoiced_other IS DISTINCT FROM NEW.invoiced_other THEN
      changes_array := changes_array || jsonb_build_object('field', 'invoiced_other', 'label', 'Invoiced Other', 'old', OLD.invoiced_other, 'new', NEW.invoiced_other);
    END IF;
    
    -- Financial fields - Cost to Complete
    IF OLD.cost_to_complete_labor IS DISTINCT FROM NEW.cost_to_complete_labor THEN
      changes_array := changes_array || jsonb_build_object('field', 'cost_to_complete_labor', 'label', 'Cost to Complete Labor', 'old', OLD.cost_to_complete_labor, 'new', NEW.cost_to_complete_labor);
    END IF;
    
    IF OLD.cost_to_complete_material IS DISTINCT FROM NEW.cost_to_complete_material THEN
      changes_array := changes_array || jsonb_build_object('field', 'cost_to_complete_material', 'label', 'Cost to Complete Material', 'old', OLD.cost_to_complete_material, 'new', NEW.cost_to_complete_material);
    END IF;
    
    IF OLD.cost_to_complete_other IS DISTINCT FROM NEW.cost_to_complete_other THEN
      changes_array := changes_array || jsonb_build_object('field', 'cost_to_complete_other', 'label', 'Cost to Complete Other', 'old', OLD.cost_to_complete_other, 'new', NEW.cost_to_complete_other);
    END IF;
    
    -- Other fields
    IF OLD.target_profit IS DISTINCT FROM NEW.target_profit THEN
      changes_array := changes_array || jsonb_build_object('field', 'target_profit', 'label', 'Target Profit', 'old', OLD.target_profit, 'new', NEW.target_profit);
    END IF;
    
    IF OLD.target_margin IS DISTINCT FROM NEW.target_margin THEN
      changes_array := changes_array || jsonb_build_object('field', 'target_margin', 'label', 'Target Margin', 'old', OLD.target_margin, 'new', NEW.target_margin);
    END IF;
    
    IF OLD.job_type IS DISTINCT FROM NEW.job_type THEN
      changes_array := changes_array || jsonb_build_object('field', 'job_type', 'label', 'Job Type', 'old', OLD.job_type, 'new', NEW.job_type);
    END IF;
    
    IF OLD.labor_cost_per_hour IS DISTINCT FROM NEW.labor_cost_per_hour THEN
      changes_array := changes_array || jsonb_build_object('field', 'labor_cost_per_hour', 'label', 'Labor Cost Per Hour', 'old', OLD.labor_cost_per_hour, 'new', NEW.labor_cost_per_hour);
    END IF;
    
    IF OLD.job_category IS DISTINCT FROM NEW.job_category THEN
      changes_array := changes_array || jsonb_build_object('field', 'job_category', 'label', 'Job Category', 'old', OLD.job_category, 'new', NEW.job_category);
    END IF;
    
    IF OLD.product_type IS DISTINCT FROM NEW.product_type THEN
      changes_array := changes_array || jsonb_build_object('field', 'product_type', 'label', 'Product Type', 'old', OLD.product_type, 'new', NEW.product_type);
    END IF;
    
    IF OLD.job_complexity IS DISTINCT FROM NEW.job_complexity THEN
      changes_array := changes_array || jsonb_build_object('field', 'job_complexity', 'label', 'Job Complexity', 'old', OLD.job_complexity, 'new', NEW.job_complexity);
    END IF;
    
    -- Only log if there are actual changes (ignore timestamp-only updates)
    IF jsonb_array_length(changes_array) = 0 THEN
      RETURN NEW;
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'delete';
    entity_name_val := COALESCE(OLD.job_no, '') || ' - ' || COALESCE(OLD.job_name, '');
  END IF;
  
  -- Insert audit log entry
  INSERT INTO public.audit_log (
    company_id,
    entity_type,
    entity_id,
    entity_name,
    action,
    changed_by,
    changed_by_email,
    changed_at,
    changes
  ) VALUES (
    COALESCE(NEW.company_id, OLD.company_id),
    'job',
    COALESCE(NEW.id, OLD.id),
    entity_name_val,
    action_type,
    user_id,
    user_email,
    now(),
    changes_array
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================================================
-- Function to create audit log entry for change orders
-- ============================================================================
CREATE OR REPLACE FUNCTION public.audit_change_orders_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  user_email TEXT;
  action_type TEXT;
  entity_name_val TEXT;
  changes_array JSONB := '[]'::jsonb;
  job_name TEXT;
BEGIN
  -- Get current user
  user_id := auth.uid();
  user_email := public.get_user_email(user_id);
  
  -- Get job name for display
  SELECT job_no || ' - ' || job_name INTO job_name
  FROM public.jobs
  WHERE id = COALESCE(NEW.job_id, OLD.job_id)
  LIMIT 1;
  
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_type := 'create';
    entity_name_val := COALESCE(job_name, 'Job') || ' - CO #' || NEW.co_number::TEXT;
    
    -- Log key fields on create
    changes_array := jsonb_build_array(
      jsonb_build_object('field', 'co_number', 'label', 'CO Number', 'old', NULL, 'new', NEW.co_number),
      jsonb_build_object('field', 'description', 'label', 'Description', 'old', NULL, 'new', NEW.description),
      jsonb_build_object('field', 'status', 'label', 'Status', 'old', NULL, 'new', NEW.status)
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'update';
    entity_name_val := COALESCE(job_name, 'Job') || ' - CO #' || NEW.co_number::TEXT;
    
    -- Check each field for changes
    IF OLD.co_number IS DISTINCT FROM NEW.co_number THEN
      changes_array := changes_array || jsonb_build_object('field', 'co_number', 'label', 'CO Number', 'old', OLD.co_number, 'new', NEW.co_number);
    END IF;
    
    IF OLD.description IS DISTINCT FROM NEW.description THEN
      changes_array := changes_array || jsonb_build_object('field', 'description', 'label', 'Description', 'old', OLD.description, 'new', NEW.description);
    END IF;
    
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      changes_array := changes_array || jsonb_build_object('field', 'status', 'label', 'Status', 'old', OLD.status, 'new', NEW.status);
    END IF;
    
    IF OLD.co_type IS DISTINCT FROM NEW.co_type THEN
      changes_array := changes_array || jsonb_build_object('field', 'co_type', 'label', 'CO Type', 'old', OLD.co_type, 'new', NEW.co_type);
    END IF;
    
    -- Contract fields
    IF OLD.contract_labor IS DISTINCT FROM NEW.contract_labor THEN
      changes_array := changes_array || jsonb_build_object('field', 'contract_labor', 'label', 'Contract Labor', 'old', OLD.contract_labor, 'new', NEW.contract_labor);
    END IF;
    
    IF OLD.contract_material IS DISTINCT FROM NEW.contract_material THEN
      changes_array := changes_array || jsonb_build_object('field', 'contract_material', 'label', 'Contract Material', 'old', OLD.contract_material, 'new', NEW.contract_material);
    END IF;
    
    IF OLD.contract_other IS DISTINCT FROM NEW.contract_other THEN
      changes_array := changes_array || jsonb_build_object('field', 'contract_other', 'label', 'Contract Other', 'old', OLD.contract_other, 'new', NEW.contract_other);
    END IF;
    
    -- Budget fields
    IF OLD.budget_labor IS DISTINCT FROM NEW.budget_labor THEN
      changes_array := changes_array || jsonb_build_object('field', 'budget_labor', 'label', 'Budget Labor', 'old', OLD.budget_labor, 'new', NEW.budget_labor);
    END IF;
    
    IF OLD.budget_material IS DISTINCT FROM NEW.budget_material THEN
      changes_array := changes_array || jsonb_build_object('field', 'budget_material', 'label', 'Budget Material', 'old', OLD.budget_material, 'new', NEW.budget_material);
    END IF;
    
    IF OLD.budget_other IS DISTINCT FROM NEW.budget_other THEN
      changes_array := changes_array || jsonb_build_object('field', 'budget_other', 'label', 'Budget Other', 'old', OLD.budget_other, 'new', NEW.budget_other);
    END IF;
    
    -- Cost fields
    IF OLD.costs_labor IS DISTINCT FROM NEW.costs_labor THEN
      changes_array := changes_array || jsonb_build_object('field', 'costs_labor', 'label', 'Cost Labor', 'old', OLD.costs_labor, 'new', NEW.costs_labor);
    END IF;
    
    IF OLD.costs_material IS DISTINCT FROM NEW.costs_material THEN
      changes_array := changes_array || jsonb_build_object('field', 'costs_material', 'label', 'Cost Material', 'old', OLD.costs_material, 'new', NEW.costs_material);
    END IF;
    
    IF OLD.costs_other IS DISTINCT FROM NEW.costs_other THEN
      changes_array := changes_array || jsonb_build_object('field', 'costs_other', 'label', 'Cost Other', 'old', OLD.costs_other, 'new', NEW.costs_other);
    END IF;
    
    -- Invoiced fields
    IF OLD.invoiced_labor IS DISTINCT FROM NEW.invoiced_labor THEN
      changes_array := changes_array || jsonb_build_object('field', 'invoiced_labor', 'label', 'Invoiced Labor', 'old', OLD.invoiced_labor, 'new', NEW.invoiced_labor);
    END IF;
    
    IF OLD.invoiced_material IS DISTINCT FROM NEW.invoiced_material THEN
      changes_array := changes_array || jsonb_build_object('field', 'invoiced_material', 'label', 'Invoiced Material', 'old', OLD.invoiced_material, 'new', NEW.invoiced_material);
    END IF;
    
    IF OLD.invoiced_other IS DISTINCT FROM NEW.invoiced_other THEN
      changes_array := changes_array || jsonb_build_object('field', 'invoiced_other', 'label', 'Invoiced Other', 'old', OLD.invoiced_other, 'new', NEW.invoiced_other);
    END IF;
    
    -- Cost to complete fields
    IF OLD.cost_to_complete_labor IS DISTINCT FROM NEW.cost_to_complete_labor THEN
      changes_array := changes_array || jsonb_build_object('field', 'cost_to_complete_labor', 'label', 'Cost to Complete Labor', 'old', OLD.cost_to_complete_labor, 'new', NEW.cost_to_complete_labor);
    END IF;
    
    IF OLD.cost_to_complete_material IS DISTINCT FROM NEW.cost_to_complete_material THEN
      changes_array := changes_array || jsonb_build_object('field', 'cost_to_complete_material', 'label', 'Cost to Complete Material', 'old', OLD.cost_to_complete_material, 'new', NEW.cost_to_complete_material);
    END IF;
    
    IF OLD.cost_to_complete_other IS DISTINCT FROM NEW.cost_to_complete_other THEN
      changes_array := changes_array || jsonb_build_object('field', 'cost_to_complete_other', 'label', 'Cost to Complete Other', 'old', OLD.cost_to_complete_other, 'new', NEW.cost_to_complete_other);
    END IF;
    
    -- Dates
    IF OLD.submitted_date IS DISTINCT FROM NEW.submitted_date THEN
      changes_array := changes_array || jsonb_build_object('field', 'submitted_date', 'label', 'Submitted Date', 'old', OLD.submitted_date, 'new', NEW.submitted_date);
    END IF;
    
    IF OLD.approved_date IS DISTINCT FROM NEW.approved_date THEN
      changes_array := changes_array || jsonb_build_object('field', 'approved_date', 'label', 'Approved Date', 'old', OLD.approved_date, 'new', NEW.approved_date);
    END IF;
    
    IF OLD.completed_date IS DISTINCT FROM NEW.completed_date THEN
      changes_array := changes_array || jsonb_build_object('field', 'completed_date', 'label', 'Completed Date', 'old', OLD.completed_date, 'new', NEW.completed_date);
    END IF;
    
    -- Only log if there are actual changes
    IF jsonb_array_length(changes_array) = 0 THEN
      RETURN NEW;
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'delete';
    entity_name_val := COALESCE(job_name, 'Job') || ' - CO #' || OLD.co_number::TEXT;
  END IF;
  
  -- Insert audit log entry
  INSERT INTO public.audit_log (
    company_id,
    entity_type,
    entity_id,
    entity_name,
    action,
    changed_by,
    changed_by_email,
    changed_at,
    changes
  ) VALUES (
    COALESCE(NEW.company_id, OLD.company_id),
    'change_order',
    COALESCE(NEW.id, OLD.id),
    entity_name_val,
    action_type,
    user_id,
    user_email,
    now(),
    changes_array
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================================================
-- Create triggers
-- ============================================================================
DROP TRIGGER IF EXISTS jobs_audit_trigger ON public.jobs;
CREATE TRIGGER jobs_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_jobs_changes();

DROP TRIGGER IF EXISTS change_orders_audit_trigger ON public.change_orders;
CREATE TRIGGER change_orders_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.change_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_change_orders_changes();

-- ============================================================================
-- Enable Row Level Security
-- ============================================================================
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Users can only view audit logs for their company
CREATE POLICY "Users can view audit logs for their company"
  ON public.audit_log
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Audit log is append-only (no INSERT/UPDATE/DELETE policies for users)
-- Only triggers can insert audit log entries

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON TABLE public.audit_log IS 'Audit trail of all changes to jobs and change orders for accountability';
COMMENT ON COLUMN public.audit_log.entity_type IS 'Type of entity: job or change_order';
COMMENT ON COLUMN public.audit_log.entity_name IS 'Display name for the entity (job number/name or CO description)';
COMMENT ON COLUMN public.audit_log.action IS 'Type of action: create, update, or delete';
COMMENT ON COLUMN public.audit_log.changes IS 'JSONB array of field changes with old/new values';
COMMENT ON COLUMN public.audit_log.changed_by_email IS 'Denormalized user email for display performance';

