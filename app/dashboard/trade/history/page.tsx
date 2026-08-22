"use client"

import React, { useEffect, useState } from 'react'
import { PairedTableSkeleton } from '@/components/skeleton/PairedTableSkeleton'
import { History, Search } from 'lucide-react'
import TradeHistoryRow from '@/components/item/TradeHistoryRow'
import { realTimeGetPairedAccounts } from '@/helper/paired_accounts'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'


const TradeHistoryPage = () => {
    const [pairs, setPairs] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    const fetchTradeHistory = async () => {
        try {
            const data = await realTimeGetPairedAccounts()
            // Filter only done trades
            const doneTrades = data.filter((p: any) => p.trade_status === 'done')
            setPairs(doneTrades)
        } catch (error) {
            console.error("Failed to fetch trade history:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchTradeHistory()

        // Realtime subscription
        const supabase = createClient()
        const channel = supabase
            .channel('trade_history_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'paired_trading_accounts'
                },
                () => {
                    fetchTradeHistory()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const filteredPairs = pairs.filter(pair => {
        const query = searchQuery.toLowerCase()
        return (
            pair.primary_account?.accounts?.units?.unit_name?.toLowerCase().includes(query) ||
            pair.secondary_account?.accounts?.units?.unit_name?.toLowerCase().includes(query) ||
            pair.symbol?.toLowerCase().includes(query)
        )
    })

    if (isLoading) {
        return (
            <div suppressHydrationWarning className="p-6 bg-[#050505] min-h-screen">
                <PairedTableSkeleton />
            </div>
        )
    }

    return (
        <div suppressHydrationWarning className="animate-in fade-in duration-500 w-full p-6 bg-[#050505] min-h-screen">
            <div className="w-full flex flex-col gap-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <History className="h-6 w-6 text-muted-foreground" />
                            Trade History
                        </h2>
                        <p className="text-sm text-muted-foreground">Review completed trading sessions and their parameters.</p>
                    </div>

                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search units or symbol..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-[#0d0d0d] border-[#1a1a1a] text-sm h-10 rounded-xl focus:ring-1 focus:ring-white/10"
                        />
                    </div>
                </div>

                {filteredPairs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16 border border-dashed border-[#1a1a1a] rounded-2xl bg-[#0a0a0a]/30">
                        <div className="h-14 w-14 rounded-full bg-white/5 flex items-center justify-center mb-5 text-muted-foreground">
                            <History className="h-7 w-7" />
                        </div>
                        <h3 className="text-xl font-semibold text-white">No history found</h3>
                        <p className="text-sm text-muted-foreground text-center max-w-sm mt-2 leading-relaxed">
                            Completed trades will be moved here automatically after the session ends.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 items-start w-full">
                        {filteredPairs.map((pair) => (
                            <TradeHistoryRow key={pair.id} pair={pair} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default TradeHistoryPage