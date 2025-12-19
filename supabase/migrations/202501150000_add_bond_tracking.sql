-- Migration: Add Bond Tracking to Jobs
-- Description: Add has_bond and bond_amount columns to jobs table and update audit trigger

-- ============================================================================
-- Add bond columns to jobs table
-- ============================================================================
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS has_bond BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bond_amount NUMERIC(15,2) DEFAULT 0;

-- ============================================================================
-- Update audit_jobs_changes function to track bond fields
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
    
    -- Add bond fields if they exist
    IF NEW.has_bond IS TRUE THEN
      changes_array := changes_array || jsonb_build_object('field', 'has_bond', 'label', 'Has Bond', 'old', NULL, 'new', NEW.has_bond);
      changes_array := changes_array || jsonb_build_object('field', 'bond_amount', 'label', 'Bond Amount', 'old', NULL, 'new', NEW.bond_amount);
    END IF;
    
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
    
    -- Bond fields
    IF OLD.has_bond IS DISTINCT FROM NEW.has_bond THEN
      changes_array := changes_array || jsonb_build_object('field', 'has_bond', 'label', 'Has Bond', 'old', OLD.has_bond, 'new', NEW.has_bond);
    END IF;
    
    IF OLD.bond_amount IS DISTINCT FROM NEW.bond_amount THEN
      changes_array := changes_array || jsonb_build_object('field', 'bond_amount', 'label', 'Bond Amount', 'old', OLD.bond_amount, 'new', NEW.bond_amount);
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

