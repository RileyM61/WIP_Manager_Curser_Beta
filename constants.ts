// ============================================================================
// APP CONFIGURATION
// ============================================================================

export const APP_URL = 'https://chainlinkcfo.com';
export const WIP_INSIGHTS_URL = 'https://wip-insights.com';

// ============================================================================
// ROUTE CONSTANTS
// ============================================================================

export const ROUTES = {
  // Landing pages
  home: '/',
  wipLanding: '/wip',

  // Auth
  auth: '/auth',

  // Protected app routes
  app: '/app',
  dashboard: '/app',

  // Module routes
  wip: '/app/wip',
  forecasting: '/app/forecasting',
  capacity: '/app/capacity',
  budget: '/app/budget',
  jcurve: '/app/jcurve',
  covenant: '/app/covenant',
  profitability: '/app/profitability',
  bidnobid: '/app/bidnobid',
  scenarios: '/app/scenarios',
  reporting: '/app/reporting',
} as const;

export type RouteKey = keyof typeof ROUTES;

// Helper to get module route
export const getModuleRoute = (moduleId: string): string => {
  return `/app/${moduleId}`;
};

// ============================================================================
// EXTERNAL PAGES (for marketing site links)
// ============================================================================

export const APP_PAGES = {
  home: APP_URL,
  about: `${APP_URL}/about`,
  blog: `${APP_URL}/blog`,
  contact: `${APP_URL}/contact`,
  privacy: `${APP_URL}/privacy`,
  terms: `${APP_URL}/terms`,
  wipInsights: WIP_INSIGHTS_URL,
} as const;

export type AppPageKey = keyof typeof APP_PAGES;

// ============================================================================
// BETA ACCESS CONTROL
// ============================================================================

/**
 * Email allowlist for beta access
 * Only emails in this list can create new accounts
 * To add users, simply add their email address to this array
 */
export const ALLOWED_EMAILS = [
  'martin@junctionpeak.com',
  'martinjunctionpeak@gmail.com',
  'scott@junctionpeak.com',
  'jordan@blueriver.com',
  'todd@ranchfenceinc.com',
<<<<<<< HEAD
  'cwdpsd@gmail.com',
=======
  'newbie@test.com',
  'ninja@test.com',
>>>>>>> dev
] as const;

/**
 * Check if an email is allowed to sign up
 */
export const isEmailAllowed = (email: string): boolean => {
  const normalizedEmail = email.toLowerCase().trim();
  return ALLOWED_EMAILS.some(allowed => allowed.toLowerCase() === normalizedEmail);
};

// ============================================================================
// APP BRANDING
// ============================================================================

export const BRANDING = {
  appName: 'ChainLink CFO',
  productName: 'ChainLink CFO Suite',
  wipProductName: 'WIP Insights',
  tagline: 'The Complete Financial Toolkit for Contractors',
  supportEmail: 'support@chainlinkcfo.com',
  salesEmail: 'sales@chainlinkcfo.com',
} as const;
