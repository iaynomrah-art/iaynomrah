"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { NOTIFICATION_SOUND } from '@/lib/notificationSound'
import { CheckCircle2, Bell, BellRing, BellOff, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function TradeNotificationListener() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const notifiedTrades = useRef<Set<string>>(new Set())
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [showPrompt, setShowPrompt] = useState(false)

  // Centralized function to trigger all 3 notification types (Sound, Toast, Desktop)
  const triggerAllNotifications = useCallback((title: string, body: string, id?: string) => {

    // 1. Audio Notification
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(err => {})
    }

    // 2. Browser Desktop Notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { 
        body,
        icon: '/favicon.ico'
      })
    }

    // 3. UI Toast Notification (Custom Styled)
    const toastId = id || `notification-${Date.now()}`;
    toast.custom(
      (t) => (
        <div className="flex items-start gap-3 bg-gray-900 border border-green-500/40 rounded-xl shadow-xl px-4 py-4 min-w-[320px] max-w-sm animate-in fade-in slide-in-from-right-5">
          <CheckCircle2 className="text-green-400 mt-0.5 shrink-0" size={20} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{body}</p>
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
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) return
    
    const result = await Notification.requestPermission()
    setPermission(result)
    setShowPrompt(false)

    if (result === 'granted') {
      triggerAllNotifications(
        "Notifications Enabled! 🔔",
        "You will now receive alerts for completed trades."
      )
    } else {
      toast.error('Notifications disabled', {
        description: 'Please enable notifications in your browser settings to receive trade alerts.'
      })
    }
  }

  // Effect to initialize audio and check permission on mount
  useEffect(() => {
    const audio = new Audio(NOTIFICATION_SOUND)
    audio.preload = 'auto'
    audio.volume = 1.0
    audioRef.current = audio

    if (!("Notification" in window)) {
      setPermission('unsupported')
    } else {
      setPermission(Notification.permission)
      // Show the prompt banner if permission is still default
      if (Notification.permission === "default") {
        const timer = setTimeout(() => setShowPrompt(true), 2000)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  // Effect to listen for Realtime DB changes
  useEffect(() => {
    const supabase = createClient()

    const handleTradeDone = async (trade: { id: string; symbol?: string }) => {
      // Deduplicate — only notify once per trade id per session
      if (notifiedTrades.current.has(trade.id)) return
      notifiedTrades.current.add(trade.id)

      // Fetch pair details to get human-readable names
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
      
      triggerAllNotifications(
        `💰 Trade completed for ${sym}!`,
        `Pair: ${pairDisplay}`,
        `trade-done-${trade.id}`
      )
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
            handleTradeDone(trade)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [triggerAllNotifications])

  if (permission === 'unsupported') return null

  return (
    <>
      {/* Floating UI: Permission Prompt Banner */}
      {showPrompt && permission === 'default' && (
        <div className="fixed bottom-6 left-6 z-[100] animate-in slide-in-from-left-10 duration-500">
          <div className="bg-[#0a0a0a] border border-blue-500/30 rounded-2xl shadow-2xl p-5 flex flex-col gap-4 max-w-xs backdrop-blur-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                  <BellRing size={20} />
                </div>
                <h3 className="text-sm font-bold text-white">Trade Alerts</h3>
              </div>
              <button 
                onClick={() => setShowPrompt(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <p className="text-xs text-gray-400 leading-relaxed">
              Enable desktop notifications to get instant alerts when your trades are completed.
            </p>

            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={requestPermission}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white border-none text-[11px] font-bold h-8"
              >
                Enable Now
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowPrompt(false)}
                className="flex-1 text-gray-400 hover:text-white hover:bg-white/5 text-[11px] font-bold h-8"
              >
                Later
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating UI: Status Indicator / Test Button */}
      <div className="fixed bottom-6 left-6 z-[90]">
        <button
          onClick={permission === 'granted' ? () => {
            triggerAllNotifications(
              "Test Notification 🚀",
              "Realtime notifications are active and working!"
            );
          } : requestPermission}
          suppressHydrationWarning={true}
          className={cn(
            "group relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 border shadow-lg overflow-hidden",
            permission === 'granted' 
              ? "bg-green-500/10 border-green-500/40 text-green-400 hover:bg-green-500/20 shadow-green-500/10" 
              : permission === 'denied'
                ? "bg-red-500/10 border-red-500/40 text-red-400 opacity-50 cursor-not-allowed"
                : "bg-blue-500/10 border-blue-500/40 text-blue-400 hover:bg-blue-500/20 shadow-blue-500/10"
          )}
          title={
            permission === 'granted' ? "Notifications Active (Click to test)" : 
            permission === 'denied' ? "Notifications Blocked" : "Enable Notifications"
          }
        >
          {permission === 'granted' ? (
            <Bell size={18} className="group-hover:scale-110 transition-transform" />
          ) : permission === 'denied' ? (
            <BellOff size={18} />
          ) : (
            <BellRing size={18} className="animate-pulse" />
          )}
          
          {permission === 'granted' && (
            <span className="absolute inset-0 rounded-full border border-green-500/20 animate-ping" />
          )}
        </button>
      </div>
    </>
  )
}
