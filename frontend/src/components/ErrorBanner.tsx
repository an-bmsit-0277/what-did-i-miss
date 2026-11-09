import React from 'react';
import { StatusBanner } from './ui';

interface ErrorBannerProps {
  error?: string;
  warning?: string;
  onDismiss: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  warning,
  onDismiss,
}) => {
  if (!error && !warning) return null;

  const isError = Boolean(error);
  const message = error || warning || '';

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-3">
      <StatusBanner
        tone={isError ? 'error' : 'warning'}
        title={isError ? 'Import Error' : 'Notice'}
        message={message}
        onDismiss={onDismiss}
      />
    </div>
  );
};
