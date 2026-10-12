import React from 'react'
import { Button } from '../ui/Button'

interface LobbyProps {
  onCreateRoom: () => void
  onJoinRoom: () => void
}

export function Lobby({ onCreateRoom, onJoinRoom }: LobbyProps) {
  return (
    <div className="min-h-screen bg-[var(--page)] flex flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--accent)]">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8" />
            <path d="M12 17v4" />
          </svg>
          <span className="font-semibold text-xl text-[var(--foreground)]">WhiteBoard</span>
        </div>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          Tài liệu
        </a>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-3xl w-full text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[var(--accent-light)] text-[var(--accent)] rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
            Cộng tác theo thời gian thực
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-[var(--foreground)] mb-6 tracking-tight">
            Bảng trắng tương tác cho
            <br />
            <span className="text-[var(--accent)]">giảng dạy và học tập</span>
          </h1>

          <p className="text-lg text-[var(--foreground-muted)] mb-10 max-w-2xl mx-auto">
            Tạo lớp học trực tuyến, vẽ, chia sẻ ý tưởng và tương tác với học sinh theo thời gian thực.
            Server được host ngay trên máy của giáo viên — không cần cài đặt phức tạp.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button variant="primary" size="lg" onClick={onCreateRoom} className="w-full sm:w-auto">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Tạo phòng (Giáo viên)
            </Button>
            <Button variant="outline" size="lg" onClick={onJoinRoom} className="w-full sm:w-auto">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Tham gia phòng (Học sinh)
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <FeatureCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              }
              title="Vẽ & Ghi chú"
              description="Bút vẽ, hình khối, văn bản, ghi chú dán và nhiều công cụ khác."
            />
            <FeatureCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
              title="Cộng tác Real-time"
              description="Nhiều người cùng vẽ, con trỏ trực tiếp và đồng bộ tức thì."
            />
            <FeatureCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                  <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                  <line x1="6" y1="6" x2="6.01" y2="6" />
                  <line x1="6" y1="18" x2="6.01" y2="18" />
                </svg>
              }
              title="Quản lý lớp học"
              description="Phân quyền vẽ, chat, quản lý học sinh trực tiếp trong phòng."
            />
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-sm text-[var(--foreground-muted)]">
        WhiteBoard — Giải pháp giảng dạy tương tác
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:border-[var(--accent)]/40 transition-colors">
      <div className="w-12 h-12 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-[var(--foreground)] mb-1.5">{title}</h3>
      <p className="text-sm text-[var(--foreground-muted)]">{description}</p>
    </div>
  )
}