import React from 'react'
import { cn } from '../../utils/cn'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center font-medium rounded-md transition-all duration-150
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      ${loading ? 'cursor-wait' : ''}
    `

    const variants = {
      primary: 'bg-[var(--accent)] text-[var(--onfill)] hover:bg-[var(--accent-hover)] focus-visible:ring-[var(--accent)]',
      secondary: 'bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--hover)] border border-[var(--border)] focus-visible:ring-[var(--border)]',
      ghost: 'text-[var(--foreground)] hover:bg-[var(--hover)] focus-visible:ring-[var(--border)]',
      danger: 'bg-[var(--danger)] text-white hover:opacity-90 focus-visible:ring-[var(--danger)]',
      outline: 'border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--hover)] focus-visible:ring-[var(--border)]',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
            <path className="opacity-75" d="M12 2a10 10 0 0 1 10 10" />
          </svg>
        )}
        {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'