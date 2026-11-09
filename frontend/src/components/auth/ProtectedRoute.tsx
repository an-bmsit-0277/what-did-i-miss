/**
 * Route Guard: ProtectedRoute
 *
 * Ensures only authenticated users can access /workspace.
 * Displays loading skeleton while resolving session; redirects unauthenticated
 * visitors to /login preserving the return destination safely.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { WorkspaceSkeleton } from '../ui';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-void text-text-primary p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center space-y-1 mb-6">
            <div className="inline-block w-8 h-8 rounded-full border-2 border-ember border-t-transparent animate-spin mb-2" />
            <h2 className="text-sm font-bold text-text-primary">
              Restoring Workspace Session...
            </h2>
            <p className="text-xs text-text-secondary">
              Verifying credentials with Missed. security layer.
            </p>
          </div>
          <WorkspaceSkeleton />
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-void text-text-primary flex items-center justify-center p-4">
        <div className="w-6 h-6 rounded-full border-2 border-ember border-t-transparent animate-spin" />
      </div>
    );
  }

  if (status === 'authenticated') {
    return <Navigate to="/workspace" replace />;
  }

  return <>{children}</>;
};
