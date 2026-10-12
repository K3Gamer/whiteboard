import React from 'react'
import { cn } from '../../utils/cn'

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  valueLabel?: string
  min: number
  max: number
  step?: number
  showValue?: boolean
}

export function Slider({ 
  label, 
  valueLabel, 
  min, 
  max, 
  step = 1, 
  showValue = true, 
  className, 
  value, 
  onChange, 
  ...props 
}: SliderProps) {
  const percentage = ((value as number) - min) / (max - min) * 100

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <label className="text-sm font-medium text-[var(--foreground)]">{label}</label>}
          {showValue && (
            <span className="text-sm font-mono text-[var(--foreground-muted)] px-2 py-0.5 bg-[var(--surface)] rounded">
              {valueLabel ?? value}
            </span>
          )}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className={cn(
          'w-full h-2 bg-[var(--surface)] rounded-lg appearance-none cursor-pointer',
          'accent-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--wall)]',
          '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--wall)] [&::-webkit-slider-thumb]:shadow-md',
          '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--accent)] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[var(--wall)]'
        )}
        style={{
          background: `linear-gradient(to right, var(--accent) ${percentage}%, var(--surface) ${percentage}%)`,
        } as React.CSSProperties}
        {...props}
      />
    </div>
  )
}