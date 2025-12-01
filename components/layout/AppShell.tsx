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
          <img 
            src="/images/chainlink-cfo-logo.png" 
            alt="ChainLink CFO" 
            className="h-40 w-auto mx-auto animate-pulse"
          />
          <p className="text-lg text-white/80">Preparing your workspace...</p>
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

