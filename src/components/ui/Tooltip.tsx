import React, { useState, useRef } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactElement
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

export function Tooltip({ content, children, position = 'top', delay = 200 }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const [coords, setCoords] = useState({ x: 0, y: 0 })

  const show = () => {
    timeoutRef.current = setTimeout(() => {
      const rect = wrapperRef.current?.getBoundingClientRect()
      if (rect) {
        setCoords({ x: rect.left + rect.width / 2, y: rect.top })
      }
      setVisible(true)
    }, delay)
  }

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setVisible(false)
  }

  const offsets: Record<string, { x: string; y: string }> = {
    top: { x: '-50%', y: '-100%' },
    bottom: { x: '-50%', y: '0' },
    left: { x: '-100%', y: '-50%' },
    right: { x: '0', y: '-50%' },
  }

  const tooltip = visible ? (
    <div
      className="fixed z-[100] px-2 py-1.5 text-xs font-medium text-[var(--page)] bg-[var(--foreground)] rounded shadow-lg animate-fade-in whitespace-nowrap pointer-events-none"
      style={{
        left: coords.x,
        top: coords.y,
        transform: `translate(${offsets[position].x}, ${offsets[position].y})`,
        marginTop: position === 'top' ? -6 : position === 'bottom' ? 6 : 0,
      }}
      role="tooltip"
    >
      {content}
    </div>
  ) : null

  return (
    <>
      <span
        ref={wrapperRef}
        className="inline-flex"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onTouchStart={show}
        onTouchEnd={hide}
      >
        {children}
      </span>
      {visible && createPortal(tooltip, document.body)}
    </>
  )
}