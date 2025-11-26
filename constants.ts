export const APP_URL = 'https://WIP-Insights.com';

export const APP_PAGES = {
  home: APP_URL,
  about: `${APP_URL}/about`,
  blog: `${APP_URL}/blog`,
  contact: `${APP_URL}/contact`,
  privacy: `${APP_URL}/privacy`,
  terms: `${APP_URL}/terms`,
} as const;

export type AppPageKey = keyof typeof APP_PAGES;

/**
 * Email allowlist for beta access
 * Only emails in this list can create new accounts
 * To add users, simply add their email address to this array
 */
export const ALLOWED_EMAILS = [
  'martin@junctionpeak.com',
  'scott@junctionpeak.com',
  'jordan@blueriver.com',
  'todd@ranchfenceinc.com',
] as const;

/**
 * Check if an email is allowed to sign up
 */
export const isEmailAllowed = (email: string): boolean => {
  const normalizedEmail = email.toLowerCase().trim();
  return ALLOWED_EMAILS.some(allowed => allowed.toLowerCase() === normalizedEmail);
};

