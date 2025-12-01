import React, { useState, useEffect } from 'react';
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
  
  // Track if we've successfully authenticated at least once
  // This prevents the loading screen from showing during token refresh
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Once we have a session and we're not loading, mark as initialized
    if (!loading && session) {
      setHasInitialized(true);
    }
    // Reset if session is explicitly lost (user signed out)
    if (!loading && !session) {
      setHasInitialized(false);
    }
  }, [loading, session]);

  // Only show loading on INITIAL load, not during token refresh
  // If we've already initialized (user was logged in), keep showing the app
  if (loading && !hasInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-4">
          <img 
            src="/images/chainlink-cfo-logo.png" 
            alt="ChainLink CFO" 
            className="h-80 w-auto mx-auto animate-pulse"
          />
          <p className="text-lg text-white/80">Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in (and not still loading)
  if (!loading && !session) {
    // Preserve the intended destination for redirect after login
    const returnTo = location.pathname + location.search;
    return <Navigate to={`/auth?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  // Show company onboarding if user doesn't have a company yet
  if (!companyId && !loading) {
    return <CompanyOnboarding />;
  }

  // Render the child route content
  return <Outlet />;
};

export default AppShell;

