import React from 'react';
import { useNavigate } from 'react-router-dom';

// ============================================================================
// VALUE BUILDER LANDING PAGE
// Free calculator lead gen tool for "Think Like an Investor"
// ============================================================================

const ValueBuilderLanding: React.FC = () => {
  const navigate = useNavigate();

  const handleStartCalculator = () => {
    navigate('/value-builder/calculate');
  };

  return (
    <div className="bg-wip-dark text-wip-text min-h-screen overflow-hidden font-sans">
      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.3); }
          50% { box-shadow: 0 0 40px rgba(34, 197, 94, 0.5); }
        }
        @keyframes count-up {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* ================================================================== */}
      {/* HERO SECTION */}
      {/* ================================================================== */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-wip-navy via-wip-dark to-wip-navy" />
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_30%_20%,_rgba(34,197,94,0.15),_transparent_50%)]" />
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_70%_80%,_rgba(16,185,129,0.12),_transparent_50%)]" />
        
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `linear-gradient(rgba(34,197,94,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.15) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative mx-auto w-full max-w-7xl px-6 py-20 sm:px-8 md:px-10">
          {/* Navigation */}
          <nav className="absolute top-6 left-6 right-6 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-wip-gold to-wip-gold-dark flex items-center justify-center">
                <svg className="w-6 h-6 text-wip-card" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <span className="text-xl font-bold text-wip-heading">
                ChainLink<span className="text-wip-gold">CFO</span>
              </span>
            </a>
            <a
              href="/"
              className="text-wip-text hover:text-wip-heading transition-colors font-medium"
            >
              ← Back to Home
            </a>
          </nav>

          <div className="text-center mt-24 lg:mt-16">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-4 py-1.5 mb-8"
              style={{ animation: 'fadeSlideUp 0.6s ease-out' }}
            >
              <span className="text-lg">💡</span>
              <span className="text-sm text-emerald-600 font-medium">Free Business Valuation Calculator</span>
            </div>

            {/* Headline */}
            <h1
              className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mb-6 max-w-5xl mx-auto text-wip-heading"
              style={{ animation: 'fadeSlideUp 0.6s ease-out 100ms both' }}
            >
              What's Your Business{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600">
                Really Worth?
              </span>
            </h1>

            {/* Subheadline */}
            <p
              className="text-xl sm:text-2xl text-wip-text mb-4 max-w-3xl mx-auto leading-relaxed"
              style={{ animation: 'fadeSlideUp 0.6s ease-out 200ms both' }}
            >
              Think Like an Investor. Calculate your construction company's value 
              using Adjusted EBITDA × Multiple—the same formula private equity uses.
            </p>

            <p
              className="text-lg text-wip-muted mb-10 max-w-2xl mx-auto"
              style={{ animation: 'fadeSlideUp 0.6s ease-out 250ms both' }}
            >
              Free. No credit card. Instant results.
            </p>

            {/* CTA */}
            <div
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
              style={{ animation: 'fadeSlideUp 0.6s ease-out 300ms both' }}
            >
              <button
                onClick={handleStartCalculator}
                className="group relative px-12 py-5 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold text-xl rounded-xl shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all hover:scale-105"
                style={{ animation: 'pulse-glow 3s ease-in-out infinite' }}
              >
                Calculate My Value Now
                <span className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

            {/* Time indicator */}
            <p
              className="text-wip-muted text-sm flex items-center justify-center gap-2"
              style={{ animation: 'fadeSlideUp 0.6s ease-out 400ms both' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Takes about 2 minutes
            </p>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-wip-muted">
          <span className="text-xs uppercase tracking-widest">Learn More</span>
          <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* ================================================================== */}
      {/* THE FORMULA SECTION */}
      {/* ================================================================== */}
      <section className="py-24 bg-wip-card">
        <div className="mx-auto max-w-6xl px-6 sm:px-8 md:px-10">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
              The Formula
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-wip-heading">
              How Investors Value Your Business
            </h2>
            <p className="mt-4 text-lg text-wip-muted max-w-2xl mx-auto">
              Private equity firms and strategic buyers use a simple but powerful formula. 
              Now you can too.
            </p>
          </div>

          {/* Formula Display */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-wip-dark border-2 border-emerald-500/30 rounded-3xl p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-center">
                <div className="bg-emerald-500/15 rounded-2xl px-6 py-4 border border-emerald-500/30">
                  <p className="text-emerald-600 text-sm uppercase tracking-wide mb-1">Business Value</p>
                  <p className="text-4xl md:text-5xl font-bold text-wip-heading">$$$</p>
                </div>
                <span className="text-4xl text-wip-muted">=</span>
                <div className="bg-wip-navy rounded-2xl px-6 py-4 border border-wip-border">
                  <p className="text-wip-muted text-sm uppercase tracking-wide mb-1">Adjusted EBITDA</p>
                  <p className="text-3xl md:text-4xl font-bold text-wip-heading">$XXX,XXX</p>
                </div>
                <span className="text-4xl text-wip-muted">×</span>
                <div className="bg-wip-navy rounded-2xl px-6 py-4 border border-wip-border">
                  <p className="text-wip-muted text-sm uppercase tracking-wide mb-1">Multiple</p>
                  <p className="text-3xl md:text-4xl font-bold text-wip-heading">X.X</p>
                </div>
              </div>
            </div>
          </div>

          {/* What is Adjusted EBITDA */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-wip-dark border border-wip-border rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-wip-heading mb-4 flex items-center gap-3">
                <span className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-lg">📊</span>
                Adjusted EBITDA
              </h3>
              <p className="text-wip-muted mb-4">
                Your true operating profit, with add-backs for owner-specific expenses:
              </p>
              <ul className="space-y-2">
                {[
                  'Net Profit (your bottom line)',
                  '+ Owner compensation adjustments',
                  '+ Depreciation & Amortization',
                  '+ Interest expense',
                  '+ Taxes',
                  '+ One-time or personal expenses',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-wip-text">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-wip-dark border border-wip-border rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-wip-heading mb-4 flex items-center gap-3">
                <span className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-lg">📈</span>
                The Multiple
              </h3>
              <p className="text-wip-muted mb-4">
                Varies by company size, growth rate, and market conditions:
              </p>
              <div className="space-y-3">
                {[
                  { range: 'Under $5M revenue', multiple: '2.0x - 3.0x' },
                  { range: '$5M - $15M revenue', multiple: '2.5x - 4.0x' },
                  { range: '$15M - $50M revenue', multiple: '3.5x - 5.0x' },
                  { range: 'Over $50M revenue', multiple: '4.0x - 6.0x+' },
                ].map((tier, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-wip-navy rounded-lg">
                    <span className="text-wip-text">{tier.range}</span>
                    <span className="text-emerald-600 font-semibold">{tier.multiple}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* WHY IT MATTERS SECTION */}
      {/* ================================================================== */}
      <section className="py-24 bg-wip-dark">
        <div className="mx-auto max-w-6xl px-6 sm:px-8 md:px-10">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
              Why It Matters
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-wip-heading">
              Think Like an Investor
            </h2>
            <p className="mt-4 text-lg text-wip-muted max-w-2xl mx-auto">
              Your business is your biggest investment. Are you managing it that way?
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🎯',
                title: 'Set Meaningful Goals',
                description: "Instead of just revenue targets, set VALUE targets. Know exactly what EBITDA and multiple you need to hit your exit number.",
              },
              {
                icon: '⚙️',
                title: 'Pull the Right Levers',
                description: 'See which changes have the biggest impact. A 10% margin improvement might be worth more than 20% revenue growth.',
              },
              {
                icon: '🚀',
                title: 'Build What Buyers Want',
                description: 'Run your business the way acquirers evaluate it. When the time comes, you\'ll command premium multiples.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-wip-card border border-wip-border rounded-2xl p-8 text-center hover:border-emerald-500/30 transition-colors"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-semibold text-wip-heading mb-3">{item.title}</h3>
                <p className="text-wip-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* EXAMPLE SCENARIOS SECTION */}
      {/* ================================================================== */}
      <section className="py-24 bg-wip-navy">
        <div className="mx-auto max-w-6xl px-6 sm:px-8 md:px-10">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
              See the Impact
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-wip-heading">
              Small Changes. Big Results.
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-wip-card border border-emerald-500/20 rounded-3xl p-8 md:p-12">
              <div className="grid md:grid-cols-3 gap-8 mb-8">
                <div className="text-center p-6 bg-wip-dark rounded-xl border border-wip-border">
                  <p className="text-wip-muted text-sm uppercase tracking-wide mb-2">Current</p>
                  <p className="text-3xl font-bold text-wip-heading mb-1">$948,000</p>
                  <p className="text-sm text-wip-muted">$379K EBITDA × 2.5x</p>
                </div>
                <div className="text-center p-6 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                  <p className="text-emerald-600 text-sm uppercase tracking-wide mb-2">Scenario A</p>
                  <p className="text-3xl font-bold text-emerald-600 mb-1">$1,466,800</p>
                  <p className="text-sm text-emerald-600/70">$386K EBITDA × 3.8x</p>
                </div>
                <div className="text-center p-6 bg-emerald-500/20 rounded-xl border border-emerald-500/40">
                  <p className="text-emerald-600 text-sm uppercase tracking-wide mb-2">Scenario B</p>
                  <p className="text-3xl font-bold text-emerald-600 mb-1">$2,115,600</p>
                  <p className="text-sm text-emerald-600/70">$492K EBITDA × 4.3x</p>
                </div>
              </div>

              <div className="text-center">
                <p className="text-wip-text mb-2">
                  By improving EBITDA by <span className="text-emerald-600 font-semibold">$113K</span> and growing your multiple from <span className="text-emerald-600 font-semibold">2.5x to 4.3x</span>:
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  +$1.17M in business value (+123%)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FINAL CTA SECTION */}
      {/* ================================================================== */}
      <section className="py-24 relative overflow-hidden bg-wip-dark">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_rgba(34,197,94,0.25),_transparent_60%)]" />
        
        <div className="relative mx-auto max-w-4xl px-6 sm:px-8 md:px-10 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-wip-heading mb-6">
            Ready to Know Your Number?
          </h2>
          <p className="text-xl text-wip-text mb-10 max-w-2xl mx-auto">
            Get your free business valuation in 2 minutes. 
            No credit card. No obligations.
          </p>

          <button
            onClick={handleStartCalculator}
            className="group relative px-12 py-5 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold text-xl rounded-xl shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all hover:scale-105"
          >
            Start Free Calculator
            <span className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <p className="mt-8 text-wip-muted text-sm">
            Over 500 contractors have valued their businesses with this tool
          </p>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FOOTER */}
      {/* ================================================================== */}
      <footer className="bg-wip-heading border-t border-wip-border py-12">
        <div className="mx-auto max-w-6xl px-6 sm:px-8 md:px-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-wip-gold to-wip-gold-dark flex items-center justify-center">
                <svg className="w-5 h-5 text-wip-card" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <span className="text-lg font-bold text-wip-card">
                ChainLink<span className="text-wip-gold">CFO</span>
              </span>
            </a>

            <div className="flex items-center gap-8 text-sm text-wip-muted">
              <a href="/" className="hover:text-wip-card transition-colors">Home</a>
              <a href="/#modules" className="hover:text-wip-card transition-colors">All Tools</a>
              <a href="/#pricing" className="hover:text-wip-card transition-colors">Pricing</a>
            </div>

            <p className="text-sm text-wip-muted">
              © {new Date().getFullYear()} ChainLink CFO. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ValueBuilderLanding;

