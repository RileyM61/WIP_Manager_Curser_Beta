import React from 'react';
import { ArrowRightIcon } from '../shared/icons';

interface CTAProps {
  onSignUp: () => void;
}

const CTA: React.FC<CTAProps> = ({ onSignUp }) => {
  return (
    <section className="py-20 bg-gradient-to-r from-brand-blue to-brand-light-blue dark:from-gray-800 dark:to-gray-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Ready to Transform Your Project Management?
          </h2>
          <p className="text-xl text-blue-100 dark:text-blue-200 mb-8 max-w-2xl mx-auto">
            Join hundreds of construction companies already using WIP Insights to streamline their operations and boost profitability.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onSignUp}
              className="bg-white text-brand-blue px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 flex items-center gap-2"
            >
              Start Your Free Trial
              <ArrowRightIcon />
            </button>
            <a
              href="#pricing"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-brand-blue transition-all duration-300"
            >
              View Pricing
            </a>
          </div>
          <p className="mt-6 text-sm text-blue-200 dark:text-blue-300">
            No credit card required • Setup in minutes • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;

