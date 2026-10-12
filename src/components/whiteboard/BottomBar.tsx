import { IconButton } from '../ui/IconButton'
import { Tooltip } from '../ui/Tooltip'

interface BottomBarProps {
  scale: number
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
  onFitToScreen: () => void
  elementCount: number
  selectedCount: number
  cursorPosition: { x: number; y: number } | null
}

export function BottomBar({
  scale,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToScreen,
  elementCount,
  selectedCount,
  cursorPosition,
}: BottomBarProps) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-[var(--wall)]/90 backdrop-blur border border-[var(--border)] rounded-full px-2 py-1 shadow-xl">
      <Tooltip content="Thu nhỏ (-)" position="top">
        <IconButton variant="ghost" size="sm" onClick={onZoomOut} aria-label="Thu nhỏ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </IconButton>
      </Tooltip>

      <button
        onClick={onResetZoom}
        className="px-3 py-1 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--hover)] rounded-full transition-colors min-w-[60px]"
        title="Nhấn để reset (0)"
      >
        {Math.round(scale * 100)}%
      </button>

      <Tooltip content="Phóng to (+)" position="top">
        <IconButton variant="ghost" size="sm" onClick={onZoomIn} aria-label="Phóng to">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </IconButton>
      </Tooltip>

      <div className="w-px h-5 bg-[var(--border)] mx-1" />

      <Tooltip content="Vừa màn hình" position="top">
        <IconButton variant="ghost" size="sm" onClick={onFitToScreen} aria-label="Vừa màn hình">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        </IconButton>
      </Tooltip>

      <div className="w-px h-5 bg-[var(--border)] mx-1" />

      <div className="flex items-center gap-3 px-2 text-xs text-[var(--foreground-muted)]">
        <span>{elementCount} đối tượng</span>
        {selectedCount > 0 && (
          <span className="text-[var(--accent)] font-medium">{selectedCount} đã chọn</span>
        )}
        {cursorPosition && (
          <span className="font-mono hidden sm:inline">
            x: {Math.round(cursorPosition.x)} y: {Math.round(cursorPosition.y)}
          </span>
        )}
      </div>
    </div>
  )
}