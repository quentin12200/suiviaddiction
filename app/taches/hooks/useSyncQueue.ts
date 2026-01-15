'use client'

import { useState, useCallback, useEffect } from 'react'

export type SyncStatus = 'synced' | 'pending' | 'offline' | 'error'

interface PendingSync {
  id: string
  taskId: string
  action: 'create' | 'update' | 'delete'
  data: any
  retries: number
  timestamp: number
}

const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 2000, 4000] // Backoff exponentiel : 1s, 2s, 4s
const QUEUE_KEY = 'tasks_sync_queue'

export function useSyncQueue() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced')
  const [pendingCount, setPendingCount] = useState(0)
  const [isOnline, setIsOnline] = useState(true)

  // Charger la queue depuis localStorage au montage
  useEffect(() => {
    const savedQueue = localStorage.getItem(QUEUE_KEY)
    if (savedQueue) {
      const queue: PendingSync[] = JSON.parse(savedQueue)
      setPendingCount(queue.length)
      if (queue.length > 0) {
        setSyncStatus('pending')
      }
    }

    // Écouter les changements de connexion
    const handleOnline = () => {
      setIsOnline(true)
      processQueue()
    }
    const handleOffline = () => {
      setIsOnline(false)
      setSyncStatus('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Vérifier l'état initial
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Ajouter une opération à la queue
  const enqueue = useCallback((taskId: string, action: 'create' | 'update' | 'delete', data: any) => {
    const queue = getQueue()
    const pendingSync: PendingSync = {
      id: crypto.randomUUID(),
      taskId,
      action,
      data,
      retries: 0,
      timestamp: Date.now()
    }
    queue.push(pendingSync)
    saveQueue(queue)
    setPendingCount(queue.length)
    setSyncStatus('pending')

    // Essayer de traiter immédiatement si online
    if (isOnline) {
      processQueue()
    }

    return pendingSync.id
  }, [isOnline])

  // Récupérer la queue depuis localStorage
  const getQueue = (): PendingSync[] => {
    const saved = localStorage.getItem(QUEUE_KEY)
    return saved ? JSON.parse(saved) : []
  }

  // Sauvegarder la queue dans localStorage
  const saveQueue = (queue: PendingSync[]) => {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  }

  // Exécuter une sync avec retry et backoff
  const executeSyncWithRetry = useCallback(async (item: PendingSync): Promise<void> => {
    const delay = item.retries > 0 ? RETRY_DELAYS[item.retries - 1] || 4000 : 0

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }

    const endpoint = item.action === 'create'
      ? '/api/tasks'
      : `/api/tasks/${item.taskId}`

    const method = item.action === 'create'
      ? 'POST'
      : item.action === 'update'
        ? 'PATCH'
        : 'DELETE'

    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method !== 'DELETE' ? JSON.stringify(item.data) : undefined,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
  }, [])

  // Traiter la queue
  const processQueue = useCallback(async () => {
    const queue = getQueue()
    if (queue.length === 0) {
      setSyncStatus('synced')
      setPendingCount(0)
      return
    }

    setSyncStatus('pending')
    const remainingQueue: PendingSync[] = []

    for (const item of queue) {
      try {
        await executeSyncWithRetry(item)
        // Succès : ne pas remettre dans la queue
      } catch (error) {
        console.error(`Erreur sync tâche ${item.taskId}:`, error)

        // Si échec après toutes les tentatives
        if (item.retries >= MAX_RETRIES) {
          console.error(`Échec définitif après ${MAX_RETRIES} tentatives`)
          setSyncStatus('error')
          // On garde quand même dans la queue pour réessayer manuellement
        }

        // Incrémenter les tentatives et remettre dans la queue
        item.retries++
        remainingQueue.push(item)
      }
    }

    saveQueue(remainingQueue)
    setPendingCount(remainingQueue.length)

    if (remainingQueue.length === 0) {
      setSyncStatus('synced')
    } else if (remainingQueue.some(item => item.retries >= MAX_RETRIES)) {
      setSyncStatus('error')
    } else {
      setSyncStatus('pending')
    }
  }, [executeSyncWithRetry])

  // Forcer le traitement de la queue (bouton manuel)
  const forceSync = useCallback(() => {
    if (!isOnline) {
      alert('Vous êtes hors ligne. Impossible de synchroniser.')
      return
    }
    processQueue()
  }, [isOnline, processQueue])

  // Vider la queue (debug uniquement)
  const clearQueue = useCallback(() => {
    localStorage.removeItem(QUEUE_KEY)
    setPendingCount(0)
    setSyncStatus('synced')
  }, [])

  return {
    syncStatus,
    pendingCount,
    isOnline,
    enqueue,
    forceSync,
    clearQueue,
  }
}
