import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const CookiePolicy: React.FC = () => {
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
                <h1 className="text-4xl font-bold mb-2 text-wip-heading">Cookie Policy</h1>
                <p className="text-wip-muted mb-8">Effective Date: {effectiveDate}</p>

                <div className="prose prose-invert prose-lg max-w-none space-y-8">
                    <section>
                        <p className="text-wip-text leading-relaxed">
                            This Cookie Policy explains how WIP Insights uses cookies and similar technologies
                            to recognize you when you visit our Service. It explains what these technologies are
                            and why we use them, as well as your rights to control our use of them.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-wip-gold mb-4">1. What Are Cookies?</h2>
                        <p className="text-wip-text leading-relaxed">
                            Cookies are small data files placed on your computer or mobile device when you visit a website.
                            They are widely used to make websites work more efficiently and provide reporting information.
                            Cookies set by the website owner are called "first-party cookies." Cookies set by parties
                            other than the website owner are called "third-party cookies."
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-wip-gold mb-4">2. Types of Cookies We Use</h2>

                        <div className="space-y-4">
                            <div className="bg-wip-card rounded-xl p-6 border border-wip-border">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded">ESSENTIAL</span>
                                    <h3 className="font-semibold text-white">Essential Cookies</h3>
                                </div>
                                <p className="text-wip-muted text-sm mb-3">Required for the Service to function properly. Cannot be disabled.</p>
                                <ul className="text-wip-muted text-sm space-y-1">
                                    <li>• <strong>Authentication:</strong> Keep you logged in securely</li>
                                    <li>• <strong>Security:</strong> Prevent cross-site request forgery</li>
                                    <li>• <strong>Session:</strong> Remember your preferences during a session</li>
                                </ul>
                            </div>

                            <div className="bg-wip-card rounded-xl p-6 border border-wip-border">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded">FUNCTIONAL</span>
                                    <h3 className="font-semibold text-white">Functional Cookies</h3>
                                </div>
                                <p className="text-wip-muted text-sm mb-3">Remember your preferences and settings.</p>
                                <ul className="text-wip-muted text-sm space-y-1">
                                    <li>• <strong>Theme:</strong> Remember dark/light mode preference</li>
                                    <li>• <strong>Language:</strong> Remember language settings</li>
                                    <li>• <strong>UI State:</strong> Remember collapsed panels, sort orders</li>
                                </ul>
                            </div>

                            <div className="bg-wip-card rounded-xl p-6 border border-wip-border">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded">ANALYTICS</span>
                                    <h3 className="font-semibold text-white">Analytics Cookies</h3>
                                </div>
                                <p className="text-wip-muted text-sm mb-3">Help us understand how visitors interact with the Service.</p>
                                <ul className="text-wip-muted text-sm space-y-1">
                                    <li>• <strong>Page Views:</strong> Track which pages are visited</li>
                                    <li>• <strong>Feature Usage:</strong> Understand which features are popular</li>
                                    <li>• <strong>Performance:</strong> Monitor load times and errors</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-wip-gold mb-4">3. Local Storage</h2>
                        <p className="text-wip-text leading-relaxed">
                            In addition to cookies, we use browser local storage to store certain preferences
                            and state information on your device. This includes your theme preference,
                            active filters, and other UI settings to improve your experience.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-wip-gold mb-4">4. Third-Party Cookies</h2>
                        <p className="text-wip-text leading-relaxed mb-4">
                            Some cookies are placed by third-party services we use:
                        </p>
                        <div className="bg-wip-card rounded-xl p-6 border border-wip-border space-y-4">
                            <div>
                                <h3 className="font-semibold text-white">Supabase</h3>
                                <p className="text-wip-muted text-sm">Authentication and session management</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Stripe</h3>
                                <p className="text-wip-muted text-sm">Payment processing (fraud prevention)</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-wip-gold mb-4">5. Managing Cookies</h2>
                        <p className="text-wip-text leading-relaxed mb-4">
                            You can control cookies through your browser settings. Most browsers allow you to:
                        </p>
                        <ul className="list-disc list-inside text-wip-text space-y-2 ml-4">
                            <li>View what cookies are stored on your device</li>
                            <li>Delete cookies individually or all at once</li>
                            <li>Block third-party cookies</li>
                            <li>Block cookies from specific websites</li>
                            <li>Block all cookies</li>
                            <li>Delete cookies when you close your browser</li>
                        </ul>
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mt-4">
                            <p className="text-orange-300 text-sm">
                                ⚠️ Note: Blocking essential cookies may prevent you from using certain features of the Service.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-wip-gold mb-4">6. Changes to This Policy</h2>
                        <p className="text-wip-text leading-relaxed">
                            We may update this Cookie Policy from time to time. The updated version will be
                            indicated by an updated "Effective Date" at the top of this page.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-wip-gold mb-4">7. Contact Us</h2>
                        <p className="text-wip-text leading-relaxed">
                            If you have questions about our use of cookies:
                        </p>
                        <div className="bg-wip-card rounded-xl p-6 border border-wip-border mt-4">
                            <p className="text-white font-semibold">ChainLink CFO</p>
                            <p className="text-wip-muted">Email: privacy@wip-insights.com</p>
                        </div>
                    </section>
                </div>

                {/* Footer Links */}
                <div className="mt-12 pt-8 border-t border-wip-border flex flex-wrap gap-6 text-sm text-wip-muted">
                    <Link to="/legal/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                    <Link to="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                    <Link to="/legal/acceptable-use" className="hover:text-white transition-colors">Acceptable Use Policy</Link>
                </div>
            </main>
        </div>
    );
};

export default CookiePolicy;
