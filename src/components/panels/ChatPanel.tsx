import React, { useState, useRef, useEffect } from 'react'
import { cn } from '../../utils/cn'
import { User } from '../../types'
import { Panel } from '../ui/Panel'
import { Button } from '../ui/Button'

interface ChatMessage {
  id: string
  userId: string
  userName: string
  userColor: string
  message: string
  timestamp: number
  isOwn: boolean
}

interface ChatPanelProps {
  messages: ChatMessage[]
  currentUser: User | null
  allowChat: boolean
  onSendMessage: (message: string) => void
  open: boolean
  onClose: () => void
  unreadCount: number
}

export function ChatPanel({
  messages,
  currentUser,
  allowChat,
  onSendMessage,
  open,
  onClose,
  unreadCount,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || !allowChat) return
    onSendMessage(inputValue.trim())
    setInputValue('')
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Panel
      title={`Thảo luận${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
      icon={
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      }
      position="right"
      defaultOpen={open}
      width={320}
      onClose={onClose}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-[var(--foreground-muted)]">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-50">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p>Chưa có tin nhắn nào</p>
              <p className="text-sm mt-1">Hãy bắt đầu cuộc hội thoại!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={cn('flex gap-2', msg.isOwn && 'flex-row-reverse')}>
                {!msg.isOwn && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-white text-xs flex-shrink-0" style={{ background: msg.userColor }}>
                    {msg.userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-2',
                  msg.isOwn
                    ? 'bg-[var(--accent)] text-[var(--onfill)] rounded-br-md'
                    : 'bg-[var(--surface)] text-[var(--foreground)] rounded-bl-md border border-[var(--border)]'
                )}>
                  {!msg.isOwn && (
                    <div className="text-xs font-medium mb-1" style={{ color: msg.userColor }}>
                      {msg.userName}
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                  <div className={cn(
                    'text-xs mt-1 text-right',
                    msg.isOwn ? 'text-[var(--onfill)]/70' : 'text-[var(--foreground-muted)]'
                  )}>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
                {msg.isOwn && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-white text-xs flex-shrink-0" style={{ background: currentUser?.color }}>
                    {currentUser?.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-[var(--border)] p-3">
          {allowChat ? (
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter để xuống dòng)"
                className="flex-1 px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--foreground-muted)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                rows={1}
                style={{ minHeight: '40px', maxHeight: '120px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
                disabled={!allowChat}
              />
              <Button type="submit" variant="primary" size="sm" disabled={!inputValue.trim()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </Button>
            </div>
          ) : (
            <div className="text-center py-2 text-sm text-[var(--foreground-muted)]">
              Giáo viên đã tắt tính năng chat
            </div>
          )}
        </form>
      </div>
    </Panel>
  )
}