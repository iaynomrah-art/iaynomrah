"use client"

import React, { useEffect, useState } from 'react'
import { PairedTableSkeleton } from '@/components/skeleton/PairedTableSkeleton'
import { ExternalLink } from 'lucide-react'
import PairedAccountRow from '@/components/item/PairedAccountRow'
import { realTimeGetPairedAccounts } from '@/helper/paired_accounts'
import { createClient } from '@/lib/supabase/client'


const PairedAccountsPage = () => {
    const [pairs, setPairs] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [isFetching, setIsFetching] = useState(false)

    const fetchPairs = async () => {
        if (isFetching) return;
        try {
            setIsFetching(true)
            const data = await realTimeGetPairedAccounts()
            setPairs(data)
        } catch (error) {
            console.error("Failed to fetch pairs:", error)
        } finally {
            setIsFetching(false)
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchPairs()

        // Realtime subscription
        const supabase = createClient()
        const channel = supabase
            .channel('paired_accounts_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'paired_trading_accounts'
                },
                () => {
                    fetchPairs()
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
        <div className="animate-in fade-in duration-500 w-full">


            {pairs.length === 0 ? (
                <div className="mt-12 flex flex-col items-center justify-center p-12 border border-dashed border-[#1a1a1a] rounded-xl bg-[#0a0a0a]/50">
                    <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 text-blue-500">
                        <ExternalLink className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-medium text-white">No active pairs</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-xs mt-1">
                        Pair your accounts in the Make Money section to see them here.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 items-start w-full">
                    {pairs.map((pair) => (
                        <PairedAccountRow key={pair.id} pair={pair} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default PairedAccountsPage
