import React from 'react';
import { APP_PAGES } from '@/constants';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 dark:bg-black text-gray-300 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">WIP Insights</h3>
            <p className="text-sm text-gray-400">
              The complete construction project management solution.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#screenshots" className="hover:text-white transition-colors">
                  Screenshots
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href={APP_PAGES.about} className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
                  About
                </a>
              </li>
              <li>
                <a href={APP_PAGES.blog} className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
                  Blog
                </a>
              </li>
              <li>
                <a href={APP_PAGES.contact} className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href={APP_PAGES.privacy} className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href={APP_PAGES.terms} className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} WIP Insights. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

