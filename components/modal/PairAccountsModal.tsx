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
    const [isSuggesting, setIsSuggesting] = React.useState(false)
    const multiplier = 0.01 // Default tick multiplier

    // Helper to calculate the safe daily limit and total loss limit
    const getAccountSafeLimit = (acc: TradingAccount | Pair) => {
        const initialBalance = acc.package_ref?.balance || 1;
        const liveEquity = acc.live_equity || acc.package_ref?.balance || 0;

        // --- Daily Loss Logic ---
        const dailyLossDollar = acc.package_ref?.max_daily_loss || acc.package_ref?.profit_target || 0;
        const dailyLossPercent = dailyLossDollar / initialBalance;
        const dailyEq = acc.daily_starting_equity || acc.package_ref?.balance || 0;
        const dailyFloor = dailyEq * (1 - dailyLossPercent);
        const dailyAllowance = Math.max(0, liveEquity - dailyFloor);

        // --- Total Loss Logic ---
        const totalLossDollar = acc.package_ref?.max_total_loss || 0;
        let totalAllowance = dailyAllowance; // fallback to daily if total not set
        if (totalLossDollar > 0) {
            const totalLossPercent = totalLossDollar / initialBalance;
            const totalFloor = initialBalance * (1 - totalLossPercent);
            totalAllowance = Math.max(0, liveEquity - totalFloor);
        }

        // --- Lowest left to lose ---
        const allowance = Math.min(dailyAllowance, totalAllowance);

        return Number((allowance * 0.96).toFixed(2));
    };

    const recalculateMetrics = (pair: Pair): Pair => {
        const lProfit = pair.sl_ticks;
        const wProfit = pair.tp_ticks;
        const isBuy = pair.trade_type === 'buy';

        return {
            ...pair,
            loss_profit: lProfit,
            win_profit: wProfit,
            loss_price: isBuy ? basePrice - (pair.sl_ticks * multiplier) : basePrice + (pair.sl_ticks * multiplier),
            win_price: isBuy ? basePrice + (pair.tp_ticks * multiplier) : basePrice - (pair.tp_ticks * multiplier),
            loss_balance: pair.starting_equity - lProfit,
            win_balance: pair.starting_equity + wProfit,
        };
    };

    const assignTradeTypesByStartingBalance = (p: Pair[]): Pair[] => {
        if (p.length !== 2) return p;
        const sorted = [...p].sort((a,b) => b.starting_balance - a.starting_balance);
        return p.map(acc => ({
             ...acc,
             trade_type: acc.id === sorted[0].id ? 'buy' : 'sell'
        }));
    };

    const syncSellTpSlFromBuy = (p: Pair[]): Pair[] => {
        if (p.length !== 2) return p;
        const buyIndex = p.findIndex(x => x.trade_type === 'buy');
        const sellIndex = p.findIndex(x => x.trade_type === 'sell');
        if (buyIndex === -1 || sellIndex === -1) return p;

        const newP = [...p];
        const buy = newP[buyIndex];
        const sell = { ...newP[sellIndex] };

        sell.tp_ticks = Number((buy.tp_ticks * 0.98).toFixed(2));
        sell.sl_ticks = Number((buy.sl_ticks * 1.02).toFixed(2));

        newP[sellIndex] = recalculateMetrics(sell);
        return newP;
    };

    // Initialize/Sync pairs when selectedAccounts changes
    React.useEffect(() => {
        if (!isOpen) return

        let primarySL = 0, primaryTP = 0, secondarySL = 0, secondaryTP = 0;

        if (selectedAccounts.length === 2) {
            const primaryAcc = selectedAccounts[0];
            const secondaryAcc = selectedAccounts[1];

            const primarySafeLimit = getAccountSafeLimit(primaryAcc);
            const secondarySafeLimit = getAccountSafeLimit(secondaryAcc);

            const constraintA = primarySafeLimit;
            const constraintB = Number((secondarySafeLimit / 1.02).toFixed(2));

            const finalPrimarySL = Math.min(constraintA, constraintB);

            primarySL = finalPrimarySL;
            primaryTP = finalPrimarySL;
            secondarySL = Number((finalPrimarySL * 1.02).toFixed(2));
            secondaryTP = Number((finalPrimarySL * 0.98).toFixed(2));
        }

        const initialPairs = selectedAccounts.map((account, index) => {
            const type = (selectedAccounts.length === 2 && index === 1) ? 'sell' as const : 'buy' as const
            const isBuy = type === 'buy'
            const isPrimary = index === 0

            const currentEquity = account.live_equity || account.package_ref?.balance || 0
            const dailyStartingEquity = account.daily_starting_equity || account.package_ref?.balance || 0

            let slTicks = 0;
            let tpTicks = 0;

            if (selectedAccounts.length === 2) {
                if (isPrimary) {
                    slTicks = primarySL;
                    tpTicks = primaryTP;
                } else {
                    slTicks = secondarySL;
                    tpTicks = secondaryTP;
                }
            } else {
                const baseValue = getAccountSafeLimit(account);
                slTicks = isPrimary ? baseValue : Number((baseValue * 1.02).toFixed(2));
                tpTicks = isPrimary ? baseValue : Number((baseValue * 0.98).toFixed(2));
            }

            const orderAmount = 0.1

            // Risk is strictly defined by the dynamically allocated ticks (dollar amount)
            const lProfit = slTicks
            const wProfit = tpTicks

            return {
                ...account,
                trade_type: type,
                order_amount: orderAmount,
                sl_ticks: slTicks,
                tp_ticks: tpTicks,
                starting_balance: dailyStartingEquity,
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

        const pairsByBalance = assignTradeTypesByStartingBalance(initialPairs)
        setPairs(syncSellTpSlFromBuy(pairsByBalance))
    }, [selectedAccounts, isOpen, basePrice])

    const updatePair = (id: string, field: keyof Pair, value: any) => {
        setPairs(prev => {
            const index = prev.findIndex(p => p.id === id)
            if (index === -1) return prev

            let updatedPairs = [...prev]
            let newPair = { ...updatedPairs[index], [field]: value }

            // Sync reciprocal fields for the changed pair
            if (field === 'loss_price') {
                newPair.sl_ticks = Math.abs((value - basePrice) / multiplier)
            } else if (field === 'win_price') {
                newPair.tp_ticks = Math.abs((value - basePrice) / multiplier)
            } else if (field === 'symbol') {
                updatedPairs = updatedPairs.map(p => ({ ...p, symbol: value.toUpperCase() }))
                newPair = { ...updatedPairs[index] }
            }

            // Inverse logic for 2 accounts when trade_type changes
            if (field === 'trade_type' && prev.length === 2) {
                const otherIndex = index === 0 ? 1 : 0
                const otherType = value === 'buy' ? 'sell' : 'buy'

                updatedPairs[otherIndex] = {
                    ...updatedPairs[otherIndex],
                    trade_type: otherType,
                }
            }

            // Apply base recalculation to the changed pair first
            updatedPairs[index] = recalculateMetrics(newPair)

            // Now apply the related TP/SL logic if there are 2 accounts
            if (updatedPairs.length === 2 && (field === 'tp_ticks' || field === 'sl_ticks' || field === 'trade_type' || field === 'win_price' || field === 'loss_price')) {
                const editedIndex = index
                const otherIndex = editedIndex === 0 ? 1 : 0

                let editedPair = updatedPairs[editedIndex]
                let otherPair = { ...updatedPairs[otherIndex] }

                const primarySafeLimit = getAccountSafeLimit(editedIndex === 0 ? editedPair : otherPair);
                const secondarySafeLimit = getAccountSafeLimit(editedIndex === 1 ? editedPair : otherPair);

                if (editedIndex === 0) {
                    // We edited the Primary account (Index 0). Secondary (Index 1) gets the worse odds.
                    if (field === 'tp_ticks' || field === 'win_price' || field === 'trade_type') {
                        let potentialTP = editedPair.tp_ticks;
                        if (potentialTP > primarySafeLimit) {
                            potentialTP = primarySafeLimit;
                            editedPair.tp_ticks = potentialTP;
                        }
                        otherPair.tp_ticks = Number((potentialTP * 0.98).toFixed(2))
                    }
                    if (field === 'sl_ticks' || field === 'loss_price' || field === 'trade_type') {
                        let potentialSL = editedPair.sl_ticks;
                        if (potentialSL > primarySafeLimit) {
                            potentialSL = primarySafeLimit;
                        }
                        let theoreticalSecondarySL = Number((potentialSL * 1.02).toFixed(2));
                        if (theoreticalSecondarySL > secondarySafeLimit) {
                            theoreticalSecondarySL = secondarySafeLimit;
                            potentialSL = Number((secondarySafeLimit / 1.02).toFixed(2));
                        }
                        editedPair.sl_ticks = potentialSL;
                        otherPair.sl_ticks = theoreticalSecondarySL;
                    }
                } else {
                    // We edited the Secondary account (Index 1). Primary (Index 0) gets the better odds.
                    if (field === 'tp_ticks' || field === 'win_price' || field === 'trade_type') {
                        let potentialTP = editedPair.tp_ticks;
                        let theoreticalPrimaryTP = Number((potentialTP / 0.98).toFixed(2));
                        if (theoreticalPrimaryTP > primarySafeLimit) {
                            theoreticalPrimaryTP = primarySafeLimit;
                            potentialTP = Number((primarySafeLimit * 0.98).toFixed(2));
                        }
                        editedPair.tp_ticks = potentialTP;
                        otherPair.tp_ticks = theoreticalPrimaryTP;
                    }
                    if (field === 'sl_ticks' || field === 'loss_price' || field === 'trade_type') {
                        let potentialSL = editedPair.sl_ticks;
                        if (potentialSL > secondarySafeLimit) {
                            potentialSL = secondarySafeLimit;
                        }
                        let theoreticalPrimarySL = Number((potentialSL / 1.02).toFixed(2));
                        if (theoreticalPrimarySL > primarySafeLimit) {
                            theoreticalPrimarySL = primarySafeLimit;
                            potentialSL = Number((primarySafeLimit * 1.02).toFixed(2));
                        }
                        editedPair.sl_ticks = potentialSL;
                        otherPair.sl_ticks = theoreticalPrimarySL;
                    }
                }

                updatedPairs[editedIndex] = recalculateMetrics(editedPair)
                updatedPairs[otherIndex] = recalculateMetrics(otherPair)
            } else if (updatedPairs.length === 2 && field !== 'symbol') {
                // Fallback: make sure the other pair is also recalculated if we updated something global like starting equity, order amount, etc
                const otherIndex = index === 0 ? 1 : 0
                updatedPairs[otherIndex] = recalculateMetrics(updatedPairs[otherIndex])
            }

            return updatedPairs
        })
    }

    const handleSuggestDirection = async () => {
        if (pairs.length < 2) return
        
        try {
            setIsSuggesting(true)
            const symbol = pairs[0].symbol || 'XAUUSD'
            
            const res = await fetch(`/api/signal?symbol=${symbol}`)
            const data = await res.json()
            
            if (!res.ok) {
                throw new Error(data.error || 'Failed to fetch suggestion')
            }
            
            if (data.suggestion === 'neutral') {
                toast.info(`Market is neutral for ${symbol}. Trend: ${data.summary}`)
                return
            }
            
            toast.success(`AI Suggestion: ${data.summary}. Applying ${data.suggestion.toUpperCase()} to Primary.`)
            updatePair(pairs[0].id, 'trade_type', data.suggestion)
            
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Error fetching market direction')
        } finally {
            setIsSuggesting(false)
        }
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
            const formatStopLoss = (slTicks: number, platform?: string | null) => {
                // cTrader only accepts negative value in sl of target profit
                return platform?.toLowerCase() === 'ctrader' ? -Math.abs(slTicks) : slTicks;
            }

            const getPlatform = (acc: Pair) => {
                const creds = acc.credentials as any;
                const pkgCreds = (acc.package_ref as any)?.credential || (acc.package_ref as any)?.credentials;
                return creds?.platform || pkgCreds?.platform;
            }

            const payload = {
                primary_account_id: String(primary.id),
                secondary_account_id: String(secondary.id),

                primary: {
                    symbol: String(primary.symbol || "XAUUSD"),
                    order_amount: primary.order_amount,
                    stop_loss: formatStopLoss(primary.sl_ticks, getPlatform(primary)),
                    take_profit: primary.tp_ticks,
                    order_type: primary.trade_type,
                    accounts_id: primary.accounts_id
                },
                secondary: {
                    symbol: String(secondary.symbol || "XAUUSD"),
                    order_amount: secondary.order_amount,
                    stop_loss: formatStopLoss(secondary.sl_ticks, getPlatform(secondary)),
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
                                    <Row label="Total Loss" value={`$${account.loss_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} color="text-[#f6465d]" />
                                    <Row label="Total Profit" value={`$${account.win_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} color="text-[#2ebc66]" />
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
                                        <span className="text-[#4788ff] text-[13px] font-medium">TP</span>
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
                                        <span className="text-[#4788ff] text-[13px] font-medium">SL</span>
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
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="bg-[#2a2e33] hover:bg-[#3a3e43] text-[#848e9c] h-[38px] px-8 rounded-[4px] font-bold text-[13px] border border-[#3a3e43]"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleSuggestDirection}
                            disabled={isSuggesting || isLoading}
                            className="bg-[#1e2329] hover:bg-[#2a2e33] text-[#f0b90b] border-[#f0b90b]/50 hover:border-[#f0b90b] h-[38px] px-5 rounded-[4px] font-bold text-[13px] flex items-center gap-2 transition-colors"
                        >
                            {isSuggesting ? (
                                <div className="w-4 h-4 border-2 border-[#f0b90b]/20 border-t-[#f0b90b] rounded-full animate-spin" />
                            ) : (
                                <span>✨ Auto-Suggest Direction</span>
                            )}
                        </Button>
                    </div>

                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading || isSuggesting}
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
