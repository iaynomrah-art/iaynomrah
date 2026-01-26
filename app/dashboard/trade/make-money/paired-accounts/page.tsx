"use client"

import React, { useEffect, useState } from 'react'
import { PairedTableSkeleton } from '@/components/skeleton/PairedTableSkeleton'
import { ExternalLink } from 'lucide-react'
import PairedAccountRow from '@/components/item/PairedAccountRow'


const PairedAccountsPage = () => {
    const [pairs, setPairs] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        setIsLoading(false)
    }, [])

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-semibold text-white">Paired Accounts</h2>
                    <p className="text-sm text-muted-foreground">Manage relationships between your parent and child accounts.</p>
                </div>
                <PairedTableSkeleton />
            </div>
        )
    }

    return (
        <div className="animate-in fade-in duration-500 max-w-[1200px]">
            <div className="flex flex-col gap-1 mb-8">
                <h2 className="text-xl font-semibold text-white">Paired Accounts</h2>
                <p className="text-sm text-muted-foreground">Monitor and manage your active trading pairs across units.</p>
            </div>

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
                <div className="space-y-4">
                    {pairs.map((pair) => (
                        <PairedAccountRow key={pair.id} pair={pair} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default PairedAccountsPage
