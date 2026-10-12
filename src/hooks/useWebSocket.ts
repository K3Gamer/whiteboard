import { useEffect, useRef, useState, useCallback } from 'react'
import { WSMessage, WSEvents, WSMessageType } from '../types'

type MessageHandler<T extends WSMessageType> = (payload: WSEvents[T]) => void

interface UseWebSocketOptions {
  url: string
  onMessage?: (message: WSMessage) => void
}

export function useWebSocket({ url, onMessage }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const handlersRef = useRef<Map<string, Set<MessageHandler<any>>>>(new Map())
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const reconnectAttemptsRef = useRef(0)
  const shouldReconnectRef = useRef(true)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        setError(null)
        reconnectAttemptsRef.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data)
          onMessage?.(message)
          const handlers = handlersRef.current.get(message.type)
          if (handlers) {
            handlers.forEach(handler => handler(message.payload))
          }
        } catch (err) {
          console.error('Error parsing WS message:', err)
        }
      }

      ws.onerror = () => {
        setError('Lỗi kết nối')
      }

      ws.onclose = () => {
        setConnected(false)
        wsRef.current = null
        if (shouldReconnectRef.current) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000)
          reconnectAttemptsRef.current++
          reconnectTimeoutRef.current = setTimeout(connect, delay)
        }
      }
    } catch (err) {
      setError('Không thể kết nối')
    }
  }, [url, onMessage])

  useEffect(() => {
    shouldReconnectRef.current = true
    connect()
    return () => {
      shouldReconnectRef.current = false
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  const send = useCallback(<T extends WSMessageType>(type: T, payload: WSEvents[T], roomId: string = '', userId: string = '') => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: WSMessage = {
        type,
        payload,
        userId,
        roomId,
        timestamp: Date.now(),
      }
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  const on = useCallback(<T extends WSMessageType>(type: T, handler: MessageHandler<T>) => {
    if (!handlersRef.current.has(type)) {
      handlersRef.current.set(type, new Set())
    }
    handlersRef.current.get(type)!.add(handler)
    return () => {
      handlersRef.current.get(type)?.delete(handler)
    }
  }, [])

  return { connected, error, send, on }
}