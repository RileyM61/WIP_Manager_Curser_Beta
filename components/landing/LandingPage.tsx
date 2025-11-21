import React, { useState } from 'react';
import Hero from './Hero';
import Features from './Features';
import Pricing from './Pricing';
import Mockups from './Mockups';
import Testimonials from './Testimonials';
import CTA from './CTA';
import Footer from './Footer';
import SignUpModal from './SignUpModal';

interface LandingPageProps {
  onSignUpComplete: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSignUpComplete }) => {
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('free');

  const handleSignUpClick = (plan?: string) => {
    if (plan) {
      setSelectedPlan(plan);
    }
    setIsSignUpModalOpen(true);
  };

  const handleSignUpComplete = (plan: string) => {
    setIsSignUpModalOpen(false);
    // In a real app, you might want to store the plan in localStorage or state
    console.log('Sign up completed for plan:', plan);
    onSignUpComplete();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Hero onSignUp={() => handleSignUpClick()} />
      <Features />
      <Mockups />
      <Pricing onSignUp={handleSignUpClick} />
      <Testimonials />
      <CTA onSignUp={() => handleSignUpClick()} />
      <Footer />
      <SignUpModal
        isOpen={isSignUpModalOpen}
        onClose={() => setIsSignUpModalOpen(false)}
        onSignUpComplete={handleSignUpComplete}
        defaultPlan={selectedPlan}
      />
    </div>
  );
};

export default LandingPage;

