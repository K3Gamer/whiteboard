import { useEffect, useCallback } from 'react'
import { ToolType } from '../types'

interface ShortcutHandlers {
  onToolChange: (tool: ToolType) => void
  onUndo: () => void
  onRedo: () => void
  onDelete: () => void
  onCopy?: () => void
  onPaste?: () => void
  onDuplicate?: () => void
  onToggleGrid: () => void
  onToggleSnap: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
  onSelectAll: () => void
  onEscape: () => void
  enabled: boolean
}

const TOOL_SHORTCUTS: Record<string, ToolType> = {
  'v': 'select',
  'h': 'hand',
  'p': 'pen',
  'e': 'eraser',
  'l': 'line',
  'a': 'arrow',
  'r': 'rectangle',
  'o': 'ellipse',
  't': 'text',
  'n': 'sticky-note',
  'i': 'image',
  'k': 'laser-pointer',
}

export function useKeyboardShortcuts({
  onToolChange,
  onUndo,
  onRedo,
  onDelete,
  onCopy,
  onPaste,
  onDuplicate,
  onToggleGrid,
  onToggleSnap,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onSelectAll,
  onEscape,
  enabled,
}: ShortcutHandlers) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return

    const target = e.target as HTMLElement
    const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

    if (isInputFocused) {
      if (e.key === 'Escape') {
        target.blur()
        onEscape()
      }
      return
    }

    const key = e.key.toLowerCase()
    const ctrl = e.ctrlKey || e.metaKey
    const shift = e.shiftKey

    if (ctrl && key === 'z' && !shift) {
      e.preventDefault()
      onUndo()
      return
    }

    if ((ctrl && key === 'y') || (ctrl && shift && key === 'z')) {
      e.preventDefault()
      onRedo()
      return
    }

    if (ctrl && key === 'c') {
      e.preventDefault()
      onCopy?.()
      return
    }

    if (ctrl && key === 'v') {
      e.preventDefault()
      onPaste?.()
      return
    }

    if (ctrl && key === 'd') {
      e.preventDefault()
      onDuplicate?.()
      return
    }

    if (ctrl && key === 'a') {
      e.preventDefault()
      onSelectAll()
      return
    }

    if (key === 'delete' || key === 'backspace') {
      e.preventDefault()
      onDelete()
      return
    }

    if (key === 'escape') {
      onEscape()
      return
    }

    if (key === '+' || key === '=') {
      e.preventDefault()
      onZoomIn()
      return
    }

    if (key === '-') {
      e.preventDefault()
      onZoomOut()
      return
    }

    if (key === '0') {
      e.preventDefault()
      onResetZoom()
      return
    }

    if (shift && key === 'g') {
      e.preventDefault()
      onToggleSnap()
      return
    }

    if (key === 'g') {
      e.preventDefault()
      onToggleGrid()
      return
    }

    if (!ctrl && !shift && TOOL_SHORTCUTS[key]) {
      onToolChange(TOOL_SHORTCUTS[key])
    }
  }, [enabled, onToolChange, onUndo, onRedo, onDelete, onCopy, onPaste, onDuplicate, onToggleGrid, onToggleSnap, onZoomIn, onZoomOut, onResetZoom, onSelectAll, onEscape])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}