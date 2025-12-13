import React, { useMemo, useState } from 'react';
import { Transition } from '@headlessui/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { XIcon } from '../shared/icons';
import { getWipKnowledgeDoc, wipKnowledgeDocs } from './wipKnowledge';

interface KnowledgeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialDocId?: string | null;
}

export const KnowledgeDrawer: React.FC<KnowledgeDrawerProps> = ({ isOpen, onClose, initialDocId }) => {
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(initialDocId || null);

  // Keep active doc aligned when caller changes initialDocId (e.g. "Learn why" click)
  React.useEffect(() => {
    if (initialDocId) setActiveId(initialDocId);
  }, [initialDocId]);

  const filteredDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return wipKnowledgeDocs;
    return wipKnowledgeDocs.filter((d) => {
      return (
        d.title.toLowerCase().includes(q) ||
        d.section.toLowerCase().includes(q) ||
        d.path.toLowerCase().includes(q)
      );
    });
  }, [query]);

  const doc = useMemo(() => {
    if (!activeId) return undefined;
    return getWipKnowledgeDoc(activeId);
  }, [activeId]);

  return (
    <Transition show={isOpen} className="fixed inset-0 z-50">
      {/* Overlay */}
      <Transition.Child
        enter="transition-opacity ease-out duration-150"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity ease-in duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      </Transition.Child>

      {/* Drawer */}
      <Transition.Child
        enter="transform transition ease-out duration-200"
        enterFrom="translate-x-full"
        enterTo="translate-x-0"
        leave="transform transition ease-in duration-150"
        leaveFrom="translate-x-0"
        leaveTo="translate-x-full"
      >
        <div className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Knowledge
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">WIP CFO</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Educational guidance only. Verify with your CPA/legal counsel before relying on this for reporting, tax, or contract decisions.
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label="Close knowledge"
            >
              <XIcon />
            </button>
          </div>

          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search topics…"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Sidebar */}
            <div className="w-80 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
              {filteredDocs.map((d) => {
                const isActive = d.id === activeId;
                return (
                  <button
                    key={d.id}
                    onClick={() => setActiveId(d.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60 ${
                      isActive ? 'bg-amber-50 dark:bg-amber-900/20' : ''
                    }`}
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {d.section}
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{d.title}</div>
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {!doc ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Select a topic on the left to view it.
                </div>
              ) : (
                <article className="prose prose-slate max-w-none dark:prose-invert prose-headings:scroll-mt-20">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.markdown}</ReactMarkdown>
                </article>
              )}
            </div>
          </div>
        </div>
      </Transition.Child>
    </Transition>
  );
};


