// src/hooks/useCardNotifications.ts
// Schedules push notifications for credit card due dates
// Called once on app open (from MainApp)

import { useEffect } from 'react'
import { useFinanceStore } from '@/store/finance-store'

async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

async function getServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.ready
  } catch {
    return null
  }
}

function getDaysUntilDue(dueDay: number): number {
  const today = new Date()
  const currentDay = today.getDate()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()

  if (dueDay >= currentDay) {
    return dueDay - currentDay
  } else {
    // Due day is next month
    return (daysInMonth - currentDay) + dueDay
  }
}

function formatCurrencySimple(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
}

export function useCardNotifications() {
  const { creditCards, settings } = useFinanceStore()

  useEffect(() => {
    // diasAviso: how many days before due date to notify (default 3)
    const diasAviso = settings.diasAviso ?? 3

    if (diasAviso <= 0) return
    if (!creditCards || creditCards.length === 0) return

    scheduleNotifications(creditCards, diasAviso)
  }, [creditCards, settings.diasAviso])
}

async function scheduleNotifications(
  creditCards: Array<{ id: string; name: string; currentStatement: number; dueDay: number }>,
  diasAviso: number
) {
  const hasPermission = await requestPermission()
  if (!hasPermission) return

  const sw = await getServiceWorker()
  if (!sw) return

  const notifications: Array<{
    title: string
    body: string
    tag: string
    delayMs: number
  }> = []

  const LAST_SCHEDULED_KEY = 'vanta_notifications_scheduled'
  const today = new Date().toDateString()
  const lastScheduled = localStorage.getItem(LAST_SCHEDULED_KEY)

  // Only reschedule once per day to avoid duplicates
  if (lastScheduled === today) return
  localStorage.setItem(LAST_SCHEDULED_KEY, today)

  creditCards.forEach((card) => {
    const daysUntil = getDaysUntilDue(card.dueDay)

    if (daysUntil === diasAviso || daysUntil === 1 || daysUntil === 0) {
      const title =
        daysUntil === 0
          ? `⚠️ ${card.name} vence HOJE`
          : daysUntil === 1
          ? `🔔 ${card.name} vence amanhã`
          : `📅 ${card.name} vence em ${daysUntil} dias`

      const body =
        card.currentStatement > 0
          ? `Fatura: ${formatCurrencySimple(card.currentStatement)} • Dia ${card.dueDay}`
          : `Vencimento dia ${card.dueDay} — sem fatura registrada`

      // Schedule notification for 9am today (or immediately if past 9am)
      const now = new Date()
      const nineAM = new Date(now)
      nineAM.setHours(9, 0, 0, 0)
      const delayMs = Math.max(nineAM.getTime() - now.getTime(), 5000)

      notifications.push({
        title,
        body,
        tag: `card-due-${card.id}-${daysUntil}`,
        delayMs,
      })
    }
  })

  if (notifications.length > 0 && sw.active) {
    sw.active.postMessage({
      type: 'SCHEDULE_NOTIFICATIONS',
      notifications,
    })
  }
}
