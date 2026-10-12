import { User, UserRole } from '../../types'
import { IconButton } from '../ui/IconButton'
import { Panel } from '../ui/Panel'

interface ParticipantsPanelProps {
  users: User[]
  currentUserId: string
  currentUserRole: UserRole
  onKickUser: (userId: string) => void
  onGrantPermission: (userId: string, permission: 'draw' | 'chat') => void
  onRevokePermission: (userId: string, permission: 'draw' | 'chat') => void
  allowStudentDraw: boolean
  allowStudentChat: boolean
  open: boolean
  onClose: () => void
}

export function ParticipantsPanel({
  users,
  currentUserId,
  currentUserRole,
  onKickUser,
  onGrantPermission,
  onRevokePermission,
  allowStudentDraw,
  allowStudentChat,
  open,
  onClose,
}: ParticipantsPanelProps) {
  const teacher = users.find(u => u.role === 'teacher')
  const students = users.filter(u => u.role === 'student')

  const isCurrentUser = (userId: string) => userId === currentUserId
  const canManage = currentUserRole === 'teacher'

  return (
    <Panel
      title="Thành viên"
      icon={
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      }
      position="right"
      defaultOpen={open}
      width={280}
      onClose={onClose}
    >
      <div className="space-y-3">
        {teacher && (
          <div className="flex items-center gap-3 p-2 bg-[var(--surface)] rounded-lg">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white" style={{ background: teacher.color }}>
              {teacher.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[var(--foreground)] truncate">{teacher.name}</span>
                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                  Giáo viên
                </span>
                {isCurrentUser(teacher.id) && (
                  <span className="px-2 py-0.5 text-xs bg-[var(--accent-light)] text-[var(--accent)] rounded-full">Bạn</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: teacher.isOnline ? 'var(--success)' : 'var(--danger)' }} />
                  {teacher.isOnline ? 'Đang trực tuyến' : 'Ngoài tuyến'}
                </span>
              </div>
            </div>
          </div>
        )}

        {students.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider mb-2">
              Học sinh ({students.length})
            </h4>
            <div className="space-y-2">
              {students.map((student) => (
                <div key={student.id} className="flex items-center gap-3 p-2 bg-[var(--surface)] rounded-lg">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white" style={{ background: student.color }}>
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--foreground)] truncate">{student.name}</span>
                      {isCurrentUser(student.id) && (
                        <span className="px-2 py-0.5 text-xs bg-[var(--accent-light)] text-[var(--accent)] rounded-full">Bạn</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: student.isOnline ? 'var(--success)' : 'var(--danger)' }} />
                        {student.isOnline ? 'Đang trực tuyến' : 'Ngoài tuyến'}
                      </span>
                    </div>
                  </div>
                  {canManage && !isCurrentUser(student.id) && (
                    <div className="flex items-center gap-1">
                      <IconButton
                        variant="ghost"
                        size="sm"
                        onClick={() => allowStudentDraw ? onRevokePermission(student.id, 'draw') : onGrantPermission(student.id, 'draw')}
                        aria-label={allowStudentDraw ? 'Thu hồi quyền vẽ' : 'Cấp quyền vẽ'}
                        className={allowStudentDraw ? 'text-[var(--success)]' : 'text-[var(--foreground-muted)]'}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 19l7-7 3 3-7 7-3-3z" />
                          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                          <path d="M2 2l7.586 7.586" />
                          <circle cx="11" cy="11" r="2" />
                        </svg>
                      </IconButton>
                      <IconButton
                        variant="ghost"
                        size="sm"
                        onClick={() => allowStudentChat ? onRevokePermission(student.id, 'chat') : onGrantPermission(student.id, 'chat')}
                        aria-label={allowStudentChat ? 'Thu hồi quyền chat' : 'Cấp quyền chat'}
                        className={allowStudentChat ? 'text-[var(--success)]' : 'text-[var(--foreground-muted)]'}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </IconButton>
                      <IconButton
                        variant="ghost"
                        size="sm"
                        onClick={() => onKickUser(student.id)}
                        aria-label="Loại khỏi phòng"
                        className="text-[var(--danger)]"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                      </IconButton>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {students.length === 0 && (
          <div className="text-center py-8 text-[var(--foreground-muted)]">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-50">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <p>Chưa có học sinh nào tham gia</p>
            <p className="text-sm mt-1">Chia sẻ mã phòng để mời học sinh</p>
          </div>
        )}
      </div>
    </Panel>
  )
}