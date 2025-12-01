import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { isEmailAllowed } from '../constants';
import { getInvitationByToken, acceptInvitation } from '../hooks/useInvitations';

type AuthMode = 'login' | 'signup';

interface InviteInfo {
  valid: boolean;
  email?: string;
  role?: string;
  companyName?: string;
  expiresAt?: string;
  error?: string;
}

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { session, refreshProfile } = useAuth();
  const [params] = useSearchParams();
  const inviteToken = params.get('invite');
  const source = params.get('source');
  const isFromWip = source === 'wip';
  const initialMode = inviteToken ? 'signup' : ((params.get('mode') as AuthMode) ?? 'login');
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [inviteLoading, setInviteLoading] = useState(!!inviteToken);
  const [acceptingInvite, setAcceptingInvite] = useState(false);
  const [inviteAttempted, setInviteAttempted] = useState(false);

  const headerCopy = useMemo(() => {
    if (inviteInfo?.valid) {
      return {
        title: `Join ${inviteInfo.companyName}`,
        subtitle: `You've been invited as ${inviteInfo.role === 'projectManager' ? 'a Project Manager' : inviteInfo.role === 'estimator' ? 'an Estimator' : 'an Owner'}`
      };
    }
    return mode === 'login'
      ? { title: 'Welcome back', subtitle: 'Log in to your workspace' }
      : { title: 'Create an account', subtitle: 'Set up your company in minutes' };
  }, [mode, inviteInfo]);

  // Fetch invitation details on mount if token present
  useEffect(() => {
    if (inviteToken) {
      setInviteLoading(true);
      getInvitationByToken(inviteToken).then(info => {
        setInviteInfo(info);
        if (info.valid && info.email) {
          setEmail(info.email);
        }
        setInviteLoading(false);
      });
    }
  }, [inviteToken]);

  // Handle accepting invitation after signup/login
  useEffect(() => {
    const handleAcceptInvite = async () => {
      // Only attempt once, and only if we have all required data
      if (session && inviteToken && inviteInfo?.valid && !acceptingInvite && !inviteAttempted) {
        setAcceptingInvite(true);
        setInviteAttempted(true); // Prevent retry loop
        
        try {
          const result = await acceptInvitation(inviteToken);
          if (result.success) {
            await refreshProfile();
            navigate('/app', { replace: true });
          } else {
            setMessage(result.error || 'Failed to accept invitation');
            setAcceptingInvite(false);
          }
        } catch (err: any) {
          console.error('[AuthPage] Error accepting invitation:', err);
          setMessage(err.message || 'Failed to accept invitation. Please try again.');
          setAcceptingInvite(false);
        }
      }
    };
    handleAcceptInvite();
  }, [session, inviteToken, inviteInfo, acceptingInvite, inviteAttempted, refreshProfile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (mode === 'login') {
        const { error } = await supabase!.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // If there's an invite, the useEffect will handle accepting it
        if (!inviteToken) {
          navigate('/app');
        }
      } else {
        // Check if email is allowed (beta access control) - skip for invited users
        if (!inviteInfo?.valid && !isEmailAllowed(email)) {
          setMessage('This email is not authorized for beta access. Please contact support@wip-insights.com to request access.');
          setLoading(false);
          return;
        }
        
        // For invitations, verify email matches
        if (inviteInfo?.valid && inviteInfo.email?.toLowerCase() !== email.toLowerCase()) {
          setMessage(`This invitation was sent to ${inviteInfo.email}. Please use that email address.`);
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
        
        if (inviteInfo?.valid) {
          setMessage('Account created! Please check your email to confirm, then log in to join the team.');
        } else {
          setMessage('Account created! Please check your email to confirm before logging in.');
        }
      }
    } catch (err: any) {
      console.error('[AuthPage] Auth error', err);
      setMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Don't auto-redirect if there's an invite token - let the accept flow handle it
    if (session && !inviteToken) {
      navigate('/app', { replace: true });
    }
  }, [session, navigate, inviteToken]);

  // Show loading state while fetching invite info
  if (inviteLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  // Show error if invite is invalid
  if (inviteToken && inviteInfo && !inviteInfo.valid) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-red-500/10 p-8 shadow-2xl backdrop-blur text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-red-300">Invalid Invitation</h1>
          <p className="mt-2 text-sm text-red-200/80">{inviteInfo.error || 'This invitation link is invalid or has expired.'}</p>
          <button
            onClick={() => navigate('/auth')}
            className="mt-6 px-6 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show accepting state
  if (acceptingInvite) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Joining {inviteInfo?.companyName}...</p>
        </div>
      </div>
    );
  }

  // Show error state if invite was attempted but failed
  if (inviteAttempted && !acceptingInvite && message) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-orange-500/30 bg-orange-500/10 p-8 shadow-2xl backdrop-blur text-center">
          <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-orange-300">Could Not Join Team</h1>
          <p className="mt-2 text-sm text-orange-200/80">{message}</p>
          <div className="mt-6 space-y-3">
            <button
              onClick={() => navigate('/app')}
              className="w-full px-6 py-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition"
            >
              Go to App
            </button>
            <button
              onClick={() => {
                setInviteAttempted(false);
                setMessage(null);
              }}
              className="w-full px-6 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
        <div className="mb-8 text-center">
          {isFromWip ? (
            <img 
              src="/images/wip-insights-logo.png" 
              alt="WIP-Insights" 
              className="h-72 w-auto mx-auto mb-4"
            />
          ) : (
            <div className="mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <p className="text-sm uppercase tracking-[0.3em] text-orange-300">ChainLink CFO</p>
            </div>
          )}
          <h1 className="mt-4 text-3xl font-semibold">{headerCopy.title}</h1>
          <p className="mt-2 text-sm text-slate-200">{headerCopy.subtitle}</p>
        </div>

        {/* Invitation Banner */}
        {inviteInfo?.valid && (
          <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-green-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Valid Invitation</span>
            </div>
            <p className="mt-1 text-xs text-green-200/80">
              Create an account or log in to join <strong>{inviteInfo.companyName}</strong>
            </p>
          </div>
        )}

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
              disabled={inviteInfo?.valid && mode === 'signup'}
              className={`mt-2 w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-orange-400 focus:outline-none ${
                inviteInfo?.valid && mode === 'signup' ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              placeholder="you@company.com"
            />
            {mode === 'signup' && !inviteInfo?.valid && (
              <p className="mt-2 text-xs text-slate-400">
                🔒 Beta access is currently invite-only. Contact support@wip-insights.com to request access.
              </p>
            )}
            {inviteInfo?.valid && mode === 'signup' && (
              <p className="mt-2 text-xs text-green-400">
                ✓ Email pre-filled from your invitation
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

