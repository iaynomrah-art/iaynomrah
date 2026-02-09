"use client"

import React, { useEffect, useState, useMemo, Dispatch, SetStateAction } from 'react'
import { TradingAccountsTable } from "@/components/tables/TradingAccountsTable"
import { getTradingAccounts } from "@/helper/trading_accounts"
import { getFunders } from "@/helper/funders"
import Swal from 'sweetalert2'
import { toast } from "sonner"
import { Funder } from "@/types/funder"
import { TradingAccount } from "@/types/trading_accounts"
import { cn } from "@/lib/utils"
import { Check, FilterX, CheckSquare, X } from "lucide-react"
import { PairAccountsModal } from "@/components/modal/PairAccountsModal"
import { TradingAccountsPageSkeleton } from "@/components/skeleton/TradingAccountsSkeleton"
import { useTradingFilter, PHASES, STATUSES } from "@/hooks/use-trading-filter"



import { createClient } from "@/lib/supabase/client"

const TradingAccountsPage = () => {
    const [data, setData] = useState<TradingAccount[]>([])
    const [funders, setFunders] = useState<Funder[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
    const [isModalOpen, setIsModalOpen] = React.useState(false)

    const fetchData = async () => {
        try {
            const [accountsResult, fundersResult] = await Promise.all([
                getTradingAccounts(),
                getFunders()
            ])
            setData(accountsResult)
            setFunders(fundersResult)
        } catch (error) {
            console.error("Failed to fetch data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()

        const supabase = createClient()
        const channel = supabase
            .channel('trading_accounts_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'trading_accounts'
                },
                () => {
                    fetchData()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const {
        selectedFunders,
        setSelectedFunders,
        selectedPhases,
        setSelectedPhases,
        selectedStatuses,
        setSelectedStatuses,
        pairableOnly,
        setPairableOnly,
        filteredData,
        toggleFilter,
        resetFilters
    } = useTradingFilter(data)

    const handlePairAccounts = async () => {
        const selected = data.filter(acc => selectedAccounts.includes(acc.id))

        if (selected.length !== 2) {
            toast.error("Please select exactly 2 accounts to pair")
            return
        }

        // 1. Trading Status Restriction
        const tradingAccount = selected.find(acc => acc.status?.toLowerCase() === 'trading')
        if (tradingAccount) {
            Swal.fire({
                title: 'Account Busy',
                text: `The account "${tradingAccount.credential_id || tradingAccount.id}" is already in a trading session. You cannot pair it again.`,
                icon: 'error',
                confirmButtonColor: '#3085d6',
                background: '#1a1a1a',
                color: '#fff'
            })
            return
        }

        const [acc1, acc2] = selected
        const isLive1 = acc1.package_ref?.phase?.toLowerCase() === 'live'
        const isLive2 = acc2.package_ref?.phase?.toLowerCase() === 'live'

        // 2. Live vs Not Live Restriction
        if (isLive1 !== isLive2) {
            Swal.fire({
                title: 'Pairing Restricted',
                text: 'You cannot pair a Live account with a Non-Live account.',
                icon: 'error',
                confirmButtonColor: '#3085d6',
                background: '#1a1a1a',
                color: '#fff'
            })
            return
        }

        // 2. Same Funder Warning
        const funder1 = acc1.package_ref?.funder_id || acc1.funder
        const funder2 = acc2.package_ref?.funder_id || acc2.funder

        if (funder1 && funder2 && funder1 === funder2) {
            const result = await Swal.fire({
                title: 'Same Funder Warning',
                text: 'Both accounts belong to the same funder. This might violate their terms. Do you want to continue?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, proceed',
                cancelButtonText: 'No, cancel',
                background: '#1a1a1a',
                color: '#fff'
            })

            if (!result.isConfirmed) return
        }

        setIsModalOpen(true)
    }

    const confirmPairing = (pairs: any[]) => {
        console.log("CONFIRMED: Pairing selected accounts with data:", pairs)

        // After confirmation logic would go here
        setIsModalOpen(false)
        setSelectedAccounts([])
    }

    if (isLoading) {
        return <TradingAccountsPageSkeleton />
    }

    return (
        <div className="animate-in fade-in duration-500 flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filter */}
            <aside className="w-full lg:w-64 flex-shrink-0 space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Filters</h3>
                        <button
                            onClick={resetFilters}
                            className="text-[10px] text-muted-foreground hover:text-white transition-colors flex items-center gap-1 bg-[#1a1a1a] px-2 py-1 rounded"
                        >
                            <FilterX className="h-3 w-3" />
                            Reset
                        </button>
                    </div>
                </div>

                {/* Filter Categories */}
                <div className="space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Pairables */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-bold text-[#444] uppercase">Availability</label>
                        <button
                            onClick={() => setPairableOnly(!pairableOnly)}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all border",
                                pairableOnly
                                    ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                                    : "bg-[#0d0d0d] border-transparent text-muted-foreground hover:bg-[#111]"
                            )}
                        >
                            <span>Pairables</span>
                            {pairableOnly && <Check className="h-4 w-4" />}
                        </button>
                    </div>

                    {/* Funders */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-bold text-[#444] uppercase">Funders</label>
                        <div className="grid grid-cols-1 gap-1.5">
                            {funders.map((funder) => {
                                const isSelected = selectedFunders.includes(funder.name || "")
                                return (
                                    <button
                                        key={funder.id}
                                        onClick={() => toggleFilter(selectedFunders, setSelectedFunders, funder.name || "")}
                                        className={cn(
                                            "flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold transition-all border border-transparent shadow-sm",
                                            isSelected
                                                ? "ring-1 ring-white/20"
                                                : "opacity-60 hover:opacity-100 bg-[#0d0d0d] hover:bg-[#111]"
                                        )}
                                        style={{
                                            backgroundColor: isSelected && funder.allias_color ? `${funder.allias_color}25` : "",
                                            color: isSelected && funder.text_color ? funder.text_color : "",
                                            borderColor: isSelected && funder.allias_color ? `${funder.allias_color}50` : ""
                                        }}
                                    >
                                        <span className="truncate">{funder.allias || funder.name}</span>
                                        {isSelected && <Check className="h-3 w-3 flex-shrink-0" />}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Phases */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-bold text-[#444] uppercase">Phases</label>
                        <div className="grid grid-cols-1 gap-1">
                            {PHASES.map((phase) => (
                                <button
                                    key={phase}
                                    onClick={() => toggleFilter(selectedPhases, setSelectedPhases, phase.toLowerCase())}
                                    className={cn(
                                        "flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-all",
                                        selectedPhases.includes(phase.toLowerCase())
                                            ? "bg-[#1a1a1a] text-white"
                                            : "text-muted-foreground hover:bg-[#0d0d0d] hover:text-white"
                                    )}
                                >
                                    <span className="capitalize">{phase}</span>
                                    {selectedPhases.includes(phase.toLowerCase()) && <Check className="h-3 w-3" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Statuses */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-bold text-[#444] uppercase">Status</label>
                        <div className="grid grid-cols-1 gap-1">
                            {STATUSES.map((status) => (
                                <button
                                    key={status}
                                    onClick={() => toggleFilter(selectedStatuses, setSelectedStatuses, status.toLowerCase())}
                                    className={cn(
                                        "flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-all",
                                        selectedStatuses.includes(status.toLowerCase())
                                            ? "bg-[#1a1a1a] text-white"
                                            : "text-muted-foreground hover:bg-[#0d0d0d] hover:text-white"
                                    )}
                                >
                                    <span className="capitalize">{status}</span>
                                    {selectedStatuses.includes(status.toLowerCase()) && <Check className="h-3 w-3" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Table Content */}
            <div className="flex-1 min-w-0 space-y-4">


                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden shadow-sm">
                    <TradingAccountsTable
                        data={filteredData}
                        selectedIds={selectedAccounts}
                        onSelectionChange={setSelectedAccounts}
                    />
                </div>
            </div>

            <PairAccountsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedAccounts={data.filter(acc => selectedAccounts.includes(acc.id))}
                onConfirm={confirmPairing}
            />

            {/* Floating Pair Button */}
            <div className={cn(
                "fixed bottom-8 right-8 z-50 flex items-center gap-0 bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl shadow-2xl transition-all duration-500 transform",
                selectedAccounts.length > 0 ? "translate-y-0 opacity-100 scale-100" : "translate-y-20 opacity-0 scale-95 pointer-events-none"
            )}>
                <button
                    onClick={handlePairAccounts}
                    className="flex items-center gap-4 px-6 py-4 text-white hover:bg-blue-600/10 transition-all rounded-l-2xl group border-r border-[#1a1a1a]"
                >
                    <div className="bg-blue-600 group-hover:bg-blue-500 p-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 group-hover:scale-110">
                        <CheckSquare className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col items-start leading-none gap-1.5">
                        <span className="text-sm font-bold tracking-tight">Pair Selected</span>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{selectedAccounts.length} Selected</span>
                    </div>
                </button>
                <button
                    onClick={() => setSelectedAccounts([])}
                    className="p-5 text-muted-foreground hover:text-white hover:bg-red-500/10 transition-all rounded-r-2xl group"
                    title="Clear selection"
                >
                    <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                </button>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1a1a1a;
                    border-radius: 10px;
                }
            ` }} />
        </div>
    )
}

export default TradingAccountsPage