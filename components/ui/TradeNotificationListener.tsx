"use client"

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { NOTIFICATION_SOUND } from '@/lib/notificationSound'
import { CheckCircle2 } from 'lucide-react'

export function TradeNotificationListener() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
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

    const triggerNotification = async (trade: { id: string; symbol?: string }) => {
      // Deduplicate — only notify once per trade id per session
      if (notifiedTrades.current.has(trade.id)) return
      notifiedTrades.current.add(trade.id)

      console.log(`🔔 REALTIME DETECTED DONE TRADE:`, trade.id)

      // Fetch pair details to get names
      const { data: pairDetails } = await supabase
        .from('paired_trading_accounts')
        .select(`
          primary_account:trading_accounts!paired_trading_accounts_primary_account_fkey(
            funder_account:funder_account_id(
              package_data:package(
                name,
                credential:credentials(platform_id)
              )
            )
          ),
          secondary_account:trading_accounts!paired_trading_accounts_secondary_account_fkey(
            funder_account:funder_account_id(
              package_data:package(
                name,
                credential:credentials(platform_id)
              )
            )
          )
        `)
        .eq('id', trade.id)
        .single()

      const pData = (pairDetails as any)?.primary_account?.funder_account?.package_data
      const sData = (pairDetails as any)?.secondary_account?.funder_account?.package_data

      const primaryName = pData?.name || 'Unknown'
      const primaryId = pData?.credential?.platform_id || 'N/A'
      
      const secondaryName = sData?.name || 'Unknown'
      const secondaryId = sData?.credential?.platform_id || 'N/A'

      const pairDisplay = `${primaryName} (${primaryId}) & ${secondaryName} (${secondaryId})`

      const sym = trade.symbol || 'your asset'
      const msg = `Trade completed for ${sym}!`
      const details = `Pair: ${pairDisplay}`

      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => {})
      }

      const toastId = `trade-done-${trade.id}`
      toast.custom(
        (t) => (
          <div className="flex items-start gap-3 bg-gray-900 border border-green-500/40 rounded-xl shadow-xl px-4 py-4 min-w-[320px] max-w-sm">
            <CheckCircle2 className="text-green-400 mt-0.5 shrink-0" size={20} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">💰 {msg}</p>
              <p className="text-xs text-gray-400 mt-0.5">{details}</p>
            </div>
            <button
              onClick={() => toast.dismiss(t)}
              className="text-gray-500 hover:text-white text-lg leading-none shrink-0 ml-1"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ),
        {
          id: toastId,
          duration: Infinity,
          position: 'bottom-right',
        }
      )

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`💰 ${msg}`, { body: details })
      }
    }

    const channel = supabase
      .channel('trade-done-listener')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'paired_trading_accounts',
          filter: 'trade_status=eq.done',
        },
        (payload) => {
          const trade = payload.new as { id: string; symbol?: string; trade_status: string }
          if (trade.trade_status === 'done') {
            triggerNotification(trade)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return null
}
