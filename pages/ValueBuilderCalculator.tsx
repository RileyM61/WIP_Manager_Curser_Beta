import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase/client';

// ============================================================================
// VALUE BUILDER CALCULATOR
// Free calculator with email gate - lead generation tool
// ============================================================================

interface CalculatorInputs {
  companyName: string;
  annualRevenue: number;
  netProfit: number;
  ownerCompensation: number;
  depreciation: number;
  interest: number;
  taxes: number;
  otherAddbacks: number;
  multiple: number;
}

interface CalculatorResults {
  adjustedEbitda: number;
  businessValue: number;
  valuePercentOfRevenue: number;
}

// Email gate form state
interface EmailFormData {
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  phone: string;
  annualRevenue: string;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// ============================================================================
// EMAIL GATE COMPONENT
// ============================================================================
const EmailGate: React.FC<{
  onSubmit: (data: EmailFormData) => void;
  isSubmitting: boolean;
}> = ({ onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState<EmailFormData>({
    email: '',
    firstName: '',
    lastName: '',
    companyName: '',
    phone: '',
    annualRevenue: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Almost There!</h2>
        <p className="text-slate-400">
          Enter your details to unlock your free business valuation calculator.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">First Name *</label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
              placeholder="John"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Last Name *</label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
              placeholder="Smith"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Work Email *</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
            placeholder="john@yourcompany.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Company Name *</label>
          <input
            type="text"
            required
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
            placeholder="Smith Construction LLC"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Phone (Optional)</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Annual Revenue *</label>
          <select
            required
            value={formData.annualRevenue}
            onChange={(e) => setFormData({ ...formData, annualRevenue: e.target.value })}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
          >
            <option value="">Select your revenue range</option>
            <option value="under-1m">Under $1 million</option>
            <option value="1m-5m">$1M - $5M</option>
            <option value="5m-10m">$5M - $10M</option>
            <option value="10m-25m">$10M - $25M</option>
            <option value="25m-50m">$25M - $50M</option>
            <option value="50m-100m">$50M - $100M</option>
            <option value="over-100m">Over $100M</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold text-lg rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : (
            'Unlock Free Calculator →'
          )}
        </button>

        <p className="text-center text-xs text-slate-500 mt-4">
          By submitting, you agree to receive occasional emails about ChainLink CFO. 
          You can unsubscribe anytime.
        </p>
      </form>
    </div>
  );
};

// ============================================================================
// CALCULATOR INPUT COMPONENT
// ============================================================================
const CurrencyInput: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  tooltip?: string;
  placeholder?: string;
}> = ({ label, value, onChange, tooltip, placeholder }) => {
  const [displayValue, setDisplayValue] = useState(value ? formatNumber(value) : '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.-]/g, '');
    const num = parseFloat(raw) || 0;
    setDisplayValue(raw);
    onChange(num);
  };

  const handleBlur = () => {
    if (value) {
      setDisplayValue(formatNumber(value));
    }
  };

  const handleFocus = () => {
    if (value) {
      setDisplayValue(value.toString());
    }
  };

  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1">
        {label}
        {tooltip && (
          <span className="group relative cursor-help">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              {tooltip}
            </span>
          </span>
        )}
      </label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder || '0'}
          className="w-full pl-8 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
        />
      </div>
    </div>
  );
};

// ============================================================================
// MULTIPLE SLIDER COMPONENT
// ============================================================================
const MultipleSlider: React.FC<{
  value: number;
  onChange: (value: number) => void;
}> = ({ value, onChange }) => {
  const getMultipleDescription = (m: number): string => {
    if (m < 2.5) return 'Small company, project-based';
    if (m < 3.5) return 'Growing company, good systems';
    if (m < 4.5) return 'Established, repeat customers';
    if (m < 5.5) return 'Market leader, diversified';
    return 'Premium brand, exceptional growth';
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <label className="text-sm font-medium text-slate-300">EBITDA Multiple</label>
        <span className="text-2xl font-bold text-emerald-400">{value.toFixed(1)}x</span>
      </div>
      <input
        type="range"
        min="1.5"
        max="7"
        step="0.1"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
      />
      <div className="flex justify-between text-xs text-slate-500 mt-2">
        <span>1.5x</span>
        <span>7.0x</span>
      </div>
      <p className="text-sm text-emerald-300 mt-3 text-center font-medium">{getMultipleDescription(value)}</p>
    </div>
  );
};

