import React from 'react';

const Mockups: React.FC = () => {
  const mockups = [
    {
      title: 'Dashboard Overview',
      description: 'Get a complete view of all your projects at a glance',
      mockup: (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div className="h-8 bg-brand-blue dark:bg-brand-light-blue rounded"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-24 bg-gray-100 dark:bg-gray-700 rounded"></div>
              <div className="h-24 bg-gray-100 dark:bg-gray-700 rounded"></div>
              <div className="h-24 bg-gray-100 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="h-64 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Job Management',
      description: 'Track every detail of your construction projects',
      mockup: (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 bg-brand-blue dark:bg-brand-light-blue rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  </div>
                  <div className="h-8 w-20 bg-green-100 dark:bg-green-900 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Financial Analytics',
      description: 'Forecast profits and manage cash flow with confidence',
      mockup: (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                <div className="text-3xl font-bold text-brand-blue dark:text-brand-light-blue">$2.4M</div>
              </div>
              <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">+18%</div>
              </div>
            </div>
            <div className="h-48 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
              <div className="p-4 space-y-3">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="screenshots" className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            See It In Action
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover how easy it is to manage your construction projects
          </p>
        </div>
        <div className="space-y-24">
          {mockups.map((mockup, index) => (
            <div
              key={index}
              className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12`}
            >
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  {mockup.title}
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                  {mockup.description}
                </p>
              </div>
              <div className="flex-1 w-full max-w-2xl">
                {mockup.mockup}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Mockups;

