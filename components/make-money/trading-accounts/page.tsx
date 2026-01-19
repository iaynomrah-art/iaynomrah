"use client"

import React, { useEffect, useState, useMemo, Dispatch, SetStateAction } from 'react'
import { TradingAccountsTable } from "@/components/tables/TradingAccountsTable"
import { getTradingAccounts } from "@/helper/trading_accounts"
import { getFunders } from "@/helper/funders"
import { Funder } from "@/types/funder"
import { TradingAccount } from "@/types/trading_accounts"
import { cn } from "@/lib/utils"
import { Check, FilterX, CheckSquare } from "lucide-react"
import { PairAccountsModal } from "../../modal/PairAccountsModal"
import { TradingAccountsPageSkeleton } from "../../skeleton/TradingAccountsSkeleton"

const PHASES = ['Live', 'phase 1', 'phase 2', 'phase 3']
const STATUSES = [
    'Idle',
    'Trading',
    'Paired',
    'ABS',
    'BRC',
    'BRC-CHECK',
    'WAITING',
    'OH',
    'KYC',
    'FOR PAYOUT'
]

const TradingAccountsPage = () => {
    const [data, setData] = useState<TradingAccount[]>([])
    const [funders, setFunders] = useState<Funder[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedAccounts, setSelectedAccounts] = useState<number[]>([])
    const [isModalOpen, setIsModalOpen] = React.useState(false)

    // Filter states
    const [selectedFunders, setSelectedFunders] = useState<string[]>([])
    const [selectedPhases, setSelectedPhases] = useState<string[]>([])
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
    const [pairableOnly, setPairableOnly] = useState(false)

    useEffect(() => {
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
        fetchData()
    }, [])

    const filteredData = useMemo(() => {
        return data.filter(item => {
            const matchesFunder = selectedFunders.length === 0 || selectedFunders.includes(item.funders?.name || '')
            const matchesPhase = selectedPhases.length === 0 || selectedPhases.some(phase => item.package?.phase?.toLowerCase().includes(phase))
            const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(item.account_status)

            const matchesPairable = !pairableOnly || (item.account_status !== 'Paired' && ['Idle', 'Trading'].includes(item.account_status))

            return matchesFunder && matchesPhase && matchesStatus && matchesPairable
        })
    }, [data, selectedFunders, selectedPhases, selectedStatuses, pairableOnly])

    const toggleFilter = (list: string[], setList: Dispatch<SetStateAction<string[]>>, value: string) => {
        setList(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value])
    }

    const resetFilters = () => {
        setSelectedFunders([])
        setSelectedPhases([])
        setSelectedStatuses([])
        setPairableOnly(false)
    }

    const handlePairAccounts = () => {
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
                                    onClick={() => toggleFilter(selectedStatuses, setSelectedStatuses, status)}
                                    className={cn(
                                        "flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-all",
                                        selectedStatuses.includes(status)
                                            ? "bg-[#1a1a1a] text-white"
                                            : "text-muted-foreground hover:bg-[#0d0d0d] hover:text-white"
                                    )}
                                >
                                    <span>{status}</span>
                                    {selectedStatuses.includes(status) && <Check className="h-3 w-3" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Table Content */}
            <div className="flex-1 min-w-0 space-y-4">
                {/* Bulk Actions Header */}
                <div className={cn(
                    "flex items-center justify-end transition-all duration-300 overflow-hidden",
                    selectedAccounts.length > 0 ? "h-14 opacity-100 mb-2" : "h-0 opacity-0 mb-0"
                )}>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSelectedAccounts([])}
                            className="text-muted-foreground hover:text-white text-xs transition-colors"
                        >
                            Deselect All
                        </button>
                        <button
                            onClick={handlePairAccounts}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20"
                        >
                            <CheckSquare className="h-3.5 w-3.5" />
                            Pair Selected Accounts
                        </button>
                    </div>
                </div>

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
