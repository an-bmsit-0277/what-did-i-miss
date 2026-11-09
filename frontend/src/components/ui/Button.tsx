import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ivory' | 'ghost' | 'danger';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  pill?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-ember text-text-primary hover:bg-ember-hover active:translate-y-px border border-amber-highlight/30 shadow-[var(--shadow-ember)]',
  secondary:
    'bg-elevated text-text-primary hover:bg-input hover:border-border-strong border border-border-default',
  ivory:
    'bg-ivory text-text-on-ivory hover:bg-text-primary active:translate-y-px border border-ivory/80 font-semibold',
  ghost:
    'bg-transparent text-text-secondary hover:text-text-primary hover:bg-elevated/80 border border-transparent',
  danger:
    'bg-semantic-urgent/12 text-semantic-urgent hover:bg-semantic-urgent/20 border border-semantic-urgent/35',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1 text-[11px] gap-1',
  sm: 'px-3.5 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-xs sm:text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2.5',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      pill = true,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      children,
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const isDisabled = Boolean(disabled || loading);
    const radiusClass = pill ? 'rounded-full' : 'rounded-[var(--radius-control)]';

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={`inline-flex items-center justify-center font-medium transition-all duration-150 select-none focus-ember ${radiusClass} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${
          isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
        } ${className}`}
        {...rest}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden="true" />
        ) : (
          leftIcon && <span className="shrink-0 inline-flex">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!loading && rightIcon && <span className="shrink-0 inline-flex">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
