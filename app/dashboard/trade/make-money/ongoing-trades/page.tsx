"use client"

import React, { useEffect, useState } from 'react'
import { PairedTableSkeleton } from '@/components/skeleton/PairedTableSkeleton'
import { ExternalLink, Activity } from 'lucide-react'
import OngoingTradeRow from '@/components/item/OngoingTradeRow'
import { realTimeGetPairedAccounts } from '@/helper/paired_accounts'
import { createClient } from '@/lib/supabase/client'


const OngoingTradesPage = () => {
    const [pairs, setPairs] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchOngoingTrades = async () => {
        try {
            const data = await realTimeGetPairedAccounts()
            // Filter only ongoing trades
            const ongoing = data.filter((p: any) => p.trade_status === 'ongoing')
            setPairs(ongoing)
        } catch (error) {
            console.error("Failed to fetch ongoing trades:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchOngoingTrades()

        // Realtime subscription
        const supabase = createClient()
        const channel = supabase
            .channel('ongoing_trades_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'paired_trading_accounts'
                },
                () => {
                    fetchOngoingTrades()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    if (isLoading) {
        return (
            <div className="space-y-8">
                <PairedTableSkeleton />
            </div>
        )
    }

    return (
        <div className="animate-in fade-in duration-500 w-full p-6">
            <div className="flex flex-col gap-1 mb-8">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Ongoing Trades
                </h2>
                <p className="text-sm text-muted-foreground">Monitor and recover real-time trade activity across your accounts.</p>
            </div>

            {pairs.length === 0 ? (
                <div className="mt-12 flex flex-col items-center justify-center p-12 border border-dashed border-[#1a1a1a] rounded-xl bg-[#0a0a0a]/50">
                    <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 text-blue-500">
                        <Activity className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-medium text-white">No ongoing trades</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-xs mt-1">
                        Active trades will appear here automatically for monitoring and recovery.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 items-start w-full">
                    {pairs.map((pair) => (
                        <OngoingTradeRow key={pair.id} pair={pair} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default OngoingTradesPage
