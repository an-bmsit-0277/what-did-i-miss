import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, Eye, EyeOff, ArrowRight, CheckCircle2, Mail, Lock } from 'lucide-react';
import { Button, StatusBanner } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, error: authError, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationSentEmail, setConfirmationSentEmail] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setValidationError(null);
    clearError();

    // Client-side validations adhering to backend SignUpRequestSchema
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setValidationError('Email address is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long.');
      return;
    }

    if (password.length > 128) {
      setValidationError('Password cannot exceed 128 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signUp(trimmedEmail, password);
      if (result.success) {
        if (result.emailConfirmationRequired) {
          setConfirmationSentEmail(trimmedEmail);
        } else {
          navigate('/workspace', { replace: true });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0A08] text-text-primary flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Film-grain texture layer */}
      <div className="film-grain" aria-hidden="true" />

      {/* Brand Header */}
      <div className="relative z-20 mb-6 text-center space-y-1.5 motion-fade-up">
        <Link
          to="/"
          className="inline-flex items-center gap-2 group focus-ember rounded-lg"
        >
          <div className="w-8 h-8 rounded-full bg-ember/15 border border-ember/35 flex items-center justify-center text-ember-hover group-hover:bg-ember group-hover:text-text-primary transition-colors shadow-[0_0_16px_rgba(255,77,28,0.2)]">
            <Flame className="w-4 h-4" />
          </div>
          <span className="font-serif font-semibold text-xl tracking-tight text-text-primary">
            Missed<span className="text-ember">.</span>
          </span>
        </Link>
        <p className="text-[11px] sm:text-xs text-text-muted">
          Create your personal conversation catch-up workspace
        </p>
      </div>

      {/* Main Card */}
      <div
        className="relative z-20 w-full max-w-[420px] rounded-2xl bg-[#0E0C0A] border border-white/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.8)] p-6 sm:p-8 motion-scale-in"
      >
        {confirmationSentEmail ? (
          /* Email Confirmation Required Notice */
          <div className="space-y-4 text-center py-2">
            <div className="w-11 h-11 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-serif text-xl font-normal text-text-primary">
                Verify Your Email Address
              </h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                We sent a confirmation link to{' '}
                <strong className="text-text-primary font-mono">{confirmationSentEmail}</strong>.
              </p>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Please check your inbox and click the verification link to activate your account, then log in.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link to="/login" className="w-full">
                <Button variant="primary" size="md" pill className="w-full shadow-[0_2px_14px_rgba(255,82,27,0.25)]">
                  Proceed to Log In
                </Button>
              </Link>
              <Link to="/" className="w-full">
                <Button variant="ghost" size="sm" pill className="w-full">
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Sign Up Form */
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1 mb-3">
              <span className="eyebrow-editorial">MISSED. ACCOUNT</span>
              <h1 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary tracking-tight mt-1">
                Get started free
              </h1>
              <p className="text-xs text-text-secondary mt-0.5">
                Deterministic catch-up triage with private PostgreSQL persistence.
              </p>
            </div>

            {/* Error Banners */}
            {(validationError || authError) && (
              <StatusBanner
                tone="error"
                title={validationError ? 'Validation Notice' : 'Registration Error'}
                message={validationError || authError || 'Failed to sign up.'}
                onDismiss={() => {
                  setValidationError(null);
                  clearError();
                }}
              />
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-email"
                className="block text-[11px] font-medium text-text-secondary uppercase tracking-wider"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="signup-email"
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
                htmlFor="signup-password"
                className="block text-[11px] font-medium text-text-secondary uppercase tracking-wider"
              >
                Password <span className="text-[10px] text-text-muted normal-case font-normal">(min. 8 characters)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
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

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-confirm-password"
                className="block text-[11px] font-medium text-text-secondary uppercase tracking-wider"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  disabled={isSubmitting}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2 rounded-xl bg-[#141210] border border-white/[0.08] hover:border-white/[0.14] text-text-primary placeholder:text-text-dim text-xs focus-ember transition-colors disabled:opacity-60"
                  aria-invalid={Boolean(validationError || authError)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-primary focus-ember rounded cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Action: Full-width ember button with arrow affordance */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-5 rounded-full bg-ember hover:bg-ember-hover text-[#FAF7F2] font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(255,82,27,0.35)] hover:shadow-[0_6px_28px_rgba(255,82,27,0.5)] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group focus-ember"
              >
                <span>{isSubmitting ? 'Creating account...' : 'Create Account'}</span>
                <span className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </span>
              </button>
            </div>

            {/* Footnote / Privacy Notice */}
            <p className="text-[11px] text-text-muted text-center leading-relaxed pt-1">
              By creating an account, conversations you save to the cloud are secured with Supabase PostgreSQL Row-Level Security.
            </p>

            {/* Links */}
            <div className="pt-3 border-t border-white/[0.07] flex items-center justify-between text-xs">
              <span className="text-text-secondary">Already registered?</span>
              <Link
                to="/login"
                className="text-ember-hover hover:text-warm-highlight font-semibold hover:underline inline-flex items-center gap-1"
              >
                <span>Sign in to your account</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </form>
        )}
      </div>

      {/* Back to Home Link */}
      <div className="relative z-20 mt-6 text-center">
        <Link
          to="/"
          className="text-xs text-text-muted hover:text-text-secondary transition-colors inline-flex items-center gap-1 focus-ember rounded px-2 py-1"
        >
          <span aria-hidden="true">&larr;</span>
          <span>Back to Missed. home</span>
        </Link>
      </div>
    </div>
  );
};
