import { useState, useEffect, useCallback } from 'react'

export type NotificationPermission = 'default' | 'granted' | 'denied'

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const supported = 'Notification' in window

  useEffect(() => {
    if (supported) {
      setPermission(Notification.permission as NotificationPermission)
    }
  }, [supported])

  const requestPermission = useCallback(async () => {
    if (!supported) return false
    const result = await Notification.requestPermission()
    setPermission(result as NotificationPermission)
    return result === 'granted'
  }, [supported])

  // Lê Notification.permission diretamente (evita stale closure do state)
  const notify = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!supported || Notification.permission !== 'granted') return
      const n = new Notification(title, {
        icon: '/icon.svg',
        badge: '/icon.svg',
        ...options,
      })
      setTimeout(() => n.close(), 6000)
      return n
    },
    [supported],
  )

  return { permission, supported, requestPermission, notify }
}
