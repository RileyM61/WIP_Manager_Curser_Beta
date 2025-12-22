import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TermsContent } from '../../components/legal/TermsContent';

const TermsOfService: React.FC = () => {
    const navigate = useNavigate();
    const effectiveDate = 'December 9, 2024';

    return (
        <div className="min-h-screen bg-wip-dark text-wip-text font-sans">
            {/* Header */}
            <header className="border-b border-wip-border bg-wip-card/80 backdrop-blur sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <img src="/images/wip-insights-logo.png" alt="WIP Insights" className="h-12 w-auto" />
                    </Link>
                    <button
                        onClick={() => navigate(-1)}
                        className="text-sm text-wip-muted hover:text-wip-heading transition-colors"
                    >
                        ← Back
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="container mx-auto px-4 py-12 max-w-4xl">
                <h1 className="text-4xl font-bold mb-2 text-wip-heading">Terms of Service</h1>
                <p className="text-wip-muted mb-8">Effective Date: {effectiveDate}</p>

                <TermsContent />

                {/* Footer Links */}
                <div className="mt-12 pt-8 border-t border-wip-border flex flex-wrap gap-6 text-sm text-wip-muted">
                    <Link to="/legal/privacy" className="hover:text-wip-heading transition-colors">Privacy Policy</Link>
                    <Link to="/legal/acceptable-use" className="hover:text-wip-heading transition-colors">Acceptable Use Policy</Link>
                    <Link to="/legal/cookies" className="hover:text-wip-heading transition-colors">Cookie Policy</Link>
                </div>
            </main>
        </div>
    );
};

export default TermsOfService;
