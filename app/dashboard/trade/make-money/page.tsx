"use client"

import React, { useEffect, useState, useMemo } from 'react'
import { TradingAccountsTable } from "@/components/tables/TradingAccountsTable"
import { getTradingAccounts } from "@/helper/trading_accounts"
import { getFunders } from "@/helper/funders"
import { getPackages } from "@/helper/package"
import Swal from 'sweetalert2'
import { toast } from "sonner"
import { Funder } from "@/types/funder"
import { TradingAccount } from "@/types/trading_accounts"
import { cn } from "@/lib/utils"
import {
    Check, CheckSquare, X, AlertTriangle, SlidersHorizontal,
    RotateCcw, Zap, Eye, EyeOff, ChevronDown, ChevronUp, Building2, MonitorSmartphone
} from "lucide-react"
import { PairAccountsModal } from "@/components/modal/PairAccountsModal"
import { TradingAccountsPageSkeleton } from "@/components/skeleton/TradingAccountsSkeleton"
import { useTradingFilter, PHASES, STATUSES } from "@/hooks/use-trading-filter"
import { createClient } from "@/lib/supabase/client"
import { getPairingHistory, getPairedAccounts } from "@/helper/paired_accounts"
import { PairAllConfirmationModal, PairConfig } from "@/components/modal/PairAllConfirmationModal"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

/* ──────────────────────────────────────────────
   Filter Drawer
────────────────────────────────────────────── */
interface FilterDrawerProps {
    isOpen: boolean
    onClose: () => void
    funders: Funder[]
    // filter state & setters
    selectedFunders: string[]
    setSelectedFunders: React.Dispatch<React.SetStateAction<string[]>>
    selectedPhases: string[]
    setSelectedPhases: React.Dispatch<React.SetStateAction<string[]>>
    selectedStatuses: string[]
    setSelectedStatuses: React.Dispatch<React.SetStateAction<string[]>>
    selectedUnits: string[]
    setSelectedUnits: React.Dispatch<React.SetStateAction<string[]>>
    selectedFranchises: string[]
    setSelectedFranchises: React.Dispatch<React.SetStateAction<string[]>>
    pairableOnly: boolean
    setPairableOnly: React.Dispatch<React.SetStateAction<boolean>>
    pairedOnly: boolean
    setPairedOnly: React.Dispatch<React.SetStateAction<boolean>>
    showBurned: boolean
    setShowBurned: React.Dispatch<React.SetStateAction<boolean>>
    allUnits: string[]
    allFranchises: string[]
    toggleFilter: (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, value: string) => void
    resetFilters: () => void
    activeFilterCount: number
}

function FilterSection({ label, icon: Icon, children, defaultOpen = true }: {
    label: string
    icon?: React.ElementType
    children: React.ReactNode
    defaultOpen?: boolean
}) {
    const [open, setOpen] = useState(defaultOpen)
    return (
        <div className="border-b border-[#1a1a1a] last:border-0">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between py-3 px-4 text-left hover:bg-[#111] transition-colors"
            >
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-3.5 w-3.5 text-gray-500" />}
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#555]">{label}</span>
                </div>
                {open ? <ChevronUp className="h-3 w-3 text-[#555]" /> : <ChevronDown className="h-3 w-3 text-[#555]" />}
            </button>
            {open && <div className="px-4 pb-4 space-y-1.5">{children}</div>}
        </div>
    )
}

function FilterChip({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color?: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all border",
                active
                    ? "border-transparent text-white"
                    : "bg-transparent border-transparent text-[#555] hover:text-white hover:bg-[#111]"
            )}
            style={active && color ? { backgroundColor: `${color}20`, borderColor: `${color}40`, color } : undefined}
        >
            <span className="font-medium">{label}</span>
            {active && <Check className="h-3 w-3 flex-shrink-0" />}
        </button>
    )
}

