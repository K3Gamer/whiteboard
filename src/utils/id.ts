export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function generateUserId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function generateRoomId(): string {
  return `room-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
}