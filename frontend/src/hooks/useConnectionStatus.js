import { useCallback, useEffect, useRef, useState } from 'react'
import { api, NETWORK_ERROR_EVENT } from '../services/api.js'

const ONLINE_POLL_MS = 15000
const OFFLINE_POLL_MS = 4000
// Un solo /health fallito può essere un singhiozzo di rete: si va offline al secondo di fila
const FAILURES_BEFORE_OFFLINE = 2

/**
 * Stato della connessione al backend: 'checking' finché non arriva la prima risposta,
 * poi 'online' o 'offline'. Combina gli eventi online/offline del browser, il polling
 * di /health (più fitto quando si è offline) e gli errori di rete delle chiamate API.
 * `reconnectCount` aumenta a ogni ritorno online dopo una disconnessione.
 */
export default function useConnectionStatus() {
  const [status, setStatus] = useState('checking')
  const [reconnectCount, setReconnectCount] = useState(0)
  const statusRef = useRef(status)
  const failuresRef = useRef(0)
  const inFlightRef = useRef(false)

  const applyStatus = useCallback((next) => {
    if (statusRef.current === next) return
    if (statusRef.current === 'offline' && next === 'online') setReconnectCount((c) => c + 1)
    statusRef.current = next
    setStatus(next)
  }, [])

  // `confirmed`: una richiesta reale è appena fallita, quindi basta un controllo negativo
  const check = useCallback(async (confirmed = false) => {
    if (inFlightRef.current) return
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      failuresRef.current = FAILURES_BEFORE_OFFLINE
      applyStatus('offline')
      return
    }
    inFlightRef.current = true
    try {
      await api.checkHealth()
      failuresRef.current = 0
      applyStatus('online')
    } catch {
      failuresRef.current += 1
      if (confirmed || failuresRef.current >= FAILURES_BEFORE_OFFLINE || statusRef.current === 'checking') {
        applyStatus('offline')
      }
    } finally {
      inFlightRef.current = false
    }
  }, [applyStatus])

  useEffect(() => {
    check()
  }, [check])

  useEffect(() => {
    const interval = setInterval(check, status === 'offline' ? OFFLINE_POLL_MS : ONLINE_POLL_MS)
    return () => clearInterval(interval)
  }, [check, status])

  useEffect(() => {
    const handleOffline = () => {
      failuresRef.current = FAILURES_BEFORE_OFFLINE
      applyStatus('offline')
    }
    const handleOnline = () => check()
    const handleNetworkError = () => check(true)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    window.addEventListener(NETWORK_ERROR_EVENT, handleNetworkError)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener(NETWORK_ERROR_EVENT, handleNetworkError)
    }
  }, [applyStatus, check])

  return { status, isOnline: status === 'online', isOffline: status === 'offline', reconnectCount, retry: check }
}
