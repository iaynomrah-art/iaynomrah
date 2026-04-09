"use client"

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { NOTIFICATION_SOUND } from '@/lib/notificationSound'

export function TradeNotificationListener() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  // Track trades to calculate transitions manually without WebSockets
  const ongoingTrades = useRef<Set<string>>(new Set())
  const notifiedTrades = useRef<Set<string>>(new Set())

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }

    const audio = new Audio(NOTIFICATION_SOUND)
    audio.preload = 'auto'
    audio.volume = 1.0
    audioRef.current = audio

    const supabase = createClient()
    let isMounted = true

    const pollTrades = async () => {
      if (!isMounted) return

      try {
        // 1. Fetch current active trades so we know what they are
        const { data: activeData } = await supabase
          .from('paired_trading_accounts')
          .select('id, trade_status')
          .in('trade_status', ['ongoing', 'initializing', 'paired'])

        if (activeData) {
          activeData.forEach(t => ongoingTrades.current.add(t.id))
        }

        // 2. Fetch recently completed trades
        const { data: doneData } = await supabase
          .from('paired_trading_accounts')
          .select('id, trade_status, symbol')
          .eq('trade_status', 'done')
          .order('updated_at', { ascending: false })
          .limit(10)

        if (doneData) {
          for (const trade of doneData) {
            // If it was previously tracked as active, and we haven't notified for it yet
            if (ongoingTrades.current.has(trade.id) && !notifiedTrades.current.has(trade.id)) {
              
              // Mark as notified and remove from active list
              notifiedTrades.current.add(trade.id)
              ongoingTrades.current.delete(trade.id)

              console.log(`🔔 POLLER DETECTED DONE TRADE:`, trade.id)

              const sym = trade.symbol || 'your asset'
              const msg = `Trade completed for ${sym}!`
              const details = `Your paired trade has successfully finished.`

              if (audioRef.current) {
                  audioRef.current.currentTime = 0;
                  audioRef.current.play().catch(() => {});
              }
              
              toast.success(msg, { description: details })
              
              if ("Notification" in window && Notification.permission === "granted") {
                 new Notification(`💰 ${msg}`, { body: details });
              }
            }
          }
        }
      } catch (e) {
        console.error("Poller error:", e)
      }
    }

    // Run first poll immediately
    pollTrades()

    // Poll every 3 seconds
    const intervalId = setInterval(pollTrades, 3000)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [])

  return null
}