function FilterDrawer({
    isOpen, onClose, funders,
    selectedFunders, setSelectedFunders,
    selectedPhases, setSelectedPhases,
    selectedStatuses, setSelectedStatuses,
    selectedUnits, setSelectedUnits,
    selectedFranchises, setSelectedFranchises,
    pairableOnly, setPairableOnly,
    pairedOnly, setPairedOnly,
    showBurned, setShowBurned,
    allUnits, allFranchises,
    toggleFilter, resetFilters, activeFilterCount
}: FilterDrawerProps) {
    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />
            {/* Drawer */}
            <div className={cn(
                "fixed top-0 left-0 z-50 h-full w-[300px] bg-[#080808] border-r border-[#1a1a1a] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-[#1a1a1a] flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <SlidersHorizontal className="h-4 w-4 text-white" />
                        <span className="text-sm font-bold text-white">Filters</span>
                        {activeFilterCount > 0 && (
                            <span className="bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                {activeFilterCount}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {activeFilterCount > 0 && (
                            <button
                                onClick={resetFilters}
                                className="text-[10px] text-[#555] hover:text-white transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-[#1a1a1a]"
                            >
                                <RotateCcw className="h-2.5 w-2.5" />
                                Reset
                            </button>
                        )}
                        <button onClick={onClose} className="p-1.5 hover:bg-[#1a1a1a] rounded transition-colors text-[#555] hover:text-white">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Body — scrollable */}
                <div className="flex-1 overflow-y-auto">

                    {/* Quick toggles */}
                    <div className="px-4 py-3 border-b border-[#1a1a1a] space-y-2">
                        <button
                            onClick={() => setPairableOnly(p => !p)}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all border",
                                pairableOnly
                                    ? "bg-blue-600/15 border-blue-600/30 text-blue-400"
                                    : "bg-[#0d0d0d] border-[#1a1a1a] text-[#555] hover:text-white hover:border-[#333]"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <Zap className="h-3.5 w-3.5" />
                                <span className="text-xs font-semibold">Pairables Only</span>
                            </div>
                            {pairableOnly && <Check className="h-3.5 w-3.5" />}
                        </button>
                        <button
                            onClick={() => setPairedOnly(p => !p)}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all border",
                                pairedOnly
                                    ? "bg-purple-600/15 border-purple-600/30 text-purple-400"
                                    : "bg-[#0d0d0d] border-[#1a1a1a] text-[#555] hover:text-white hover:border-[#333]"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <CheckSquare className="h-3.5 w-3.5" />
                                <span className="text-xs font-semibold">Paired Only</span>
                            </div>
                            {pairedOnly && <Check className="h-3.5 w-3.5" />}
                        </button>
                        <button
                            onClick={() => setShowBurned(b => !b)}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all border",
                                !showBurned
                                    ? "bg-red-600/15 border-red-600/30 text-red-400"
                                    : "bg-[#0d0d0d] border-[#1a1a1a] text-[#555] hover:text-white hover:border-[#333]"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                {showBurned ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                <span className="text-xs font-semibold">{showBurned ? "Burned Accounts Visible" : "Burned Accounts Hidden"}</span>
                            </div>
                            {!showBurned && <Check className="h-3.5 w-3.5" />}
                        </button>
                    </div>

                    {/* Funders */}
                    {funders.length > 0 && (
                        <FilterSection label="Funders">
                            {funders.map(f => (
                                <FilterChip
                                    key={f.id}
                                    label={f.allias || f.name || ''}
                                    active={selectedFunders.includes(f.name || '')}
                                    onClick={() => toggleFilter(selectedFunders, setSelectedFunders, f.name || '')}
                                    color={f.allias_color ?? undefined}
                                />
                            ))}
                        </FilterSection>
                    )}

                    {/* Phases */}
                    <FilterSection label="Phase">
                        {PHASES.map(p => (
                            <FilterChip
                                key={p}
                                label={p}
                                active={selectedPhases.includes(p.toLowerCase())}
                                onClick={() => toggleFilter(selectedPhases, setSelectedPhases, p.toLowerCase())}
                            />
                        ))}
                    </FilterSection>

                    {/* Status */}
                    <FilterSection label="Status" defaultOpen={false}>
                        {STATUSES.map(s => (
                            <FilterChip
                                key={s}
                                label={s}
                                active={selectedStatuses.includes(s.toLowerCase())}
                                onClick={() => toggleFilter(selectedStatuses, setSelectedStatuses, s.toLowerCase())}
                            />
                        ))}
                    </FilterSection>

                    {/* Units */}
                    {allUnits.length > 0 && (
                        <FilterSection label="Units" icon={MonitorSmartphone} defaultOpen={false}>
                            {allUnits.map(u => (
                                <FilterChip
                                    key={u}
                                    label={u}
                                    active={selectedUnits.includes(u)}
                                    onClick={() => toggleFilter(selectedUnits, setSelectedUnits, u)}
                                />
                            ))}
                        </FilterSection>
                    )}

                    {/* Franchises */}
                    {allFranchises.length > 0 && (
                        <FilterSection label="Franchise" icon={Building2} defaultOpen={false}>
                            {allFranchises.map(fr => (
                                <FilterChip
                                    key={fr}
                                    label={fr}
                                    active={selectedFranchises.includes(fr)}
                                    onClick={() => toggleFilter(selectedFranchises, setSelectedFranchises, fr)}
                                />
                            ))}
                        </FilterSection>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-[#1a1a1a] flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-[#1a1a1a] text-white text-xs font-semibold transition-all"
                    >
                        Apply & Close
                    </button>
                </div>
            </div>
        </>
    )
}

/* ──────────────────────────────────────────────
   Main Page
────────────────────────────────────────────── */
const TradingAccountsPage = () => {
    const router = useRouter()
    const [data, setData] = useState<TradingAccount[]>([])
    const [funders, setFunders] = useState<Funder[]>([])
    const [unusedPackages, setUnusedPackages] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
    const [isModalOpen, setIsModalOpen] = React.useState(false)
    const [isPairAllModalOpen, setIsPairAllModalOpen] = useState(false)
    const [proposedPairs, setProposedPairs] = useState<PairConfig[]>([])
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [pairedAccounts, setPairedAccounts] = useState<any[]>([])

    const fetchData = async () => {
        try {
            const [accountsResult, fundersResult, packagesResult, pairedResult] = await Promise.all([
                getTradingAccounts(),
                getFunders(),
                getPackages(),
                getPairedAccounts()
            ])
            setData(accountsResult)
            setFunders(fundersResult)
            const unused = (packagesResult || []).filter((pkg: any) => !pkg.is_used)
            setUnusedPackages(unused)
            setPairedAccounts(pairedResult)
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
            .on('postgres_changes', { event: '*', schema: 'public', table: 'trading_accounts' }, fetchData)
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [])

    const {
        selectedFunders, setSelectedFunders,
        selectedPhases, setSelectedPhases,
        selectedStatuses, setSelectedStatuses,
        selectedUnits, setSelectedUnits,
        selectedFranchises, setSelectedFranchises,
        pairableOnly, setPairableOnly,
        pairedOnly, setPairedOnly,
        showBurned, setShowBurned,
        filteredData,
        allUnits, allFranchises,
        toggleFilter,
        resetFilters,
        activeFilterCount,
    } = useTradingFilter(data)

    const getAccountSafeLimit = (acc: any) => {
        const parseNum = (val: any, fallback: number) => {
            if (val === undefined || val === null || val === '') return fallback
            const parsed = parseFloat(String(val).replace(/[^0-9.-]+/g, ""))
            return isNaN(parsed) || parsed <= 0 ? fallback : parsed
        }
        const liveEquity = parseNum(acc.live_equity ?? acc.package_ref?.balance, 100000)
        const dailyEq = parseNum(acc.daily_starting_equity ?? acc.package_ref?.balance, liveEquity)
        const initialBalance = parseNum(acc.package_ref?.balance, dailyEq)
        const dailyLossDollar = parseNum(acc.package_ref?.max_daily_loss ?? acc.package_ref?.profit_target, 0)
        let dailyLossPercent = 0.05
        if (dailyLossDollar > 0 && initialBalance > 0) dailyLossPercent = dailyLossDollar / initialBalance
        const dailyFloor = dailyEq * (1 - dailyLossPercent)
        let dailyAllowance = liveEquity - dailyFloor
        const totalLossDollar = parseNum(acc.package_ref?.max_total_loss, 0)
        let totalLossPercent = 0.10
        if (totalLossDollar > 0 && initialBalance > 0) totalLossPercent = totalLossDollar / initialBalance
        const totalFloor = initialBalance * (1 - totalLossPercent)
        let totalAllowance = liveEquity - totalFloor
        const consistencyPercent = parseNum(acc.package_ref?.consistency_rule, 0)
        const profitTarget = parseNum(acc.package_ref?.profit_target, 0)
        let consistencyAllowance = Infinity
        if (consistencyPercent > 0 && profitTarget > 0) {
            const maxDailyProfit = profitTarget * (consistencyPercent / 100)
            const incurredProfit = parseNum(acc.daily_pnl, 0)
            consistencyAllowance = Math.max(0, maxDailyProfit - (incurredProfit > 0 ? incurredProfit : 0))
        }
        if (dailyAllowance <= 0) dailyAllowance = liveEquity * dailyLossPercent
        if (totalAllowance <= 0) totalAllowance = liveEquity * totalLossPercent
        const allowance = Math.min(dailyAllowance, totalAllowance, consistencyAllowance)
        return Number((Math.max(0, allowance) * 0.70).toFixed(2))
    }

    const isAccountBurned = (acc: TradingAccount) => {
        if ((acc.status as string) === 'burned') return true
        const balance = acc.package_ref?.balance || 0
        const maxDailyLoss = acc.package_ref?.max_daily_loss || 0
        const maxTotalLoss = acc.package_ref?.max_total_loss || 0
        const liveEquity = acc.live_equity || 0
        const dailyStartingEquity = acc.daily_starting_equity || balance
        const dailyDrawdownValue = Math.max(0, dailyStartingEquity - liveEquity)
        if (maxDailyLoss > 0 && dailyDrawdownValue >= maxDailyLoss) return true
        const totalDrawdownValue = Math.max(0, balance - liveEquity)
        if (maxTotalLoss > 0 && totalDrawdownValue >= maxTotalLoss) return true
        return false
    }

    const handlePairAccounts = async () => {
        const selected = data.filter(acc => selectedAccounts.includes(acc.id))
        if (selected.length !== 2) { toast.error("Please select exactly 2 accounts to pair"); return }
        const busyAccount = selected.find(acc => {
            const status = acc.status?.toLowerCase()
            return status === 'trading' || status === 'paired'
        })
        if (busyAccount) {
            Swal.fire({ title: 'Account Busy', text: `"${busyAccount.credential_id || busyAccount.id}" is currently in a ${busyAccount.status?.toLowerCase()} state.`, icon: 'error', confirmButtonColor: '#3085d6', background: '#1a1a1a', color: '#fff' })
            return
        }
        const [acc1, acc2] = selected
        const isLive1 = acc1.package_ref?.phase?.toLowerCase() === 'live'
        const isLive2 = acc2.package_ref?.phase?.toLowerCase() === 'live'
        if (isLive1 !== isLive2) {
            Swal.fire({ title: 'Pairing Restricted', text: 'You cannot pair a Live account with a Non-Live account.', icon: 'error', confirmButtonColor: '#3085d6', background: '#1a1a1a', color: '#fff' })
            return
        }
        const funder1 = acc1.package_ref?.funder_id || acc1.funder
        const funder2 = acc2.package_ref?.funder_id || acc2.funder
        if (funder1 && funder2 && funder1 === funder2) {
            const result = await Swal.fire({ title: 'Same Funder Warning', text: 'Both accounts belong to the same funder. This might violate their terms. Do you want to continue?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Yes, proceed', cancelButtonText: 'No, cancel', background: '#1a1a1a', color: '#fff' })
            if (!result.isConfirmed) return
        }
        setIsModalOpen(true)
    }

    const handlePairAllClick = async () => {
        const idleAccounts = filteredData.filter(acc => acc.status?.toLowerCase() === 'idle' && !isAccountBurned(acc))
        if (idleAccounts.length < 2) { toast.error("At least 2 available idle accounts are required to pair."); return }
        toast.loading("Generating suggested pairings...", { id: 'pair-all' })
        try {
            const history = await getPairingHistory()
            const pastPairsSet = new Set<string>()
            history.forEach((h: any) => { const key = [h.primary_account_id, h.secondary_account_id].sort().join('-'); pastPairsSet.add(key) })
            const liveAccounts = idleAccounts.filter(acc => acc.package_ref?.phase?.toLowerCase() === 'live')
            const demoAccounts = idleAccounts.filter(acc => acc.package_ref?.phase?.toLowerCase() !== 'live')
            const getPairScore = (a: TradingAccount, b: TradingAccount) => {
                const key = [a.id, b.id].sort().join('-')
                let score = 0
                if (pastPairsSet.has(key)) score -= 100000
                if (a.package_ref?.funder_id === b.package_ref?.funder_id) score -= 500
                score -= Math.abs((a.daily_pnl || 0) - (b.daily_pnl || 0))
                return score
            }
            const solveGroup = (accounts: TradingAccount[]): [TradingAccount, TradingAccount][] => {
                if (accounts.length < 2) return []
                if (accounts.length <= 10) {
                    let bestMatching: [TradingAccount, TradingAccount][] = []
                    let bestScore = -Infinity
                    const backtrack = (index: number, currentPairs: [TradingAccount, TradingAccount][], currentScore: number, used: Set<string>) => {
                        if (index >= accounts.length) { if (currentScore > bestScore) { bestScore = currentScore; bestMatching = [...currentPairs] }; return }
                        const a1 = accounts[index]
                        if (used.has(a1.id)) { backtrack(index + 1, currentPairs, currentScore, used); return }
                        let foundMatch = false
                        used.add(a1.id)
                        for (let j = index + 1; j < accounts.length; j++) {
                            const a2 = accounts[j]
                            if (used.has(a2.id)) continue
                            foundMatch = true
                            used.add(a2.id)
                            backtrack(index + 1, [...currentPairs, [a1, a2]], currentScore + getPairScore(a1, a2), used)
                            used.delete(a2.id)
                        }
                        used.delete(a1.id)
                        if (!foundMatch || accounts.length % 2 !== 0) backtrack(index + 1, currentPairs, currentScore - 50000, used)
                    }
                    backtrack(0, [], 0, new Set())
                    return bestMatching
                } else {
                    const edges = []
                    for (let i = 0; i < accounts.length; i++) for (let j = i + 1; j < accounts.length; j++) edges.push({ a: accounts[i], b: accounts[j], score: getPairScore(accounts[i], accounts[j]) })
                    edges.sort((x, y) => y.score - x.score)
                    const matchedIds = new Set<string>()
                    const pairsResult: [TradingAccount, TradingAccount][] = []
                    for (const edge of edges) {
                        if (matchedIds.has(edge.a.id) || matchedIds.has(edge.b.id)) continue
                        pairsResult.push([edge.a, edge.b])
                        matchedIds.add(edge.a.id)
                        matchedIds.add(edge.b.id)
                    }
                    return pairsResult
                }
            }
            const allMatchedPairs = [...solveGroup(liveAccounts), ...solveGroup(demoAccounts)]
            if (allMatchedPairs.length === 0) { toast.dismiss('pair-all'); toast.error("No compatible pairs could be formed."); return }
            const configPairs: PairConfig[] = allMatchedPairs.map(([acc1, acc2]) => {
                const sortedByBalance = [acc1, acc2].sort((x, y) => {
                    const balX = x.daily_starting_equity || x.package_ref?.balance || 0
                    const balY = y.daily_starting_equity || y.package_ref?.balance || 0
                    return balY - balX
                })
                const primary = sortedByBalance[0]
                const secondary = sortedByBalance[1]
                const primaryLimit = getAccountSafeLimit(primary)
                const secondaryLimit = getAccountSafeLimit(secondary)
                const constraintA = primaryLimit
                const constraintB = Number((secondaryLimit / 1.02).toFixed(2))
                const finalPrimarySL = Math.min(constraintA, constraintB)
                return {
                    id: `${primary.id}-${secondary.id}`,
                    primary, secondary,
                    symbol: primary.package_ref?.symbol || primary.package || "XAUUSD",
                    primary_order_amount: 0.1, primary_order_type: 'buy',
                    primary_take_profit: finalPrimarySL, primary_stop_loss: finalPrimarySL,
                    secondary_order_amount: 0.1, secondary_order_type: 'sell',
                    secondary_take_profit: Number((finalPrimarySL * 0.98).toFixed(2)),
                    secondary_stop_loss: Number((finalPrimarySL * 1.02).toFixed(2)),
                }
            })
            setProposedPairs(configPairs)
            toast.dismiss('pair-all')
            setIsPairAllModalOpen(true)
        } catch (err) {
            console.error("Failed to generate pairings:", err)
            toast.dismiss('pair-all')
            toast.error("An error occurred while generating pairings.")
        }
    }

    const confirmPairAll = () => { setIsPairAllModalOpen(false); setProposedPairs([]); fetchData() }

    if (isLoading) return <TradingAccountsPageSkeleton />

    const idleCount = filteredData.filter(acc => acc.status?.toLowerCase() === 'idle' && !isAccountBurned(acc)).length
    const burnedCount = data.filter(isAccountBurned).length

    return (
        <div suppressHydrationWarning className="flex flex-col h-full bg-[#050505] min-h-screen">
            <FilterDrawer
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                funders={funders}
                selectedFunders={selectedFunders} setSelectedFunders={setSelectedFunders}
                selectedPhases={selectedPhases} setSelectedPhases={setSelectedPhases}
                selectedStatuses={selectedStatuses} setSelectedStatuses={setSelectedStatuses}
                selectedUnits={selectedUnits} setSelectedUnits={setSelectedUnits}
                selectedFranchises={selectedFranchises} setSelectedFranchises={setSelectedFranchises}
                pairableOnly={pairableOnly} setPairableOnly={setPairableOnly}
                pairedOnly={pairedOnly} setPairedOnly={setPairedOnly}
                showBurned={showBurned} setShowBurned={setShowBurned}
                allUnits={allUnits} allFranchises={allFranchises}
                toggleFilter={toggleFilter}
                resetFilters={resetFilters}
                activeFilterCount={activeFilterCount}
            />

            {/* ── Top Bar ── */}
            <div className="sticky top-0 z-30 bg-[#050505]/95 backdrop-blur border-b border-[#111] px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {/* Filter button */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsFilterOpen(true)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all",
                                    activeFilterCount > 0
                                        ? "bg-blue-600/15 border-blue-600/30 text-blue-400"
                                        : "bg-[#0d0d0d] border-[#1a1a1a] text-[#666] hover:text-white hover:border-[#333]"
                                )}
                            >
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                                Filters
                                {activeFilterCount > 0 && (
                                    <span className="bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        resetFilters();
                                    }}
                                    className="flex items-center justify-center p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                                    title="Clear all filters"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Stats pills */}
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[#444] font-mono">
                                <span className="text-white font-bold">{filteredData.length}</span> accounts
                            </span>
                            {idleCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    {idleCount} idle
                                </span>
                            )}
                            {burnedCount > 0 && showBurned && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                    🔥 {burnedCount} burned
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handlePairAllClick}
                            className="bg-blue-600 hover:bg-blue-500 text-white h-9 px-4 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/10 active:scale-95 transition-all"
                        >
                            <Zap className="h-3.5 w-3.5" />
                            Auto-Pair All
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── Pending Packages Banner ── */}
            {unusedPackages.length > 0 && (
                <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-amber-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-amber-400">
                                {unusedPackages.length} Unlinked Package{unusedPackages.length > 1 ? 's' : ''} Detected
                            </span>
                            <span className="text-xs text-amber-400/80 mt-0.5">
                                You have {unusedPackages.length} package{unusedPackages.length > 1 ? 's' : ''} that aren't linked to a funder account yet. Link them to start trading.
                            </span>
                        </div>
                    </div>
                    <Button
                        onClick={() => router.push('/dashboard/trading-accounts/funder-accounts')}
                        className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-xs h-9 px-4 rounded-lg transition-all"
                    >
                        Link Accounts Now
                    </Button>
                </div>
            )}

            {/* ── Table ── */}
            <div className="flex-1 px-6 py-4">
                <TradingAccountsTable
                    data={filteredData}
                    selectedIds={selectedAccounts}
                    onSelectionChange={setSelectedAccounts}
                    pairedAccounts={pairedAccounts}
                />
            </div>

            {/* ── Modals ── */}
            <PairAccountsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedAccounts={selectedAccounts.map(id => data.find(acc => acc.id === id)).filter(Boolean) as TradingAccount[]}
                onConfirm={() => { setIsModalOpen(false); setSelectedAccounts([]) }}
            />
            <PairAllConfirmationModal
                isOpen={isPairAllModalOpen}
                onClose={() => setIsPairAllModalOpen(false)}
                proposedPairs={proposedPairs}
                onConfirmAll={confirmPairAll}
            />

            {/* ── Floating Pair Button ── */}
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
        </div>
    )
}

export default TradingAccountsPage