import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WIPCard } from '../components/WIPCard';

// ============================================================================
// SAMPLE PROJECT TILE COMPONENT - Realistic mid-execution job card
// ============================================================================
const SampleProjectTile: React.FC<{
  jobNumber: string;
  jobName: string;
  client: string;
  pm: string;
  status: 'active' | 'pending' | 'complete';
  percentComplete: number;
  contractValue: number;
  costToDate: number;
  billedToDate: number;
  projectedProfit: number;
  delay?: number;
}> = ({
  jobNumber,
  jobName,
  client,
  pm,
  status,
  percentComplete,
  contractValue,
  costToDate,
  billedToDate,
  projectedProfit,
  delay = 0,
}) => {
    const statusColors = {
      active: 'bg-emerald-500',
      pending: 'bg-amber-500',
      complete: 'bg-slate-400',
    };

    const profitMargin = ((projectedProfit / contractValue) * 100).toFixed(1);
    const isOverBilled = billedToDate > costToDate * 1.1;
    const isUnderBilled = billedToDate < costToDate * 0.9;

    return (
      <div
        className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
        style={{
          animation: `fadeSlideUp 0.6s ease-out ${delay}ms both`,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-orange-300 bg-orange-500/20 px-2 py-0.5 rounded">
                {jobNumber}
              </span>
              <span className={`w-2 h-2 rounded-full ${statusColors[status]} animate-pulse`} />
            </div>
            <h3 className="text-white font-semibold text-sm leading-tight">{jobName}</h3>
            <p className="text-slate-400 text-xs mt-0.5">{client}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">PM</p>
            <p className="text-xs text-white font-medium">{pm}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Progress</span>
            <span className="text-white font-medium">{percentComplete}%</span>
          </div>
          <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-1000"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>

        {/* Financial Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-slate-800/50 rounded-lg p-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Contract</p>
            <p className="text-sm text-white font-semibold">
              ${(contractValue / 1000).toFixed(0)}K
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Cost to Date</p>
            <p className="text-sm text-white font-semibold">
              ${(costToDate / 1000).toFixed(0)}K
            </p>
          </div>
        </div>

        {/* Billing Status */}
        <div className="flex items-center justify-between bg-slate-800/30 rounded-lg p-2">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Billed</p>
            <p className="text-sm text-white font-semibold">
              ${(billedToDate / 1000).toFixed(0)}K
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Proj. Margin</p>
            <p
              className={`text-sm font-bold ${parseFloat(profitMargin) >= 15
                ? 'text-emerald-400'
                : parseFloat(profitMargin) >= 10
                  ? 'text-amber-400'
                  : 'text-red-400'
                }`}
            >
              {profitMargin}%
            </p>
          </div>
          {(isOverBilled || isUnderBilled) && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${isOverBilled
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-red-500/20 text-red-300'
                }`}
            >
              {isOverBilled ? 'Over-billed' : 'Under-billed'}
            </span>
          )}
        </div>
      </div>
    );
  };

// ============================================================================
// VIDEO SECTION COMPONENT - Placeholder for infographic videos
// ============================================================================
const VideoSection: React.FC<{
  number: string;
  title: string;
  subtitle: string;
  description: string;
  videoPlaceholder: string;
  thumbnailImage?: string;
  reverse?: boolean;
  bgColor?: string;
}> = ({ number, title, subtitle, description, videoPlaceholder, thumbnailImage, reverse = false, bgColor = '' }) => {
  return (
    <section className={`py-20 ${bgColor}`}>
      <div className="mx-auto max-w-6xl px-6 sm:px-8 md:px-10">
        <div
          className={`flex flex-col gap-12 items-center ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'
            }`}
        >
          {/* Content */}
          <div className="flex-1 max-w-xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-500/30">
                {number}
              </span>
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
                {subtitle}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">{title}</h2>
            <p className="text-lg text-slate-600 leading-relaxed">{description}</p>
          </div>

          {/* Video Placeholder */}
          <div className="flex-1 w-full max-w-lg">
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700">
              {/* Thumbnail Image */}
              {thumbnailImage && (
                <img
                  src={thumbnailImage}
                  alt={videoPlaceholder}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/10 transition-colors cursor-pointer group">
                <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <svg
                    className="w-8 h-8 text-orange-500 ml-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              {/* Placeholder Text */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2">
                  <p className="text-white text-sm font-medium">{videoPlaceholder}</p>
                  <p className="text-slate-400 text-xs">Click to play</p>
                </div>
              </div>
              {/* Decorative Elements */}
              <div className="absolute top-4 right-4 flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// FEATURE CARD COMPONENT
// ============================================================================
const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}> = ({ icon, title, description, delay }) => {
  return (
    <div
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-orange-200"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white mb-5 shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
};

// ============================================================================
// TESTIMONIAL CARD COMPONENT
// ============================================================================
const TestimonialCard: React.FC<{
  quote: string;
  name: string;
  role: string;
  company: string;
  delay: number;
}> = ({ quote, name, role, company, delay }) => {
  return (
    <div
      className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <p className="text-slate-700 text-lg mb-6 italic leading-relaxed">"{quote}"</p>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold">
          {name.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-slate-900">{name}</p>
          <p className="text-sm text-slate-500">
            {role}, {company}
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN LANDING PAGE COMPONENT
// ============================================================================
const WIPInsightsLanding: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth?mode=signup&source=wip&returnTo=/app/wip');
  };

  const handleLogin = () => {
    navigate('/auth?mode=login&source=wip&returnTo=/app/wip');
  };

  // Sample project data for the hero tiles
  // Sample project data for the hero tiles
  // Sample project data for the hero tiles (Lakeside Medical)
  const sampleProjects = [
    {
      jobNumber: '24-1055',
      jobName: 'Lakeside Medical Center',
      client: 'Apex Builders',
      pm: 'Jordan',
      startDate: '4/1/2026',
      contractValue: 235000,
      originalProfit: 117500,
      forecastedProfit: 83000,
      variance: -34500,
      costToDate: 34500,
      originalBudget: 117500,
      forecastedBudget: 152000,
      earned: 69000,
      invoiced: 303,
      underBilled: 68697,
      laborProgress: 20,
      materialProgress: 38,
      otherProgress: 29
    }
  ];

  const features = [
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: 'Real-Time Job Profitability',
      description:
        'Track actual costs, billings, and earned revenue as work happens. Know your margins before the month closes.',
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      title: 'Labor & Backlog Visibility',
      description:
        "Understand how your workforce lines up with backlog. Spot when you're overloaded or underutilized before it's too late.",
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      title: 'CFO-Level Insights',
      description:
        'Automatic dashboards show over/under billings and performance trends. No analyst needed—just clarity.',
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
      title: 'Simple, Secure & Field-Ready',
      description:
        'Designed for construction teams—easy for PMs, powerful for owners. Works on any device, anywhere.',
    },
  ];

  const testimonials = [
    {
      quote:
        'We caught a $180K billing gap on a project that looked fine on paper. WIP-Insights paid for itself in the first month.',
      name: 'Robert Martinez',
      role: 'CFO',
      company: 'Summit Construction',
    },
    {
      quote:
        "Finally, my PMs and I are looking at the same numbers. No more surprises at month-end. It's changed how we run jobs.",
      name: 'Jennifer Walsh',
      role: 'Owner',
      company: 'Walsh & Sons Builders',
    },
    {
      quote:
        'The labor planning feature alone saved us from overcommitting on three bids. We actually know our capacity now.',
      name: 'David Chen',
      role: 'Operations Director',
      company: 'Pacific General Contractors',
    },
  ];

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '/forever',
      description: 'Try WIP tracking at no cost',
      features: [
        '1 user included',
        'Up to 5 active projects',
        'Basic WIP calculations',
        'Over/under billing analysis',
        'Real-time job tracking',
        'CSV export',
      ],
      cta: 'Get Started Free',
      popular: false,
      badge: null,
      foundersRate: null,
    },
    {
      name: 'Pro',
      price: '$49',
      period: '/month',
      description: 'For contractors who need full visibility',
      features: [
        'Unlimited users',
        'Unlimited projects',
        'Advanced WIP (component-level)',
        'Time & Material job support',
        'Company-wide dashboards',
        'PDF reports & CSV export',
        'Role-based access',
        'Profit margin tracking',
      ],
      cta: 'Start Free Trial',
      popular: true,
      badge: 'Most Popular',
    },
    {
      name: 'Controller',
      price: '$399',
      period: '/month',
      description: 'For larger firms with complex needs',
      features: [
        'Everything in Pro',
        'Priority support',
        'Future: PO integration',
        'Future: QuickBooks sync',
        'Future: AIA billing',
        'API access (coming soon)',
      ],
      cta: 'Contact Sales',
      popular: false,
      badge: null,
    },
  ];

  return (
    <div className="bg-white text-slate-900 overflow-hidden">
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
          0%, 100% { box-shadow: 0 0 20px rgba(249, 115, 22, 0.3); }
          50% { box-shadow: 0 0 40px rgba(249, 115, 22, 0.5); }
        }
      `}</style>

      {/* ================================================================== */}
      {/* HERO SECTION */}
      {/* ================================================================== */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_30%,_rgba(249,115,22,0.15),_transparent_50%)]" />
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_80%_70%,_rgba(30,64,175,0.2),_transparent_50%)]" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />

        <div className="relative mx-auto w-full max-w-7xl px-6 py-20 sm:px-8 md:px-10 lg:py-28">
          {/* Navigation */}
          <nav className="absolute top-6 left-6 right-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/images/wip-insights-logo.png"
                alt="WIP-Insights"
                className="h-72 w-auto"
              />
            </div>
            <div className="flex items-center gap-4">
              {/* ChainLink CFO Suite Badge */}
              <a
                href="/"
                className="hidden sm:flex items-center gap-2 text-xs text-slate-400 hover:text-orange-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span>Part of ChainLink CFO Suite</span>
              </a>
              <button
                onClick={handleLogin}
                className="text-slate-300 hover:text-white transition-colors font-medium"
              >
                Sign In →
              </button>
            </div>
          </nav>

          <div className="flex flex-col lg:flex-row items-center gap-16 mt-16 lg:mt-0">
            {/* Left: Copy */}
            <div className="flex-1 text-center lg:text-left">
              <div
                className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mb-6"
                style={{ animation: 'fadeSlideUp 0.6s ease-out' }}
              >
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-sm text-orange-300 font-medium">Beta Access - Limited Availability</span>
              </div>

              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
                style={{ animation: 'fadeSlideUp 0.6s ease-out 100ms both' }}
              >
                Clarity, Control &{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
                  Confidence
                </span>{' '}
                for Construction Leaders
              </h1>

              <p
                className="text-xl text-slate-300 mb-8 max-w-xl mx-auto lg:mx-0"
                style={{ animation: 'fadeSlideUp 0.6s ease-out 200ms both' }}
              >
                Real-time visibility into job profitability, earned revenue, and labor performance.
                Stop managing by gut feel.
              </p>

              <div
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8"
                style={{ animation: 'fadeSlideUp 0.6s ease-out 300ms both' }}
              >
                <button
                  onClick={handleGetStarted}
                  className="group relative px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all hover:scale-105"
                  style={{ animation: 'pulse-glow 3s ease-in-out infinite' }}
                >
                  Start Free — No Credit Card
                  <span className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <a
                  href="#why"
                  className="px-8 py-4 border-2 border-slate-600 text-slate-300 font-semibold rounded-xl hover:border-slate-400 hover:text-white transition-all"
                >
                  See How It Works
                </a>
              </div>

              {/* Trust badges */}
              <div
                className="flex flex-wrap items-center gap-6 justify-center lg:justify-start text-slate-400 text-sm"
                style={{ animation: 'fadeSlideUp 0.6s ease-out 400ms both' }}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Free plan available</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Setup in 5 minutes</span>
                </div>
                <div className="flex items-center gap-2 group relative">
                  <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Bank-level security</span>
                  <svg className="w-4 h-4 text-slate-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl">
                    <div className="space-y-1">
                      <div>✓ SOC 2 Type II Certified</div>
                      <div>✓ AES-256 Encryption</div>
                      <div>✓ TLS 1.3 in Transit</div>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Project Tiles */}
            <div className="flex-1 w-full max-w-lg lg:max-w-xl">
              <div className="transform transition-all duration-500 hover:scale-[1.02]">
                {sampleProjects.map((project, index) => (
                  <WIPCard key={project.jobNumber} {...project} delay={500 + index * 150} />
                ))}
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500">
            <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
            <svg
              className="w-5 h-5 animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* WHY A WIP SECTION */}
      {/* ================================================================== */}
      <section id="why" />
      <VideoSection
        number="1"
        subtitle="The Problem"
        title="WHY You Need a WIP Report"
        description="Most contractors fly blind. Spreadsheets are outdated the moment they're created. By the time you spot a problem, it's already cost you money. A Work-in-Progress report gives you the truth about every job—before it's too late."
        videoPlaceholder="WHY a WIP — Understanding the problem"
        thumbnailImage="/images/why-wip-thumbnail.png"
        bgColor="bg-slate-50"
      />

      {/* ================================================================== */}
      {/* WHAT IS A WIP SECTION */}
      {/* ================================================================== */}
      <VideoSection
        number="2"
        subtitle="The Solution"
        title="WHAT is a WIP Report?"
        description="A WIP report compares what you've earned to what you've billed and spent. It shows you over-billings, under-billings, and projected profit on every job. It's the financial heartbeat of your construction business."
        videoPlaceholder="WHAT is a WIP — The fundamentals"
        reverse
        bgColor="bg-white"
      />

      {/* ================================================================== */}
      {/* HOW TO USE SECTION */}
      {/* ================================================================== */}
      <VideoSection
        number="3"
        subtitle="Getting Started"
        title="HOW to Use WIP-Insights"
        description="Add your jobs, enter your numbers weekly, and watch the insights appear. Our dashboard highlights problems automatically—red flags for under-billing, green lights for healthy margins. No accounting degree required."
        videoPlaceholder="HOW to use WIP-Insights — Quick start guide"
        bgColor="bg-slate-50"
      />

      {/* ================================================================== */}
      {/* FEATURES SECTION */}
      {/* ================================================================== */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-6xl px-6 sm:px-8 md:px-10">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-500">
              Features
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-slate-900">
              Everything You Need to Stay Profitable
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Built by contractors, for contractors. Every feature solves a real problem.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} delay={index * 100} />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* TESTIMONIALS SECTION */}
      {/* ================================================================== */}
      <section className="py-24 bg-gradient-to-br from-slate-900 to-slate-950">
        <div className="mx-auto max-w-6xl px-6 sm:px-8 md:px-10">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-400">
              Testimonials
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-white">
              Trusted by Construction Leaders
            </h2>
            <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
              See what contractors are saying about WIP-Insights
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={testimonial.name} {...testimonial} delay={index * 100} />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* PRICING SECTION */}
      {/* ================================================================== */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 sm:px-8 md:px-10">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-500">
              Pricing
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-slate-900">
              Simple Pricing, Serious Results
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Start free, upgrade when you're ready. No credit card required.
            </p>
            <div className="mt-6 inline-flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl px-6 py-3">
              <span className="text-2xl">🚀</span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Free Forever Plan</p>
                <p className="text-xs text-slate-600">Get started with 5 projects at no cost — upgrade to Pro for unlimited</p>
              </div>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl p-8 ${plan.popular
                  ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-2xl scale-105 border-2 border-orange-500'
                  : 'bg-white border border-slate-200 shadow-lg'
                  }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold px-4 py-1 rounded-full shadow-lg">
                      {plan.badge}
                    </span>
                  </div>
                )}
                {plan.foundersRate && (
                  <div className="absolute -top-4 right-4">
                    <span className="bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                      Founder's Rate
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3
                    className={`text-2xl font-bold ${plan.popular ? 'text-white' : 'text-slate-900'}`}
                  >
                    {plan.name}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-slate-900'}`}
                    >
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className={plan.popular ? 'text-slate-400' : 'text-slate-500'}>
                        {plan.period}
                      </span>
                    )}
                  </div>
                  {plan.foundersRate && (
                    <p className={`mt-2 text-sm ${plan.popular ? 'text-orange-300' : 'text-emerald-600'} font-medium`}>
                      {plan.foundersRate}
                    </p>
                  )}
                  <p className={`mt-2 ${plan.popular ? 'text-slate-300' : 'text-slate-600'}`}>
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <svg
                        className={`w-5 h-5 flex-shrink-0 ${plan.popular ? 'text-orange-400' : 'text-emerald-500'
                          }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className={plan.popular ? 'text-slate-200' : 'text-slate-700'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={plan.cta === 'Contact Sales' ? () => window.location.href = 'mailto:support@wip-insights.com?subject=Controller Tier Inquiry' : handleGetStarted}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${plan.popular
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:shadow-lg hover:shadow-orange-500/30'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          {/* CFO Suite Callout */}
          <div className="mt-12 text-center">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-orange-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>Need more tools? Check out the full ChainLink CFO Suite →</span>
            </a>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FINAL CTA SECTION */}
      {/* ================================================================== */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_rgba(249,115,22,0.2),_transparent_60%)]" />

        <div className="relative mx-auto max-w-4xl px-6 sm:px-8 md:px-10 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Your Competitors Are Already Tracking WIP
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Don't let another month close with surprises. Get the clarity you deserve—start today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="group relative px-10 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-lg rounded-xl shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all hover:scale-105"
            >
              Get Started Free
              <span className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          <p className="mt-6 text-slate-400 text-sm">
            Free forever plan • No credit card required • Upgrade anytime
          </p>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FOOTER */}
      {/* ================================================================== */}
      <footer className="bg-slate-950 text-slate-400 py-12">
        <div className="mx-auto max-w-6xl px-6 sm:px-8 md:px-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img
                src="/images/wip-insights-logo.png"
                alt="WIP-Insights"
                className="h-52 w-auto"
              />
              <a
                href="/"
                className="flex items-center gap-2 text-xs text-slate-500 hover:text-orange-400 transition-colors border-l border-slate-700 pl-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span>Part of ChainLink CFO</span>
              </a>
            </div>

            <div className="flex items-center gap-8 text-sm">
              <a href="#features" className="hover:text-white transition-colors">
                Features
              </a>
              <a href="#pricing" className="hover:text-white transition-colors">
                Pricing
              </a>
              <a href="/" className="hover:text-white transition-colors">
                CFO Suite
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
            </div>

            <p className="text-sm">
              © {new Date().getFullYear()} WIP-Insights. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WIPInsightsLanding;

