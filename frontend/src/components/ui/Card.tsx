import React from 'react';

export type CardVariant = 'default' | 'elevated' | 'featured' | 'subtle' | 'ivory';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  spotlight?: boolean;
  beam?: boolean;
  interactive?: boolean;
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: 'bg-surface text-text-primary border-specular',
  elevated: 'bg-elevated text-text-primary border border-border-strong shadow-[var(--shadow-elevated)]',
  featured: 'bg-surface text-text-primary border-specular-ember',
  subtle: 'bg-canvas text-text-primary border border-border-default',
  ivory: 'bg-ivory text-text-on-ivory border border-ivory/80 shadow-[var(--shadow-card)]',
};

const PADDING_CLASSES: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3.5',
  md: 'p-5',
  lg: 'p-6 sm:p-7',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      spotlight = false,
      beam = false,
      interactive = false,
      className = '',
      children,
      ...rest
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`rounded-[var(--radius-card)] transition-colors duration-150 ${VARIANT_CLASSES[variant]} ${PADDING_CLASSES[padding]} ${
          spotlight ? 'bg-ember-spotlight' : ''
        } ${beam ? 'bg-solar-beam' : ''} ${
          interactive ? 'hover:border-ember/45' : ''
        } ${className}`}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
