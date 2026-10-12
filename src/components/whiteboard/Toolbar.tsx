import React from 'react'
import { ToolType, DEFAULT_TOOL_SETTINGS, FONT_FAMILIES } from '../../types'
import { IconButton } from '../ui/IconButton'
import { ColorPicker } from '../ui/ColorPicker'
import { Slider } from '../ui/Slider'
import { Dropdown } from '../ui/Dropdown'
import { Tooltip } from '../ui/Tooltip'

interface ToolbarProps {
  tool: ToolType
  onToolChange: (tool: ToolType) => void
  settings: typeof DEFAULT_TOOL_SETTINGS
  onSettingsChange: (settings: Partial<typeof DEFAULT_TOOL_SETTINGS>) => void
  canDraw: boolean
}

const TOOLS: { type: ToolType; label: string; icon: React.ReactNode; shortcut?: string }[] = [
  { type: 'select', label: 'Chọn (V)', shortcut: 'V', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      <path d="M13 13l6 6" />
    </svg>
  )},
  { type: 'hand', label: 'Cú pháp (H)', shortcut: 'H', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v0" />
      <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v0" />
      <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </svg>
  )},
  { type: 'pen', label: 'Bút vẽ (P)', shortcut: 'P', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  )},
  { type: 'eraser', label: 'Tẩy (E)', shortcut: 'E', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 20H7L2 15l9-9 9 9 5 5z" />
      <path d="M16 4l4 4" />
    </svg>
  )},
  { type: 'line', label: 'Đường thẳng (L)', shortcut: 'L', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="19" x2="19" y2="5" />
    </svg>
  )},
  { type: 'arrow', label: 'Mũi tên (A)', shortcut: 'A', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="19" x2="19" y2="5" />
      <polyline points="19 5 19 12 12 5" />
    </svg>
  )},
  { type: 'rectangle', label: 'Hình chữ nhật (R)', shortcut: 'R', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  )},
  { type: 'ellipse', label: 'Hình tròn (O)', shortcut: 'O', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
    </svg>
  )},
  { type: 'text', label: 'Văn bản (T)', shortcut: 'T', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 6.1H3" />
      <path d="M21 12.1H3" />
      <path d="M15.1 18H3" />
    </svg>
  )},
  { type: 'sticky-note', label: 'Ghi chú (N)', shortcut: 'N', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
      <path d="M10 14H8" />
      <path d="M10 10H8" />
      <path d="M10 6H8" />
      <path d="M14 14h4" />
      <path d="M14 10h4" />
      <path d="M14 6h4" />
    </svg>
  )},
  { type: 'image', label: 'Hình ảnh (I)', shortcut: 'I', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )},
  { type: 'laser-pointer', label: 'Con trỏ laser (K)', shortcut: 'K', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="M4.93 4.93l2.83 2.83" />
      <path d="M16.24 16.24l2.83 2.83" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
      <path d="M4.93 19.07l2.83-2.83" />
      <path d="M16.24 7.76l2.83-2.83" />
    </svg>
  )},
]

const FONT_FAMILY_OPTIONS = FONT_FAMILIES.map(f => ({ label: f, value: f }))

export function Toolbar({ tool, onToolChange, settings, onSettingsChange, canDraw }: ToolbarProps) {
  const handleToolClick = (t: ToolType) => {
    if (!canDraw && t !== 'select' && t !== 'hand' && t !== 'laser-pointer') return
    onToolChange(t)
  }

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 shadow-xl">
      <div className="flex flex-col gap-1">
        {TOOLS.map(({ type, label, icon, shortcut }) => (
          <Tooltip key={type} content={`${label}${shortcut ? ` (${shortcut})` : ''}`} position="right">
            <IconButton
              onClick={() => handleToolClick(type)}
              variant={tool === type ? 'primary' : 'ghost'}
              size="md"
              aria-label={label}
              aria-pressed={tool === type}
              disabled={!canDraw && type !== 'select' && type !== 'hand' && type !== 'laser-pointer'}
            >
              {icon}
            </IconButton>
          </Tooltip>
        ))}
      </div>

      <div className="h-px bg-[var(--border)] my-1" />

      {canDraw && (tool === 'pen' || tool === 'eraser' || tool === 'line' || tool === 'arrow' || tool === 'rectangle' || tool === 'ellipse') && (
        <div className="flex flex-col gap-3 px-1">
          <div>
            <ColorPicker
              value={settings.strokeColor}
              onChange={(color) => onSettingsChange({ strokeColor: color })}
              size="md"
            />
          </div>
          <Slider
            label="Độ dày"
            value={settings.strokeWidth}
            onChange={(e) => onSettingsChange({ strokeWidth: Number(e.target.value) })}
            min={1}
            max={20}
            step={1}
            showValue
          />
          <Slider
            label="Độ mờ"
            value={settings.opacity}
            onChange={(e) => onSettingsChange({ opacity: Number(e.target.value) })}
            min={0}
            max={1}
            step={0.1}
            showValue
            valueLabel={`${Math.round(settings.opacity * 100)}%`}
          />
        </div>
      )}

      {canDraw && (tool === 'rectangle' || tool === 'ellipse') && (
        <div className="flex flex-col gap-3 px-1 border-t border-[var(--border)] pt-2 mt-2">
          <div>
            <label className="text-xs text-[var(--foreground-muted)] mb-1 block">Màu nền</label>
            <ColorPicker
              value={settings.fillColor}
              onChange={(color) => onSettingsChange({ fillColor: color })}
              showOpacity
              opacity={settings.opacity}
              onOpacityChange={(opacity) => onSettingsChange({ opacity })}
              size="md"
            />
          </div>
        </div>
      )}

      {canDraw && tool === 'text' && (
        <div className="flex flex-col gap-3 px-1 border-t border-[var(--border)] pt-2 mt-2">
          <div>
            <label className="text-xs text-[var(--foreground-muted)] mb-1 block">Font</label>
            <Dropdown
              trigger={
                <button className="w-full px-2 py-1.5 text-sm bg-[var(--wall)] border border-[var(--border)] rounded text-left hover:bg-[var(--hover)] transition-colors">
                  {settings.fontFamily}
                </button>
              }
              items={FONT_FAMILY_OPTIONS.map(o => ({ label: o.label, value: o.value }))}
              onSelect={(value) => onSettingsChange({ fontFamily: value })}
            />
          </div>
          <Slider
            label="Cỡ chữ"
            value={settings.fontSize}
            onChange={(e) => onSettingsChange({ fontSize: Number(e.target.value) })}
            min={8}
            max={72}
            step={1}
            showValue
          />
          <div>
            <ColorPicker
              value={settings.strokeColor}
              onChange={(color) => onSettingsChange({ strokeColor: color })}
              size="md"
            />
          </div>
        </div>
      )}

      {canDraw && tool === 'sticky-note' && (
        <div className="flex flex-col gap-3 px-1 border-t border-[var(--border)] pt-2 mt-2">
          <div>
            <label className="text-xs text-[var(--foreground-muted)] mb-1 block">Màu ghi chú</label>
            <ColorPicker
              value={settings.fillColor}
              onChange={(color) => onSettingsChange({ fillColor: color })}
              size="md"
            />
          </div>
        </div>
      )}

      {!canDraw && (
        <div className="px-2 py-3 text-center text-xs text-[var(--foreground-muted)]">
          Chỉ xem - Liên hệ giáo viên để được cấp quyền vẽ
        </div>
      )}
    </div>
  )
}