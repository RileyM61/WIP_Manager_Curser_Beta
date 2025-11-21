<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1gU5wW34LSWNtSziHM2nyJQgovVMBt5yH

## Run Locally

**Prerequisites:**  Node.js, Supabase project

1. Install dependencies  
   `npm install`
2. Copy `.env.local.example` to `.env.local` and configure
   - `GEMINI_API_KEY`
   - `VITE_SUPABASE_URL` (e.g. `https://xzmzsutxmvwcqpjjoapc.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY` (anon/public key from Supabase dashboard)
3. Apply the Supabase migrations  
   - `supabase/migrations/202503071200_multi_tenant.sql` (multi-company auth & RLS)  
   - `supabase/migrations/202503071330_capacity_optional.sql` (capacity toggle + unique settings per company)
4. Seed the default capacity plan + settings (only needed once)  
   - Use the seed snippet from the docs/assistant conversation or create a company via the onboarding screen after auth.
5. Enable email/password auth in Supabase (Authentication → Providers) so users can sign up and log in.
6. Run the dev server  
   `npm run dev`

## Authentication & Multi-company flow

- Visit `/auth` to sign up or log in. New accounts must confirm via email (per Supabase settings).
- After logging in the first time, you’ll be prompted to name your company. This creates a tenant plus default settings/capacity plan tied to your user.
- Every table row is now scoped by `company_id`. Users can only read/write data for the company referenced in their `profiles` row.
- Use the “Sign Out” button in the header to switch accounts.
- Staffing capacity planning is optional. In Settings, toggle “Staffing Capacity Tracking” on to generate (or reuse) a capacity plan and unlock the Manage Capacity UI in the company view. When the toggle is off, all capacity widgets stay hidden.
