import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CFOProApplicationForm from '../components/forms/CFOProApplicationForm';

// ============================================================================
// PROCESS STEP COMPONENT
// ============================================================================
const ProcessStep: React.FC<{
  number: string;
  title: string;
  description: string;
}> = ({ number, title, description }) => (
  <div className="flex gap-6">
    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-orange-500/30">
      {number}
    </div>
    <div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  </div>
);

// ============================================================================
// FEATURE CARD COMPONENT
// ============================================================================
const FeatureCard: React.FC<{
  icon: string;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-orange-500/30 transition-all duration-300">
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
    <p className="text-slate-400 text-sm">{description}</p>
  </div>
);

// ============================================================================
// MAIN CFO PRO PAGE
// ============================================================================
const CFOProPage: React.FC = () => {
  const navigate = useNavigate();
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  const features = [
    {
      icon: '🎯',
      title: 'Personal CFO Discovery Interview',
      description: 'A deep-dive session with our CFO team to understand your business, challenges, and goals. We learn how you operate so we can configure everything perfectly.',
    },
    {
      icon: '⚙️',
      title: 'Custom Tool Configuration',
      description: 'We set up all your modules, import your data, configure your job structures, and customize dashboards to match exactly how you run your business.',
    },
    {
      icon: '🎓',
      title: 'Hands-On Team Onboarding',
      description: 'Live training sessions for your PMs, estimators, and leadership. Everyone learns the system and understands how to use it effectively from day one.',
    },
    {
      icon: '📈',
      title: 'Ongoing Success Management',
      description: 'Regular check-ins to review your data, identify insights, and optimize your processes. We help you get maximum value from the platform.',
    },
    {
      icon: '👤',
      title: 'Dedicated CFO Advisor',
      description: 'Your own CFO expert who knows your business inside and out. Direct access for questions, strategic advice, and financial guidance.',
    },
    {
      icon: '📞',
      title: 'Priority Support',
      description: 'Skip the queue. When you need help, you get it immediately. Phone, email, or video—whatever works best for you.',
    },
  ];

  const processSteps = [
    {
      number: '1',
      title: 'Apply',
      description: 'Tell us about your company and what you\'re looking to achieve. We review every application personally.',
    },
    {
      number: '2',
      title: 'Discovery Call',
      description: 'A 60-minute deep dive with our CFO team. We learn your business, your pain points, and your goals.',
    },
    {
      number: '3',
      title: 'Custom Setup',
      description: 'We configure the entire platform for you—jobs, cost codes, team members, dashboards, everything.',
    },
    {
      number: '4',
      title: 'Team Onboarding',
      description: 'Live training for your entire team. PMs learn their workflows, leadership learns the insights.',
    },
    {
      number: '5',
      title: 'Ongoing Partnership',
      description: 'Regular check-ins, continuous optimization, and your CFO advisor on call whenever you need guidance.',
    },
  ];

  const idealFor = [
    'Contractors ready to professionalize their financial operations',
    'Companies tired of spreadsheet chaos and month-end surprises',
    'Leadership teams who want expert guidance, not DIY software',
    'Businesses that value their time more than learning new tools',
    'GCs who want a true CFO partner, not just another app',
  ];

  return (
    <div className="bg-slate-950 text-white min-h-screen">
      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(249, 115, 22, 0.3); }
          50% { box-shadow: 0 0 40px rgba(249, 115, 22, 0.5); }
        }
      `}</style>

      {/* ================================================================== */}
      {/* NAVIGATION */}
      {/* ================================================================== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white hover:text-orange-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Back to ChainLink CFO</span>
          </button>
          <button
            onClick={() => setShowApplicationForm(true)}
            className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all"
          >
            Apply Now
          </button>
        </div>
      </nav>

      {/* ================================================================== */}
      {/* HERO SECTION */}
      {/* ================================================================== */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,_rgba(249,115,22,0.3),_transparent_50%)]" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_70%_80%,_rgba(59,130,246,0.2),_transparent_50%)]" />

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-1.5 mb-8">
            <span className="text-2xl">👔</span>
            <span className="text-sm text-orange-300 font-semibold uppercase tracking-wide">Premium Service</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            ChainLink CFO{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
              Pro
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            White-glove CFO services for contractors who want it done right. 
            We set up everything, train your team, and partner with you for ongoing success.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => setShowApplicationForm(true)}
              className="group relative px-10 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-lg rounded-xl shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all hover:scale-105"
              style={{ animation: 'pulse-glow 3s ease-in-out infinite' }}
            >
              Apply Now
              <span className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <a
              href="#how-it-works"
              className="px-10 py-4 border-2 border-slate-600 text-slate-300 font-semibold text-lg rounded-xl hover:border-slate-400 hover:text-white transition-all"
            >
              See How It Works
            </a>
          </div>

          {/* Pricing Pills */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-3">
              <p className="text-sm text-slate-400">Setup Fee</p>
              <p className="text-2xl font-bold text-white">$5,000</p>
            </div>
            <div className="text-slate-500 text-2xl hidden sm:block">+</div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-3">
              <p className="text-sm text-slate-400">Monthly</p>
              <p className="text-2xl font-bold text-white">$2,500<span className="text-sm font-normal text-slate-400">/mo</span></p>
            </div>
            <div className="text-slate-500 text-sm sm:ml-4">Cancel anytime</div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* WHAT'S INCLUDED SECTION */}
      {/* ================================================================== */}
      <section className="py-24 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-400">
              What's Included
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-white">
              Everything You Need to Succeed
            </h2>
            <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
              We don't just give you software—we partner with you to transform your financial operations.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* HOW IT WORKS SECTION */}
      {/* ================================================================== */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-400">
              The Process
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-white">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
              From application to ongoing partnership—here's what to expect.
            </p>
          </div>

          <div className="space-y-12">
            {processSteps.map((step) => (
              <ProcessStep key={step.number} {...step} />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* WHO IT'S FOR SECTION */}
      {/* ================================================================== */}
      <section className="py-24 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-400">
              Is This Right For You?
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-white">
              CFO Pro is Perfect For...
            </h2>
          </div>

          <div className="space-y-4">
            {idealFor.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-5"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-lg text-slate-200">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* PRICING CTA SECTION */}
      {/* ================================================================== */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_rgba(249,115,22,0.3),_transparent_60%)]" />
        
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Financial Operations?
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Apply now and let's discuss how CFO Pro can help your construction company thrive.
          </p>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-orange-500 rounded-2xl p-8 max-w-md mx-auto mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-sm text-slate-400">Setup Fee</p>
                <p className="text-3xl font-bold text-white">$5,000</p>
              </div>
              <div className="text-2xl text-slate-500">+</div>
              <div>
                <p className="text-sm text-slate-400">Monthly</p>
                <p className="text-3xl font-bold text-white">$2,500</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-6">Cancel anytime. No long-term contracts.</p>
            <button
              onClick={() => setShowApplicationForm(true)}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-lg rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all"
            >
              Apply Now
            </button>
          </div>

          <p className="text-slate-500 text-sm">
            Have questions? Email us at{' '}
            <a href="mailto:pro@chainlinkcfo.com" className="text-orange-400 hover:underline">
              pro@chainlinkcfo.com
            </a>
          </p>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FOOTER */}
      {/* ================================================================== */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="font-bold">ChainLink<span className="text-orange-400">CFO</span></span>
          </button>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} ChainLink CFO. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ================================================================== */}
      {/* APPLICATION FORM MODAL */}
      {/* ================================================================== */}
      {showApplicationForm && (
        <CFOProApplicationForm onClose={() => setShowApplicationForm(false)} />
      )}
    </div>
  );
};

export default CFOProPage;

