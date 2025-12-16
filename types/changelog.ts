/**
 * Change Log Types
 * 
 * Types for the product Change Log system.
 * Designed for construction finance professionals - all copy must be
 * written in plain language with explicit "why it matters" context.
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Change category - what type of change was made
 */
export type ChangeCategory = 'Added' | 'Improved' | 'Fixed' | 'Behavior Change';

/**
 * Action required by the user after this change
 */
export type ActionRequired = 'None' | 'Recommended' | 'Required';

/**
 * A single change log entry
 * 
 * IMPORTANT: All text fields should be written for construction owners
 * and finance leaders. Avoid technical jargon. Always explain impact.
 */
export interface ChangeLogEntry {
  /** Unique identifier (e.g., "2024-12-16-margin-alerts") */
  id: string;
  
  /** Optional version number (e.g., "2.1.0") */
  version?: string;
  
  /** User-facing title - what changed in 5-10 words */
  title: string;
  
  /** Type of change */
  category: ChangeCategory;
  
  /** 1-2 sentence summary in plain English */
  summary: string;
  
  /**
   * REQUIRED: Explicit explanation of user impact.
   * Answer: "Why should a CFO or contractor care about this?"
   */
  whyItMatters: string;
  
  /** Does the user need to do anything? */
  actionRequired: ActionRequired;
  
  /** Optional: What action should they take? */
  actionDescription?: string;
  
  /** Release date (ISO format: "2024-12-16") */
  releaseDate: string;
  
  /** Show on public /changelog page */
  isPublic: boolean;
  
  /** Show in "What's New" drawer */
  isInAppVisible: boolean;
  
  /**
   * Optional tags for future filtering
   * Examples: ["WIP Logic", "Billing", "Reports", "Performance"]
   */
  tags?: string[];
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * Grouped entries by date for display
 */
export interface GroupedChangeLog {
  date: string;
  entries: ChangeLogEntry[];
}

/**
 * Filter options for the change log page
 */
export interface ChangeLogFilters {
  category?: ChangeCategory;
  searchQuery?: string;
}

// ============================================================================
// Category Metadata
// ============================================================================

/**
 * Display configuration for each category
 */
export const CATEGORY_CONFIG: Record<ChangeCategory, {
  label: string;
  color: string;
  bgColor: string;
  darkBgColor: string;
  icon: string;
}> = {
  'Added': {
    label: 'Added',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-100',
    darkBgColor: 'dark:bg-emerald-900/30',
    icon: '+',
  },
  'Improved': {
    label: 'Improved',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100',
    darkBgColor: 'dark:bg-blue-900/30',
    icon: '↑',
  },
  'Fixed': {
    label: 'Fixed',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100',
    darkBgColor: 'dark:bg-amber-900/30',
    icon: '✓',
  },
  'Behavior Change': {
    label: 'Changed',
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-100',
    darkBgColor: 'dark:bg-purple-900/30',
    icon: '~',
  },
};

/**
 * Action required badge configuration
 */
export const ACTION_REQUIRED_CONFIG: Record<ActionRequired, {
  label: string;
  color: string;
  bgColor: string;
  show: boolean;
}> = {
  'None': {
    label: '',
    color: '',
    bgColor: '',
    show: false,
  },
  'Recommended': {
    label: 'Action Recommended',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800',
    show: true,
  },
  'Required': {
    label: 'Action Required',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800',
    show: true,
  },
};

