/**
 * Authentication Context & Session Management
 *
 * Provides single-source-of-truth session lifecycle across public and protected routes.
 * Prevents flashing protected content, manages token storage, handles email confirmation,
 * and purges user-scoped state on logout.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { api, type AuthUser, ApiError } from '../api/client.ts';

const TOKEN_STORAGE_KEY = 'missed_auth_token';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  status: AuthStatus;
  error: string | null;
  emailConfirmationPending: string | null; // Email address awaiting verification
  signUp: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; emailConfirmationRequired: boolean; error?: string }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
  clearConfirmationNotice: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [emailConfirmationPending, setEmailConfirmationPending] = useState<string | null>(
    null
  );

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (!storedToken) {
          if (isMounted) {
            setStatus('unauthenticated');
          }
          return;
        }

        // Validate token against backend /api/auth/me
        const { user: verifiedUser } = await api.getMe(storedToken);
        if (isMounted) {
          setUser(verifiedUser);
          setAccessToken(storedToken);
          setStatus('authenticated');
        }
      } catch {
        // Token expired, revoked, or invalid
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        if (isMounted) {
          setUser(null);
          setAccessToken(null);
          setStatus('unauthenticated');
        }
      }
    }

    void initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const signUp = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ success: boolean; emailConfirmationRequired: boolean; error?: string }> => {
      setError(null);
      try {
        const res = await api.signUp(email, password);
        if (res.emailConfirmationRequired || !res.accessToken) {
          setEmailConfirmationPending(email);
          setUser(null);
          setAccessToken(null);
          setStatus('unauthenticated');
          return { success: true, emailConfirmationRequired: true };
        }

        // Direct authenticated session established
        localStorage.setItem(TOKEN_STORAGE_KEY, res.accessToken);
        setUser(res.user);
        setAccessToken(res.accessToken);
        setStatus('authenticated');
        setEmailConfirmationPending(null);
        return { success: true, emailConfirmationRequired: false };
      } catch (err: any) {
        const message =
          err instanceof ApiError
            ? err.message
            : err.message || 'Registration failed. Please try again.';
        setError(message);
        return { success: false, emailConfirmationRequired: false, error: message };
      }
    },
    []
  );

  const signIn = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ success: boolean; error?: string }> => {
      setError(null);
      try {
        const res = await api.signIn(email, password);
        if (res.emailConfirmationRequired || !res.accessToken) {
          const msg =
            'Email confirmation is required before sign in. Please verify your email via the confirmation link sent to you.';
          setError(msg);
          setEmailConfirmationPending(email);
          return { success: false, error: msg };
        }

        localStorage.setItem(TOKEN_STORAGE_KEY, res.accessToken);
        setUser(res.user);
        setAccessToken(res.accessToken);
        setStatus('authenticated');
        setEmailConfirmationPending(null);
        return { success: true };
      } catch (err: any) {
        const message =
          err instanceof ApiError
            ? err.message
            : err.message || 'Sign in failed. Please check your credentials.';
        setError(message);
        return { success: false, error: message };
      }
    },
    []
  );

  const signOut = useCallback(async (): Promise<void> => {
    try {
      if (accessToken) {
        await api.signOut(accessToken).catch(() => {});
      }
    } finally {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setUser(null);
      setAccessToken(null);
      setStatus('unauthenticated');
      setError(null);
      setEmailConfirmationPending(null);
    }
  }, [accessToken]);

  const deleteAccount = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!accessToken) {
      return { success: false, error: 'Not authenticated' };
    }
    try {
      await api.deleteAccount(accessToken);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setUser(null);
      setAccessToken(null);
      setStatus('unauthenticated');
      return { success: true };
    } catch (err: any) {
      const message =
        err instanceof ApiError ? err.message : err.message || 'Failed to delete account.';
      return { success: false, error: message };
    }
  }, [accessToken]);

  const clearError = useCallback(() => setError(null), []);
  const clearConfirmationNotice = useCallback(
    () => setEmailConfirmationPending(null),
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      status,
      error,
      emailConfirmationPending,
      signUp,
      signIn,
      signOut,
      deleteAccount,
      clearError,
      clearConfirmationNotice,
    }),
    [
      user,
      accessToken,
      status,
      error,
      emailConfirmationPending,
      signUp,
      signIn,
      signOut,
      deleteAccount,
      clearError,
      clearConfirmationNotice,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// oxlint-disable-next-line react/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
