import { useState } from 'react'
import { Button } from '../ui/Button'

interface ShareModalProps {
  open: boolean
  roomId: string
  roomName: string
  onClose: () => void
}

export function ShareModal({ open, roomId, roomName, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState<'id' | 'link' | null>(null)
  const joinUrl = `${window.location.origin}?room=${roomId}`

  if (!open) return null

  const copyToClipboard = async (text: string, type: 'id' | 'link') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="bg-[var(--wall)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative px-6 py-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-light)] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--accent)]">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Chia sẻ phòng học</h2>
              <p className="text-sm text-[var(--foreground-muted)] truncate">{roomName}</p>
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

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Mã phòng</label>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg font-mono text-[var(--foreground)] truncate">
                {roomId}
              </div>
              <Button
                variant={copied === 'id' ? 'primary' : 'outline'}
                onClick={() => copyToClipboard(roomId, 'id')}
              >
                {copied === 'id' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Đường dẫn tham gia</label>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--foreground-muted)] truncate text-sm">
                {joinUrl}
              </div>
              <Button
                variant={copied === 'link' ? 'primary' : 'outline'}
                onClick={() => copyToClipboard(joinUrl, 'link')}
              >
                {copied === 'link' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                )}
              </Button>
            </div>
          </div>

          <div className="p-3 bg-[var(--accent-light)] rounded-lg text-sm text-[var(--accent)] flex items-start gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>Chia sẻ mã phòng hoặc đường dẫn cho học sinh để họ tham gia lớp học.</span>
          </div>
        </div>
      </div>
    </div>
  )
}