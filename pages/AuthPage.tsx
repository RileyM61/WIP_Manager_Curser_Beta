import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { isEmailAllowed } from '../constants';

type AuthMode = 'login' | 'signup';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [params] = useSearchParams();
  const initialMode = (params.get('mode') as AuthMode) ?? 'login';
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const headerCopy = useMemo(() => (
    mode === 'login'
      ? { title: 'Welcome back', subtitle: 'Log in to your workspace' }
      : { title: 'Create an account', subtitle: 'Set up your company in minutes' }
  ), [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (mode === 'login') {
        const { error } = await supabase!.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/app');
      } else {
        // Check if email is allowed (beta access control)
        if (!isEmailAllowed(email)) {
          setMessage('This email is not authorized for beta access. Please contact support@wip-insights.com to request access.');
          setLoading(false);
          return;
        }
        
        if (password !== confirmPassword) {
          setMessage('Passwords do not match.');
          setLoading(false);
          return;
        }
        const { error } = await supabase!.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Account created! Please check your email to confirm before logging in.');
      }
    } catch (err: any) {
      console.error('[AuthPage] Auth error', err);
      setMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      navigate('/app', { replace: true });
    }
  }, [session, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
        <div className="mb-8 text-center">
          <img 
            src="/images/wip-insights-logo.png" 
            alt="WIP-Insights" 
            className="h-72 w-auto mx-auto mb-4"
          />
          <h1 className="mt-4 text-3xl font-semibold">{headerCopy.title}</h1>
          <p className="mt-2 text-sm text-slate-200">{headerCopy.subtitle}</p>
        </div>

        <div className="mb-6 flex gap-3 rounded-full bg-white/10 p-1 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 rounded-full py-2 transition ${
              mode === 'login' ? 'bg-white text-slate-900' : 'text-white/70'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 rounded-full py-2 transition ${
              mode === 'signup' ? 'bg-white text-slate-900' : 'text-white/70'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-orange-400 focus:outline-none"
              placeholder="you@company.com"
            />
            {mode === 'signup' && (
              <p className="mt-2 text-xs text-slate-400">
                🔒 Beta access is currently invite-only. Contact support@wip-insights.com to request access.
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-orange-400 focus:outline-none"
              placeholder="Minimum 6 characters"
              minLength={6}
            />
          </div>
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-300">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-orange-400 focus:outline-none"
                placeholder="Re-enter your password"
                minLength={6}
              />
            </div>
          )}
          {message && (
            <div className="rounded-xl border border-orange-400/40 bg-orange-400/10 px-4 py-3 text-sm text-orange-200">
              {message}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-orange-500 py-3 text-base font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>
        <p className="mt-8 text-center text-xs text-white/60">
          By continuing you agree to the WIP-Insights terms of service.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;

