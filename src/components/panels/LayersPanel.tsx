import React from 'react'
import { cn } from '../../utils/cn'
import { WhiteboardElement, ToolType } from '../../types'
import { Panel } from '../ui/Panel'
import { IconButton } from '../ui/IconButton'

interface LayersPanelProps {
  elements: WhiteboardElement[]
  selectedIds: string[]
  onSelectElement: (id: string, multi?: boolean) => void
  onDeleteElement: (id: string) => void
  onDuplicateElement: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onToggleVisibility: (id: string) => void
  onToggleLock: (id: string) => void
  open: boolean
  onClose: () => void
}

const TOOL_ICONS: Record<ToolType, React.ReactNode> = {
  select: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /><path d="M13 13l6 6" /></svg>,
  pen: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /></svg>,
  eraser: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 20H7L2 15l9-9 9 9 5 5z" /><path d="M16 4l4 4" /></svg>,
  line: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="19" x2="19" y2="5" /></svg>,
  rectangle: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>,
  ellipse: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /></svg>,
  arrow: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="19" x2="19" y2="5" /><polyline points="19 5 19 12 12 5" /></svg>,
  text: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 6.1H3" /><path d="M21 12.1H3" /><path d="M15.1 18H3" /></svg>,
  'sticky-note': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /><path d="M10 14H8" /><path d="M10 10H8" /><path d="M10 6H8" /><path d="M14 14h4" /><path d="M14 10h4" /><path d="M14 6h4" /></svg>,
  image: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>,
  'laser-pointer': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 2v4" /><path d="M12 18v4" /><path d="M4.93 4.93l2.83 2.83" /><path d="M16.24 16.24l2.83 2.83" /><path d="M2 12h4" /><path d="M18 12h4" /><path d="M4.93 19.07l2.83-2.83" /><path d="M16.24 7.76l2.83-2.83" /></svg>,
  hand: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v0" /><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v0" /><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" /><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" /></svg>,
}

const TOOL_LABELS: Record<ToolType, string> = {
  select: 'Chọn',
  pen: 'Bút vẽ',
  eraser: 'Tẩy',
  line: 'Đường thẳng',
  rectangle: 'Hình chữ nhật',
  ellipse: 'Hình tròn',
  arrow: 'Mũi tên',
  text: 'Văn bản',
  'sticky-note': 'Ghi chú',
  image: 'Hình ảnh',
  'laser-pointer': 'Con trỏ laser',
  hand: 'Cú pháp',
}

function getElementLabel(element: WhiteboardElement): string {
  if (element.type === 'text') return element.content.slice(0, 30) || 'Văn bản trống'
  if (element.type === 'sticky-note') return element.content.slice(0, 30) || 'Ghi chú trống'
  if (element.type === 'image') return element.alt || 'Hình ảnh'
  return TOOL_LABELS[element.type] || element.type
}

export function LayersPanel({
  elements,
  selectedIds,
  onSelectElement,
  onDeleteElement,
  onDuplicateElement,
  onMoveUp,
  onMoveDown,
  onToggleVisibility,
  onToggleLock,
  open,
  onClose,
}: LayersPanelProps) {
  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex)

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      onDeleteElement(id)
    }
  }

  return (
    <Panel
      title="Lớp"
      icon={
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      }
      position="right"
      defaultOpen={open}
      width={280}
      onClose={onClose}
    >
      <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
        {sortedElements.length === 0 ? (
          <div className="text-center py-8 text-[var(--foreground-muted)]">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-50">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            <p>Chưa có đối tượng nào</p>
          </div>
        ) : (
          [...sortedElements].reverse().map((element) => {
            const isSelected = selectedIds.includes(element.id)
            const isLocked = element.locked
            const isVisible = element.visible

            return (
              <div
                key={element.id}
                className={cn(
                  'group relative rounded-lg transition-colors',
                  isSelected ? 'bg-[var(--accent-light)] border border-[var(--accent)]' : 'bg-[var(--surface)] border border-transparent hover:border-[var(--border)]'
                )}
                onClick={() => onSelectElement(element.id, false)}
                onDoubleClick={() => {}}
                onKeyDown={(e) => handleKeyDown(e, element.id)}
                tabIndex={0}
                role="listitem"
                aria-selected={isSelected}
                aria-label={getElementLabel(element)}
              >
                <div className="flex items-center gap-2 p-2">
                  <IconButton
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleVisibility(element.id)
                    }}
                    aria-label={isVisible ? 'Ẩn' : 'Hiện'}
                    className={isVisible ? 'text-[var(--accent)]' : 'text-[var(--foreground-muted)] opacity-50'}
                  >
                    {isVisible ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                  </IconButton>

                  <IconButton
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleLock(element.id)
                    }}
                    aria-label={isLocked ? 'Mở khóa' : 'Khóa'}
                    className={isLocked ? 'text-[var(--danger)]' : 'text-[var(--foreground-muted)] opacity-50'}
                  >
                    {isLocked ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                      </svg>
                    )}
                  </IconButton>

                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="text-[var(--foreground-muted)] text-xs flex-shrink-0" style={{ color: element.type === 'pen' ? 'var(--accent)' : element.type === 'eraser' ? 'var(--danger)' : '' }}>
                      {TOOL_ICONS[element.type]}
                    </span>
                    <span className="text-sm font-medium text-[var(--foreground)] truncate">
                      {getElementLabel(element)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onMoveUp(element.id)
                      }}
                      aria-label="Đưa lên trên"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </IconButton>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onMoveDown(element.id)
                      }}
                      aria-label="Đưa xuống dưới"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </IconButton>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDuplicateElement(element.id)
                      }}
                      aria-label="Nhân bản"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </IconButton>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteElement(element.id)
                      }}
                      aria-label="Xóa"
                      className="text-[var(--danger)]"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </IconButton>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </Panel>
  )
}