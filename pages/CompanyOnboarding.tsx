import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const CompanyOnboarding: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const { data: company, error: companyError } = await supabase!
        .from('companies')
        .insert({
          name: companyName.trim(),
          owner_user_id: user.id,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Associate user with company before inserting other scoped data
      const { error: profileError } = await supabase!
        .from('profiles')
        .upsert({
          user_id: user.id,
          company_id: company.id,
          role: 'owner',
        });
      if (profileError) throw profileError;

      const { error: settingsError } = await supabase!
        .from('settings')
        .insert({
          company_id: company.id,
          company_name: companyName.trim(),
          project_managers: [],
          estimators: [],
          week_end_day: 'Friday',
          default_status: 'Future',
          default_role: 'owner',
          capacity_enabled: false,
          capacity_plan_id: null,
        });
      if (settingsError) throw settingsError;

      await refreshProfile();
    } catch (err: any) {
      console.error('[CompanyOnboarding] Error creating company', err);
      setError(err.message || 'Failed to create company. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur">
        <p className="text-sm uppercase tracking-[0.3em] text-orange-300">Onboarding</p>
        <h1 className="mt-4 text-3xl font-semibold">Create your company workspace</h1>
        <p className="mt-2 text-sm text-white/70">
          We’ll set up your default financial settings. You can enable staffing capacity tracking later from Settings.
        </p>
        <form className="mt-8 space-y-5" onSubmit={handleCreateCompany}>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-300">
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-orange-400 focus:outline-none"
              placeholder="e.g. Skyline Constructors"
            />
          </div>
          {error && (
            <div className="rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-orange-500 py-3 text-base font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Setting up your workspace...' : 'Create Company'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompanyOnboarding;

