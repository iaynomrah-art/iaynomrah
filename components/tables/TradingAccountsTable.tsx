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
import { ArrowUp, ArrowDown, ArrowUpDown, CheckSquare, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface TradingAccountsTableProps {
    data: TradingAccount[]
    type?: string
    selectedIds?: string[] // Changed to string[]
    onSelectionChange?: (ids: string[]) => void // Changed to string[]
}

type SortConfig = {
    key: keyof TradingAccount | null
    direction: 'asc' | 'desc' | null
}

export const TradingAccountsTable = ({ data, type, selectedIds = [], onSelectionChange }: TradingAccountsTableProps) => {
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null })

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
        return (
            <TableHead className={cn("text-muted-foreground font-medium text-xs py-5", className)}>
                <Button
                    variant="ghost"
                    onClick={() => requestSort(sortKey)}
                    className={cn(
                        "hover:bg-[#1a1a1a] hover:text-white px-3 py-2 h-auto font-medium transition-all gap-1.5 text-xs",
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

    return (
        <div className="w-full overflow-x-auto custom-scrollbar">
            <Table>
                <TableHeader className="bg-[#0d0d0d] border-b border-[#1a1a1a]">
                    <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                        <TableHead className="w-[60px] py-5 px-6">
                            {/* Select All removed - Pairing limited to 2 */}
                        </TableHead>
                        <SortableHeader label="ACCOUNT" sortKey="id" />
                        <SortableHeader label="STATUS" sortKey="status" />
                        <SortableHeader label="L-EQUITY" sortKey="live_equity" className="text-right" />
                        <SortableHeader label="DAILY P&L" sortKey="daily_pnl" className="text-right" />
                        <SortableHeader label="RDD" sortKey="rdd" className="text-right" />
                        <SortableHeader label="HIGHEST PROFIT" sortKey="highest_profit" className="text-right" />
                        <SortableHeader label="CONSIS" sortKey="consistency" className="text-right" />
                        <SortableHeader label="R.T-DAYS" sortKey="remaining_target_days" className="text-right" />
                        <SortableHeader label="R.T-PROFIT" sortKey="remaining_target_profit" className="text-right" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedData.length === 0 ? (
                        <TableRow className="border-[#1a1a1a]">
                            <TableCell colSpan={10} className="h-32 text-center text-muted-foreground py-10">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <p className="text-sm font-medium">No trading accounts found</p>
                                    <p className="text-xs opacity-50">Check back later or adjust your filters</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        sortedData.map((account) => (
                            <TableRow
                                key={account.id}
                                onClick={() => toggleSelection(account.id)}
                                className={cn(
                                    "border-[#1a1a1a] hover:bg-[#111] transition-colors group cursor-pointer",
                                    selectedIds.includes(account.id) && "bg-blue-500/5 shadow-inner"
                                )}
                            >
                                <TableCell className="py-6 px-6">
                                    <div className="flex items-center justify-center">
                                        {selectedIds.includes(account.id) ? (
                                            <CheckSquare className="h-4 w-4 text-blue-500 animate-in zoom-in-75 duration-200" />
                                        ) : (
                                            <Square className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-white py-6 font-mono text-xs font-semibold">
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
                                        <span className="text-[11px] tracking-wider text-white/90">{account.credential_id}</span>
                                        <span className="text-[11px] tracking-wider text-white/90">{account.package || account.package_ref?.name}</span>
                                        <span className="text-[11px] tracking-wider text-white/90">{account.accounts?.units?.unit_name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-6">
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
                                </TableCell>
                                <TableCell className="text-white py-6 text-right text-xs font-medium" suppressHydrationWarning>
                                    {formatCurrency(account.live_equity ?? null)}
                                </TableCell>
                                <TableCell className={cn(
                                    "py-6 text-right text-xs font-bold",
                                    (account.daily_pnl ?? 0) > 0 ? 'text-green-500' : (account.daily_pnl ?? 0) < 0 ? 'text-red-500' : 'text-white'
                                )} suppressHydrationWarning>
                                    {(account.daily_pnl ?? 0) !== 0 ? ((account.daily_pnl ?? 0) > 0 ? "+" : "") + formatCurrency(account.daily_pnl ?? null) : "$0.00"}
                                </TableCell>
                                <TableCell className="text-white py-6 text-right text-xs" suppressHydrationWarning>
                                    {formatCurrency(account.rdd ?? null)}
                                </TableCell>
                                <TableCell className="text-white py-6 text-right text-xs text-blue-400" suppressHydrationWarning>
                                    {formatCurrency(account.highest_profit ?? null)}
                                </TableCell>
                                <TableCell className="text-white py-6 text-right text-xs" suppressHydrationWarning>
                                    {formatPercent(account.consistency ?? null)}
                                </TableCell>
                                <TableCell className="text-white py-6 text-right text-xs font-mono">
                                    {account.remaining_target_days ?? "--"}
                                </TableCell>
                                <TableCell className="text-white py-6 text-right text-xs font-medium text-orange-400" suppressHydrationWarning>
                                    {formatCurrency(account.remaining_target_profit ?? null)}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

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
