import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CompanyOnboarding from '../../pages/CompanyOnboarding';

/**
 * AppShell - Protected wrapper for all authenticated app routes
 * 
 * Handles:
 * - Authentication state check (redirects to /auth if not logged in)
 * - Company onboarding check (shows onboarding if no company)
 * - Renders child routes via <Outlet />
 */
const AppShell: React.FC = () => {
  const { loading, session, companyId } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto animate-pulse">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-orange-300">ChainLink CFO</p>
            <p className="text-lg text-white/80 mt-1">Preparing your workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!session) {
    // Preserve the intended destination for redirect after login
    const returnTo = location.pathname + location.search;
    return <Navigate to={`/auth?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  // Show company onboarding if user doesn't have a company yet
  if (!companyId) {
    return <CompanyOnboarding />;
  }

  // Render the child route content
  return <Outlet />;
};

export default AppShell;

