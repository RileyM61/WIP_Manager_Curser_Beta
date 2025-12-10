import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { IndustryType, RevenueRange, EmployeeRange, ServicePreference } from '../types';
import { ModuleId, MODULES, ALL_MODULE_IDS } from '../types/modules';

// ============================================================================
// TYPES
// ============================================================================

interface OnboardingData {
  companyName: string;
  industry: IndustryType | '';
  annualRevenueRange: RevenueRange | '';
  employeeCountRange: EmployeeRange | '';
  interestedModules: ModuleId[];
  servicePreference: ServicePreference | '';
}

type Step = 1 | 2 | 3;

// ============================================================================
// CONSTANTS
// ============================================================================

const INDUSTRIES: { value: IndustryType; label: string; icon: string }[] = [
  { value: 'Construction', label: 'Construction', icon: '🏗️' },
  { value: 'Manufacturing', label: 'Manufacturing', icon: '🏭' },
  { value: 'Professional Services', label: 'Professional Services', icon: '💼' },
  { value: 'Retail', label: 'Retail', icon: '🏪' },
  { value: 'Healthcare', label: 'Healthcare', icon: '🏥' },
  { value: 'Technology', label: 'Technology', icon: '💻' },
  { value: 'Other', label: 'Other', icon: '📦' },
];

const REVENUE_RANGES: { value: RevenueRange; label: string }[] = [
  { value: 'Under $1M', label: 'Under $1M' },
  { value: '$1M-$5M', label: '$1M - $5M' },
  { value: '$5M-$10M', label: '$5M - $10M' },
  { value: '$10M-$25M', label: '$10M - $25M' },
  { value: '$25M-$50M', label: '$25M - $50M' },
  { value: '$50M+', label: '$50M+' },
];

const EMPLOYEE_RANGES: { value: EmployeeRange; label: string }[] = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-25', label: '11-25 employees' },
  { value: '26-50', label: '26-50 employees' },
  { value: '51-100', label: '51-100 employees' },
  { value: '100+', label: '100+ employees' },
];

// Only show active modules for interest selection
const AVAILABLE_MODULES = ALL_MODULE_IDS.filter(id => !MODULES[id].comingSoon);

// ============================================================================
// SELECTION CARD COMPONENT
// ============================================================================

interface SelectionCardProps {
  selected: boolean;
  onClick: () => void;
  icon?: string;
  title: string;
  subtitle?: string;
  disabled?: boolean;
}

