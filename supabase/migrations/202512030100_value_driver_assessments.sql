-- Value Driver Assessments Table
-- Stores questionnaire answers and strategic recommendations for value builder module

CREATE TABLE IF NOT EXISTS public.value_driver_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  valuation_id UUID, -- Optional reference to valuation (no FK constraint if table doesn't exist)
  answers JSONB NOT NULL, -- Store questionnaire answers {questionId: answerValue}
  scores JSONB NOT NULL, -- Store calculated scores [{category, score, weight, impact}]
  overall_score DECIMAL(5,2) NOT NULL, -- Aggregate score from -2 to +2
  strengths TEXT[] NOT NULL DEFAULT '{}', -- Top 3 categories
  weaknesses TEXT[] NOT NULL DEFAULT '{}', -- Bottom 3 categories
  recommendations JSONB, -- Store strategic recommendations
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_value_driver_assessments_company ON public.value_driver_assessments(company_id);
CREATE INDEX IF NOT EXISTS idx_value_driver_assessments_valuation ON public.value_driver_assessments(valuation_id);
CREATE INDEX IF NOT EXISTS idx_value_driver_assessments_completed ON public.value_driver_assessments(completed_at DESC);

-- RLS Policies
ALTER TABLE public.value_driver_assessments ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be refined later when profiles/companies tables exist)
-- For now, allow authenticated users to manage their own assessments
-- You can update these policies later to match your multi-tenant structure

-- Policy: Authenticated users can view assessments
CREATE POLICY "Authenticated users can view assessments"
  ON public.value_driver_assessments
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can create assessments
CREATE POLICY "Authenticated users can create assessments"
  ON public.value_driver_assessments
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Authenticated users can update assessments
CREATE POLICY "Authenticated users can update assessments"
  ON public.value_driver_assessments
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can delete assessments
CREATE POLICY "Authenticated users can delete assessments"
  ON public.value_driver_assessments
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_value_driver_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_value_driver_assessments_updated_at
  BEFORE UPDATE ON public.value_driver_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_value_driver_assessments_updated_at();