// ============================================================================
// RESULTS DISPLAY COMPONENT
// ============================================================================
const ResultsDisplay: React.FC<{
  results: CalculatorResults;
  inputs: CalculatorInputs;
}> = ({ results, inputs }) => {
  return (
    <div className="space-y-6">
      {/* Main Value Card */}
      <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-2 border-emerald-500/50 rounded-2xl p-8 text-center">
        <p className="text-emerald-400 text-sm uppercase tracking-wide mb-2">Estimated Business Value</p>
        <p className="text-5xl md:text-6xl font-bold text-white mb-2">
          {formatCurrency(results.businessValue)}
        </p>
        <p className="text-slate-400">
          {results.valuePercentOfRevenue.toFixed(0)}% of annual revenue
        </p>
      </div>

      {/* Breakdown */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Calculation Breakdown</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-slate-700">
            <span className="text-slate-400">Net Profit</span>
            <span className="text-white">{formatCurrency(inputs.netProfit)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-700">
            <span className="text-slate-400">+ Owner Compensation Adjustments</span>
            <span className="text-white">{formatCurrency(inputs.ownerCompensation)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-700">
            <span className="text-slate-400">+ Depreciation</span>
            <span className="text-white">{formatCurrency(inputs.depreciation)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-700">
            <span className="text-slate-400">+ Interest</span>
            <span className="text-white">{formatCurrency(inputs.interest)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-700">
            <span className="text-slate-400">+ Taxes</span>
            <span className="text-white">{formatCurrency(inputs.taxes)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-700">
            <span className="text-slate-400">+ Other Add-backs</span>
            <span className="text-white">{formatCurrency(inputs.otherAddbacks)}</span>
          </div>
          <div className="flex justify-between py-3 bg-emerald-500/10 rounded-lg px-3 -mx-3">
            <span className="text-emerald-400 font-semibold">Adjusted EBITDA</span>
            <span className="text-emerald-400 font-semibold">{formatCurrency(results.adjustedEbitda)}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-400">× Multiple</span>
            <span className="text-white">{inputs.multiple.toFixed(1)}x</span>
          </div>
        </div>
      </div>

      {/* Formula Recap */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center">
        <div className="flex flex-wrap items-center justify-center gap-3 text-lg">
          <span className="text-emerald-400 font-semibold">{formatCurrency(results.adjustedEbitda)}</span>
          <span className="text-slate-500">×</span>
          <span className="text-emerald-400 font-semibold">{inputs.multiple.toFixed(1)}x</span>
          <span className="text-slate-500">=</span>
          <span className="text-2xl text-white font-bold">{formatCurrency(results.businessValue)}</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN CALCULATOR PAGE COMPONENT
// ============================================================================
const ValueBuilderCalculator: React.FC = () => {
  const navigate = useNavigate();
  const [isEmailGated, setIsEmailGated] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  
  // Calculator inputs
  const [inputs, setInputs] = useState<CalculatorInputs>({
    companyName: '',
    annualRevenue: 0,
    netProfit: 0,
    ownerCompensation: 0,
    depreciation: 0,
    interest: 0,
    taxes: 0,
    otherAddbacks: 0,
    multiple: 3.0,
  });

  // Calculate results
  const calculateResults = (): CalculatorResults => {
    const adjustedEbitda = 
      inputs.netProfit + 
      inputs.ownerCompensation + 
      inputs.depreciation + 
      inputs.interest + 
      inputs.taxes + 
      inputs.otherAddbacks;
    
    const businessValue = adjustedEbitda * inputs.multiple;
    const valuePercentOfRevenue = inputs.annualRevenue > 0 
      ? (businessValue / inputs.annualRevenue) * 100 
      : 0;

    return {
      adjustedEbitda,
      businessValue,
      valuePercentOfRevenue,
    };
  };

  const results = calculateResults();

  // Handle email form submission
  const handleEmailSubmit = async (emailData: EmailFormData) => {
    setIsSubmitting(true);
    
    try {
      // Save lead to database
      const { data, error } = await supabase
        .from('value_builder_leads')
        .insert([{
          email: emailData.email,
          first_name: emailData.firstName,
          last_name: emailData.lastName,
          company_name: emailData.companyName,
          phone: emailData.phone || null,
          annual_revenue_range: emailData.annualRevenue,
          source: 'value-builder-calculator',
        }])
        .select()
        .single();

      if (error) {
        console.error('Error saving lead:', error);
        // Still let them through even if DB fails
      } else if (data) {
        setLeadId(data.id);
      }

      // Update company name in inputs
      setInputs(prev => ({ ...prev, companyName: emailData.companyName }));
      
      // Unlock the calculator
      setIsEmailGated(false);
      
      // Send notification email (fire and forget)
      try {
        await supabase.functions.invoke('send-value-builder-lead', {
          body: JSON.stringify(emailData),
        });
      } catch (emailErr) {
        console.log('Email notification failed (non-critical):', emailErr);
      }
    } catch (err) {
      console.error('Error:', err);
      // Still let them through
      setIsEmailGated(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save calculation to lead record
  const saveCalculation = async () => {
    if (!leadId) return;
    
    try {
      await supabase
        .from('value_builder_leads')
        .update({
          calculated_ebitda: results.adjustedEbitda,
          calculated_value: results.businessValue,
          multiple_used: inputs.multiple,
          last_calculated_at: new Date().toISOString(),
        })
        .eq('id', leadId);
    } catch (err) {
      console.error('Error saving calculation:', err);
    }
  };

  // Auto-save calculation when results change significantly
  useEffect(() => {
    if (leadId && results.businessValue > 0) {
      const timer = setTimeout(saveCalculation, 2000);
      return () => clearTimeout(timer);
    }
  }, [results.businessValue, inputs.multiple, leadId]);

  return (
    <div className="bg-slate-950 text-white min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-wip-gold to-wip-gold-dark flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">
              ChainLink<span className="text-orange-400">CFO</span>
            </span>
          </a>
          
          <div className="flex items-center gap-4">
            <a
              href="/value-builder"
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              ← Back
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {isEmailGated ? (
          /* Email Gate */
          <div className="min-h-[60vh] flex items-center justify-center">
            <EmailGate onSubmit={handleEmailSubmit} isSubmitting={isSubmitting} />
          </div>
        ) : (
          /* Calculator */
          <div>
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Business Value Calculator
              </h1>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Enter your financial data below to calculate your business value. 
                Adjust the multiple slider to see different scenarios.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Inputs Column */}
              <div className="space-y-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm">1</span>
                    Revenue & Profit
                  </h2>
                  <div className="space-y-4">
                    <CurrencyInput
                      label="Annual Revenue"
                      value={inputs.annualRevenue}
                      onChange={(v) => setInputs({ ...inputs, annualRevenue: v })}
                      tooltip="Your total annual sales/revenue"
                    />
                    <CurrencyInput
                      label="Net Profit (After Tax)"
                      value={inputs.netProfit}
                      onChange={(v) => setInputs({ ...inputs, netProfit: v })}
                      tooltip="Bottom line profit from your P&L"
                    />
                  </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm">2</span>
                    EBITDA Add-backs
                  </h2>
                  <div className="space-y-4">
                    <CurrencyInput
                      label="Owner Compensation Adjustments"
                      value={inputs.ownerCompensation}
                      onChange={(v) => setInputs({ ...inputs, ownerCompensation: v })}
                      tooltip="Excess salary, personal expenses run through business"
                    />
                    <CurrencyInput
                      label="Depreciation & Amortization"
                      value={inputs.depreciation}
                      onChange={(v) => setInputs({ ...inputs, depreciation: v })}
                      tooltip="Non-cash expense from your tax return"
                    />
                    <CurrencyInput
                      label="Interest Expense"
                      value={inputs.interest}
                      onChange={(v) => setInputs({ ...inputs, interest: v })}
                      tooltip="Interest paid on loans and credit lines"
                    />
                    <CurrencyInput
                      label="Taxes Paid"
                      value={inputs.taxes}
                      onChange={(v) => setInputs({ ...inputs, taxes: v })}
                      tooltip="Income taxes paid by the business"
                    />
                    <CurrencyInput
                      label="Other One-time/Discretionary"
                      value={inputs.otherAddbacks}
                      onChange={(v) => setInputs({ ...inputs, otherAddbacks: v })}
                      tooltip="One-time expenses, personal vehicles, family payroll, etc."
                    />
                  </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm">3</span>
                    Valuation Multiple
                  </h2>
                  <MultipleSlider
                    value={inputs.multiple}
                    onChange={(v) => setInputs({ ...inputs, multiple: v })}
                  />
                </div>
              </div>

              {/* Results Column */}
              <div className="lg:sticky lg:top-8 h-fit">
                <ResultsDisplay results={results} inputs={inputs} />
                
                {/* CTA Section */}
                <div className="mt-8 bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700 rounded-2xl p-6 text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">Want to Increase Your Value?</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    ChainLink CFO's tools help you improve EBITDA and command higher multiples.
                  </p>
                  <a
                    href="/auth?mode=signup"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-wip-gold to-wip-gold-dark text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-wip-gold/30 transition-all"
                  >
                    Start Free Trial
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-500">
          <p>
            This calculator provides estimates for educational purposes only. 
            Actual business valuations depend on many factors and should be performed by qualified professionals.
          </p>
          <p className="mt-2">
            © {new Date().getFullYear()} ChainLink CFO. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ValueBuilderCalculator;

