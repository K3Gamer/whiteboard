import { useState, useEffect } from 'react'
import { cn } from '../../utils/cn'
import { AppSettings } from '../../types'
import { Panel, CollapsiblePanel } from '../ui/Panel'
import { Button } from '../ui/Button'
import { Slider } from '../ui/Slider'

interface SettingsPanelProps {
  settings: AppSettings
  onSettingsChange: (settings: Partial<AppSettings>) => void
  open: boolean
  onClose: () => void
}

export function SettingsPanel({ settings, onSettingsChange, open, onClose }: SettingsPanelProps) {
  const [theme, setTheme] = useState(settings.theme)
  const [language, setLanguage] = useState(settings.language)

  useEffect(() => {
    onSettingsChange({ theme })
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('whiteboard-theme', theme)
  }, [theme, onSettingsChange])

  useEffect(() => {
    onSettingsChange({ language })
    localStorage.setItem('whiteboard-language', language)
  }, [language, onSettingsChange])

  useEffect(() => {
    const savedTheme = localStorage.getItem('whiteboard-theme') as AppSettings['theme'] | null
    const savedLang = localStorage.getItem('whiteboard-language') as AppSettings['language'] | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)
    }
    if (savedLang) setLanguage(savedLang)
  }, [])

  return (
    <Panel
      title="Cài đặt"
      icon={
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      }
      position="right"
      defaultOpen={open}
      width={320}
      onClose={onClose}
    >
      <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        <CollapsiblePanel title="Giao diện" icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        }>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Chế độ màu</label>
              <div className="flex gap-2">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all',
                      theme === t
                        ? 'border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]'
                        : 'border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)]'
                    )}
                  >
                    {t === 'light' ? 'Sáng' : t === 'dark' ? 'Tối' : 'Hệ thống'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Ngôn ngữ</label>
              <div className="flex gap-2">
                {(['vi', 'en'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLanguage(l)}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all',
                      language === l
                        ? 'border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]'
                        : 'border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)]'
                    )}
                  >
                    {l === 'vi' ? 'Tiếng Việt' : 'English'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel title="Bảng vẽ" icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8" />
            <path d="M12 17v4" />
          </svg>
        }>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.showGrid}
                onChange={(e) => onSettingsChange({ showGrid: e.target.checked })}
                className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <span className="text-sm text-[var(--foreground)]">Hiển thị lưới</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.snapToGrid}
                onChange={(e) => onSettingsChange({ snapToGrid: e.target.checked })}
                className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <span className="text-sm text-[var(--foreground)]">Cắm vào lưới</span>
            </label>

            <Slider
              label="Kích thước lưới"
              value={settings.gridSize}
              onChange={(e) => onSettingsChange({ gridSize: Number(e.target.value) })}
              min={10}
              max={100}
              step={5}
            />

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={(e) => onSettingsChange({ autoSave: e.target.checked })}
                className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <span className="text-sm text-[var(--foreground)]">Tự động lưu</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.shortcutsEnabled}
                onChange={(e) => onSettingsChange({ shortcutsEnabled: e.target.checked })}
                className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <span className="text-sm text-[var(--foreground)]">Phím tắt</span>
            </label>
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel title="Nâng cao" icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="4 17 10 11 4 5" />
            <polyline points="20 17 14 11 20 5" />
          </svg>
        }>
          <div className="space-y-4">
            <Button variant="outline" onClick={() => {}} className="w-full justify-start">
              Xuất dữ liệu bảng
            </Button>
            <Button variant="outline" onClick={() => {}} className="w-full justify-start">
              Nhập dữ liệu bảng
            </Button>
            <Button variant="outline" onClick={() => {}} className="w-full justify-start">
              Khôi phục mặc định
            </Button>
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel title="Phím tắt" icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M6 8h.01" />
            <path d="M10 8h.01" />
            <path d="M14 8h.01" />
            <path d="M18 8h.01" />
            <path d="M8 12h.01" />
            <path d="M12 12h.01" />
            <path d="M16 12h.01" />
            <path d="M6 16h.01" />
            <path d="M10 16h.01" />
            <path d="M14 16h.01" />
            <path d="M18 16h.01" />
          </svg>
        } defaultOpen={false}>
          <div className="space-y-3 text-sm">
            {[
              ['V', 'Chọn'],
              ['H', 'Cú pháp'],
              ['P', 'Bút vẽ'],
              ['E', 'Tẩy'],
              ['L', 'Đường thẳng'],
              ['A', 'Mũi tên'],
              ['R', 'Hình chữ nhật'],
              ['O', 'Hình tròn'],
              ['T', 'Văn bản'],
              ['N', 'Ghi chú'],
              ['I', 'Hình ảnh'],
              ['K', 'Con trỏ laser'],
              ['Ctrl+Z', 'Hoàn tác'],
              ['Ctrl+Y', 'Làm lại'],
              ['Delete', 'Xóa đối tượng'],
              ['G', 'Bật/tắt lưới'],
              ['Shift+G', 'Bật/tắt cắm lưới'],
              ['+/-', 'Zoom in/out'],
              ['0', 'Reset zoom'],
            ].map(([key, action]) => (
              <div key={key} className="flex items-center justify-between py-1">
                <kbd className="px-2 py-1 bg-[var(--surface)] border border-[var(--border)] rounded text-[var(--foreground-muted)] font-mono text-xs">
                  {key}
                </kbd>
                <span className="text-[var(--foreground)]">{action}</span>
              </div>
            ))}
          </div>
        </CollapsiblePanel>
      </div>
    </Panel>
  )
}