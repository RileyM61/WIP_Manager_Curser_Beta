import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const AcceptableUsePolicy: React.FC = () => {
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
                <h1 className="text-4xl font-bold mb-2">Acceptable Use Policy</h1>
                <p className="text-white/60 mb-8">Effective Date: {effectiveDate}</p>

                <div className="prose prose-invert prose-lg max-w-none space-y-8">
                    <section>
                        <p className="text-white/80 leading-relaxed">
                            This Acceptable Use Policy ("AUP") governs your use of WIP Insights and is part of our
                            Terms of Service. By using the Service, you agree to comply with this policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-orange-400 mb-4">1. Prohibited Activities</h2>
                        <p className="text-white/80 leading-relaxed mb-4">You may not use the Service to:</p>

                        <h3 className="text-xl font-medium text-white mt-6 mb-3">1.1 Illegal Activities</h3>
                        <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                            <li>Violate any applicable laws, regulations, or legal rights</li>
                            <li>Engage in fraud, money laundering, or financial crimes</li>
                            <li>Evade taxes or misrepresent financial information</li>
                            <li>Infringe on intellectual property rights</li>
                        </ul>

                        <h3 className="text-xl font-medium text-white mt-6 mb-3">1.2 Security Violations</h3>
                        <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                            <li>Attempt to gain unauthorized access to the Service or related systems</li>
                            <li>Probe, scan, or test vulnerabilities without authorization</li>
                            <li>Breach or circumvent security measures</li>
                            <li>Interfere with service to any user, host, or network</li>
                            <li>Transmit viruses, worms, malware, or harmful code</li>
                        </ul>

                        <h3 className="text-xl font-medium text-white mt-6 mb-3">1.3 Abuse of Service</h3>
                        <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                            <li>Use automated systems (bots, scrapers) without permission</li>
                            <li>Reverse engineer, decompile, or disassemble the Service</li>
                            <li>Attempt to extract source code or proprietary algorithms</li>
                            <li>Exceed rate limits or abuse API access</li>
                            <li>Create multiple accounts to bypass limitations</li>
                        </ul>

                        <h3 className="text-xl font-medium text-white mt-6 mb-3">1.4 Account Misuse</h3>
                        <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                            <li>Share login credentials with unauthorized users</li>
                            <li>Allow access to your account by third parties</li>
                            <li>Impersonate another person or organization</li>
                            <li>Misrepresent your affiliation with any entity</li>
                        </ul>

                        <h3 className="text-xl font-medium text-white mt-6 mb-3">1.5 Harmful Content</h3>
                        <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                            <li>Upload content that is defamatory, obscene, or harassing</li>
                            <li>Submit false or misleading information</li>
                            <li>Store or transmit content that violates third-party rights</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-orange-400 mb-4">2. AI Feature Usage</h2>
                        <p className="text-white/80 leading-relaxed mb-4">
                            When using AI-powered features, you agree not to:
                        </p>
                        <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                            <li>Attempt to manipulate AI outputs for fraudulent purposes</li>
                            <li>Use AI features to generate misleading financial data</li>
                            <li>Submit prompts designed to extract training data or models</li>
                            <li>Rely solely on AI outputs without human verification for critical decisions</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-orange-400 mb-4">3. Data Restrictions</h2>
                        <p className="text-white/80 leading-relaxed mb-4">You may not:</p>
                        <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                            <li>Upload data you do not have the right to use</li>
                            <li>Store sensitive personal data (SSN, health records) beyond what's necessary</li>
                            <li>Use the Service to process data in violation of privacy laws</li>
                            <li>Transfer data to unauthorized third parties</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-orange-400 mb-4">4. Enforcement</h2>
                        <p className="text-white/80 leading-relaxed mb-4">
                            Violations of this AUP may result in:
                        </p>
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6 space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="text-orange-400">⚠️</span>
                                <span className="text-white/80">Warning and request for immediate compliance</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-orange-400">🔒</span>
                                <span className="text-white/80">Temporary suspension of access</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-orange-400">🚫</span>
                                <span className="text-white/80">Permanent termination of account</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-orange-400">⚖️</span>
                                <span className="text-white/80">Legal action if warranted</span>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-orange-400 mb-4">5. Reporting Violations</h2>
                        <p className="text-white/80 leading-relaxed">
                            If you believe someone is violating this AUP, please report it to:
                        </p>
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10 mt-4">
                            <p className="text-white font-semibold">ChainLink CFO - Security Team</p>
                            <p className="text-white/60">Email: security@wip-insights.com</p>
                        </div>
                    </section>
                </div>

                {/* Footer Links */}
                <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-6 text-sm text-white/60">
                    <Link to="/legal/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                    <Link to="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                    <Link to="/legal/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
                </div>
            </main>
        </div>
    );
};

export default AcceptableUsePolicy;
