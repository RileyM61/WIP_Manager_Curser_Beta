import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import WIPManagerApp from './WIPManagerApp';
import AuthPage from './pages/AuthPage';
import CompanyOnboarding from './pages/CompanyOnboarding';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedApp: React.FC = () => {
  const { loading, session, companyId } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-orange-300">WIP-Insights</p>
          <p className="text-lg text-white/80">Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (!companyId) {
    return <CompanyOnboarding />;
  }

  return <WIPManagerApp />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/app" element={<ProtectedApp />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
