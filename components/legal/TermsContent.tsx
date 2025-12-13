import React from 'react';

export const TermsContent: React.FC = () => {
    return (
        <div className="prose prose-invert prose-lg max-w-none space-y-8">
            <section>
                <p className="text-white/80 leading-relaxed">
                    Welcome to WIP Insights ("Service"), operated by ChainLink CFO ("Company," "we," "us," or "our").
                    By accessing or using our Service, you agree to be bound by these Terms of Service ("Terms").
                    Please read them carefully.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-orange-400 mb-4">1. Acceptance of Terms</h2>
                <p className="text-white/80 leading-relaxed">
                    By creating an account or using the Service, you agree to these Terms, our Privacy Policy,
                    and our Acceptable Use Policy. If you do not agree to these Terms, do not use the Service.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-orange-400 mb-4">2. Eligibility</h2>
                <p className="text-white/80 leading-relaxed">
                    You must be at least 18 years old and have the legal capacity to enter into a binding agreement
                    to use the Service. The Service is intended for business use only. By using the Service, you
                    represent that you are authorized to bind your company or organization to these Terms.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-orange-400 mb-4">3. Account Registration</h2>
                <p className="text-white/80 leading-relaxed mb-4">
                    To access certain features, you must create an account. You agree to:
                </p>
                <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                    <li>Provide accurate, current, and complete information</li>
                    <li>Maintain and update your information as needed</li>
                    <li>Keep your password secure and confidential</li>
                    <li>Accept responsibility for all activities under your account</li>
                    <li>Notify us immediately of any unauthorized access</li>
                </ul>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-orange-400 mb-4">4. Subscription Plans</h2>
                <p className="text-white/80 leading-relaxed mb-4">
                    We offer the following subscription tiers:
                </p>
                <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
                    <div>
                        <h3 className="font-semibold text-white">Free Tier</h3>
                        <p className="text-white/60 text-sm">Limited to 10 active jobs. Basic features included.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">Pro Tier</h3>
                        <p className="text-white/60 text-sm">Unlimited jobs, advanced reporting, priority support, and all premium features.</p>
                    </div>
                </div>
                <p className="text-white/80 leading-relaxed mt-4">
                    Paid subscriptions are billed in advance on a monthly or annual basis. All fees are non-refundable
                    except as required by law or as explicitly stated in these Terms.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-orange-400 mb-4">5. User Content and Data</h2>
                <p className="text-white/80 leading-relaxed mb-4">
                    You retain all ownership rights to the data you submit to the Service ("User Content").
                    By using the Service, you grant us a limited license to:
                </p>
                <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                    <li>Store, process, and display your User Content to provide the Service</li>
                    <li>Create backups for data protection purposes</li>
                    <li>Generate anonymized, aggregated statistics to improve the Service</li>
                </ul>
                <p className="text-white/80 leading-relaxed mt-4">
                    You are solely responsible for the accuracy and legality of your User Content.
                    We do not claim ownership of your business data.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-orange-400 mb-4">6. AI-Assisted Features; No Professional Advice</h2>
                <p className="text-white/80 leading-relaxed mb-4">
                    The Service may offer optional AI-assisted features ("AI Features") that can generate guidance, explanations,
                    suggested workflows, or interpretations based on information you provide.
                </p>
                <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                    <li>
                        <strong>No professional advice:</strong> AI Features are provided for informational and educational purposes only and do not constitute
                        accounting, audit, tax, legal, financial, investment, or other professional advice. ChainLink CFO is not acting as your accountant, auditor,
                        tax advisor, attorney, fiduciary, or financial advisor through the Service.
                    </li>
                    <li>
                        <strong>Workspace admin controls:</strong> If your workspace administrator enables AI Features, they may configure controls that limit which categories
                        of workspace data are included (for example, excluding notes or client identifiers). Those settings apply workspace-wide.
                    </li>
                    <li>
                        <strong>Optional third-party processing:</strong> If AI Features are enabled or used, your inputs (including prompts and relevant workspace/company data permitted by your settings)
                        and AI outputs may be processed by third-party AI service providers acting as service providers/processors to deliver the AI Features.
                    </li>
                    <li>
                        <strong>Your responsibility:</strong> You are responsible for ensuring your AI settings reflect your organization’s policies and contractual obligations, including any confidentiality requirements.
                        You are solely responsible for validating inputs and outputs and for all decisions, filings, compliance obligations, reporting, and business outcomes.
                    </li>
                    <li>
                        <strong>No guarantees:</strong> AI outputs may be inaccurate, incomplete, outdated, or unsuitable for your situation. Do not rely on AI outputs as the sole basis for business-critical decisions.
                    </li>
                </ul>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-orange-400 mb-4">7. Prohibited Uses</h2>
                <p className="text-white/80 leading-relaxed mb-4">
                    You agree not to:
                </p>
                <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                    <li>Use the Service for any unlawful purpose</li>
                    <li>Attempt to gain unauthorized access to any part of the Service</li>
                    <li>Interfere with or disrupt the Service or servers</li>
                    <li>Reverse engineer, decompile, or attempt to extract source code</li>
                    <li>Use automated systems to access the Service without permission</li>
                    <li>Share your account credentials with unauthorized parties</li>
                    <li>Transmit viruses, malware, or other harmful code</li>
                </ul>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-orange-400 mb-4">8. Intellectual Property</h2>
                <p className="text-white/80 leading-relaxed">
                    The Service, including all software, design, text, graphics, and other content (excluding User Content),
                    is owned by ChainLink CFO and protected by intellectual property laws. You may not copy, modify,
                    distribute, sell, or lease any part of the Service without our written permission.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-orange-400 mb-4">9. Service Availability</h2>
                <p className="text-white/80 leading-relaxed">
                    We strive to maintain high availability but do not guarantee uninterrupted access.
                    The Service may be temporarily unavailable for maintenance, updates, or circumstances beyond our control.
                    We will make reasonable efforts to provide advance notice of scheduled maintenance.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-orange-400 mb-4">10. Limitation of Liability</h2>
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
                    <p className="text-white/80 leading-relaxed">
                        TO THE MAXIMUM EXTENT PERMITTED BY LAW, CHAINLINK CFO SHALL NOT BE LIABLE FOR ANY INDIRECT,
                        INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF
                        PROFITS, DATA, USE, OR GOODWILL. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US
                        IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
                    </p>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-orange-400 mb-4">11. Disclaimer of Warranties</h2>
                <p className="text-white/80 leading-relaxed">
                    THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
                    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
                    AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE ERROR-FREE OR UNINTERRUPTED.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-orange-400 mb-4">12. Indemnification</h2>
                <p className="text-white/80 leading-relaxed">
                    You agree to indemnify and hold harmless ChainLink CFO, its affiliates, officers, directors,
                    employees, and agents from any claims, damages, losses, or expenses arising from your use of
                    the Service, violation of these Terms, or infringement of any third-party rights.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-orange-400 mb-4">13. Termination</h2>
                <p className="text-white/80 leading-relaxed mb-4">
                    Either party may terminate this agreement at any time:
                </p>
                <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                    <li>You may close your account at any time through account settings</li>
                    <li>We may suspend or terminate your access for violation of these Terms</li>
                    <li>Upon termination, you may request export of your data within 30 days</li>
                </ul>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-orange-400 mb-4">14. Dispute Resolution</h2>
                <p className="text-white/80 leading-relaxed">
                    Any disputes arising from these Terms or the Service shall be resolved through binding arbitration
                    in accordance with the American Arbitration Association rules. The arbitration shall take place
                    in California, and the decision shall be final and binding. You agree to waive your right to
                    participate in class action lawsuits.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-orange-400 mb-4">15. Governing Law</h2>
                <p className="text-white/80 leading-relaxed">
                    These Terms shall be governed by and construed in accordance with the laws of the State of California,
                    United States, without regard to its conflict of law provisions.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-orange-400 mb-4">16. Changes to Terms</h2>
                <p className="text-white/80 leading-relaxed">
                    We may update these Terms from time to time. We will notify you of material changes by email
                    or through the Service. Your continued use after changes become effective constitutes acceptance
                    of the updated Terms.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-orange-400 mb-4">17. Contact Us</h2>
                <p className="text-white/80 leading-relaxed">
                    If you have questions about these Terms, please contact us at:
                </p>
                <div className="bg-white/5 rounded-xl p-6 border border-white/10 mt-4">
                    <p className="text-white font-semibold">ChainLink CFO</p>
                    <p className="text-white/60">Email: support@wip-insights.com</p>
                </div>
            </section>
        </div>
    );
};
