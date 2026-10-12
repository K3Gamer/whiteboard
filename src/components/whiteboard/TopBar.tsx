import { IconButton } from '../ui/IconButton'
import { Dropdown } from '../ui/Dropdown'
import { Tooltip } from '../ui/Tooltip'
import { UserRole } from '../../types'

interface TopBarProps {
  roomName: string
  userRole: UserRole
  userName: string
  userColor: string
  participantCount: number
  onCreateRoom: () => void
  onJoinRoom: () => void
  onLeaveRoom: () => void
  onShare: () => void
  onSettings: () => void
  onToggleGrid: () => void
  onToggleSnap: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onClearCanvas: () => void
  isRecording: boolean
  onToggleRecord: () => void
  connected: boolean
}

export function TopBar({
  roomName,
  userRole,
  userName,
  userColor,
  participantCount,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onShare,
  onSettings,
  onToggleGrid,
  onToggleSnap,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onClearCanvas,
  isRecording,
  onToggleRecord,
  connected,
}: TopBarProps) {
  const userMenuItems = [
    { label: 'Hồ sơ', value: 'profile', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    )},
    { label: 'Cài đặt', value: 'settings', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    )},
    { label: 'Đăng xuất', value: 'logout', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    )},
  ]

  const roomMenuItems = [
    { label: 'Tạo phòng mới', value: 'create', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    )},
    { label: 'Tham gia phòng', value: 'join', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
      </svg>
    )},
    { label: 'Chia sẻ phòng', value: 'share', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    )},
    { label: 'Rời phòng', value: 'leave', danger: true, icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    )},
  ]

  const viewMenuItems = [
    { label: 'Lưới', value: 'grid', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    )},
    { label: 'Cắm lưới', value: 'snap', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16v16H4z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )},
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-20 h-14 bg-[var(--wall)] border-b border-[var(--border)] flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--accent)]">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8" />
            <path d="M12 17v4" />
          </svg>
          <span className="font-semibold text-lg text-[var(--foreground)]">WhiteBoard</span>
        </div>

        <div className="hidden md:flex items-center gap-1 ml-4 border-l border-[var(--border)] pl-4">
          <Dropdown
            trigger={
              <IconButton variant="ghost" size="sm" aria-label="Menu phòng">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6" />
                  <path d="M3 18h18" />
                  <path d="M16 10v8" />
                </svg>
              </IconButton>
            }
            items={roomMenuItems}
            onSelect={(value) => {
              if (value === 'create') onCreateRoom()
              else if (value === 'join') onJoinRoom()
              else if (value === 'share') onShare()
              else if (value === 'leave') onLeaveRoom()
            }}
          />
          <Dropdown
            trigger={
              <IconButton variant="ghost" size="sm" aria-label="Menu xem">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </IconButton>
            }
            items={viewMenuItems}
            onSelect={(value) => {
              if (value === 'grid') onToggleGrid()
              else if (value === 'snap') onToggleSnap()
            }}
          />
        </div>

        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-1.5 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--foreground-muted)]">
              <path d="M21 10V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6" />
              <path d="M3 18h18" />
              <path d="M16 10v8" />
            </svg>
            <span className="font-medium text-[var(--foreground)] truncate">{roomName}</span>
            <span className="px-2 py-0.5 text-xs bg-[var(--accent-light)] text-[var(--accent)] rounded-full">
              {participantCount} người
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <div className="hidden sm:flex items-center gap-1 border-r border-[var(--border)] pr-3">
          <Tooltip content="Hoàn tác (Ctrl+Z)" position="bottom">
            <IconButton variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo} aria-label="Hoàn tác">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
              </svg>
            </IconButton>
          </Tooltip>
          <Tooltip content="Làm lại (Ctrl+Y)" position="bottom">
            <IconButton variant="ghost" size="sm" onClick={onRedo} disabled={!canRedo} aria-label="Làm lại">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 7v6h-6" />
                <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
              </svg>
            </IconButton>
          </Tooltip>
        </div>

        <Tooltip content={isRecording ? 'Dừng ghi hình' : 'Ghi hình màn hình'} position="bottom">
          <IconButton
            variant={isRecording ? 'danger' : 'ghost'}
            size="sm"
            onClick={onToggleRecord}
            aria-label={isRecording ? 'Dừng ghi hình' : 'Ghi hình màn hình'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isRecording ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
            </svg>
          </IconButton>
        </Tooltip>

        <Tooltip content="Xóa bảng" position="bottom">
          <IconButton variant="ghost" size="sm" onClick={onClearCanvas} aria-label="Xóa bảng">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </IconButton>
        </Tooltip>

        <Dropdown
          trigger={
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--hover)] transition-colors" aria-label="Menu người dùng">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm" style={{ background: userColor, color: 'white' }}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block text-sm font-medium text-[var(--foreground)]">{userName}</span>
              <span className={`px-2 py-0.5 text-xs rounded-full ${userRole === 'teacher' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                {userRole === 'teacher' ? 'Giáo viên' : 'Học sinh'}
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--foreground-muted)]">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          }
          items={userMenuItems}
          onSelect={(value) => {
            if (value === 'settings') onSettings()
          }}
          align="right"
        />

        <div className="w-2 h-2 rounded-full" style={{ background: connected ? 'var(--success)' : 'var(--danger)' }} title={connected ? 'Đã kết nối' : 'Mất kết nối'} />
      </div>
    </header>
  )
}