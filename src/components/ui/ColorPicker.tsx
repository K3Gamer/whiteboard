import React, { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'
import { COLORS } from '../../types'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  showOpacity?: boolean
  opacity?: number
  onOpacityChange?: (opacity: number) => void
  size?: 'sm' | 'md' | 'lg'
}

export function ColorPicker({ 
  value, 
  onChange, 
  showOpacity = false, 
  opacity = 1, 
  onOpacityChange,
  size = 'md' 
}: ColorPickerProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [customColor, setCustomColor] = useState(value)
  const [customOpacity, setCustomOpacity] = useState(opacity)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
          setOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }

  const handleColorClick = (color: string) => {
    setCustomColor(color)
    onChange(color)
    setOpen(false)
  }

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    setCustomColor(color)
    onChange(color)
  }

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const op = parseFloat(e.target.value)
    setCustomOpacity(op)
    onOpacityChange?.(op)
  }

  const trigger = (
    <button
      ref={triggerRef}
      onClick={() => setOpen(!open)}
      className={cn(
        'relative rounded border border-[var(--border)] overflow-hidden transition-all',
        sizes[size]
      )}
      style={{
        background: value,
        opacity,
      }}
      aria-label="Chọn màu"
      aria-expanded={open}
      aria-haspopup="dialog"
    >
      {value === 'transparent' && (
        <svg className="absolute inset-0 w-full h-full text-[var(--foreground-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      )}
    </button>
  )

  const popover = (
    <div
      ref={popoverRef}
      className="fixed z-50 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg p-3 min-w-[200px] animate-slide-in"
      role="dialog"
      aria-label="Chọn màu"
    >
      <div className="grid grid-cols-7 gap-1.5 mb-3">
        {COLORS.map((color) => (
          <button
            key={color}
            onClick={() => handleColorClick(color)}
            className={cn(
              'w-7 h-7 rounded border-2 transition-all',
              'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]',
              color === value ? 'border-[var(--accent)] scale-110' : 'border-transparent'
            )}
            style={{ background: color }}
            aria-label={color}
            aria-pressed={color === value}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <input
          type="color"
          value={customColor}
          onChange={handleCustomColorChange}
          className="w-8 h-8 rounded border border-[var(--border)] cursor-pointer"
          aria-label="Màu tùy chỉnh"
        />
        <input
          type="text"
          value={customColor}
          onChange={handleCustomColorChange}
          className="flex-1 px-2 py-1.5 text-sm bg-[var(--wall)] border border-[var(--border)] rounded text-[var(--foreground)]"
          placeholder="#RRGGBB"
          aria-label="Mã màu hex"
        />
      </div>

      {showOpacity && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
            <span className="w-16">Độ trong suốt</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={customOpacity}
              onChange={handleOpacityChange}
              className="flex-1 accent-[var(--accent)]"
              aria-label="Độ trong suốt"
            />
            <span className="w-10 text-right">{Math.round(customOpacity * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {trigger}
      {open && createPortal(popover, document.body)}
    </>
  )
}