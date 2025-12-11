import React from 'react';
import * as Sentry from "@sentry/react";
import ErrorFallback from './components/shared/ErrorFallback';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ChainLinkCFOLanding from './pages/ChainLinkCFOLanding';
import WIPInsightsLanding from './pages/WIPInsightsLanding';
import CFOProPage from './pages/CFOProPage';
import ValueBuilderLanding from './pages/ValueBuilderLanding';
import ValueBuilderCalculator from './pages/ValueBuilderCalculator';
import AuthPage from './pages/AuthPage';
import ModuleDashboard from './pages/ModuleDashboard';
import AppShell from './components/layout/AppShell';
import WIPManagerApp from './WIPManagerApp';
import { AuthProvider } from './context/AuthContext';
import { DiscoveryPage } from './modules/discovery';
import { LaborCapacityPage } from './modules/labor-capacity';
import { ValueBuilderPage } from './modules/value-builder';
import { ForecastVsActualsPage } from './modules/budget';
import DashboardNavButton from './components/layout/DashboardNavButton';

// Legal Pages
import TermsOfService from './pages/legal/TermsOfService';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import AcceptableUsePolicy from './pages/legal/AcceptableUsePolicy';
import CookiePolicy from './pages/legal/CookiePolicy';
import { OnboardingWizardModal } from './components/onboarding/OnboardingWizardModal';
import { WIPCoachProvider } from './components/feedback/WIPCoach';
import ResetOnboarding from './components/debug/ResetOnboarding';

/**
 * Main App Router
 * 
 * Route Structure:
 * /                    → ChainLink CFO Suite landing page
 * /wip                 → WIP Insights standalone landing (direct marketing)
 * /auth                → Unified authentication
 * /app                 → Module Dashboard (protected)
 * /app/wip/*           → WIP Insights module (protected)
 * /app/[module]/*      → Other modules (protected, future)
 */

/**
 * Domain Aware Landing Page
 * Detects which domain the user visited and serves the appropriate landing page.
 */
const DomainAwareLanding: React.FC = () => {
  const hostname = window.location.hostname.toLowerCase();

  // Check for WIP Insights domain (including www subdomain)
  if (hostname.includes('wip-insights.com')) {
    return <WIPInsightsLanding />;
  }

  // Default to ChainLink CFO for chainlinkcfo.com and all other domains (including localhost)
  return <ChainLinkCFOLanding />;
};

function App() {
  return (
    <Sentry.ErrorBoundary fallback={ErrorFallback} showDialog>
      <BrowserRouter>
        <AuthProvider>
          <WIPCoachProvider>
            <OnboardingWizardModal />
            <Routes>
              {/* ============================================ */}
              {/* PUBLIC ROUTES - Landing Pages */}
              {/* ============================================ */}

              {/* Domain-aware main landing - serves different content based on URL */}
              <Route path="/" element={<DomainAwareLanding />} />

              {/* WIP Insights standalone landing (for direct marketing) */}
              <Route path="/wip" element={<WIPInsightsLanding />} />

              {/* CFO Pro - Premium managed service */}
              <Route path="/cfo-pro" element={<CFOProPage />} />

              {/* Value Builder - Free calculator lead gen */}
              <Route path="/value-builder" element={<ValueBuilderLanding />} />
              <Route path="/value-builder/calculate" element={<ValueBuilderCalculator />} />

              {/* Authentication */}
              <Route path="/auth" element={<AuthPage />} />

              {/* Legal Pages */}
              <Route path="/legal/terms" element={<TermsOfService />} />
              <Route path="/legal/privacy" element={<PrivacyPolicy />} />
              <Route path="/legal/acceptable-use" element={<AcceptableUsePolicy />} />
              <Route path="/legal/cookies" element={<CookiePolicy />} />

              {/* Debug Tools */}
              <Route path="/debug/reset" element={<ResetOnboarding />} />

              {/* ============================================ */}
              {/* PROTECTED ROUTES - App Shell */}
              {/* ============================================ */}

              <Route path="/app" element={<AppShell />}>
                {/* Module Dashboard - the hub */}
                <Route index element={<ModuleDashboard />} />

                {/* WIP Module */}
                <Route path="wip/*" element={<WIPManagerApp />} />

                {/* Discovery Module - Executive Interviews */}
                <Route path="discovery/*" element={<DiscoveryPage />} />

                {/* Labor Capacity Module */}
                <Route path="capacity/*" element={<LaborCapacityPage />} />

                {/* Value Builder Module */}
                <Route path="value-builder/*" element={<ValueBuilderPage />} />

                {/* Future Modules - Placeholder routes */}
                {/* These will show "Coming Soon" via the dashboard for now */}
                <Route path="forecasting/*" element={<ComingSoonModule moduleName="Cash Flow Forecasting" />} />
                <Route path="budget/*" element={<ForecastVsActualsPage />} />
                <Route path="jcurve/*" element={<ComingSoonModule moduleName="J-Curve Investment Analysis" />} />
                <Route path="covenant/*" element={<ComingSoonModule moduleName="Covenant Compliance" />} />
                <Route path="profitability/*" element={<ComingSoonModule moduleName="Profitability Analytics" />} />
                <Route path="bidnobid/*" element={<ComingSoonModule moduleName="Bid/No-Bid Decisions" />} />
                <Route path="scenarios/*" element={<ComingSoonModule moduleName="Scenario Planning" />} />
                <Route path="reporting/*" element={<ComingSoonModule moduleName="Financial Reporting" />} />
              </Route>

              {/* ============================================ */}
              {/* LEGACY REDIRECT - Old /app route behavior */}
              {/* ============================================ */}

              {/* Catch-all: redirect unknown routes to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </WIPCoachProvider>
        </AuthProvider>
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  );
}

/**
 * Coming Soon Module Placeholder
 * Displayed when user navigates to a module that's not yet built
 */
const ComingSoonModule: React.FC<{ moduleName: string }> = ({ moduleName }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
      <DashboardNavButton floating />
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {moduleName}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          This module is coming soon. We're working hard to bring you powerful new tools for your construction business.
        </p>
        <a
          href="/app"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </a>
      </div>
    </div>
  );
};

export default App;
