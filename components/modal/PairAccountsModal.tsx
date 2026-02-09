"use client"

import React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { TradingAccount } from "@/types/trading_accounts"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Row from "@/components/ui/row"
import PlayIcon from "@/components/ui/playicon"

import { TradeStatus } from "@/types/paired"

type Pair = TradingAccount & {
    trade_type: 'buy' | 'sell'
    order_amount: number
    tp_ticks: number
    sl_ticks: number
    starting_balance: number
    starting_equity: number
    latest_equity: number
    daily_pnl: number
    rdd: number
    symbol: string

    // Calculated fields for UI
    loss_profit: number
    win_profit: number
    loss_balance: number
    win_balance: number
    loss_price: number
    win_price: number
}

interface PairAccountsModalProps {
    isOpen: boolean
    onClose: () => void
    selectedAccounts: TradingAccount[]
    onConfirm: (pairs: Pair[]) => void
}

export const PairAccountsModal = ({
    isOpen,
    onClose,
    selectedAccounts,
    onConfirm
}: PairAccountsModalProps) => {
    const [basePrice, setBasePrice] = React.useState<number>(2000)
    const [pairs, setPairs] = React.useState<Pair[]>([])
    const [isLoading, setIsLoading] = React.useState(false)
    const multiplier = 0.01 // Default tick multiplier

    // Initialize/Sync pairs when selectedAccounts changes
    React.useEffect(() => {
        if (!isOpen) return

        const initialPairs = selectedAccounts.map((account, index) => {
            const currentEquity = account.live_equity || 0
            const slTicks = 50
            const tpTicks = 100
            const orderAmount = 0.1

            const type = (selectedAccounts.length === 2 && index === 1) ? 'sell' as const : 'buy' as const
            const isBuy = type === 'buy'

            // Default risk 1% based on starting equity
            const lProfit = currentEquity * 0.01
            const wProfit = lProfit * (tpTicks / slTicks)

            return {
                ...account,
                trade_type: type,
                order_amount: orderAmount,
                sl_ticks: slTicks,
                tp_ticks: tpTicks,
                starting_balance: account.package_ref?.balance || 0,
                starting_equity: currentEquity,
                latest_equity: currentEquity,
                daily_pnl: account.daily_pnl || 0,
                rdd: account.rdd || 0,
                symbol: account.package_ref?.symbol || account.package || "XAUUSD",

                loss_profit: lProfit,
                win_profit: wProfit,
                loss_price: isBuy ? basePrice - (slTicks * multiplier) : basePrice + (slTicks * multiplier),
                win_price: isBuy ? basePrice + (tpTicks * multiplier) : basePrice - (tpTicks * multiplier),
                loss_balance: currentEquity - lProfit,
                win_balance: currentEquity + wProfit,
            } as Pair
        })
        setPairs(initialPairs)
    }, [selectedAccounts, isOpen, basePrice])

    const updatePair = (id: string, field: keyof Pair, value: any) => {
        setPairs(prev => {
            const index = prev.findIndex(p => p.id === id)
            if (index === -1) return prev

            let updatedPairs = [...prev]
            let newPair = { ...updatedPairs[index], [field]: value }
            const startEquity = newPair.starting_equity || 0
            let isBuy = newPair.trade_type === 'buy'

            // Inverse logic for 2 accounts when trade_type changes
            if (field === 'trade_type' && prev.length === 2) {
                const otherIndex = index === 0 ? 1 : 0
                const otherType = value === 'buy' ? 'sell' : 'buy'

                updatedPairs[otherIndex] = {
                    ...updatedPairs[otherIndex],
                    trade_type: otherType,
                }
                const otherIsBuy = otherType === 'buy'
                updatedPairs[otherIndex].loss_price = otherIsBuy
                    ? basePrice - (updatedPairs[otherIndex].sl_ticks * multiplier)
                    : basePrice + (updatedPairs[otherIndex].sl_ticks * multiplier)
                updatedPairs[otherIndex].win_price = otherIsBuy
                    ? basePrice + (updatedPairs[otherIndex].tp_ticks * multiplier)
                    : basePrice - (updatedPairs[otherIndex].tp_ticks * multiplier)
            }

            // Sync reciprocal fields and recalculate profits
            if (field === 'sl_ticks') {
                newPair.loss_price = isBuy ? basePrice - (value * multiplier) : basePrice + (value * multiplier)
            } else if (field === 'tp_ticks') {
                newPair.win_price = isBuy ? basePrice + (value * multiplier) : basePrice - (value * multiplier)
            } else if (field === 'loss_price') {
                newPair.sl_ticks = Math.abs((value - basePrice) / multiplier)
            } else if (field === 'win_price') {
                newPair.tp_ticks = Math.abs((value - basePrice) / multiplier)
            } else if (field === 'starting_equity') {
                newPair.loss_balance = value - newPair.loss_profit
                newPair.win_balance = value + newPair.win_profit
            } else if (field === 'trade_type') {
                isBuy = value === 'buy'
                newPair.loss_price = isBuy ? basePrice - (newPair.sl_ticks * multiplier) : basePrice + (newPair.sl_ticks * multiplier)
                newPair.win_price = isBuy ? basePrice + (newPair.tp_ticks * multiplier) : basePrice - (newPair.tp_ticks * multiplier)
            } else if (field === 'symbol') {
                updatedPairs = updatedPairs.map(p => ({ ...p, symbol: value.toUpperCase() }))
                newPair = { ...updatedPairs[index] }
            }

            // Recalculate estimated profits based on start equity and ticks/order amount
            // This is a simplified formula, might need contract size adjustment based on symbol
            newPair.loss_profit = startEquity * 0.01 // Keeping 1% risk as baseline for UI feedback
            newPair.win_profit = newPair.loss_profit * (newPair.tp_ticks / newPair.sl_ticks)
            newPair.loss_balance = startEquity - newPair.loss_profit
            newPair.win_balance = startEquity + newPair.win_profit

            updatedPairs[index] = newPair
            return updatedPairs
        })
    }

    const handleConfirm = async () => {
        try {
            setIsLoading(true)

            if (pairs.length < 2) {
                toast.error("At least two accounts are required for pairing")
                return
            }

            const primary = pairs[0]
            const secondary = pairs[1]

            // 1. Validation: Same Funder Warning
            const funderId1 = primary.package_ref?.funder_id
            const funderId2 = secondary.package_ref?.funder_id

            if (funderId1 && funderId2 && funderId1 === funderId2) {
                const proceed = window.confirm(
                    `Warning: Both accounts belong to the same funder (${primary.package_ref?.funders?.name || 'Same Funder'}). \n\nMultiple accounts from the same funder might violate their rules. Do you want to proceed?`
                )
                if (!proceed) {
                    setIsLoading(false)
                    return
                }
            }

            // 2. Validation: Live paired with Not Live
            const phase1 = primary.package_ref?.phase?.toLowerCase()
            const phase2 = secondary.package_ref?.phase?.toLowerCase()
            const isLive1 = phase1 === 'live'
            const isLive2 = phase2 === 'live'

            if (isLive1 !== isLive2) {
                const proceed = window.confirm(
                    `Notice: You are pairing a ${isLive1 ? 'Live' : 'Phase'} account with a ${isLive2 ? 'Live' : 'Phase'} account. \n\nDo you want to proceed?`
                )
                if (!proceed) {
                    setIsLoading(false)
                    return
                }
            }

            // 3. Validation: Unit Health
            const unit1 = primary.accounts?.units
            const unit2 = secondary.accounts?.units

            if (!unit1?.api_base_url || unit1?.status !== 'enabled') {
                toast.error(`Unit unavailable.`)
                setIsLoading(false)
                return
            }

            if (!unit2?.api_base_url || unit2?.status !== 'enabled') {
                toast.error(`Unit unavailable.`)
                setIsLoading(false)
                return
            }

            // 3. Prepare minimal data for Edge Function
            const payload = {
                primary_account_id: String(primary.id),
                secondary_account_id: String(secondary.id),

                primary: {
                    symbol: String(primary.symbol || "XAUUSD"),
                    order_amount: primary.order_amount,
                    stop_loss: primary.sl_ticks,
                    take_profit: primary.tp_ticks,
                    order_type: primary.trade_type,
                    accounts_id: primary.accounts_id
                },
                secondary: {
                    symbol: String(secondary.symbol || "XAUUSD"),
                    order_amount: secondary.order_amount,
                    stop_loss: secondary.sl_ticks,
                    take_profit: secondary.tp_ticks,
                    order_type: secondary.trade_type,
                    accounts_id: secondary.accounts_id
                }
            }

            // 4. Call Edge Function
            // Note: Using NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as shown in the curl command
            // If NEXT_PRIVATE_SUPABASE_ANON_KEY is needed and exposed, it can be substituted here.
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

            const response = await fetch('https://cisszbamrleoxcnyeoku.supabase.co/functions/v1/pairing-trading-accounts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'apikey': `${supabaseKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
                throw new Error(errorData.message || `Edge Function Error: ${response.statusText}`);
            }

            toast.success("Pairing initiated successfully")
            onConfirm(pairs)
        } catch (error: any) {
            console.error("Pairing error:", error)
            toast.error(error.message || "Failed to initiate pairing")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#1e2329] border-[#2b3139] text-white max-w-[800px] overflow-hidden flex flex-col max-h-[95vh] p-0 gap-0 shadow-2xl">
                <DialogTitle className="sr-only">Pair Configuration</DialogTitle>
                <DialogDescription className="sr-only">Configure trade parameters for paired accounts.</DialogDescription>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0b0e11]">
                    <div className="grid grid-cols-2 divide-x divide-[#2b3139]">
                        {pairs.map((account, index) => (
                            <div key={account.id} className="flex flex-col bg-[#161a1e]">
                                {/* Header */}
                                <div className={cn(
                                    "px-4 py-2.5 flex items-center justify-between",
                                    account.trade_type === 'buy' ? "bg-[#2ebc66]" : "bg-[#cf304a]"
                                )}>
                                    <div className="flex items-center gap-1.5">
                                        <div className="bg-[#f0b90b] text-black px-1.5 py-0.5 rounded-[3px] text-[10px] font-black uppercase">
                                            {account.package_ref?.funders?.allias || "UPFT"}
                                        </div>
                                        <div className="bg-[#ffffff20] text-white px-1.5 py-0.5 rounded-[3px] text-[10px] font-bold uppercase truncate max-w-[70px]">
                                            {account.package_ref?.phase || account.package?.split(' ')[0] || "PHASE 1"}
                                        </div>
                                    </div>
                                    <div className="text-white font-black text-[12px] uppercase tracking-tighter flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                                        {account.accounts?.units?.unit_name || "NO UNIT"}
                                    </div>
                                </div>

                                {/* Table Grid */}
                                <div className="divide-y divide-[#2b3139]">
                                    <Row label="Starting Balance" value={`$${account.starting_balance.toLocaleString()}`} />



                                    <div className="grid grid-cols-2 px-4 py-2.5 items-center hover:bg-[#2b3139]/30 transition-colors">
                                        <span className="text-[#848e9c] text-[13px] font-medium">Starting Equity</span>
                                        <div className="flex justify-end">

                                            <input
                                                type="number"
                                                value={account.starting_equity}
                                                onChange={(e) => updatePair(account.id, 'starting_equity', Number(e.target.value))}
                                                className="bg-transparent border-none text-white text-[13px] font-bold text-right focus:outline-none w-full"
                                            />
                                        </div>
                                    </div>

                                    <Row label="Latest Equity" value={`$${account.latest_equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                                    <Row label="Daily P&L" value={`$${account.daily_pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} color={account.daily_pnl >= 0 ? "text-[#2ebc66]" : "text-[#f6465d]"} />
                                    <Row label="RDD" value={`$${(account.rdd || 0).toLocaleString()}`} />
                                    <Row label="Unit" value={account.accounts?.units?.unit_name || "None"} color="text-blue-400 font-mono text-[11px]" />

                                    {/* Actionable Fields */}
                                    <div className="grid grid-cols-2 px-4 py-2.5 items-center hover:bg-[#2b3139]/30 transition-colors">
                                        <span className="text-[#848e9c] text-[13px] font-medium">Symbol</span>
                                        <div className="flex justify-end border border-[#2b3139] bg-[#0b0e11] px-2 py-0.5 rounded-[4px]">
                                            <input
                                                type="text"
                                                value={account.symbol}
                                                onChange={(e) => updatePair(account.id, 'symbol', e.target.value)}
                                                className="bg-transparent border-none text-white text-[13px] font-bold text-right focus:outline-none w-full uppercase"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 px-4 py-2.5 items-center hover:bg-[#2b3139]/30 transition-colors">
                                        <span className="text-[#4788ff] text-[13px] font-medium">Order Amount</span>
                                        <div className="flex justify-end border border-[#2b3139] bg-[#0b0e11] px-2 py-0.5 rounded-[4px]">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={account.order_amount}
                                                onChange={(e) => updatePair(account.id, 'order_amount', Number(e.target.value))}
                                                className="bg-transparent border-none text-white text-[13px] font-bold text-right focus:outline-none w-full"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 px-4 py-2.5 items-center hover:bg-[#2b3139]/30 transition-colors">
                                        <span className="text-[#4788ff] text-[13px] font-medium">TP (Ticks)</span>
                                        <div className="flex justify-end border border-[#2b3139] bg-[#0b0e11] px-2 py-0.5 rounded-[4px]">
                                            <input
                                                type="number"
                                                value={account.tp_ticks}
                                                onChange={(e) => updatePair(account.id, 'tp_ticks', Number(e.target.value))}
                                                className="bg-transparent border-none text-white text-[13px] font-bold text-right focus:outline-none w-full"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 px-4 py-2.5 items-center hover:bg-[#2b3139]/30 transition-colors">
                                        <span className="text-[#4788ff] text-[13px] font-medium">SL (Ticks)</span>
                                        <div className="flex justify-end border border-[#2b3139] bg-[#0b0e11] px-2 py-0.5 rounded-[4px]">
                                            <input
                                                type="number"
                                                value={account.sl_ticks}
                                                onChange={(e) => updatePair(account.id, 'sl_ticks', Number(e.target.value))}
                                                className="bg-transparent border-none text-white text-[13px] font-bold text-right focus:outline-none w-full"
                                            />
                                        </div>
                                    </div>

                                    {/* Purchase Type Row */}
                                    <div className="grid grid-cols-2 px-4 py-3 items-center hover:bg-[#2b3139]/30 transition-colors">
                                        <span className="text-[#848e9c] text-[13px] font-medium">Purchase Type</span>
                                        <Select
                                            value={account.trade_type}
                                            onValueChange={(value: 'buy' | 'sell') => updatePair(account.id, 'trade_type', value)}
                                        >
                                            <SelectTrigger className="bg-[#0b0e11] border-[#2b3139] h-8 text-[13px] font-bold focus:ring-0 focus:ring-offset-0">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#1e2329] border-[#2b3139] text-white">
                                                <SelectItem value="buy">Buy</SelectItem>
                                                <SelectItem value="sell">Sell</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <DialogFooter className="px-5 py-4 bg-[#1e2329] border-t border-[#2b3139] flex items-center justify-between sm:justify-between w-full">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="bg-[#2a2e33] hover:bg-[#3a3e43] text-[#848e9c] h-[38px] px-8 rounded-[4px] font-bold text-[13px] border border-[#3a3e43]"
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="bg-[#2f66d4] hover:bg-[#3b7ef6] text-white h-[38px] px-5 rounded-[4px] font-bold text-[13px] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                <span>Initiating...</span>
                            </div>
                        ) : (
                            <>
                                <PlayIcon className="w-3.5 h-3.5" />
                                <span>Initiate Pairing</span>
                            </>
                        )}
                    </Button>

                </DialogFooter>

                <style>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #3a3e43; border-radius: 10px; }
                `}</style>
            </DialogContent>
        </Dialog>
    )
}
