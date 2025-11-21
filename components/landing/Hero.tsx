import React from 'react';
import { ArrowRightIcon } from '../shared/icons';

interface HeroProps {
  onSignUp: () => void;
}

const Hero: React.FC<HeroProps> = ({ onSignUp }) => {
  return (
    <section className="relative bg-gradient-to-br from-brand-blue via-brand-light-blue to-blue-600 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-white overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Manage Your Construction Projects
            <span className="block text-blue-200 dark:text-blue-300 mt-2">
              Like Never Before
            </span>
          </h1>
          <p className="text-xl sm:text-2xl text-blue-100 dark:text-blue-200 mb-8 max-w-2xl mx-auto">
            Complete Work-in-Progress management solution for construction companies. Track jobs, manage capacity, forecast profits, and stay on top of your cash flow—all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onSignUp}
              className="bg-white text-brand-blue px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 flex items-center gap-2"
            >
              Start Free Trial
              <ArrowRightIcon />
            </button>
            <a
              href="#features"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-brand-blue transition-all duration-300"
            >
              Learn More
            </a>
          </div>
          <p className="mt-6 text-sm text-blue-200 dark:text-blue-300">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-brand-gray dark:from-gray-900 to-transparent"></div>
    </section>
  );
};

export default Hero;

