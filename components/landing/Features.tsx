import React from 'react';
import { CheckCircleIcon } from '../shared/icons';

const Features: React.FC = () => {
  const features = [
    {
      icon: <CheckCircleIcon />,
      title: 'Real-Time Job Tracking',
      description: 'Monitor all your projects in one dashboard. Track status, budgets, costs, and timelines with real-time updates.',
    },
    {
      icon: <CheckCircleIcon />,
      title: 'Profit Forecasting',
      description: 'Forecast profitability with accurate cost-to-complete estimates. Identify at-risk projects before they impact your bottom line.',
    },
    {
      icon: <CheckCircleIcon />,
      title: 'Capacity Planning',
      description: 'Manage your team\'s workload and capacity. Balance staffing across disciplines and avoid overcommitment.',
    },
    {
      icon: <CheckCircleIcon />,
      title: 'Cash Flow Management',
      description: 'Track invoicing, earned revenue, and billing status. Ensure you\'re billing correctly and maintaining healthy cash flow.',
    },
    {
      icon: <CheckCircleIcon />,
      title: 'Project Manager Views',
      description: 'Give PMs their own dashboard focused on their projects. Track targets, margins, and schedules.',
    },
    {
      icon: <CheckCircleIcon />,
      title: 'Role-Based Access',
      description: 'Owner and Project Manager views with tailored insights. See what matters most to your role.',
    },
  ];

  return (
    <section id="features" className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Everything You Need to Manage Your Projects
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Powerful features designed specifically for construction project management
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700"
            >
              <div className="text-brand-blue dark:text-brand-light-blue mb-4 w-12 h-12">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;

