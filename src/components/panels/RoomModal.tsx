import React, { useState } from 'react'
import { cn } from '../../utils/cn'
import { Button } from '../ui/Button'

interface RoomModalProps {
  open: boolean
  mode: 'create' | 'join'
  onClose: () => void
  onCreate: (data: { name: string; userName: string; roomName: string }) => void
  onJoin: (data: { name: string; userName: string; roomId: string }) => void
}

export function RoomModal({ open, mode: initialMode, onClose, onCreate, onJoin }: RoomModalProps) {
  const [mode, setMode] = useState<'create' | 'join'>(initialMode)
  const [roomName, setRoomName] = useState('Lớp học của tôi')
  const [roomId, setRoomId] = useState('')
  const [userName, setUserName] = useState('')
  const [error, setError] = useState('')

  React.useEffect(() => {
    setMode(initialMode)
    setError('')
  }, [initialMode, open])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!userName.trim()) {
      setError('Vui lòng nhập tên của bạn')
      return
    }

    if (mode === 'create') {
      onCreate({ name: '', userName: userName.trim(), roomName: roomName.trim() || 'Lớp học của tôi' })
    } else {
      if (!roomId.trim()) {
        setError('Vui lòng nhập mã phòng')
        return
      }
      onJoin({ name: '', userName: userName.trim(), roomId: roomId.trim() })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-[var(--wall)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative px-6 pt-6 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-light)] flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--accent)]">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8" />
                <path d="M12 17v4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">
                {mode === 'create' ? 'Tạo phòng học mới' : 'Tham gia phòng học'}
              </h2>
              <p className="text-sm text-[var(--foreground-muted)]">
                {mode === 'create' ? 'Bạn sẽ là giáo viên chủ phòng' : 'Nhập mã phòng từ giáo viên'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--foreground-muted)] hover:bg-[var(--hover)] hover:text-[var(--foreground)] transition-colors"
            aria-label="Đóng"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex border-b border-[var(--border)]">
          {(['create', 'join'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError('') }}
              className={cn(
                'flex-1 py-3 text-sm font-medium transition-colors relative',
                mode === m ? 'text-[var(--accent)]' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              )}
            >
              {m === 'create' ? 'Tạo phòng' : 'Tham gia'}
              {mode === m && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]" />}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="userName" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
              Tên của bạn <span className="text-[var(--danger)]">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <input
                id="userName"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="VD: Nguyễn Văn A"
                className="w-full pl-10 pr-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                autoFocus
              />
            </div>
          </div>

          {mode === 'create' ? (
            <div>
              <label htmlFor="roomName" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Tên phòng học
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6" />
                    <path d="M3 18h18" />
                    <path d="M16 10v8" />
                  </svg>
                </div>
                <input
                  id="roomName"
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="VD: Toán 10A1 - Tiết 3"
                  className="w-full pl-10 pr-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                />
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="roomId" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Mã phòng <span className="text-[var(--danger)]">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <input
                  id="roomId"
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="VD: room-1234-abc"
                  className="w-full pl-10 pr-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent font-mono"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-[var(--danger-light)] border border-[var(--danger)]/30 rounded-lg text-sm text-[var(--danger)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" className="w-full">
            {mode === 'create' ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Tạo phòng học
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                Tham gia ngay
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}