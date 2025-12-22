import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MODULES, TIER_NAMES, ModuleId } from '../types/modules';

// ============================================================================
// MODULE CARD COMPONENT - Showcases each tool in the suite
// ============================================================================
const ModuleShowcaseCard: React.FC<{
  moduleId: ModuleId;
  delay: number;
}> = ({ moduleId, delay }) => {
  const module = MODULES[moduleId];

  return (
    <div
      className="group relative bg-wip-card backdrop-blur-sm border border-wip-border rounded-2xl p-6 hover:bg-wip-card hover:border-wip-gold/40 transition-all duration-300 hover:-translate-y-1"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-wip-gold/20 to-wip-gold-dark/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
          {module.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-wip-heading font-semibold">{module.name}</h3>
            {module.comingSoon && (
              <span className="text-[10px] uppercase tracking-wide bg-wip-navy text-wip-muted px-2 py-0.5 rounded-full">
                Coming Soon
              </span>
            )}
          </div>
          <p className="text-wip-muted text-sm leading-relaxed">{module.description}</p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// STATS CARD COMPONENT
// ============================================================================
const StatCard: React.FC<{
  value: string;
  label: string;
  delay: number;
}> = ({ value, label, delay }) => (
  <div
    className="text-center"
    style={{ animation: `fadeSlideUp 0.6s ease-out ${delay}ms both` }}
  >
    <div className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-wip-gold to-wip-gold-dark mb-2">
      {value}
    </div>
    <div className="text-wip-muted text-sm uppercase tracking-wide">{label}</div>
  </div>
);

// ============================================================================
// PRICING TIER CARD
// ============================================================================
const PricingCard: React.FC<{
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
  cta: string;
  onCtaClick: () => void;
}> = ({ name, price, description, features, popular, cta, onCtaClick }) => (
  <div
    className={`relative flex flex-col rounded-2xl p-8 ${popular
        ? 'bg-wip-heading border-2 border-wip-gold shadow-2xl shadow-wip-gold/20 scale-105'
        : 'bg-wip-card border border-wip-border'
      }`}
  >
    {popular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
        <span className="bg-gradient-to-r from-wip-gold to-wip-gold-dark text-wip-card text-sm font-semibold px-4 py-1 rounded-full shadow-lg">
          Most Popular
        </span>
      </div>
    )}

    <div className="mb-6">
      <h3 className={`text-2xl font-bold ${popular ? 'text-wip-card' : 'text-wip-heading'}`}>{name}</h3>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={`text-4xl font-bold ${popular ? 'text-wip-card' : 'text-wip-heading'}`}>{price}</span>
        {price !== 'Custom' && <span className="text-wip-muted">/month</span>}
      </div>
      <p className={`mt-2 ${popular ? 'text-wip-muted' : 'text-wip-muted'}`}>{description}</p>
    </div>

    <ul className="space-y-3 mb-8 flex-1">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-3">
          <svg
            className="w-5 h-5 flex-shrink-0 text-wip-gold"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className={popular ? 'text-wip-card/90' : 'text-wip-text'}>{feature}</span>
        </li>
      ))}
    </ul>

    <button
      onClick={onCtaClick}
      className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${popular
          ? 'bg-gradient-to-r from-wip-gold to-wip-gold-dark text-wip-card hover:shadow-lg hover:shadow-wip-gold/30'
          : 'bg-wip-heading text-wip-card hover:bg-wip-text'
        }`}
    >
      {cta}
    </button>
  </div>
);

// ============================================================================
// MAIN LANDING PAGE COMPONENT
// ============================================================================
const ChainLinkCFOLanding: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth?mode=signup');
  };

  const handleLogin = () => {
    navigate('/auth?mode=login');
  };

  // Module order for display
  const moduleOrder: ModuleId[] = [
    'wip', 'forecasting', 'capacity', 'budget', 'covenant',
    'profitability', 'jcurve', 'bidnobid', 'scenarios', 'reporting'
  ];

  const pricingTiers = [
    {
      name: 'Starter',
      price: '$99',
      description: 'For small contractors getting organized',
      features: [
        'WIP Manager (full access)',
        'Unlimited jobs & users',
        'Over/under billing analysis',
        'Basic reporting & exports',
        'Email support',
      ],
      cta: 'Start Free Trial',
    },
    {
      name: 'Professional',
      price: '$199',
      description: 'For growing GCs who need financial clarity',
      features: [
        'Everything in Starter',
        'Cash Flow Forecasting',
        'Labor Capacity Planning',
        'Forecast vs Actuals tracking',
        'Advanced dashboards',
        'Priority support',
      ],
      popular: true,
      cta: 'Start Free Trial',
    },
    {
      name: 'Enterprise',
      price: '$399',
      description: 'For established contractors with complex needs',
      features: [
        'Everything in Professional',
        'Covenant Compliance tracking',
        'Profitability Analytics',
        'J-Curve Investment Analysis',
        'Dedicated account manager',
      ],
      cta: 'Contact Sales',
    },
    {
      name: 'CFO Suite',
      price: 'Custom',
      description: 'Full platform for CFO practices & large GCs',
      features: [
        'Everything in Enterprise',
        'Bid/No-Bid Decision Tool',
        'Scenario Planning & What-If',
        'Financial Reporting Suite',
        'Multi-company management',
        'API access & integrations',
        'White-label options',
      ],
      cta: 'Contact Sales',
    },
  ];

  return (
    <div className="bg-wip-dark text-wip-text overflow-hidden font-sans">
      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(166, 134, 63, 0.3); }
          50% { box-shadow: 0 0 40px rgba(166, 134, 63, 0.5); }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>

      {/* ================================================================== */}
      {/* HERO SECTION */}
      {/* ================================================================== */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-wip-navy via-wip-dark to-wip-navy" />
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_20%_30%,_rgba(166,134,63,0.25),_transparent_50%)]" />
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_80%_70%,_rgba(138,111,50,0.2),_transparent_50%)]" />

        {/* Animated grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `linear-gradient(rgba(166,134,63,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(166,134,63,0.2) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative mx-auto w-full max-w-7xl px-6 py-20 sm:px-8 md:px-10">
          {/* Navigation */}
          <nav className="absolute top-6 left-6 right-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/images/chainlink-cfo-logo.png"
                alt="ChainLink CFO"
                className="h-48 w-auto"
              />
            </div>
            <div className="flex items-center gap-6">
              <a href="#modules" className="text-wip-text hover:text-wip-heading transition-colors hidden sm:block">
                Tools
              </a>
              <a href="#pricing" className="text-wip-text hover:text-wip-heading transition-colors hidden sm:block">
                Pricing
              </a>
              <a href="/value-builder" className="text-wip-gold hover:text-wip-gold-dark transition-colors hidden sm:block font-medium">
                Free Calculator
              </a>
              <button
                onClick={handleLogin}
                className="text-wip-text hover:text-wip-heading transition-colors font-medium"
              >
                Sign In →
              </button>
            </div>
          </nav>

          <div className="text-center mt-24 lg:mt-16">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 bg-wip-gold/10 border border-wip-gold/30 rounded-full px-4 py-1.5 mb-8"
              style={{ animation: 'fadeSlideUp 0.6s ease-out' }}
            >
              <span className="w-2 h-2 rounded-full bg-wip-gold animate-pulse" />
              <span className="text-sm text-wip-gold font-medium">The Complete Financial Toolkit for Contractors</span>
            </div>

            {/* Headline */}
            <h1
              className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mb-6 max-w-5xl mx-auto text-wip-heading"
              style={{ animation: 'fadeSlideUp 0.6s ease-out 100ms both' }}
            >
              Your Construction Company Deserves a{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-wip-gold via-wip-gold-dark to-wip-gold">
                Real CFO
              </span>
            </h1>

            {/* Subheadline */}
            <p
              className="text-xl sm:text-2xl text-wip-text mb-10 max-w-3xl mx-auto leading-relaxed"
              style={{ animation: 'fadeSlideUp 0.6s ease-out 200ms both' }}
            >
              11 integrated financial tools built specifically for construction.
              From WIP tracking to cash flow forecasting to bid analysis—everything
              you need to run your business with confidence.
            </p>

            {/* CTAs */}
            <div
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
              style={{ animation: 'fadeSlideUp 0.6s ease-out 300ms both' }}
            >
              <button
                onClick={handleGetStarted}
                className="group relative px-10 py-4 bg-gradient-to-r from-wip-gold to-wip-gold-dark text-wip-card font-semibold text-lg rounded-xl shadow-xl shadow-wip-gold/30 hover:shadow-wip-gold/50 transition-all hover:scale-105"
                style={{ animation: 'pulse-glow 3s ease-in-out infinite' }}
              >
                Start Your Free Trial
                <span className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <a
                href="#modules"
                className="px-10 py-4 border-2 border-wip-border text-wip-text font-semibold text-lg rounded-xl hover:border-wip-gold hover:text-wip-heading transition-all"
              >
                Explore the Suite
              </a>
            </div>

            {/* Stats */}
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-4xl mx-auto pt-8 border-t border-wip-border"
              style={{ animation: 'fadeSlideUp 0.6s ease-out 400ms both' }}
            >
              <StatCard value="11" label="Integrated Tools" delay={500} />
              <StatCard value="$2B+" label="Projects Tracked" delay={600} />
              <StatCard value="98%" label="Client Retention" delay={700} />
              <StatCard value="5 min" label="Setup Time" delay={800} />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-wip-muted">
          <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
          <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* ================================================================== */}
      {/* THE PROBLEM SECTION */}
      {/* ================================================================== */}
      <section className="py-24 bg-wip-navy">
        <div className="mx-auto max-w-6xl px-6 sm:px-8 md:px-10">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-wip-gold">
              The Challenge
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-wip-heading">
              Construction Finance is Broken
            </h2>
            <p className="mt-4 text-lg text-wip-muted max-w-2xl mx-auto">
              Spreadsheets everywhere. Data silos. Month-end surprises. You're flying blind while
              your competitors get clarity.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '📊',
                title: 'Scattered Data',
                description: 'Job costs in one place, billing in another, cash flow... who knows? Your financial picture is fragmented across a dozen spreadsheets.',
              },
              {
                icon: '⏰',
                title: 'Always Behind',
                description: "By the time you spot a problem job, it's already cost you money. Month-end closes are a scramble of manual reconciliation.",
              },
              {
                icon: '🎯',
                title: 'Gut-Feel Decisions',
                description: "Should you bid that project? Hire more PMs? Expand? Without real-time data, you're gambling on every major decision.",
              },
            ].map((item, index) => (
              <div
                key={item.title}
                className="bg-wip-card border border-wip-border rounded-2xl p-8 text-center"
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
      {/* MODULES SHOWCASE SECTION */}
      {/* ================================================================== */}
      <section id="modules" className="py-24 bg-wip-dark">
        <div className="mx-auto max-w-6xl px-6 sm:px-8 md:px-10">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-wip-gold">
              The Solution
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-wip-heading">
              11 Tools. One Platform. Complete Clarity.
            </h2>
            <p className="mt-4 text-lg text-wip-muted max-w-2xl mx-auto">
              Every financial tool a construction CFO needs, integrated and working together.
              Start with what you need, unlock more as you grow.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {moduleOrder.map((moduleId, index) => (
              <ModuleShowcaseCard
                key={moduleId}
                moduleId={moduleId}
                delay={index * 50}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={handleGetStarted}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-wip-gold to-wip-gold-dark text-wip-card font-semibold rounded-xl hover:shadow-lg hover:shadow-wip-gold/30 transition-all"
            >
              Start with WIP Manager Free
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* HOW IT WORKS SECTION */}
      {/* ================================================================== */}
      <section className="py-24 bg-wip-card">
        <div className="mx-auto max-w-6xl px-6 sm:px-8 md:px-10">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-wip-gold">
              How It Works
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-wip-heading">
              From Chaos to Clarity in 3 Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Connect Your Data',
                description: 'Import your jobs, costs, and billing data. Takes 5 minutes to get started, or sync with your existing accounting system.',
              },
              {
                step: '2',
                title: 'See the Full Picture',
                description: 'Instantly see WIP, cash flow projections, and profitability across all jobs. Real-time dashboards update as you work.',
              },
              {
                step: '3',
                title: 'Make Confident Decisions',
                description: 'Bid smarter, staff better, and catch problems before they cost you. Finally run your business with the data you need.',
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-wip-gold to-wip-gold-dark flex items-center justify-center text-2xl font-bold text-wip-card mb-6 shadow-lg shadow-wip-gold/30">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-wip-heading mb-3">{item.title}</h3>
                <p className="text-wip-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* PRICING SECTION */}
      {/* ================================================================== */}
      <section id="pricing" className="py-24 bg-wip-dark">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 md:px-10">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-wip-gold">
              Pricing
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-wip-heading">
              Start Small. Scale as You Grow.
            </h2>
            <p className="mt-4 text-lg text-wip-muted max-w-2xl mx-auto">
              Every plan includes a 7-day free trial. No credit card required.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-4 max-w-6xl mx-auto">
            {pricingTiers.map((tier) => (
              <PricingCard
                key={tier.name}
                {...tier}
                onCtaClick={tier.cta === 'Contact Sales'
                  ? () => window.location.href = 'mailto:sales@chainlinkcfo.com?subject=Enterprise Inquiry'
                  : handleGetStarted
                }
              />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* VALUE BUILDER FREE TOOL CALLOUT */}
      {/* ================================================================== */}
      <section className="py-20 bg-wip-navy border-y border-wip-border">
        <div className="mx-auto max-w-6xl px-6 sm:px-8 md:px-10">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            {/* Left: Content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-4 py-1.5 mb-4">
                <span className="text-lg">🆓</span>
                <span className="text-sm text-emerald-600 font-semibold uppercase tracking-wide">Free Tool</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-wip-heading mb-4">
                What's Your Business{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-green-500">
                  Really Worth?
                </span>
              </h2>
              <p className="text-lg text-wip-text mb-6 max-w-xl">
                Think like an investor. Use our free Value Builder calculator to
                see your business value using the same Adjusted EBITDA × Multiple
                formula that private equity uses.
              </p>
              <a
                href="/value-builder"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold text-lg rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all hover:scale-105"
              >
                Try Free Calculator
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>

            {/* Right: Visual */}
            <div className="flex-shrink-0">
              <div className="bg-wip-card border border-wip-border rounded-2xl p-6 w-72">
                <div className="text-center mb-4">
                  <p className="text-wip-muted text-sm mb-1">Business Value</p>
                  <p className="text-4xl font-bold text-emerald-500">$2.4M</p>
                </div>
                <div className="flex items-center justify-center gap-2 text-wip-muted text-sm">
                  <span className="bg-wip-navy px-3 py-1 rounded">$600K</span>
                  <span>×</span>
                  <span className="bg-wip-navy px-3 py-1 rounded">4.0x</span>
                </div>
                <p className="text-center text-xs text-wip-muted mt-3">EBITDA × Multiple</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* CFO PRO CALLOUT - Premium Managed Service */}
      {/* ================================================================== */}
      <section className="py-24 relative overflow-hidden bg-wip-dark">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,_rgba(166,134,63,0.2),_transparent_70%)]" />

        <div className="relative mx-auto max-w-6xl px-6 sm:px-8 md:px-10">
          <div className="bg-wip-card backdrop-blur-sm border-2 border-wip-gold/50 rounded-3xl p-8 md:p-12 shadow-2xl shadow-wip-gold/10">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              {/* Left: Content */}
              <div>
                <div className="inline-flex items-center gap-2 bg-wip-gold/20 border border-wip-gold/30 rounded-full px-4 py-1.5 mb-6">
                  <span className="text-xl">👔</span>
                  <span className="text-sm text-wip-gold font-semibold uppercase tracking-wide">Premium Service</span>
                </div>

                <h2 className="text-3xl md:text-4xl font-bold text-wip-heading mb-4">
                  ChainLink CFO{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-wip-gold to-wip-gold-dark">
                    Pro
                  </span>
                </h2>

                <p className="text-lg text-wip-text mb-6 leading-relaxed">
                  Don't want to set it up yourself? Our CFO experts will interview your team,
                  configure every tool, train your people, and partner with you for ongoing success.
                </p>

                <ul className="space-y-3 mb-8">
                  {[
                    'Personal CFO discovery interview',
                    'Custom tool configuration',
                    'Hands-on team onboarding',
                    'Ongoing success management',
                    'Dedicated CFO advisor',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-wip-gold to-wip-gold-dark flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-wip-card" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-wip-text">{item}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="/cfo-pro"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-wip-gold to-wip-gold-dark text-wip-card font-semibold text-lg rounded-xl shadow-lg shadow-wip-gold/30 hover:shadow-wip-gold/50 transition-all hover:scale-105"
                >
                  Learn More & Apply
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>

              {/* Right: Pricing */}
              <div className="text-center lg:text-right">
                <div className="inline-block bg-wip-navy border border-wip-border rounded-2xl p-8">
                  <p className="text-wip-muted text-sm uppercase tracking-wide mb-2">Pricing</p>
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="text-3xl font-bold text-wip-heading">$5,000</p>
                      <p className="text-wip-muted">One-time setup</p>
                    </div>
                    <div className="text-2xl text-wip-muted">+</div>
                    <div>
                      <p className="text-3xl font-bold text-wip-heading">$2,500<span className="text-lg font-normal text-wip-muted">/mo</span></p>
                      <p className="text-wip-muted">Ongoing partnership</p>
                    </div>
                  </div>
                  <p className="mt-6 text-sm text-wip-muted">Cancel anytime. No long-term contracts.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* WIP INSIGHTS CALLOUT */}
      {/* ================================================================== */}
      <section className="py-16 bg-wip-gold/10 border-y border-wip-gold/30">
        <div className="mx-auto max-w-4xl px-6 sm:px-8 md:px-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-3xl">📊</span>
            <h2 className="text-2xl font-bold text-wip-heading">Looking for Just WIP Tracking?</h2>
          </div>
          <p className="text-wip-text mb-6 max-w-2xl mx-auto">
            WIP Insights is our standalone WIP Manager tool. Perfect for contractors who want
            to start with the fundamentals before growing into the full CFO Suite.
          </p>
          <a
            href="/wip"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-wip-gold text-wip-gold font-semibold rounded-xl hover:bg-wip-gold hover:text-wip-card transition-all"
          >
            Explore WIP Insights
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FINAL CTA SECTION */}
      {/* ================================================================== */}
      <section className="py-24 relative overflow-hidden bg-wip-navy">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_rgba(166,134,63,0.3),_transparent_60%)]" />

        <div className="relative mx-auto max-w-4xl px-6 sm:px-8 md:px-10 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-wip-heading mb-6">
            Ready to Run Your Business<br />Like a Fortune 500?
          </h2>
          <p className="text-xl text-wip-text mb-10 max-w-2xl mx-auto">
            Join contractors who've replaced guesswork with data-driven decisions.
            Start your free trial today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="group relative px-10 py-4 bg-gradient-to-r from-wip-gold to-wip-gold-dark text-wip-card font-semibold text-lg rounded-xl shadow-xl shadow-wip-gold/30 hover:shadow-wip-gold/50 transition-all hover:scale-105"
            >
              Start Free Trial
              <span className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          <p className="mt-6 text-wip-muted text-sm">
            7-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FOOTER */}
      {/* ================================================================== */}
      <footer className="bg-wip-heading border-t border-wip-border py-12">
        <div className="mx-auto max-w-6xl px-6 sm:px-8 md:px-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-wip-gold to-wip-gold-dark flex items-center justify-center">
                <svg className="w-5 h-5 text-wip-card" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <span className="text-lg font-bold text-wip-card">
                ChainLink<span className="text-wip-gold">CFO</span>
              </span>
            </div>

            <div className="flex items-center gap-8 text-sm text-wip-muted">
              <a href="#modules" className="hover:text-wip-card transition-colors">Tools</a>
              <a href="#pricing" className="hover:text-wip-card transition-colors">Pricing</a>
              <a href="/value-builder" className="text-emerald-400 hover:text-emerald-300 transition-colors">Free Calculator</a>
              <a href="/wip" className="hover:text-wip-card transition-colors">WIP Insights</a>
              <Link to="/legal/privacy" className="hover:text-wip-card transition-colors">Privacy</Link>
              <Link to="/legal/terms" className="hover:text-wip-card transition-colors">Terms</Link>
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

export default ChainLinkCFOLanding;

