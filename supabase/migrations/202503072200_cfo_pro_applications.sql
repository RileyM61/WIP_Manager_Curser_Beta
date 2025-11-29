-- Migration: CFO Pro Applications Table
-- Description: Store applications for the ChainLink CFO Pro premium service

-- Create the cfo_pro_applications table
CREATE TABLE IF NOT EXISTS cfo_pro_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  annual_revenue TEXT NOT NULL,
  active_jobs TEXT NOT NULL,
  challenges TEXT NOT NULL,
  referral_source TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'declined')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  contacted_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cfo_pro_applications_status ON cfo_pro_applications(status);
CREATE INDEX IF NOT EXISTS idx_cfo_pro_applications_created_at ON cfo_pro_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cfo_pro_applications_email ON cfo_pro_applications(email);

-- Enable RLS
ALTER TABLE cfo_pro_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Allow inserts from anyone (public applications)
CREATE POLICY "Anyone can submit CFO Pro applications"
  ON cfo_pro_applications
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Only authenticated admins can view applications
-- For now, we'll allow service_role to access everything
-- You can create an admin role later for dashboard access

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_cfo_pro_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cfo_pro_applications_timestamp
  BEFORE UPDATE ON cfo_pro_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_cfo_pro_applications_updated_at();

-- Add comment for documentation
COMMENT ON TABLE cfo_pro_applications IS 'Applications for the ChainLink CFO Pro premium service';

