import React from 'react';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    title: 'Real-Time Job Profitability',
    description: 'Track actual costs, billings, and earned revenue as work happens.',
  },
  {
    title: 'Labor & Backlog Visibility',
    description: "Understand how your workforce lines up with backlog. Spot when you're overloaded or underutilized.",
  },
  {
    title: 'CFO-Level Insights - No Analyst Needed',
    description: 'Automatic dashboards show over/under billings and performance trends.',
  },
  {
    title: 'Simple, Secure, and Field-Ready',
    description: 'Designed for construction teams - easy for PMs, powerful for owners.',
  },
];

const plans = [
  {
    name: 'Free',
    blurb: 'Track up to 3 active jobs',
  },
  {
    name: 'Pro',
    blurb: 'Unlimited jobs, dashboards, and team access',
  },
  {
    name: 'Enterprise',
    blurb: 'Advanced reporting & integrations',
  },
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const handleEarlyAccessClick = () => {
    navigate('/auth?mode=signup');
  };

  return (
    <div className="bg-white text-slate-900">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" aria-hidden="true" />
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,_rgba(30,64,175,0.35),_transparent_55%)]" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 py-24 sm:px-8 md:px-10 lg:flex-row lg:items-center lg:justify-between lg:py-32">
          <div className="max-w-xl text-white">
            <p className="text-sm uppercase tracking-[0.3em] text-orange-300">WIP-Insights</p>
            <h1 className="mt-6 text-4xl font-semibold sm:text-5xl lg:text-6xl">
              Clarity, Control, and Confidence for Construction Leaders
            </h1>
            <p className="mt-6 text-lg text-slate-200 sm:text-xl">
              Real-time visibility into job profitability, earned revenue, and labor performance.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                onClick={handleEarlyAccessClick}
                className="rounded-full bg-orange-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-orange-500/40 transition hover:bg-orange-600"
              >
                Join the Early Access List
              </button>
              <span className="text-sm text-slate-300 sm:text-base">
                Built for owners, trusted by project managers.
              </span>
            </div>
          </div>
          <div className="grid w-full max-w-md grid-cols-1 gap-6 text-slate-200 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <span className="text-xs uppercase tracking-wide text-orange-300">Dashboard Preview</span>
              <div className="mt-4 h-36 rounded-2xl border border-dashed border-slate-400/40 bg-slate-900/40" />
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:translate-y-10">
              <span className="text-xs uppercase tracking-wide text-orange-300">Job List</span>
              <div className="mt-4 h-36 rounded-2xl border border-dashed border-slate-400/40 bg-slate-900/30" />
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:col-span-2">
              <span className="text-xs uppercase tracking-wide text-orange-300">Profit Chart</span>
              <div className="mt-4 h-40 rounded-2xl border border-dashed border-slate-400/40 bg-slate-900/30" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 sm:px-8 md:px-10">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-500">Why Contractors Use WIP-Insights</p>
          <h2 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">Give your team the same truth from field to finance</h2>
          <p className="mt-4 text-lg text-slate-600 sm:text-xl">
            WIP-Insights keeps owners, CFOs, and project managers aligned with actionable data they can trust.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.title} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-full bg-orange-100 text-center text-lg font-semibold leading-10 text-orange-500">&bull;</span>
                <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
              </div>
              <p className="mt-5 text-base text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 md:px-10">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-500">Pricing</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">Built for every stage of your construction business</h2>
            <p className="mt-3 text-lg text-slate-600">Start where you are - scale when you're ready.</p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.name} className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-8 text-left shadow-sm">
                <h3 className="text-2xl font-semibold text-slate-900">{plan.name}</h3>
                <p className="mt-4 text-base text-slate-600">{plan.blurb}</p>
                <div className="mt-auto pt-8">
                  <button className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-orange-400 hover:text-orange-500">
                    Learn More
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <button
              onClick={handleEarlyAccessClick}
              className="rounded-full bg-orange-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600"
            >
              Request Early Access
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-24 text-center sm:px-8 md:px-10">
        <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Get the Clarity You Deserve</h2>
        <p className="mt-4 text-lg text-slate-600 sm:text-xl">Stop managing by gut feel. Start managing with insight.</p>
        <div className="mt-8">
          <button
            onClick={handleEarlyAccessClick}
            className="rounded-full bg-orange-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600"
          >
            Join the Early Access List
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;


