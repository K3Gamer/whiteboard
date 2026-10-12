import React from 'react'
import { cn } from '../../utils/cn'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'outline' | 'primary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  'aria-label': string
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = 'ghost', size = 'md', 'aria-label': ariaLabel, children, ...props }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center rounded-md transition-all duration-150
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
    `

    const variants = {
      ghost: 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover)] focus-visible:ring-[var(--border)]',
      outline: 'border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--hover)] focus-visible:ring-[var(--border)]',
      primary: 'bg-[var(--accent)] text-[var(--onfill)] hover:bg-[var(--accent-hover)] focus-visible:ring-[var(--accent)]',
      danger: 'text-[var(--danger)] hover:bg-[var(--danger-light)] focus-visible:ring-[var(--danger)]',
    }

    const sizes = {
      sm: 'p-1.5',
      md: 'p-2',
      lg: 'p-3',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        aria-label={ariaLabel}
        {...props}
      >
        {children}
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'