import React, { useState, useRef, useEffect } from 'react'
import { cn } from '../../utils/cn'
import { IconButton } from './IconButton'
import { createPortal } from 'react-dom'

interface PanelProps {
  title: string
  children: React.ReactNode
  position?: 'left' | 'right'
  defaultOpen?: boolean
  width?: number
  icon?: React.ReactNode
  onClose?: () => void
}

export function Panel({ 
  title, 
  children, 
  position = 'right', 
  defaultOpen = false, 
  width = 280,
  icon,
  onClose
}: PanelProps) {
  const [open, setOpen] = useState(defaultOpen)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const panel = (
    <div
      ref={panelRef}
      className={cn(
        'fixed top-0 z-40 h-full bg-[var(--wall)] border-[var(--border)] shadow-xl',
        'flex flex-col transition-transform duration-200 ease-out',
        position === 'left' 
          ? 'translate-x-0' 
          : 'translate-x-0',
        open ? '' : position === 'left' ? '-translate-x-full' : 'translate-x-full'
      )}
      style={{ width: `${width}px` }}
      role="dialog"
      aria-label={title}
      aria-hidden={!open}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          {icon && <span className="text-[var(--accent)]">{icon}</span>}
          <h2 className="font-semibold text-[var(--foreground)]">{title}</h2>
        </div>
        <IconButton
          onClick={() => { setOpen(false); onClose?.() }}
          aria-label="Đóng panel"
          variant="ghost"
          size="sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </IconButton>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {children}
      </div>
    </div>
  )

  const overlay = open && (
    <div
      className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm animate-fade-in"
      onClick={() => { setOpen(false); onClose?.() }}
      aria-hidden="true"
    />
  )

  return (
    <>
      {overlay}
      {open && createPortal(panel, document.body)}
    </>
  )
}

interface CollapsiblePanelProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  icon?: React.ReactNode
}

export function CollapsiblePanel({ title, children, defaultOpen = true, icon }: CollapsiblePanelProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--surface)]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-[var(--hover)] transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-[var(--accent)]">{icon}</span>}
          <h3 className="font-medium text-[var(--foreground)]">{title}</h3>
        </div>
        <svg
          className={cn('w-4 h-4 text-[var(--foreground-muted)] transition-transform', open ? 'rotate-180' : '')}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="p-3 border-t border-[var(--border)] animate-fade-in">
          {children}
        </div>
      )}
    </div>
  )
}