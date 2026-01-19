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
import { Button } from "@/components/ui/button"
import { TradingAccount } from "@/types/trading_accounts"
import { CheckSquare, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginToAccount } from "@/helper/automation"

type Pair = TradingAccount & {
    trade_type: 'buy' | 'sell'
    range_pips: number
    loss_pips: number
    loss_price: number
    loss_balance: number
    loss_profit: number
    win_pips: number
    win_price: number
    win_balance: number
    win_profit: number
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
    const multiplier = 0.01 // Adjust based on symbol if needed

    // Initialize/Sync pairs when selectedAccounts changes
    React.useEffect(() => {
        if (!isOpen) return

        const initialPairs = selectedAccounts.map((account, index) => {
            const equity = account.live_equity || 0
            const lPips = 50
            const wPips = 100
            const range = lPips + wPips

            // If exactly 2 accounts, make second one sell
            const type = (selectedAccounts.length === 2 && index === 1) ? 'sell' as const : 'buy' as const
            const isBuy = type === 'buy'

            // Default risk 1%
            const lProfit = equity * 0.01
            const wProfit = lProfit * (wPips / lPips)

            return {
                ...account,
                trade_type: type,
                range_pips: range,
                loss_pips: lPips,
                win_pips: wPips,
                loss_price: isBuy ? basePrice - (lPips * multiplier) : basePrice + (lPips * multiplier),
                win_price: isBuy ? basePrice + (wPips * multiplier) : basePrice - (wPips * multiplier),
                loss_profit: lProfit,
                win_profit: wProfit,
                loss_balance: equity - lProfit,
                win_balance: equity + wProfit,
            }
        })
        setPairs(initialPairs)
    }, [selectedAccounts, isOpen, basePrice, multiplier])

    const updatePair = (id: number, field: keyof Pair, value: any) => {
        setPairs(prev => {
            const index = prev.findIndex(p => p.id === id)
            if (index === -1) return prev

            let updatedPairs = [...prev]
            let newPair = { ...updatedPairs[index], [field]: value }
            const equity = newPair.live_equity || 0
            let isBuy = newPair.trade_type === 'buy'

            // Inverse logic for 2 accounts when trade_type changes
            if (field === 'trade_type' && prev.length === 2) {
                const otherIndex = index === 0 ? 1 : 0
                const otherType = value === 'buy' ? 'sell' : 'buy'

                // Update the other pair's trade_type and recalculate its prices
                updatedPairs[otherIndex] = {
                    ...updatedPairs[otherIndex],
                    trade_type: otherType,
                }
                const otherIsBuy = otherType === 'buy'
                updatedPairs[otherIndex].loss_price = otherIsBuy
                    ? basePrice - (updatedPairs[otherIndex].loss_pips * multiplier)
                    : basePrice + (updatedPairs[otherIndex].loss_pips * multiplier)
                updatedPairs[otherIndex].win_price = otherIsBuy
                    ? basePrice + (updatedPairs[otherIndex].win_pips * multiplier)
                    : basePrice - (updatedPairs[otherIndex].win_pips * multiplier)
            }

            // Sync reciprocal fields
            if (field === 'loss_pips') {
                newPair.loss_price = isBuy ? basePrice - (value * multiplier) : basePrice + (value * multiplier)
            } else if (field === 'loss_price') {
                newPair.loss_pips = Math.abs((value - basePrice) / multiplier)
            } else if (field === 'win_pips') {
                newPair.win_price = isBuy ? basePrice + (value * multiplier) : basePrice - (value * multiplier)
            } else if (field === 'win_price') {
                newPair.win_pips = Math.abs((value - basePrice) / multiplier)
            } else if (field === 'loss_profit') {
                newPair.loss_balance = equity - value
            } else if (field === 'loss_balance') {
                newPair.loss_profit = equity - value
            } else if (field === 'win_profit') {
                newPair.win_balance = equity + value
            } else if (field === 'win_balance') {
                newPair.win_profit = value - equity
            } else if (field === 'trade_type') {
                isBuy = value === 'buy' // Update isBuy based on the new trade_type
                newPair.loss_price = isBuy ? basePrice - (newPair.loss_pips * multiplier) : basePrice + (newPair.loss_pips * multiplier)
                newPair.win_price = isBuy ? basePrice + (newPair.win_pips * multiplier) : basePrice - (newPair.win_pips * multiplier)
            }

            newPair.range_pips = newPair.loss_pips + newPair.win_pips
            updatedPairs[index] = newPair
            return updatedPairs
        })
    }

    const handleConfirm = async () => {
        try {
            onConfirm(pairs)

            if (pairs[0].units?.status !== 'enabled' || pairs[1].units?.status !== 'enabled') {
                toast.error("Units are not enabled")
                return
            }

            await Promise.all([
                loginToAccount(pairs[0]),
                loginToAccount(pairs[1])
            ])
        } catch (error) {
            toast.error("Units are not enabled")
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#0a0a0a] border-[#1a1a1a] text-white max-w-[1600px] overflow-hidden flex flex-col max-h-[95vh] p-0">
                {/* Visually hidden but accessible title for screen readers */}
                <DialogTitle className="sr-only">Pair Configuration</DialogTitle>
                <DialogDescription className="sr-only">Configure trade parameters for paired accounts.</DialogDescription>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 divide-x divide-[#1a1a1a] h-full">
                        {pairs.map((account, index) => (
                            <div
                                key={account.id}
                                className={cn(
                                    "p-5 space-y-5 flex flex-col",
                                    index === 0 ? "bg-[#050505]" : "bg-[#080808]"
                                )}
                            >
                                {/* Account Identity */}
                                <div className="flex items-center justify-between pb-4 border-b border-[#1a1a1a]">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-mono font-bold text-white tracking-tighter uppercase">{account.account_number}</span>
                                            <div
                                                className="px-2 py-0.5 rounded text-[9px] font-bold border border-transparent"
                                                style={{
                                                    backgroundColor: account.funders?.allias_color ? `${account.funders.allias_color}20` : '#1a1a1a',
                                                    color: account.funders?.text_color || '#fff',
                                                }}
                                            >
                                                {account.funders?.allias}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] text-blue-400 font-medium tracking-tight" suppressHydrationWarning>Equity: ${account.live_equity.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                </div>

                                {/* Inputs List - Now tightly stacked to prevent overflow */}
                                <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                                    {/* Pips Metric Group */}
                                    <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] space-y-3 shadow-inner">
                                        <div className="flex items-center justify-between gap-4">
                                            <Label className="text-[9px] text-muted-foreground uppercase font-black shrink-0 tracking-widest">Loss Pips</Label>
                                            <Input
                                                type="number"
                                                value={account.loss_pips}
                                                onChange={(e) => updatePair(account.id, 'loss_pips', Number(e.target.value))}
                                                className="h-8 w-24 bg-[#050505] border-[#1a1a1a] text-xs font-mono text-right focus:border-red-500/30"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <Label className="text-[9px] text-muted-foreground uppercase font-black shrink-0 tracking-widest">Win Pips</Label>
                                            <Input
                                                type="number"
                                                value={account.win_pips}
                                                onChange={(e) => updatePair(account.id, 'win_pips', Number(e.target.value))}
                                                className="h-8 w-24 bg-[#050505] border-[#1a1a1a] text-xs font-mono text-right focus:border-green-500/30"
                                            />
                                        </div>
                                    </div>

                                    {/* Price Metric Group */}
                                    <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] space-y-3 shadow-inner">
                                        <div className="flex items-center justify-between gap-4">
                                            <Label className="text-[9px] text-red-500/70 font-black uppercase shrink-0 tracking-widest">SL Price</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={account.loss_price.toFixed(2)}
                                                onChange={(e) => updatePair(account.id, 'loss_price', Number(e.target.value))}
                                                className="h-8 w-24 bg-[#050505] border-red-500/10 text-xs font-mono text-red-400 text-right"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <Label className="text-[9px] text-green-500/70 font-black uppercase shrink-0 tracking-widest">TP Price</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={account.win_price.toFixed(2)}
                                                onChange={(e) => updatePair(account.id, 'win_price', Number(e.target.value))}
                                                className="h-8 w-24 bg-[#050505] border-green-500/10 text-xs font-mono text-green-400 text-right"
                                            />
                                        </div>
                                    </div>

                                    {/* Profit Metric Group */}
                                    <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] space-y-3 shadow-inner">
                                        <div className="flex items-center justify-between gap-4">
                                            <Label className="text-[9px] text-muted-foreground font-black uppercase shrink-0 tracking-widest">Loss Amount</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={account.loss_profit.toFixed(2)}
                                                onChange={(e) => updatePair(account.id, 'loss_profit', Number(e.target.value))}
                                                className="h-8 w-24 bg-[#050505] border-[#1a1a1a] text-xs font-mono text-right"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <Label className="text-[9px] text-blue-400 font-black uppercase shrink-0 tracking-widest">Win Amount</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={account.win_profit.toFixed(2)}
                                                onChange={(e) => updatePair(account.id, 'win_profit', Number(e.target.value))}
                                                className="h-8 w-24 bg-[#050505] border-[#1a1a1a] text-xs font-mono text-blue-400 text-right"
                                            />
                                        </div>
                                    </div>

                                    {/* Balance Metric Group */}
                                    <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] space-y-3 shadow-inner">
                                        <div className="flex items-center justify-between gap-4">
                                            <Label className="text-[9px] text-muted-foreground font-black uppercase shrink-0 tracking-widest">Post-Loss Bal</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={account.loss_balance.toFixed(2)}
                                                onChange={(e) => updatePair(account.id, 'loss_balance', Number(e.target.value))}
                                                className="h-8 w-24 bg-[#050505] border-[#1a1a1a] text-xs font-mono opacity-80 text-right"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <Label className="text-[9px] text-muted-foreground font-black uppercase shrink-0 tracking-widest">Post-Win Bal</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={account.win_balance.toFixed(2)}
                                                onChange={(e) => updatePair(account.id, 'win_balance', Number(e.target.value))}
                                                className="h-8 w-24 bg-[#050505] border-[#1a1a1a] text-xs font-mono opacity-80 text-right"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto pt-4 border-t border-[#1a1a1a] space-y-4">
                                    <div className="flex justify-between items-center bg-[#0a0a0a] p-2.5 rounded-lg border border-[#1a1a1a]">
                                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Efficiency Range</span>
                                        <span className="text-sm font-mono font-bold text-white">{account.range_pips} PIPS</span>
                                    </div>

                                    <div className="flex bg-[#0a0a0a] p-1 rounded-xl border border-[#1a1a1a] shadow-inner w-full">
                                        <button
                                            onClick={() => updatePair(account.id, 'trade_type', 'buy')}
                                            className={cn(
                                                "flex-1 py-3 rounded-lg text-xs font-bold transition-all",
                                                account.trade_type === 'buy' ? "bg-green-500/10 text-green-400 shadow-sm border border-green-500/20" : "text-muted-foreground hover:text-white"
                                            )}
                                        >BUY</button>
                                        <button
                                            onClick={() => updatePair(account.id, 'trade_type', 'sell')}
                                            className={cn(
                                                "flex-1 py-3 rounded-lg text-xs font-bold transition-all",
                                                account.trade_type === 'sell' ? "bg-red-500/10 text-red-400 shadow-sm border border-red-500/20" : "text-muted-foreground hover:text-white"
                                            )}
                                        >SELL</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter className="px-8 py-6 bg-[#0a0a0a] border-t border-[#1a1a1a] gap-4 flex items-center justify-end">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-muted-foreground hover:text-white h-11 px-8 rounded-xl"
                    >
                        Discard
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        className="bg-blue-600 hover:bg-blue-500 text-white h-11 px-12 rounded-xl shadow-xl shadow-blue-900/20 font-black tracking-wide"
                    >
                        CONFIRM PAIRING
                    </Button>
                </DialogFooter>

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
            </DialogContent>
        </Dialog>
    )
}
