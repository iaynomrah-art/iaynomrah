"use client"

import React, { useState, useMemo } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { TradingAccount } from "@/types/trading_accounts"
import { ArrowUp, ArrowDown, ArrowUpDown, CheckSquare, Square, Star, AlertTriangle, RotateCcw, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { resetBurnedAccount } from "@/helper/funder_accounts"
import { toast } from "sonner"

interface TradingAccountsTableProps {
    data: TradingAccount[]
    type?: string
    selectedIds?: string[]
    onSelectionChange?: (ids: string[]) => void
    pairedAccounts?: any[]
}

const PAIR_COLORS = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
    '#06b6d4'  // cyan
]

type SortConfig = {
    key: keyof TradingAccount | null
    direction: 'asc' | 'desc' | null
}

export const TradingAccountsTable = ({ data, type, selectedIds = [], onSelectionChange, pairedAccounts = [] }: TradingAccountsTableProps) => {
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null })

    const activePairInfoMap = useMemo(() => {
        const map = new Map<string, { color: string, pairId: string }>()
        let colorIdx = 0
        const activePairs = pairedAccounts.filter(p => ['ongoing', 'paired', 'initializing'].includes(p.trade_status?.toLowerCase()))
        activePairs.forEach(pair => {
            const color = PAIR_COLORS[colorIdx % PAIR_COLORS.length]
            if (pair.primary_account_id) map.set(pair.primary_account_id, { color, pairId: pair.id })
            if (pair.secondary_account_id) map.set(pair.secondary_account_id, { color, pairId: pair.id })
            colorIdx++
        })
        return map
    }, [pairedAccounts])

    const recentPairMap = useMemo(() => {
        const map = new Map<string, { partnerName: string, date: string }>()
        const historyPairs = pairedAccounts.filter(p => ['done', 'failed'].includes(p.trade_status?.toLowerCase()))
        
        const formatPartner = (account: any) => {
            if (!account) return 'Unknown Account'
            const acc = account.accounts
            const name = acc ? `${acc.first_name || ""} ${acc.last_name || ""}`.trim() || acc.email : account.credential_id || 'Unknown'
            const funder = account.funder || account.package_ref?.funders?.allias || ''
            const phase = account.package_ref?.phase || account.package || ''
            const suffix = [funder, phase].filter(Boolean).join(' ')
            return suffix ? `${name} (${suffix})` : name
        }

        historyPairs.forEach(pair => {
            if (pair.primary_account_id && !map.has(pair.primary_account_id)) {
                map.set(pair.primary_account_id, { partnerName: formatPartner(pair.secondary_account), date: pair.updated_at })
            }
            if (pair.secondary_account_id && !map.has(pair.secondary_account_id)) {
                map.set(pair.secondary_account_id, { partnerName: formatPartner(pair.primary_account), date: pair.updated_at })
            }
        })
        return map
    }, [pairedAccounts])

    // Filter data by type if provided (matching package name or funder)
    const filteredData = useMemo(() => {
        if (!type || type === "All") return data
        return data.filter(item =>
            item.package?.toLowerCase().includes(type.toLowerCase()) ||
            item.package_ref?.name?.toLowerCase().includes(type.toLowerCase()) ||
            item.funder?.toLowerCase().includes(type.toLowerCase()) ||
            item.challenge_type?.toLowerCase().includes(type.toLowerCase())
        )
    }, [data, type])

    const sortedData = useMemo(() => {
        let sortableData = [...filteredData]
        if (sortConfig.key !== null && sortConfig.direction !== null) {
            sortableData.sort((a, b) => {
                const aValue = a[sortConfig.key!]
                const bValue = b[sortConfig.key!]

                if (aValue === null || aValue === undefined) return 1
                if (bValue === null || bValue === undefined) return -1

                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
                }

                const strA = String(aValue).toLowerCase()
                const strB = String(bValue).toLowerCase()

                if (strA < strB) {
                    return sortConfig.direction === 'asc' ? -1 : 1
                }
                if (strA > strB) {
                    return sortConfig.direction === 'asc' ? 1 : -1
                }
                return 0
            })
        }
        return sortableData
    }, [filteredData, sortConfig])

    const requestSort = (key: keyof TradingAccount) => {
        let direction: 'asc' | 'desc' | null = 'asc'
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = null
            key = null as any
        }
        setSortConfig({ key, direction })
    }

    const toggleSelection = (id: string) => {
        if (!onSelectionChange) return
        const isSelected = selectedIds.includes(id)

        if (isSelected) {
            onSelectionChange(selectedIds.filter(selectedId => selectedId !== id))
        } else {
            // Only allow up to 2 selections
            if (selectedIds.length < 2) {
                onSelectionChange([...selectedIds, id])
            }
        }
    }

    const SortableHeader = ({ label, sortKey, className }: { label: string, sortKey: keyof TradingAccount, className?: string }) => {
        const isActive = sortConfig.key === sortKey
        const isRightAligned = className?.includes('text-right')
        return (
            <TableHead className={cn("text-muted-foreground font-medium text-xs py-5", className)}>
                <Button
                    variant="ghost"
                    onClick={() => requestSort(sortKey)}
                    className={cn(
                        "hover:bg-[#1a1a1a] hover:text-white px-3 py-2 h-auto font-medium transition-all gap-1.5 text-xs flex w-full",
                        isRightAligned ? "justify-end" : "justify-start",
                        isActive && "text-white bg-[#1a1a1a]"
                    )}
                >
                    {label}
                    {isActive ? (
                        sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100" />
                    )}
                </Button>
            </TableHead>
        )
    }

    const formatCurrency = (value: number | null) => {
        if (value === null || value === undefined) return "-"
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(value)
    }

    const formatPercent = (value: number | null) => {
        if (value === null || value === undefined) return "-"
        return `${value}%`
    }

    interface GroupedAccounts {
        unitName: string
        unitId: string | null
        unitStatus: string
        ownerName: string
        ownerEmail: string
        accounts: TradingAccount[]
    }

    const groupedData = useMemo(() => {
        const groups: GroupedAccounts[] = []
        const groupMap = new Map<string, GroupedAccounts>()

        sortedData.forEach((account) => {
            const unitObj = account.package_ref?.account?.units || account.accounts?.units
            const unitName = unitObj?.unit_name || "No Unit Assigned"
            const unitId = unitObj?.id || null
            const unitStatus = unitObj?.status || "not connected"
            const ownerName = account.accounts
                ? `${account.accounts.first_name || ""} ${account.accounts.last_name || ""}`.trim() || account.accounts.email
                : "UNLINKED"
            const ownerEmail = account.accounts?.email || ""

            const key = unitName

            if (!groupMap.has(key)) {
                const newGroup: GroupedAccounts = {
                    unitName,
                    unitId,
                    unitStatus,
                    ownerName,
                    ownerEmail,
                    accounts: []
                }
                groupMap.set(key, newGroup)
                groups.push(newGroup)
            }
            groupMap.get(key)!.accounts.push(account)
        })

        // Separate and sort paired accounts to the top within each group
        groups.forEach(group => {
            group.accounts.sort((a, b) => {
                const aPair = activePairInfoMap.get(a.id)
                const bPair = activePairInfoMap.get(b.id)
                if (aPair && !bPair) return -1
                if (!aPair && bPair) return 1
                if (aPair && bPair) {
                    if (aPair.pairId !== bPair.pairId) {
                        return aPair.pairId.localeCompare(bPair.pairId)
                    }
                }
                return 0
            })
        })

        return groups
    }, [sortedData, activePairInfoMap])

    return (
        <div className="flex flex-col gap-6 w-full pb-10">
            {groupedData.length === 0 ? (
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl flex items-center justify-center h-40 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <p className="text-sm font-medium">No trading accounts found</p>
                        <p className="text-xs opacity-50">Check back later or adjust your filters</p>
                    </div>
                </div>
            ) : (
                groupedData.map((group) => (
                    <div key={group.unitName} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden shadow-sm flex flex-col">
                        <div className="bg-[#0d0d0d] border-b border-[#1a1a1a] py-3.5 px-6 flex items-center justify-between">
                            <div className="flex items-center gap-3.5">
                                {group.unitName !== "No Unit Assigned" && (
                                    <span 
                                        className={cn(
                                            "w-2.5 h-2.5 rounded-full shadow-sm",
                                            {
                                                'bg-emerald-500 shadow-emerald-500/50': group.unitStatus === 'enabled',
                                                'bg-blue-500 animate-pulse shadow-blue-500/50': group.unitStatus === 'processing',
                                                'bg-orange-500 shadow-orange-500/50': group.unitStatus === 'slow network',
                                                'bg-red-500 shadow-red-500/50': ['pc issue', 'disabled'].includes(group.unitStatus),
                                                'bg-gray-600 border border-gray-500': group.unitStatus === 'not connected'
                                            }
                                        )}
                                        title={`Unit status: ${group.unitStatus}`}
                                    />
                                )}
                                <span className={cn(
                                    "text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded border shadow-sm",
                                    group.unitName === "No Unit Assigned"
                                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                )}>
                                    {group.unitName}
                                </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider bg-[#141414] px-3 py-1 rounded border border-[#1e1e1e]">
                                {group.accounts.length} {group.accounts.length === 1 ? "Account" : "Accounts"}
                            </span>
                        </div>
                        <div className="w-full overflow-x-auto custom-scrollbar">
                            <Table>
                                <TableHeader className="bg-[#0b0b0b] border-b border-[#161616]">
                                    <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                                        <TableHead className="w-[60px] py-4 px-6"></TableHead>
                                        <SortableHeader label="ACCOUNT" sortKey="id" className="py-4" />
                                        <SortableHeader label="STATUS" sortKey="status" className="py-4" />
                                        <SortableHeader label="L-EQUITY" sortKey="live_equity" className="text-right py-4" />
                                        <SortableHeader label="DAILY P&L" sortKey="daily_pnl" className="text-right py-4" />
                                        <SortableHeader label="TOTAL P&L" sortKey="total_pnl" className="text-right py-4" />
                                        <SortableHeader label="HIGHEST PROFIT" sortKey="highest_profit" className="text-right py-4" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                {group.accounts.map((account) => {
                                    const balance = account.package_ref?.balance || 0
                                    const maxDailyLoss = account.package_ref?.max_daily_loss || 0
                                    const maxTotalLoss = account.package_ref?.max_total_loss || 0
                                    const consistencyRule = account.package_ref?.consistency_rule || 40

                                    const liveEquity = account.live_equity || 0
                                    const dailyStartingEquity = account.daily_starting_equity || balance
                                    const dailyPnl = account.daily_pnl || 0
                                    const totalPnl = account.total_pnl || 0

                                    // Daily Drawdown
                                    const dailyDrawdownValue = Math.max(0, dailyStartingEquity - liveEquity)
                                    let dailyDrawdownPercent = 0
                                    if (maxDailyLoss > 0) {
                                        dailyDrawdownPercent = Math.min(100, (dailyDrawdownValue / maxDailyLoss) * 100)
                                    }

                                    // Total Drawdown
                                    const totalDrawdownValue = Math.max(0, balance - liveEquity)
                                    let totalDrawdownPercent = 0
                                    if (maxTotalLoss > 0) {
                                        totalDrawdownPercent = Math.min(100, (totalDrawdownValue / maxTotalLoss) * 100)
                                    }

                                    // Consistency Rule
                                    const consistencyLimitValue = (totalPnl > 0) ? (totalPnl * consistencyRule) / 100 : 0
                                    const isConsistencyWarning = (totalPnl > 0 && dailyPnl > 0 && consistencyLimitValue > 0 && dailyPnl >= (consistencyLimitValue * 0.8))
                                    const isConsistencyViolation = (totalPnl > 0 && dailyPnl > 0 && consistencyLimitValue > 0 && dailyPnl > consistencyLimitValue)

                                    const isBurned = (account.status as string) === 'burned' || (maxDailyLoss > 0 && dailyDrawdownPercent >= 100) || (maxTotalLoss > 0 && totalDrawdownPercent >= 100)

                                    const pairInfo = activePairInfoMap.get(account.id)
                                    const isPaired = !!pairInfo
                                    const rowStyle = (isPaired && !isBurned) 
                                        ? { borderLeft: `3px solid ${pairInfo.color}`, backgroundColor: `${pairInfo.color}10` }
                                        : { borderLeft: `3px solid transparent` }

                                    return (
                                        <TableRow
                                            key={account.id}
                                            onClick={() => !isBurned && toggleSelection(account.id)}
                                            style={rowStyle}
                                            className={cn(
                                                "border-[#1a1a1a] transition-colors group cursor-pointer",
                                                !isBurned && !isPaired && "hover:bg-[#111]",
                                                !isBurned && isPaired && "hover:opacity-80",
                                                selectedIds.includes(account.id) && "bg-blue-500/5 shadow-inner",
                                                isBurned && "bg-red-950/20 border-red-900/50 opacity-80 cursor-not-allowed hover:bg-red-950/30"
                                            )}
                                        >
                                            <TableCell className="py-4 px-6">
                                                <div className="flex items-center justify-center">
                                                    {selectedIds.includes(account.id) ? (
                                                        selectedIds[0] === account.id ? (
                                                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 animate-in zoom-in-75 duration-200" />
                                                        ) : (
                                                            <CheckSquare className="h-4 w-4 text-blue-500 animate-in zoom-in-75 duration-200" />
                                                        )
                                                    ) : (
                                                        <Square className={cn("h-4 w-4 transition-colors", isBurned ? "text-muted-foreground/10" : "text-muted-foreground/30 group-hover:text-muted-foreground")} />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-white py-4 font-mono text-xs font-semibold">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="px-2 py-0.5 rounded text-[10px] font-bold w-fit border border-transparent shadow-sm"
                                                            style={{
                                                                backgroundColor: account.package_ref?.funders?.allias_color ? `${account.package_ref.funders.allias_color}20` : '#1a1a1a',
                                                                color: account.package_ref?.funders?.text_color || '#fff',
                                                                borderColor: account.package_ref?.funders?.allias_color ? `${account.package_ref.funders.allias_color}40` : '#333'
                                                            }}
                                                        >
                                                            {account.funder || account.package_ref?.funders?.allias}
                                                        </div>
                                                        <div
                                                            className={cn(
                                                                "px-2 py-0.5 rounded text-[10px] font-bold w-fit border shadow-sm uppercase",
                                                                {
                                                                    'bg-blue-500/10 text-blue-400 border-blue-500/30': account.package_ref?.phase?.toLowerCase().includes('phase 1'),
                                                                    'bg-purple-500/10 text-purple-400 border-purple-500/30': account.package_ref?.phase?.toLowerCase().includes('phase 2'),
                                                                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/30': account.package_ref?.phase?.toLowerCase() === 'live',
                                                                    'bg-gray-500/10 text-gray-400 border-gray-500/30': !account.package_ref?.phase
                                                                }
                                                            )}
                                                        >
                                                            {account.package_ref?.phase || 'N/A'}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[11px] font-bold text-white tracking-tight truncate max-w-[150px]" title={account.accounts ? `${account.accounts.first_name || ""} ${account.accounts.last_name || ""}`.trim() || account.accounts.email : "UNLINKED"}>
                                                            {account.accounts ? `${account.accounts.first_name || ""} ${account.accounts.last_name || ""}`.trim() || account.accounts.email : "UNLINKED"}
                                                        </span>
                                                        {account.accounts?.email && (
                                                            <span className="text-[10px] text-muted-foreground/80 font-mono lowercase truncate max-w-[150px]" title={account.accounts.email}>
                                                                {account.accounts.email}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] text-muted-foreground uppercase font-black truncate max-w-[150px]" title={account.credentials?.username || account.credential_id || "No Creds"}>
                                                            {account.credentials?.username || account.credential_id || "No Creds"}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col opacity-60 gap-1">
                                                        <span className="text-[10px] tracking-wider text-white/80">{account.package || account.package_ref?.name || "No Package"}</span>
                                                        {recentPairMap.get(account.id) && !isPaired && (
                                                            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground/80 mt-1 bg-[#1a1a1a] w-fit px-1.5 py-0.5 rounded border border-[#262626]">
                                                                <History className="w-2.5 h-2.5" />
                                                                <span>Last paired with: <span className="font-bold text-white/70">{recentPairMap.get(account.id)?.partnerName}</span></span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                {isBurned ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="px-2 py-0.5 rounded-full text-[10px] font-bold w-fit border whitespace-nowrap bg-red-500/10 text-red-500 border-red-500/20 flex items-center gap-1">
                                                            🔥 BURNED
                                                        </div>
                                                        <button
                                                            title="Reset burn — restores status to idle and resets daily baseline equity"
                                                            className="pointer-events-auto flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                const faId = account.funder_account_id;
                                                                if (!faId) {
                                                                    toast.error("No funder account linked to this row.");
                                                                    return;
                                                                }
                                                                const toastId = toast.loading("Resetting burn status...");
                                                                try {
                                                                    await resetBurnedAccount(faId);
                                                                    toast.success("Account reset to idle successfully.", { id: toastId });
                                                                } catch (err: any) {
                                                                    toast.error(err?.message || "Failed to reset account.", { id: toastId });
                                                                }
                                                            }}
                                                        >
                                                            <RotateCcw className="w-2.5 h-2.5" />
                                                            Reset
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className={cn(
                                                        "px-2 py-0.5 rounded-full text-[10px] font-bold w-fit border whitespace-nowrap",
                                                        {
                                                            'bg-green-500/10 text-green-500 border-green-500/20': ['Active', 'Trading', 'Paired'].includes(account.status),
                                                            'bg-yellow-500/10 text-yellow-500 border-yellow-500/20': ['Idle', 'WAITING', 'KYC', 'idle'].includes(account.status),
                                                            'bg-blue-500/10 text-blue-500 border-blue-500/20': ['BRC', 'BRC-CHECK'].includes(account.status),
                                                            'bg-orange-500/10 text-orange-500 border-orange-500/20': ['FOR PAYOUT', 'OH'].includes(account.status),
                                                            'bg-red-500/10 text-red-500 border-red-500/20': ['ABS'].includes(account.status),
                                                        }
                                                    )}>
                                                        {(account.status || 'idle').toUpperCase()}
                                                    </div>
                                                )}
                                            </TableCell>
                                            
                                            {/* L-EQUITY & TOTAL DRAWDOWN */}
                                            <TableCell className="text-white py-4 text-right font-medium" suppressHydrationWarning>
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <span className="text-xs">{formatCurrency(liveEquity)}</span>
                                                    {maxTotalLoss > 0 && (
                                                        <div className="flex flex-col items-end gap-0.5 w-24" title={`Max Total Loss: ${formatCurrency(maxTotalLoss)}`}>
                                                            <div className="flex justify-between w-full text-[9px] text-muted-foreground font-semibold">
                                                                <span>TL</span>
                                                                <span className={totalDrawdownPercent >= 90 ? 'text-red-500' : totalDrawdownPercent >= 70 ? 'text-yellow-500' : ''}>
                                                                    {totalDrawdownPercent.toFixed(1)}%
                                                                </span>
                                                            </div>
                                                            <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                                                                <div 
                                                                    className={cn("h-full rounded-full transition-all", 
                                                                        totalDrawdownPercent >= 90 ? "bg-red-500" : 
                                                                        totalDrawdownPercent >= 70 ? "bg-yellow-500" : "bg-blue-500"
                                                                    )} 
                                                                    style={{ width: `${totalDrawdownPercent}%` }} 
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* DAILY P&L & DAILY DRAWDOWN */}
                                            <TableCell className="py-4 text-right" suppressHydrationWarning>
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <div className="flex items-center gap-1.5">
                                                        {(isConsistencyWarning || isConsistencyViolation) && (
                                                            <div title={`Consistency Limit: ${formatCurrency(consistencyLimitValue)} (Max ${consistencyRule}% of Total Profit)`}>
                                                                <AlertTriangle className={cn("w-3.5 h-3.5", isConsistencyViolation ? "text-red-500" : "text-yellow-500")} />
                                                            </div>
                                                        )}
                                                        <span className={cn(
                                                            "text-xs font-bold",
                                                            dailyPnl > 0 ? 'text-green-500' : dailyPnl < 0 ? 'text-red-500' : 'text-white'
                                                        )}>
                                                            {dailyPnl !== 0 ? (dailyPnl > 0 ? "+" : "") + formatCurrency(dailyPnl) : "$0.00"}
                                                        </span>
                                                    </div>
                                                    {maxDailyLoss > 0 && (
                                                        <div className="flex flex-col items-end gap-0.5 w-24" title={`Max Daily Loss: ${formatCurrency(maxDailyLoss)}`}>
                                                            <div className="flex justify-between w-full text-[9px] text-muted-foreground font-semibold">
                                                                <span>DL</span>
                                                                <span className={dailyDrawdownPercent >= 90 ? 'text-red-500' : dailyDrawdownPercent >= 70 ? 'text-yellow-500' : ''}>
                                                                    {dailyDrawdownPercent.toFixed(1)}%
                                                                </span>
                                                            </div>
                                                            <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                                                                <div 
                                                                    className={cn("h-full rounded-full transition-all", 
                                                                        dailyDrawdownPercent >= 90 ? "bg-red-500" : 
                                                                        dailyDrawdownPercent >= 70 ? "bg-yellow-500" : "bg-purple-500"
                                                                    )} 
                                                                    style={{ width: `${dailyDrawdownPercent}%` }} 
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-4 text-right" suppressHydrationWarning>
                                                <div className="flex flex-col items-end justify-center h-full">
                                                    <span className={cn(
                                                        "text-xs font-bold",
                                                        totalPnl > 0 ? 'text-green-500' : totalPnl < 0 ? 'text-red-500' : 'text-white'
                                                    )}>
                                                        {totalPnl !== 0 ? (totalPnl > 0 ? "+" : "") + formatCurrency(totalPnl) : "$0.00"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            
                                            <TableCell className="text-white py-4 text-right text-xs text-blue-400 font-medium" suppressHydrationWarning>
                                                <div className="flex flex-col items-end justify-center h-full">
                                                    {formatCurrency(account.highest_profit ?? null)}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ))
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #0a0a0a;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1a1a1a;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #262626;
                }
            ` }} />
        </div>
    )
}
