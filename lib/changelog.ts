/**
 * Change Log Utilities
 * 
 * Functions for loading, filtering, and managing changelog entries.
 * Entries are stored in data/changelog.json for easy developer maintenance.
 */

import { ChangeLogEntry, GroupedChangeLog, ChangeLogFilters, ChangeCategory } from '../types/changelog';
import changelogData from '../data/changelog.json';

// ============================================================================
// LocalStorage Keys
// ============================================================================

const LAST_VIEWED_KEY = 'changelog_last_viewed';

// ============================================================================
// Data Loading
// ============================================================================

/**
 * Get all changelog entries from the data file
 * Entries are returned sorted by releaseDate DESC (newest first)
 */
export function getAllEntries(): ChangeLogEntry[] {
  return (changelogData.entries as ChangeLogEntry[]).sort(
    (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
  );
}

/**
 * Get entries visible in the "What's New" drawer
 * Filters by isInAppVisible and optionally by date range
 */
export function getInAppEntries(daysBack: number = 60): ChangeLogEntry[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  
  return getAllEntries().filter(entry => {
    if (!entry.isInAppVisible) return false;
    return new Date(entry.releaseDate) >= cutoffDate;
  });
}

/**
 * Get entries for the public changelog page
 * Filters by isPublic flag
 */
export function getPublicEntries(): ChangeLogEntry[] {
  return getAllEntries().filter(entry => entry.isPublic);
}

/**
 * Get a single entry by ID
 */
export function getEntryById(id: string): ChangeLogEntry | undefined {
  return getAllEntries().find(entry => entry.id === id);
}

// ============================================================================
// Filtering
// ============================================================================

/**
 * Filter entries by category and search query
 */
export function filterEntries(
  entries: ChangeLogEntry[],
  filters: ChangeLogFilters
): ChangeLogEntry[] {
  return entries.filter(entry => {
    // Category filter
    if (filters.category && entry.category !== filters.category) {
      return false;
    }
    
    // Search filter (searches title, summary, and whyItMatters)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const searchable = [
        entry.title,
        entry.summary,
        entry.whyItMatters,
        ...(entry.tags || []),
      ].join(' ').toLowerCase();
      
      if (!searchable.includes(query)) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Get all unique categories from entries
 */
export function getCategories(): ChangeCategory[] {
  return ['Added', 'Improved', 'Fixed', 'Behavior Change'];
}

// ============================================================================
// Grouping
// ============================================================================

/**
 * Group entries by release date for display
 */
export function groupByDate(entries: ChangeLogEntry[]): GroupedChangeLog[] {
  const groups: Record<string, ChangeLogEntry[]> = {};
  
  entries.forEach(entry => {
    const date = entry.releaseDate;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
  });
  
  // Convert to array and sort by date DESC
  return Object.entries(groups)
    .map(([date, entries]) => ({ date, entries }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ============================================================================
// Unread Tracking (localStorage)
// ============================================================================

/**
 * Get the date when the user last viewed the changelog
 */
export function getLastViewedDate(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LAST_VIEWED_KEY);
}

/**
 * Mark changelog as viewed (stores current date)
 */
export function markAsViewed(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_VIEWED_KEY, new Date().toISOString().split('T')[0]);
}

/**
 * Get count of unread entries (entries since last viewed)
 */
export function getUnreadCount(): number {
  const lastViewed = getLastViewedDate();
  const entries = getInAppEntries();
  
  if (!lastViewed) {
    // If never viewed, all recent entries are "unread"
    return Math.min(entries.length, 5); // Cap at 5 to avoid overwhelming badge
  }
  
  return entries.filter(entry => entry.releaseDate > lastViewed).length;
}

/**
 * Check if there are any unread entries
 */
export function hasUnread(): boolean {
  return getUnreadCount() > 0;
}

// ============================================================================
// Date Formatting
// ============================================================================

/**
 * Format a date string for display
 * e.g., "2024-12-16" → "December 16, 2024"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00'); // Force local timezone
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a date string relative to today
 * e.g., "Today", "Yesterday", "3 days ago", "December 16"
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  
  return formatDate(dateString);
}

