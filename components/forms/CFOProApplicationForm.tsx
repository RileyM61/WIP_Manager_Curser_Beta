import React, { useState } from 'react';
import { supabase } from '../../lib/supabase/client';

interface CFOProApplicationFormProps {
  onClose: () => void;
}

interface FormData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  annualRevenue: string;
  activeJobs: string;
  challenges: string;
  referralSource: string;
}

const initialFormData: FormData = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  annualRevenue: '',
  activeJobs: '',
  challenges: '',
  referralSource: '',
};

const CFOProApplicationForm: React.FC<CFOProApplicationFormProps> = ({ onClose }) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Save to Supabase
      const { error: dbError } = await supabase
        .from('cfo_pro_applications')
        .insert([
          {
            company_name: formData.companyName,
            contact_name: formData.contactName,
            email: formData.email,
            phone: formData.phone,
            annual_revenue: formData.annualRevenue,
            active_jobs: formData.activeJobs,
            challenges: formData.challenges,
            referral_source: formData.referralSource,
            status: 'new',
            created_at: new Date().toISOString(),
          },
        ]);

      if (dbError) {
        console.error('Database error:', dbError);
        // Continue anyway - we'll still try to send email
      }

      // 2. Send email notification via Edge Function (if configured)
      try {
        await supabase.functions.invoke('send-cfo-pro-application', {
          body: {
            companyName: formData.companyName,
            contactName: formData.contactName,
            email: formData.email,
            phone: formData.phone,
            annualRevenue: formData.annualRevenue,
            activeJobs: formData.activeJobs,
            challenges: formData.challenges,
            referralSource: formData.referralSource,
          },
        });
      } catch (emailError) {
        console.log('Email function not configured yet - application still saved');
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting application:', err);
      setError('There was an error submitting your application. Please try again or email us directly at pro@chainlinkcfo.com');
    } finally {
      setIsSubmitting(false);
    }
  };

  const revenueOptions = [
    { value: '', label: 'Select annual revenue...' },
    { value: 'under-1m', label: 'Under $1 million' },
    { value: '1m-5m', label: '$1M - $5M' },
    { value: '5m-10m', label: '$5M - $10M' },
    { value: '10m-25m', label: '$10M - $25M' },
    { value: '25m-50m', label: '$25M - $50M' },
    { value: '50m-100m', label: '$50M - $100M' },
    { value: 'over-100m', label: 'Over $100M' },
  ];

  const jobsOptions = [
    { value: '', label: 'Select number of jobs...' },
    { value: '1-5', label: '1-5 active jobs' },
    { value: '6-15', label: '6-15 active jobs' },
    { value: '16-30', label: '16-30 active jobs' },
    { value: '31-50', label: '31-50 active jobs' },
    { value: 'over-50', label: '50+ active jobs' },
  ];

  const referralOptions = [
    { value: '', label: 'How did you hear about us?' },
    { value: 'google', label: 'Google search' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'referral', label: 'Referral from someone' },
    { value: 'conference', label: 'Conference or event' },
    { value: 'podcast', label: 'Podcast' },
    { value: 'other', label: 'Other' },
  ];

  // Success State
  if (isSubmitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Application Received!</h2>
          <p className="text-slate-400 mb-6">
            Thank you for your interest in ChainLink CFO Pro. Our team will review your application and reach out within 1-2 business days.
          </p>
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            Got It
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Apply for CFO Pro</h2>
            <p className="text-slate-400 text-sm mt-1">Tell us about your company</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Company & Contact */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-slate-300 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                placeholder="Your Company Inc."
              />
            </div>
            <div>
              <label htmlFor="contactName" className="block text-sm font-medium text-slate-300 mb-2">
                Your Name *
              </label>
              <input
                type="text"
                id="contactName"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                placeholder="John Smith"
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                placeholder="john@company.com"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-2">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          {/* Revenue & Jobs */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="annualRevenue" className="block text-sm font-medium text-slate-300 mb-2">
                Annual Revenue *
              </label>
              <select
                id="annualRevenue"
                name="annualRevenue"
                value={formData.annualRevenue}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              >
                {revenueOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="activeJobs" className="block text-sm font-medium text-slate-300 mb-2">
                Active Jobs *
              </label>
              <select
                id="activeJobs"
                name="activeJobs"
                value={formData.activeJobs}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              >
                {jobsOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Challenges */}
          <div>
            <label htmlFor="challenges" className="block text-sm font-medium text-slate-300 mb-2">
              What challenges are you facing? *
            </label>
            <textarea
              id="challenges"
              name="challenges"
              value={formData.challenges}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none"
              placeholder="Tell us about your current pain points with job costing, WIP, cash flow, or financial visibility..."
            />
          </div>

          {/* Referral Source */}
          <div>
            <label htmlFor="referralSource" className="block text-sm font-medium text-slate-300 mb-2">
              How did you hear about us?
            </label>
            <select
              id="referralSource"
              name="referralSource"
              value={formData.referralSource}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            >
              {referralOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-600 text-slate-300 font-semibold rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CFOProApplicationForm;

