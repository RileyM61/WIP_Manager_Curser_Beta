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

