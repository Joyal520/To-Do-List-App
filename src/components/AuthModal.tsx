import React, { useState } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signup' | 'signin';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'signup',
  onSuccess,
}) => {
  const [mode, setMode] = useState<'signup' | 'signin'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);

  if (!isOpen) return null;

  // Sign in / Sign up with Google
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    setIsUnauthorizedDomain(false);
    try {
      await signInWithPopup(auth, googleProvider);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      if (err.code === 'auth/unauthorized-domain') {
        setIsUnauthorizedDomain(true);
        setError(
          'Google Sign-in domain not whitelisted in Firebase. Use Email Sign In below, or continue in Guest Mode (tasks are saved locally)!'
        );
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completing. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups for this site.');
      } else {
        setError(err.message || 'Failed to authenticate with Google. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Email/Password submit handler
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsUnauthorizedDomain(false);

    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) {
          await updateProfile(userCredential.user, { displayName: name.trim() });
        }
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Try signing in instead.');
      } else if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        setError('Invalid email or password. Please check your credentials.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top ambient banner gradient */}
        <div className="h-2.5 bg-gradient-to-r from-indigo-600 via-sky-500 to-purple-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 mb-3 shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">
              {mode === 'signup' ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium">
              {mode === 'signup'
                ? 'Sync and protect your tasks effortlessly.'
                : 'Sign in to access your boards and active projects.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 mb-6 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setIsUnauthorizedDomain(false);
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setIsUnauthorizedDomain(false);
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Sign In
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="font-semibold">{error}</span>
              </div>
              {isUnauthorizedDomain && (
                <div className="mt-1 p-2.5 bg-white rounded-xl border border-rose-200 text-[11px] text-slate-700 font-medium">
                  <p className="font-bold text-slate-900 mb-1">To whitelist in Firebase:</p>
                  <p>Add <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono font-bold">joyal520.github.io</code> under <strong>Firebase Console ➔ Authentication ➔ Settings ➔ Authorized Domains</strong>.</p>
                </div>
              )}
            </div>
          )}

          {/* PRIMARY: Continue with Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-2xl border border-slate-300 shadow-xs hover:shadow transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span className="text-sm font-bold">
              {isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}
            </span>
          </button>

          {/* Divider */}
          <div className="relative my-5 flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
              or continue with email
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-950 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-950 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-950 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 font-medium">At least 6 characters</p>
            </div>

            {/* Liquid Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="liquid-btn w-full py-3 px-4 text-white font-bold text-sm rounded-2xl shadow-md cursor-pointer flex items-center justify-center gap-2 tracking-wide disabled:opacity-40"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{mode === 'signup' ? 'Create Free Account' : 'Sign In'}</span>
              )}
            </button>
          </form>

          {/* Reassurance */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-600 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Tasks saved automatically with real-time cloud and local sync</span>
          </div>
        </div>
      </div>
    </div>
  );
};
