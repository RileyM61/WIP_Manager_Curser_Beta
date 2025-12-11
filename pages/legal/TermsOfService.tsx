import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TermsContent } from '../../components/legal/TermsContent';

const TermsOfService: React.FC = () => {
    const navigate = useNavigate();
    const effectiveDate = 'December 9, 2024';

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <img src="/images/wip-insights-logo.png" alt="WIP Insights" className="h-12 w-auto" />
                    </Link>
                    <button
                        onClick={() => navigate(-1)}
                        className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                        ← Back
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="container mx-auto px-4 py-12 max-w-4xl">
                <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
                <p className="text-white/60 mb-8">Effective Date: {effectiveDate}</p>

                <TermsContent />

                {/* Footer Links */}
                <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-6 text-sm text-white/60">
                    <Link to="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                    <Link to="/legal/acceptable-use" className="hover:text-white transition-colors">Acceptable Use Policy</Link>
                    <Link to="/legal/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
                </div>
            </main>
        </div>
    );
};

export default TermsOfService;
