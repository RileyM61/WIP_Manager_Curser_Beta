import React, { useState, useRef, useEffect } from 'react';
import { TermsContent } from '../legal/TermsContent';

interface TermsModalProps {
    onAccept: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ onAccept }) => {
    const [canAccept, setCanAccept] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (contentRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
            // Allow acceptance if user is within 50px of the bottom
            if (scrollHeight - scrollTop - clientHeight < 50) {
                setCanAccept(true);
            }
        }
    };

    // Check if content fits without scrolling
    useEffect(() => {
        if (contentRef.current) {
            const { scrollHeight, clientHeight } = contentRef.current;
            if (scrollHeight <= clientHeight) {
                setCanAccept(true);
            }
        }
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-4xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Terms of Service Update</h2>
                        <p className="text-white/60 mt-1">Please review and accept our Terms of Service to continue.</p>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div
                    ref={contentRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-6 scroll-smooth"
                >
                    <TermsContent />
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-slate-900/50 flex flex-col gap-4 shrink-0 rounded-b-2xl">
                    {!canAccept && (
                        <div className="text-amber-400 text-sm text-center animate-pulse">
                            Please scroll to the bottom to accept
                        </div>
                    )}
                    <button
                        onClick={onAccept}
                        disabled={!canAccept}
                        className={`
              w-full py-4 px-6 rounded-xl font-bold text-lg transition-all
              ${canAccept
                                ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/20 transform hover:scale-[1.01]'
                                : 'bg-white/5 text-white/40 cursor-not-allowed'
                            }
            `}
                    >
                        I Accept the Terms of Service
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TermsModal;
