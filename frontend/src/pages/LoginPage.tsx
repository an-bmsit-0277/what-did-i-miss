import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Flame, Eye, EyeOff, ArrowRight, Sparkles, Mail, Lock } from 'lucide-react';
import { Button, StatusBanner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { getSafeRedirect } from '../config/env';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, error: authError, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine safe redirect destination
  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');
  const stateFrom = (location.state as { from?: { pathname?: string; search?: string } })?.from;
  const rawTarget =
    redirectParam ||
    (stateFrom ? `${stateFrom.pathname || ''}${stateFrom.search || ''}` : null);
  const safeTarget = getSafeRedirect(rawTarget, '/workspace');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setValidationError(null);
    clearError();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setValidationError('Please enter your email address.');
      return;
    }

    if (!password) {
      setValidationError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signIn(trimmedEmail, password);
      if (result.success) {
        navigate(safeTarget, { replace: true });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-void text-text-primary flex flex-col justify-center items-center p-4 sm:p-6 bg-circuit-grid">
      {/* Brand Header */}
      <div className="mb-6 text-center space-y-1.5 motion-fade-up">
        <Link
          to="/"
          className="inline-flex items-center gap-2 group focus-ember rounded-lg"
        >
          <div className="w-9 h-9 rounded-[var(--radius-icon)] bg-ember/15 border border-ember/35 flex items-center justify-center text-ember-hover group-hover:bg-ember group-hover:text-text-primary transition-colors shadow-[0_0_16px_rgba(255,77,28,0.2)]">
            <Flame className="w-4.5 h-4.5" />
          </div>
          <span className="font-serif font-semibold text-xl tracking-tight text-text-primary">
            Missed<span className="text-ember-hover">.</span>
          </span>
        </Link>
        <p className="text-[11px] sm:text-xs text-text-muted">
          Sign in to access your saved conversations and tasks
        </p>
      </div>

      {/* Main Login Card */}
      <div
        className="w-full max-w-[400px] rounded-2xl bg-[#0E0C0A]/95 border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.65)] p-6 sm:p-7 motion-scale-in"
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1 mb-1">
            <h1 className="font-serif text-2xl font-normal text-text-primary tracking-tight">
              Welcome back
            </h1>
            <p className="text-xs text-text-secondary">
              Enter your credentials to access your protected workspace.
            </p>
          </div>

          {/* Error Banner */}
          {(validationError || authError) && (
            <StatusBanner
              tone="error"
              title={validationError ? 'Validation Notice' : 'Sign-In Error'}
              message={validationError || authError || 'Failed to sign in.'}
              onDismiss={() => {
                setValidationError(null);
                clearError();
              }}
            />
          )}

          {/* Email Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="login-email"
              className="block text-[11px] font-medium text-text-secondary uppercase tracking-wider"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                disabled={isSubmitting}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="you@company.com"
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#141210] border border-white/[0.08] hover:border-white/[0.14] text-text-primary placeholder:text-text-dim text-xs focus-ember transition-colors disabled:opacity-60"
                aria-invalid={Boolean(validationError || authError)}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="login-password"
              className="block text-[11px] font-medium text-text-secondary uppercase tracking-wider"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                disabled={isSubmitting}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-10 py-2 rounded-xl bg-[#141210] border border-white/[0.08] hover:border-white/[0.14] text-text-primary placeholder:text-text-dim text-xs focus-ember transition-colors disabled:opacity-60"
                aria-invalid={Boolean(validationError || authError)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-primary focus-ember rounded cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              pill
              className="w-full justify-center shadow-[0_2px_14px_rgba(255,82,27,0.25)] hover:shadow-[0_4px_20px_rgba(255,82,27,0.4)]"
              loading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </div>

          {/* Navigation Links */}
          <div className="pt-3 border-t border-white/[0.07] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">New to Missed.?</span>
              <Link
                to="/signup"
                className="text-ember-hover hover:text-warm-highlight font-semibold hover:underline"
              >
                Create a free account →
              </Link>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-text-muted">Want to test first?</span>
              <Link
                to="/demo"
                className="text-amber-highlight hover:text-warm-highlight font-medium flex items-center gap-1 hover:underline"
              >
                <Sparkles className="w-3 h-3" />
                <span>Explore Guest Demo</span>
              </Link>
            </div>
          </div>
        </form>
      </div>

      {/* Back to Home */}
      <div className="mt-6 text-center">
        <Link
          to="/"
          className="text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          ← Back to Missed. home
        </Link>
      </div>
    </div>
  );
};
