import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
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
                <h1 className="text-4xl font-bold mb-2 text-wip-heading">Privacy Policy</h1>
                <p className="text-wip-muted mb-8">Effective Date: {effectiveDate}</p>

                <div className="prose prose-invert prose-lg max-w-none space-y-8">
                    <section>
                        <p className="text-wip-text leading-relaxed">
                            ChainLink CFO ("Company," "we," "us," or "our") is committed to protecting your privacy.
                            This Privacy Policy explains how we collect, use, disclose, and safeguard your information
                            when you use WIP Insights ("Service").
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-wip-gold mb-4">1. Information We Collect</h2>

                        <h3 className="text-xl font-medium text-white mt-6 mb-3">1.1 Information You Provide</h3>
                        <ul className="list-disc list-inside text-wip-text space-y-2 ml-4">
                            <li><strong>Account Information:</strong> Email address, password, company name</li>
                            <li><strong>Profile Information:</strong> Name, role, industry, company size</li>
                            <li><strong>Business Data:</strong> Job information, financial data (contracts, invoices, costs, budgets), project schedules, notes</li>
                            <li><strong>Payment Information:</strong> Billing address (payment card details are processed by Stripe and never stored on our servers)</li>
                            <li><strong>Communications:</strong> Support requests, feedback, survey responses</li>
                        </ul>

                        <h3 className="text-xl font-medium text-white mt-6 mb-3">1.2 Information Collected Automatically</h3>
                        <ul className="list-disc list-inside text-wip-text space-y-2 ml-4">
                            <li><strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
                            <li><strong>Usage Data:</strong> Pages visited, features used, time spent, click patterns</li>
                            <li><strong>Log Data:</strong> IP address, access times, referring URLs</li>
                            <li><strong>Cookies:</strong> See our Cookie Policy for details</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-wip-gold mb-4">2. How We Use Your Information</h2>
                        <p className="text-wip-text leading-relaxed mb-4">We use your information to:</p>
                        <ul className="list-disc list-inside text-wip-text space-y-2 ml-4">
                            <li>Provide, maintain, and improve the Service</li>
                            <li>Process transactions and send related information</li>
                            <li>Send administrative notifications (e.g., security alerts, updates)</li>
                            <li>Respond to your comments, questions, and support requests</li>
                            <li>Analyze usage patterns to improve user experience</li>
                            <li>Detect, prevent, and address technical issues or fraud</li>
                            <li>Generate anonymized, aggregate statistics</li>
                            <li>Provide optional AI-assisted features (when enabled), including generating responses based on user prompts and permitted workspace data</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-wip-gold mb-4">3. Data Sharing and Third Parties</h2>
                        <p className="text-wip-text leading-relaxed mb-4">
                            We do not sell your personal information. We may share data with:
                        </p>
                        <div className="bg-wip-card rounded-xl p-6 border border-wip-border space-y-4">
                            <div>
                                <h3 className="font-semibold text-white">Supabase</h3>
                                <p className="text-wip-muted text-sm">Database hosting and authentication services</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Stripe</h3>
                                <p className="text-wip-muted text-sm">Payment processing (PCI-DSS compliant)</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">AI Service Providers (Optional)</h3>
                                <p className="text-wip-muted text-sm">If enabled, AI-assisted features may be processed by third-party AI service providers acting as service providers/processors</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Analytics Providers</h3>
                                <p className="text-wip-muted text-sm">Service usage analysis (anonymized where possible)</p>
                            </div>
                        </div>
                        <div className="mt-6 space-y-3 text-wip-text leading-relaxed">
                            <h3 className="text-xl font-medium text-white">3.1 AI Features (Optional)</h3>
                            <ul className="list-disc list-inside text-wip-text space-y-2 ml-4">
                                <li>
                                    <strong>What may be shared:</strong> If AI Features are enabled or used, we may share your prompt and relevant workspace/company data
                                    (for example: job records, financial fields, schedules, notes, snapshots, and other data stored in the Service) with AI service providers
                                    to generate outputs.
                                </li>
                                <li>
                                    <strong>Workspace admin controls:</strong> We may provide workspace administrator controls to limit which categories of workspace data are included in AI processing
                                    (for example, excluding notes or client identifiers). When configured, we will honor these workspace-wide settings when providing AI Features.
                                </li>
                                <li>
                                    <strong>Data minimization:</strong> We aim to share only the minimum data reasonably necessary to fulfill the request, subject to the context required for the feature to work.
                                </li>
                                <li>
                                    <strong>No sale / no advertising use:</strong> We do not sell your data. We do not permit AI service providers to use your data for their own marketing purposes.
                                </li>
                                <li>
                                    <strong>Training:</strong> We do not allow AI service providers to use your workspace data to train their public AI models unless you explicitly opt in (if offered).
                                </li>
                                <li>
                                    <strong>Retention:</strong> AI inputs/outputs may be retained for a limited period to provide the Service, improve reliability and safety, prevent abuse, and comply with legal obligations.
                                </li>
                                <li>
                                    <strong>User guidance:</strong> Avoid including sensitive personal information in prompts (e.g., Social Security numbers, health data) unless necessary and you have the right to provide it.
                                </li>
                            </ul>
                        </div>
                        <p className="text-wip-text leading-relaxed mt-4">
                            We may also disclose information if required by law, to protect our rights, or in connection
                            with a merger, acquisition, or sale of assets.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-wip-gold mb-4">4. Data Retention</h2>
                        <p className="text-wip-text leading-relaxed">
                            We retain your information for as long as your account is active or as needed to provide services.
                            After account deletion, we may retain certain data for up to 2 years for legal compliance,
                            dispute resolution, and legitimate business purposes. Anonymized data may be retained indefinitely.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-wip-gold mb-4">5. Data Security</h2>
                        <p className="text-wip-text leading-relaxed mb-4">
                            We implement appropriate technical and organizational measures to protect your data:
                        </p>
                        <ul className="list-disc list-inside text-wip-text space-y-2 ml-4">
                            <li>Encryption in transit (TLS/HTTPS) and at rest</li>
                            <li>Regular security assessments</li>
                            <li>Access controls and authentication</li>
                            <li>Secure data centers with physical security</li>
                        </ul>
                        <p className="text-wip-text leading-relaxed mt-4">
                            However, no method of transmission or storage is 100% secure. We cannot guarantee absolute security.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-wip-gold mb-4">6. Your Rights</h2>
                        <p className="text-wip-text leading-relaxed mb-4">
                            Depending on your jurisdiction, you may have the right to:
                        </p>
                        <ul className="list-disc list-inside text-wip-text space-y-2 ml-4">
                            <li><strong>Access:</strong> Request a copy of your personal data</li>
                            <li><strong>Correction:</strong> Request correction of inaccurate data</li>
                            <li><strong>Deletion:</strong> Request deletion of your data</li>
                            <li><strong>Portability:</strong> Request your data in a portable format</li>
                            <li><strong>Restriction:</strong> Request restriction of processing</li>
                            <li><strong>Objection:</strong> Object to certain processing activities</li>
                            <li><strong>Withdraw Consent:</strong> Where processing is based on consent</li>
                        </ul>
                        <p className="text-wip-text leading-relaxed mt-4">
                            To exercise these rights, contact us at privacy@wip-insights.com.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-wip-gold mb-4">7. California Privacy Rights (CCPA)</h2>
                        <p className="text-wip-text leading-relaxed mb-4">
                            California residents have additional rights:
                        </p>
                        <ul className="list-disc list-inside text-wip-text space-y-2 ml-4">
                            <li>Right to know what personal information is collected</li>
                            <li>Right to know if personal information is sold or disclosed</li>
                            <li>Right to say no to the sale of personal information</li>
                            <li>Right to equal service and price</li>
                        </ul>
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mt-4">
                            <p className="text-green-300 font-medium">We do not sell your personal information.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-wip-gold mb-4">8. International Data Transfers</h2>
                        <p className="text-wip-text leading-relaxed">
                            Your information may be transferred to and processed in countries other than your own.
                            We ensure appropriate safeguards are in place, including standard contractual clauses
                            where required by applicable law.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-wip-gold mb-4">9. Children's Privacy</h2>
                        <p className="text-wip-text leading-relaxed">
                            The Service is not intended for individuals under 18 years of age. We do not knowingly
                            collect personal information from children. If we learn we have collected information
                            from a child, we will delete it promptly.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-wip-gold mb-4">10. Changes to This Policy</h2>
                        <p className="text-wip-text leading-relaxed">
                            We may update this Privacy Policy from time to time. We will notify you of material changes
                            by email or through the Service. Your continued use after changes become effective
                            constitutes acceptance of the updated policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-wip-gold mb-4">11. Contact Us</h2>
                        <p className="text-wip-text leading-relaxed">
                            For privacy-related questions or to exercise your rights:
                        </p>
                        <div className="bg-wip-card rounded-xl p-6 border border-wip-border mt-4">
                            <p className="text-white font-semibold">ChainLink CFO - Privacy Team</p>
                            <p className="text-wip-muted">Email: privacy@wip-insights.com</p>
                        </div>
                    </section>
                </div>

                {/* Footer Links */}
                <div className="mt-12 pt-8 border-t border-wip-border flex flex-wrap gap-6 text-sm text-wip-muted">
                    <Link to="/legal/terms" className="hover:text-wip-heading transition-colors">Terms of Service</Link>
                    <Link to="/legal/acceptable-use" className="hover:text-wip-heading transition-colors">Acceptable Use Policy</Link>
                    <Link to="/legal/cookies" className="hover:text-wip-heading transition-colors">Cookie Policy</Link>
                </div>
            </main>
        </div>
    );
};

export default PrivacyPolicy;
