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
import { inputCtraderOrder } from "@/helper/automation"
import { createTradePair } from "@/helper/trade_pairs"

import Row from "@/components/ui/row"
import PlayIcon from "@/components/ui/playicon"

type Pair = TradingAccount & {
    trade_type: 'buy' | 'sell'
    order_amount: number
    tp_ticks: number
    sl_ticks: number
    purchase_type: string
    starting_balance: number
    starting_equity: number
    latest_equity: number
    daily_pnl: number
    rdd: number

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
                symbol: account.package?.instrument || "XAUUSD",
                order_amount: orderAmount,
                sl_ticks: slTicks,
                tp_ticks: tpTicks,
                purchase_type: account.challenge_type || "Standard",
                starting_balance: account.package?.balance || 0,
                starting_equity: currentEquity,
                latest_equity: currentEquity,
                daily_pnl: account.daily_pnl || 0,
                rdd: account.rdd || 0,

                loss_profit: lProfit,
                win_profit: wProfit,
                loss_price: isBuy ? basePrice - (slTicks * multiplier) : basePrice + (slTicks * multiplier),
                win_price: isBuy ? basePrice + (tpTicks * multiplier) : basePrice - (tpTicks * multiplier),
                loss_balance: currentEquity - lProfit,
                win_balance: currentEquity + wProfit,
            }
        })
        setPairs(initialPairs)
    }, [selectedAccounts, isOpen, basePrice])

    const updatePair = (id: number, field: keyof Pair, value: any) => {
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
            if (!pairs[0]?.units?.api_base_url || !pairs[1]?.units?.api_base_url) {
                toast.error("Units are not configured with API URL")
                return
            }

            // 1. Save to database
            await createTradePair({
                account_1_id: pairs[0].id,
                account_1_purchase_type: pairs[0].trade_type,
                account_1_order_amount: pairs[0].order_amount,
                account_1_tp_ticks: pairs[0].tp_ticks,
                account_1_sl_ticks: pairs[0].sl_ticks,
                account_1_start_equity: pairs[0].starting_equity,
                account_2_id: pairs[1].id,
                account_2_purchase_type: pairs[1].trade_type,
                account_2_order_amount: pairs[1].order_amount,
                account_2_tp_ticks: pairs[1].tp_ticks,
                account_2_sl_ticks: pairs[1].sl_ticks,
                account_2_start_equity: pairs[1].starting_equity,
            });

            // 2. Trigger automation for both accounts
            await Promise.all(pairs.map(pair => {
                const payload = {
                    username: String(pair.credentials?.username || ""),
                    password: String(pair.credentials?.password || ""),
                    symbol: String(pair.package?.symbol || ""),
                    order_amount: String(pair.order_amount),
                    tp_ticks: String(pair.tp_ticks),
                    sl_ticks: String(pair.sl_ticks),
                    purchase_type: String(pair.trade_type),
                    // Metadata/Tracking
                    account_number: String(pair.account_number),
                    starting_balance: String(pair.starting_balance),
                    starting_equity: String(pair.starting_equity),
                    latest_equity: String(pair.latest_equity),
                    daily_pnl: String(pair.daily_pnl),
                    rdd: String(pair.rdd)
                }

                return inputCtraderOrder(pair.units?.api_base_url || "", payload)
            }))

            toast.success("Accounts paired and trading session initiated")
            onConfirm(pairs)
        } catch (error: any) {
            console.error("Pairing error:", error)
            toast.error("Failed to initiate pairing")
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
                                        <div className="bg-[#f0b90b] text-black px-1.5 py-0.5 rounded-[3px] text-[10px] font-black uppercase">UPFT</div>
                                        <div className="bg-[#ffffff20] text-white px-1.5 py-0.5 rounded-[3px] text-[10px] font-bold uppercase truncate max-w-[70px]">
                                            {account.package?.name?.split(' ')[0] || "UPTDay5..."}
                                        </div>
                                    </div>
                                    <div className="text-white font-black text-[12px] uppercase tracking-tighter">
                                        {account.units?.unit_name || `UNIT ${account.id}`}
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
                                    <Row label="RDD" value={`$${account.rdd.toLocaleString()}`} />

                                    {/* Actionable Fields */}
                                    <div className="grid grid-cols-2 px-4 py-2.5 items-center hover:bg-[#2b3139]/30 transition-colors">
                                        <span className="text-[#848e9c] text-[13px] font-medium">Symbol</span>
                                        <div className="flex justify-end px-2 py-0.5">
                                            <span className="text-white text-[13px] font-bold text-right uppercase">
                                                {account.package?.symbol || "XAUUSD"}
                                            </span>
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
                        className="bg-[#2f66d4] hover:bg-[#3b7ef6] text-white h-[38px] px-5 rounded-[4px] font-bold text-[13px] flex items-center gap-2"
                    >
                        <PlayIcon className="w-3.5 h-3.5" />
                        Initiate Pairing
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




