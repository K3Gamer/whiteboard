import React, { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'

interface DropdownItem {
  label: string
  value: string
  icon?: React.ReactNode
  disabled?: boolean
  danger?: boolean
}

interface DropdownProps {
  trigger: React.ReactElement
  items: DropdownItem[]
  onSelect: (value: string) => void
  align?: 'left' | 'right'
  width?: number
}

export function Dropdown({ trigger, items, onSelect, width }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const handleItemClick = (value: string) => {
    onSelect(value)
    setOpen(false)
  }

  const dropdown = (
    <div
      ref={dropdownRef}
      className={cn(
        'fixed z-50 min-w-[160px] max-w-[280px] bg-[var(--surface)] border border-[var(--border)] rounded-md shadow-lg',
        'animate-slide-in overflow-hidden'
      )}
      style={{ width: width ? `${width}px` : undefined }}
      role="menu"
    >
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => !item.disabled && handleItemClick(item.value)}
          disabled={item.disabled}
          className={cn(
            'w-full px-3 py-2 text-left text-sm flex items-center gap-2',
            'hover:bg-[var(--hover)] focus:outline-none focus:bg-[var(--hover)]',
            'transition-colors',
            item.danger ? 'text-[var(--danger)]' : 'text-[var(--foreground)]',
            item.disabled ? 'opacity-50 cursor-not-allowed' : ''
          )}
          role="menuitem"
          tabIndex={-1}
        >
          {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  )

  const triggerWithRef = React.cloneElement(trigger, {
    ref: triggerRef,
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation()
      setOpen(!open)
      trigger.props.onClick?.(e)
    },
    'aria-expanded': open,
    'aria-haspopup': 'menu',
  })

  return (
    <>
      {triggerWithRef}
      {open && createPortal(dropdown, document.body)}
    </>
  )
}