const SelectionCard: React.FC<SelectionCardProps> = ({
  selected,
  onClick,
  icon,
  title,
  subtitle,
  disabled
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`
      w-full p-4 rounded-xl border-2 text-left transition-all
      ${selected
        ? 'border-orange-500 bg-orange-500/10'
        : 'border-white/10 bg-white/5 hover:border-white/30'
      }
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    <div className="flex items-center gap-3">
      {icon && <span className="text-2xl">{icon}</span>}
      <div>
        <p className={`font-medium ${selected ? 'text-orange-300' : 'text-white'}`}>{title}</p>
        {subtitle && <p className="text-sm text-white/60">{subtitle}</p>}
      </div>
      {selected && (
        <div className="ml-auto">
          <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  </button>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CompanyOnboarding: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    companyName: '',
    industry: '',
    annualRevenueRange: '',
    employeeCountRange: '',
    interestedModules: [],
    servicePreference: '',
  });

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const toggleModule = (moduleId: ModuleId) => {
    setData(prev => ({
      ...prev,
      interestedModules: prev.interestedModules.includes(moduleId)
        ? prev.interestedModules.filter(id => id !== moduleId)
        : [...prev.interestedModules, moduleId]
    }));
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return data.companyName.trim().length > 0 && data.industry !== '';
      case 2:
        return data.annualRevenueRange !== '' && data.employeeCountRange !== '';
      case 3:
        return data.servicePreference !== '' && acceptedTerms;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep((step + 1) as Step);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      // Create company
      const { data: company, error: companyError } = await supabase!
        .from('companies')
        .insert({
          name: data.companyName.trim(),
          owner_user_id: user.id,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Associate user with company
      const { error: profileError } = await supabase!
        .from('profiles')
        .upsert({
          user_id: user.id,
          company_id: company.id,
          role: 'owner',
        });
      if (profileError) throw profileError;

      // Create settings with all onboarding data
      const { error: settingsError } = await supabase!
        .from('settings')
        .insert({
          company_id: company.id,
          company_name: data.companyName.trim(),
          project_managers: [],
          estimators: [],
          week_end_day: 'Friday',
          default_status: 'Future',
          default_role: 'owner',
          capacity_enabled: false,
          capacity_plan_id: null,
          // New onboarding fields
          industry: data.industry || null,
          annual_revenue_range: data.annualRevenueRange || null,
          employee_count_range: data.employeeCountRange || null,
          interested_modules: data.interestedModules.length > 0 ? data.interestedModules : null,
          service_preference: data.servicePreference || null,
          // Set company type based on service preference
          company_type: data.servicePreference === 'cfo-managed' ? 'managed' : 'direct',
        });
      if (settingsError) throw settingsError;

      await refreshProfile();
    } catch (err: any) {
      console.error('[CompanyOnboarding] Error creating company', err);
      setError(err.message || 'Failed to create company. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="/images/chainlink-cfo-logo.png"
            alt="ChainLink CFO"
            className="h-80 w-auto mx-auto mb-6"
          />
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-4">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-sm text-orange-300 font-medium">Step {step} of 3</span>
          </div>
          <h1 className="text-3xl font-bold">
            {step === 1 && 'Tell us about your company'}
            {step === 2 && 'Company size'}
            {step === 3 && 'How can we help?'}
          </h1>
          <p className="text-white/60 mt-2">
            {step === 1 && 'This helps us customize your experience'}
            {step === 2 && "We'll recommend the right tools for your business"}
            {step === 3 && 'Choose your preferred way to work with us'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-all ${s <= step ? 'bg-orange-500' : 'bg-white/10'
                }`}
            />
          ))}
        </div>

        {/* Form Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          {/* Step 1: Company Basics */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={data.companyName}
                  onChange={(e) => updateData({ companyName: e.target.value })}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-orange-400 focus:outline-none"
                  placeholder="e.g. Skyline Constructors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300 mb-3">
                  Industry
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {INDUSTRIES.map(ind => (
                    <SelectionCard
                      key={ind.value}
                      selected={data.industry === ind.value}
                      onClick={() => updateData({ industry: ind.value })}
                      icon={ind.icon}
                      title={ind.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Company Size */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300 mb-3">
                  Annual Revenue
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {REVENUE_RANGES.map(range => (
                    <SelectionCard
                      key={range.value}
                      selected={data.annualRevenueRange === range.value}
                      onClick={() => updateData({ annualRevenueRange: range.value })}
                      icon="💰"
                      title={range.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300 mb-3">
                  Team Size
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {EMPLOYEE_RANGES.map(range => (
                    <SelectionCard
                      key={range.value}
                      selected={data.employeeCountRange === range.value}
                      onClick={() => updateData({ employeeCountRange: range.value })}
                      icon="👥"
                      title={range.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Service Preference & Modules */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300 mb-3">
                  How would you like to work with us?
                </label>
                <div className="space-y-3">
                  <SelectionCard
                    selected={data.servicePreference === 'self-service'}
                    onClick={() => updateData({ servicePreference: 'self-service' })}
                    icon="🚀"
                    title="Self-Service"
                    subtitle="I'll manage my own financial tools and dashboards"
                  />
                  <SelectionCard
                    selected={data.servicePreference === 'cfo-managed'}
                    onClick={() => updateData({ servicePreference: 'cfo-managed' })}
                    icon="🤝"
                    title="CFO-Managed"
                    subtitle="I'd like a fractional CFO to help set up and manage my financials"
                  />
                </div>
              </div>


            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating workspace...
                  </>
                ) : (
                  <>
                    Create Workspace
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex flex-col items-center gap-4">
          <label className="flex items-start gap-3 cursor-pointer group text-left">
            <div className="relative flex items-center pt-0.5">
              <input
                type="checkbox"
                required
                className="peer sr-only"
                checked={acceptedTerms === true}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <div className="h-5 w-5 rounded border-2 border-slate-400 bg-transparent transition-all peer-checked:border-orange-500 peer-checked:bg-orange-500 hover:border-orange-400">
                <svg className="h-full w-full stroke-white p-0.5 opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
            </div>
            <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
              I agree to the{' '}
              <Link to="/legal/terms" target="_blank" className="font-semibold text-orange-400 hover:text-orange-300 hover:underline">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link to="/legal/privacy" target="_blank" className="font-semibold text-orange-400 hover:text-orange-300 hover:underline">
                Privacy Policy
              </Link>
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default CompanyOnboarding;
