import React, { useState } from 'react';
import { getGlossaryEntries, HelpContent } from '../lib/helpContent';

interface GlossaryPageProps {
  onBack: () => void;
}

const categoryLabels: Record<HelpContent['category'], string> = {
  basics: 'Job Basics',
  financials: 'Financials',
  billing: 'Billing & Invoicing',
  metrics: 'Performance Metrics',
  settings: 'Settings',
};

const categoryColors: Record<HelpContent['category'], string> = {
  basics: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  financials: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  billing: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  metrics: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  settings: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const GlossaryPage: React.FC<GlossaryPageProps> = ({ onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HelpContent['category'] | 'all'>('all');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const allEntries = getGlossaryEntries();
  
  const filteredEntries = allEntries.filter(entry => {
    const matchesSearch = searchTerm === '' || 
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.short.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.detailed.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories: Array<HelpContent['category']> = ['basics', 'financials', 'billing', 'metrics', 'settings'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold">WIP Glossary</h1>
                <p className="text-blue-100 text-sm mt-1">Learn the terminology used in Work-in-Progress reporting</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg">
              <span className="text-2xl">📚</span>
              <span className="text-sm font-medium">{allEntries.length} terms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
          {/* Search */}
          <div className="relative mb-4">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search terms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="space-y-3">
          {filteredEntries.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No terms found matching "{searchTerm}"</p>
            </div>
          ) : (
            filteredEntries.map(entry => (
              <div
                key={entry.key}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
              >
                {/* Entry Header */}
                <button
                  onClick={() => setExpandedItem(expandedItem === entry.key ? null : entry.key)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{entry.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[entry.category]}`}>
                      {categoryLabels[entry.category]}
                    </span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedItem === entry.key ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Quick Summary (always visible) */}
                <div className="px-5 pb-4">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{entry.short}</p>
                </div>

                {/* Expanded Content */}
                {expandedItem === entry.key && (
                  <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-gray-700 space-y-4">
                    {/* Detailed Explanation */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Detailed Explanation
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                        {entry.detailed}
                      </p>
                    </div>

                    {/* Formula */}
                    {entry.formula && (
                      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-2">
                          Formula
                        </h4>
                        <code className="text-blue-800 dark:text-blue-200 font-mono text-sm">
                          {entry.formula}
                        </code>
                      </div>
                    )}

                    {/* Example */}
                    {entry.example && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                        <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-2">
                          Example
                        </h4>
                        <p className="text-amber-800 dark:text-amber-200 text-sm whitespace-pre-line">
                          {entry.example}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Back to App Button */}
        <div className="mt-8 text-center">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to App
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlossaryPage;

