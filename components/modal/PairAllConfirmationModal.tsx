"use client"

import React, { useState, useEffect } from "react"
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
import { createClient } from "@/lib/supabase/client"
import { PlayCircle, Trash2, ArrowUpDown, RefreshCw, X, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react"

// Types matching the original modal
export type PairConfig = {
    id: string; // Unique temporary ID for the pair row
    primary: TradingAccount;
    secondary: TradingAccount;
    symbol: string;
    primary_order_amount: number;
    primary_order_type: 'buy' | 'sell';
    primary_take_profit: number;
    primary_stop_loss: number;
    secondary_order_amount: number;
    secondary_order_type: 'buy' | 'sell';
    secondary_take_profit: number;
    secondary_stop_loss: number;

    // UI tracking
    isRemoved?: boolean;
    status?: 'idle' | 'running' | 'success' | 'failed';
    errorMsg?: string;
}

interface PairAllConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    proposedPairs: PairConfig[];
    onConfirmAll: () => void;
}

export const PairAllConfirmationModal = ({
    isOpen,
    onClose,
    proposedPairs: initialPairs,
    onConfirmAll
}: PairAllConfirmationModalProps) => {
    const [pairs, setPairs] = useState<PairConfig[]>([])
    const [isExecuting, setIsExecuting] = useState(false)
    const [executionIndex, setExecutionIndex] = useState(-1)
    const [executionProgress, setExecutionProgress] = useState(0)
    const [isSuggestingMap, setIsSuggestingMap] = useState<Record<string, boolean>>({})
    const [isSuggestingAll, setIsSuggestingAll] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setPairs(JSON.parse(JSON.stringify(initialPairs))) // Deep copy
            setIsExecuting(false)
            setExecutionIndex(-1)
            setExecutionProgress(0)
        }
    }, [isOpen, initialPairs])

    const multiplier = 0.01 // Default tick multiplier

    const getAccountSafeLimit = (acc: any) => {
        const parseNum = (val: any, fallback: number) => {
            if (val === undefined || val === null || val === '') return fallback;
            const parsed = parseFloat(String(val).replace(/[^0-9.-]+/g, ""));
            return isNaN(parsed) || parsed <= 0 ? fallback : parsed;
        };

        const liveEquity = parseNum(acc.live_equity ?? acc.package_ref?.balance, 100000);
        const dailyEq = parseNum(acc.daily_starting_equity ?? acc.package_ref?.balance, liveEquity);
        const initialBalance = parseNum(acc.package_ref?.balance, dailyEq);

        const dailyLossDollar = parseNum(acc.package_ref?.max_daily_loss ?? acc.package_ref?.profit_target, 0);
        let dailyLossPercent = 0.05;
        if (dailyLossDollar > 0 && initialBalance > 0) {
            dailyLossPercent = dailyLossDollar / initialBalance;
        }

        const dailyFloor = dailyEq * (1 - dailyLossPercent);
        let dailyAllowance = liveEquity - dailyFloor;

        const totalLossDollar = parseNum(acc.package_ref?.max_total_loss, 0);
        let totalLossPercent = 0.10;
        if (totalLossDollar > 0 && initialBalance > 0) {
            totalLossPercent = totalLossDollar / initialBalance;
        }

        const totalFloor = initialBalance * (1 - totalLossPercent);
        let totalAllowance = liveEquity - totalFloor;

        const consistencyPercent = parseNum(acc.package_ref?.consistency_rule, 0);
        const profitTarget = parseNum(acc.package_ref?.profit_target, 0);
        let consistencyAllowance = Infinity;

        if (consistencyPercent > 0 && profitTarget > 0) {
            const maxDailyProfit = profitTarget * (consistencyPercent / 100);
            const incurredProfit = parseNum(acc.daily_pnl, 0);
            consistencyAllowance = Math.max(0, maxDailyProfit - (incurredProfit > 0 ? incurredProfit : 0));
        }

        if (dailyAllowance <= 0) dailyAllowance = liveEquity * dailyLossPercent;
        if (totalAllowance <= 0) totalAllowance = liveEquity * totalLossPercent;

        const allowance = Math.min(dailyAllowance, totalAllowance, consistencyAllowance);
        return Number((Math.max(0, allowance) * 0.70).toFixed(2));
    };

    const recalculatePairMetrics = (pair: PairConfig): PairConfig => {
        const primaryLimit = getAccountSafeLimit(pair.primary)
        const secondaryLimit = getAccountSafeLimit(pair.secondary)

        const constraintA = primaryLimit;
        const constraintB = Number((secondaryLimit / 1.02).toFixed(2));
        const maxPrimarySL = Math.min(constraintA, constraintB);

        const maxSecondarySL = Number((maxPrimarySL * 1.02).toFixed(2));
        const maxSecondaryTP = Number((maxPrimarySL * 0.98).toFixed(2));

        // Enforce caps
        let finalPrimarySL = pair.primary_stop_loss
        if (finalPrimarySL > maxPrimarySL) finalPrimarySL = maxPrimarySL

        let finalPrimaryTP = pair.primary_take_profit
        if (finalPrimaryTP > maxPrimarySL) finalPrimaryTP = maxPrimarySL

        let finalSecondarySL = pair.secondary_stop_loss
        if (finalSecondarySL > maxSecondarySL) finalSecondarySL = maxSecondarySL

        let finalSecondaryTP = pair.secondary_take_profit
        if (finalSecondaryTP > maxSecondaryTP) finalSecondaryTP = maxSecondaryTP

        return {
            ...pair,
            primary_stop_loss: finalPrimarySL,
            primary_take_profit: finalPrimaryTP,
            secondary_stop_loss: finalSecondarySL,
            secondary_take_profit: finalSecondaryTP
        }
    }

    const updatePairField = (pairId: string, field: string, value: any) => {
        setPairs(prev => prev.map(p => {
            if (p.id !== pairId) return p

            let updated = { ...p }

            if (field === 'symbol') {
                updated.symbol = String(value).toUpperCase()
            } else if (field === 'primary_order_amount') {
                updated.primary_order_amount = Number(value)
            } else if (field === 'secondary_order_amount') {
                updated.secondary_order_amount = Number(value)
            } else if (field === 'primary_take_profit') {
                updated.primary_take_profit = Number(value)
                updated.secondary_take_profit = Number((Number(value) * 0.98).toFixed(2))
            } else if (field === 'primary_stop_loss') {
                updated.primary_stop_loss = Number(value)
                updated.secondary_stop_loss = Number((Number(value) * 1.02).toFixed(2))
            } else if (field === 'secondary_take_profit') {
                updated.secondary_take_profit = Number(value)
                updated.primary_take_profit = Number((Number(value) / 0.98).toFixed(2))
            } else if (field === 'secondary_stop_loss') {
                updated.secondary_stop_loss = Number(value)
                updated.primary_stop_loss = Number((Number(value) / 1.02).toFixed(2))
            } else if (field === 'primary_order_type') {
                updated.primary_order_type = value
                updated.secondary_order_type = value === 'buy' ? 'sell' : 'buy'
            } else if (field === 'secondary_order_type') {
                updated.secondary_order_type = value
                updated.primary_order_type = value === 'buy' ? 'sell' : 'buy'
            }

            return recalculatePairMetrics(updated)
        }))
    }

    const handleSwapPair = (pairId: string) => {
        setPairs(prev => prev.map(p => {
            if (p.id !== pairId) return p
            return {
                ...p,
                primary: p.secondary,
                secondary: p.primary,
                primary_order_type: p.secondary_order_type,
                secondary_order_type: p.primary_order_type,
                primary_order_amount: p.secondary_order_amount,
                secondary_order_amount: p.primary_order_amount,
                primary_take_profit: p.secondary_take_profit,
                secondary_take_profit: p.primary_take_profit,
                primary_stop_loss: p.secondary_stop_loss,
                secondary_stop_loss: p.primary_stop_loss,
            }
        }))
    }

    const handleRemovePair = (pairId: string) => {
        setPairs(prev => prev.filter(p => p.id !== pairId))
    }

    const handleSuggestDirection = async (pairId: string, symbol: string) => {
        setIsSuggestingMap(prev => ({ ...prev, [pairId]: true }))
        try {
            const res = await fetch(`/api/signal?symbol=${symbol || 'XAUUSD'}`)
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || 'Failed to fetch signal')
            }
            if (data.suggestion === 'neutral') {
                toast.info(`Market is neutral for ${symbol}. Reason: ${data.summary}`)
                return
            }

            toast.success(`AI Verdict for ${symbol}: ${data.suggestion.toUpperCase()} (${data.summary})`)
            updatePairField(pairId, 'primary_order_type', data.suggestion)
        } catch (err: any) {
            toast.error(err.message || 'Error fetching signal')
        } finally {
            setIsSuggestingMap(prev => ({ ...prev, [pairId]: false }))
        }
    }

    const handleSuggestAllDirections = async () => {
        setIsSuggestingAll(true)
        toast.loading("Fetching signals for all pairs...", { id: 'suggest-all' })
        try {
            for (const p of activePairs) {
                await handleSuggestDirection(p.id, p.symbol)
            }
            toast.success("Applied AI suggestions to all pairs", { id: 'suggest-all' })
        } catch (err) {
            toast.error("Failed to suggest directions for all pairs", { id: 'suggest-all' })
        } finally {
            setIsSuggestingAll(false)
        }
    }

    const activePairs = pairs.filter(p => !p.isRemoved)

    const executeSequentialPairing = async () => {
        if (activePairs.length === 0) {
            toast.error("No pairings to initiate")
            return
        }

        setIsExecuting(true)
        setExecutionIndex(0)
        setExecutionProgress(0)

        const supabaseForToken = createClient()
        const { data: { session } } = await supabaseForToken.auth.getSession()
        const token = session?.access_token
        const orchestratorUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'https://orchestrator.iaynomrah.cloud'

        let completedCount = 0

        // Execute sequentially
        for (let i = 0; i < activePairs.length; i++) {
            const currentPair = activePairs[i]

            // Skip already succeeded ones (useful if retrying)
            if (currentPair.status === 'success') {
                completedCount++
                setExecutionProgress(Math.round((completedCount / activePairs.length) * 100))
                continue
            }

            setExecutionIndex(i)
            setPairs(prev => prev.map(p => p.id === currentPair.id ? { ...p, status: 'running', errorMsg: undefined } : p))

            try {
                const primary = currentPair.primary
                const secondary = currentPair.secondary

                const unit1Id = primary.accounts?.units?.unit_id
                const unit2Id = secondary.accounts?.units?.unit_id

                if (!unit1Id || !unit2Id) {
                    throw new Error("One or both units are missing a Unit GUID.")
                }

                const formatStopLoss = (slTicks: number, platform?: string | null) => {
                    return platform?.toLowerCase() === 'ctrader' ? -Math.abs(slTicks) : slTicks;
                }

                const getPlatform = (acc: any) => {
                    const creds = Array.isArray(acc.credentials) ? acc.credentials[0] : acc.credentials;
                    const pkgCredsObj = acc.package_ref?.credential || acc.package_ref?.credentials;
                    const pkgCreds = Array.isArray(pkgCredsObj) ? pkgCredsObj[0] : pkgCredsObj;
                    return creds?.platform || pkgCreds?.platform;
                }

                const createRealtimePayload = (acc: any, type: 'buy' | 'sell', amt: number, tp: number, sl: number, operation: string) => {
                    const creds = Array.isArray(acc.credentials) ? acc.credentials[0] : acc.credentials;
                    const pkgCredsObj = acc.package_ref?.credential || acc.package_ref?.credentials;
                    const pkgCreds = Array.isArray(pkgCredsObj) ? pkgCredsObj[0] : pkgCredsObj;
                    const platform = getPlatform(acc);

                    return {
                        event: platform?.toLowerCase() === 'ctrader' ? 'run_ctrader' : (platform?.toLowerCase().includes('mt5') || platform?.toLowerCase().includes('metatrader')) ? 'run_metatrader5' : 'run_tradelocker',
                        payload: {
                            username: creds?.username || pkgCreds?.username || "",
                            password: creds?.password || pkgCreds?.password || "",
                            server: creds?.server || pkgCreds?.server || "",
                            purchase_type: type,
                            order_amount: amt,
                            take_profit: tp,
                            stop_loss: formatStopLoss(sl, platform),
                            account_id: creds?.platform_id || pkgCreds?.platform_id || "",
                            db_account_id: acc.id,
                            symbol: String(currentPair.symbol || "XAUUSD"),
                            operation: operation
                        }
                    }
                }

                const p1Data = createRealtimePayload(primary, currentPair.primary_order_type, currentPair.primary_order_amount, currentPair.primary_take_profit, currentPair.primary_stop_loss, 'input-order')
                const p2Data = createRealtimePayload(secondary, currentPair.secondary_order_type, currentPair.secondary_order_amount, currentPair.secondary_take_profit, currentPair.secondary_stop_loss, 'input-order')

                const payload = {
                    primary_id: primary.id,
                    secondary_id: secondary.id,
                    symbol: currentPair.symbol,
                    primary_order_amount: currentPair.primary_order_amount,
                    primary_order_type: currentPair.primary_order_type,
                    primary_take_profit: currentPair.primary_take_profit,
                    primary_stop_loss: currentPair.primary_stop_loss,
                    secondary_order_amount: currentPair.secondary_order_amount,
                    secondary_order_type: currentPair.secondary_order_type,
                    secondary_take_profit: currentPair.secondary_take_profit,
                    secondary_stop_loss: currentPair.secondary_stop_loss,
                    unit1Id: unit1Id,
                    unit2Id: unit2Id,
                    p1Event: p1Data.event,
                    p1Payload: p1Data.payload,
                    p2Event: p2Data.event,
                    p2Payload: p2Data.payload
                }

                if (p1Data.event === 'run_tradelocker' && (!p1Data.payload.username || !p1Data.payload.password)) {
                    throw new Error(`Primary Account (${primary.funder_account_id || primary.id}) is missing TradeLocker username or password in the database. Please edit the account credentials and ensure they are linked.`);
                }
                if (p2Data.event === 'run_tradelocker' && (!p2Data.payload.username || !p2Data.payload.password)) {
                    throw new Error(`Secondary Account (${secondary.funder_account_id || secondary.id}) is missing TradeLocker username or password in the database. Please edit the account credentials and ensure they are linked.`);
                }
                if (!p1Data.payload.account_id) {
                    throw new Error(`Primary Account (${primary.funder_account_id || primary.id}) is missing Platform ID in the database. Please edit the account credentials and add the Platform ID.`);
                }
                if (!p2Data.payload.account_id) {
                    throw new Error(`Secondary Account (${secondary.funder_account_id || secondary.id}) is missing Platform ID in the database. Please edit the account credentials and add the Platform ID.`);
                }

                const response = await fetch(`${orchestratorUrl}/api/v1/units/pair`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (!response.ok) {
                    const errorMessage = typeof data.error === 'string' ? data.error : data.error?.message;
                    throw new Error(data.message || errorMessage || "Failed to pair via Orchestrator");
                }

                // Succeeded!
                setPairs(prev => prev.map(p => p.id === currentPair.id ? { ...p, status: 'success' } : p))
                completedCount++
            } catch (err: any) {
                console.error(`Error pairing ${currentPair.id}:`, err)
                setPairs(prev => prev.map(p => p.id === currentPair.id ? { ...p, status: 'failed', errorMsg: err.message || "Failed to initiate pairing." } : p))

                // Cleanup DB status on fail
                try {
                    const supabase = createClient();
                    await supabase.from('trading_accounts').update({ account_status: 'idle' }).in('id', [currentPair.primary.id, currentPair.secondary.id])
                } catch (e) { }
            }

            setExecutionProgress(Math.round((completedCount / activePairs.length) * 100))
        }

        const successCount = activePairs.filter(p => p.status === 'success').length + (completedCount - activePairs.filter(p => p.status === 'success').length)
        if (successCount === activePairs.length) {
            toast.success(`Successfully paired all ${activePairs.length} sessions!`)
            onConfirmAll()
        } else {
            const failedCount = activePairs.length - successCount
            toast.warning(`Pairing completed with ${failedCount} failures.`)
        }
        setIsExecuting(false)
        setExecutionIndex(-1)
    }

    const hasFailedPairs = activePairs.some(p => p.status === 'failed')

    return (
        <Dialog open={isOpen} onOpenChange={isExecuting ? () => { } : onClose}>
            <DialogContent className="bg-[#1e2329] border-[#2b3139] text-white max-w-[950px] overflow-hidden flex flex-col max-h-[90vh] p-0 gap-0 shadow-2xl">
                <DialogHeader className="px-6 py-5 border-b border-[#2b3139] bg-[#161a1e]">
                    <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                        Pair All Suggestion Preview
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Review, edit, or remove the generated pairing configurations before starting the sessions.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0b0e11] p-6 space-y-6">
                    {activePairs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <AlertTriangle className="h-10 w-10 text-yellow-500 mb-3" />
                            <p className="font-bold text-sm">No pairs generated or all pairs removed.</p>
                            <p className="text-xs text-muted-foreground mt-1">Adjust filters or close this preview.</p>
                        </div>
                    ) : (
                        activePairs.map((pair, pIdx) => {
                            const isPending = !pair.status || pair.status === 'idle'
                            const isRunning = pair.status === 'running'
                            const isSuccess = pair.status === 'success'
                            const isFailed = pair.status === 'failed'

                            return (
                                <div key={pair.id} className={cn(
                                    "border rounded-xl overflow-hidden bg-[#161a1e] transition-all relative",
                                    isSuccess ? "border-green-500/50 shadow-green-950/20 shadow-lg" :
                                        isFailed ? "border-red-500/50 shadow-red-950/20 shadow-lg" :
                                            isRunning ? "border-blue-500 animate-pulse" : "border-[#2b3139]"
                                )}>
                                    {/* Action Header */}
                                    <div className="px-4 py-2 bg-[#1a1f24] border-b border-[#2b3139] flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-gray-400">Pair #{pIdx + 1}</span>
                                            {isSuccess && <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Staged</span>}
                                            {isFailed && <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Failed</span>}
                                            {isRunning && <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-spin"><RefreshCw className="h-3 w-3" /> Staging...</span>}
                                        </div>

                                        {!isExecuting && isPending && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleSuggestDirection(pair.id, pair.symbol)}
                                                    disabled={isSuggestingMap[pair.id]}
                                                    className="p-1 px-2 text-[10px] font-bold text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500/20 rounded flex items-center gap-1.5 transition-all disabled:opacity-50"
                                                    title="Suggest trade direction from AI signal"
                                                >
                                                    {isSuggestingMap[pair.id] ? (
                                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <RefreshCw className="h-3 w-3" />
                                                    )}
                                                    AI Suggest
                                                </button>
                                                <button
                                                    onClick={() => handleSwapPair(pair.id)}
                                                    className="p-1 px-2 text-[10px] font-bold text-gray-400 hover:text-white bg-[#2a2e33] hover:bg-[#3a3e43] rounded flex items-center gap-1.5 transition-all"
                                                    title="Swap directions (Primary <-> Secondary)"
                                                >
                                                    <ArrowUpDown className="h-3 w-3" /> Swap Direction
                                                </button>
                                                <button
                                                    onClick={() => handleRemovePair(pair.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-all"
                                                    title="Remove pairing"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Grid Content */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#2b3139]">
                                        {/* Primary */}
                                        <div className="flex flex-col">
                                            <div className={cn("px-4 py-2 flex items-center justify-between text-xs font-bold", pair.primary_order_type === 'buy' ? "bg-[#2ebc66]" : "bg-[#cf304a]")}>
                                                <span>{pair.primary.accounts?.units?.unit_name || "UNIT A"} (Primary)</span>
                                                <span className="uppercase tracking-wide font-black">{pair.primary_order_type}</span>
                                            </div>
                                            <div className="p-4 space-y-3">
                                                <div className="flex items-center justify-between text-xs text-[#848e9c]">
                                                    <span>Funder:</span>
                                                    <span className="font-bold text-white">{pair.primary.package_ref?.funders?.allias || pair.primary.funder || "UPFT"}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-[#848e9c]">
                                                    <span>Phase:</span>
                                                    <span className="font-bold text-white">{pair.primary.package_ref?.phase || "Standard"}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-[#848e9c]">
                                                    <span>Daily PnL:</span>
                                                    <span className={cn("font-bold", (pair.primary.daily_pnl || 0) >= 0 ? "text-[#2ebc66]" : "text-[#f6465d]")}>
                                                        ${(pair.primary.daily_pnl || 0).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-[#848e9c]">
                                                    <span>Order Amount:</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        disabled={isExecuting || !isPending}
                                                        value={pair.primary_order_amount}
                                                        onChange={(e) => updatePairField(pair.id, 'primary_order_amount', e.target.value)}
                                                        className="bg-[#0b0e11] border border-[#2b3139] text-white rounded text-right px-2 py-0.5 text-xs font-bold w-20 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-[#848e9c]">
                                                    <span>TP (ticks):</span>
                                                    <input
                                                        type="number"
                                                        disabled={isExecuting || !isPending}
                                                        value={pair.primary_take_profit}
                                                        onChange={(e) => updatePairField(pair.id, 'primary_take_profit', e.target.value)}
                                                        className="bg-[#0b0e11] border border-[#2b3139] text-white rounded text-right px-2 py-0.5 text-xs font-bold w-20 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-[#848e9c]">
                                                    <span>SL (ticks):</span>
                                                    <input
                                                        type="number"
                                                        disabled={isExecuting || !isPending}
                                                        value={pair.primary_stop_loss}
                                                        onChange={(e) => updatePairField(pair.id, 'primary_stop_loss', e.target.value)}
                                                        className="bg-[#0b0e11] border border-[#2b3139] text-white rounded text-right px-2 py-0.5 text-xs font-bold w-20 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Secondary */}
                                        <div className="flex flex-col">
                                            <div className={cn("px-4 py-2 flex items-center justify-between text-xs font-bold", pair.secondary_order_type === 'buy' ? "bg-[#2ebc66]" : "bg-[#cf304a]")}>
                                                <span>{pair.secondary.accounts?.units?.unit_name || "UNIT B"} (Secondary)</span>
                                                <span className="uppercase tracking-wide font-black">{pair.secondary_order_type}</span>
                                            </div>
                                            <div className="p-4 space-y-3">
                                                <div className="flex items-center justify-between text-xs text-[#848e9c]">
                                                    <span>Funder:</span>
                                                    <span className="font-bold text-white">{pair.secondary.package_ref?.funders?.allias || pair.secondary.funder || "UPFT"}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-[#848e9c]">
                                                    <span>Phase:</span>
                                                    <span className="font-bold text-white">{pair.secondary.package_ref?.phase || "Standard"}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-[#848e9c]">
                                                    <span>Daily PnL:</span>
                                                    <span className={cn("font-bold", (pair.secondary.daily_pnl || 0) >= 0 ? "text-[#2ebc66]" : "text-[#f6465d]")}>
                                                        ${(pair.secondary.daily_pnl || 0).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-[#848e9c]">
                                                    <span>Order Amount:</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        disabled={isExecuting || !isPending}
                                                        value={pair.secondary_order_amount}
                                                        onChange={(e) => updatePairField(pair.id, 'secondary_order_amount', e.target.value)}
                                                        className="bg-[#0b0e11] border border-[#2b3139] text-white rounded text-right px-2 py-0.5 text-xs font-bold w-20 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-[#848e9c]">
                                                    <span>TP (ticks):</span>
                                                    <input
                                                        type="number"
                                                        disabled={isExecuting || !isPending}
                                                        value={pair.secondary_take_profit}
                                                        onChange={(e) => updatePairField(pair.id, 'secondary_take_profit', e.target.value)}
                                                        className="bg-[#0b0e11] border border-[#2b3139] text-white rounded text-right px-2 py-0.5 text-xs font-bold w-20 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-[#848e9c]">
                                                    <span>SL (ticks):</span>
                                                    <input
                                                        type="number"
                                                        disabled={isExecuting || !isPending}
                                                        value={pair.secondary_stop_loss}
                                                        onChange={(e) => updatePairField(pair.id, 'secondary_stop_loss', e.target.value)}
                                                        className="bg-[#0b0e11] border border-[#2b3139] text-white rounded text-right px-2 py-0.5 text-xs font-bold w-20 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Symbol & Global Row */}
                                    <div className="px-4 py-3 bg-[#13171b] border-t border-[#2b3139] flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="text-gray-400">Instrument:</span>
                                            <input
                                                type="text"
                                                disabled={isExecuting || !isPending}
                                                value={pair.symbol}
                                                onChange={(e) => updatePairField(pair.id, 'symbol', e.target.value)}
                                                className="bg-[#0b0e11] border border-[#2b3139] text-white rounded px-2 py-0.5 text-xs font-bold w-24 uppercase focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                            />
                                        </div>
                                        <div className="flex items-center gap-6 text-[11px] text-gray-400">
                                            <span>Est. Profit: <strong className="text-[#2ebc66]">${pair.primary_take_profit.toLocaleString()}</strong></span>
                                            <span>Est. Loss: <strong className="text-[#f6465d]">${pair.primary_stop_loss.toLocaleString()}</strong></span>
                                        </div>
                                    </div>

                                    {/* Error Console */}
                                    {isFailed && pair.errorMsg && (
                                        <div className="bg-red-950/20 text-red-400 px-4 py-2 text-xs font-mono border-t border-red-900/50">
                                            ⚠️ Error: {pair.errorMsg}
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Progress bar when executing */}
                {isExecuting && (
                    <div className="w-full bg-[#0b0e11] px-6 py-3 border-t border-[#2b3139]">
                        <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                            <span>Processing pairings...</span>
                            <span>{executionProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${executionProgress}%` }} />
                        </div>
                    </div>
                )}

                <DialogFooter className="px-6 py-4 bg-[#161a1e] border-t border-[#2b3139] flex items-center justify-between sm:justify-between w-full">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            disabled={isExecuting}
                            className="bg-[#2a2e33] hover:bg-[#3a3e43] text-[#848e9c] h-[38px] px-6 rounded-[4px] font-bold text-xs border border-[#3a3e43] disabled:opacity-50"
                        >
                            Cancel
                        </Button>

                        {!isExecuting && activePairs.some(p => !p.status || p.status === 'idle') && (
                            <Button
                                variant="outline"
                                onClick={handleSuggestAllDirections}
                                disabled={isSuggestingAll}
                                className="bg-[#1e2329] hover:bg-[#2a2e33] text-[#f0b90b] border-[#f0b90b]/50 hover:border-[#f0b90b] h-[38px] px-4 rounded-[4px] font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                            >
                                {isSuggestingAll ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-4 w-4" />
                                )}
                                Auto-Suggest Directions
                            </Button>
                        )}
                    </div>

                    <Button
                        onClick={executeSequentialPairing}
                        disabled={isExecuting || activePairs.length === 0 || (activePairs.every(p => p.status === 'success'))}
                        className={cn(
                            "text-white h-[38px] px-6 rounded-[4px] font-bold text-xs flex items-center gap-2 disabled:opacity-50 min-w-[150px]",
                            hasFailedPairs ? "bg-yellow-600 hover:bg-yellow-500" : "bg-blue-600 hover:bg-blue-500"
                        )}
                    >
                        {isExecuting ? (
                            <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                <span>Pairing...</span>
                            </>
                        ) : hasFailedPairs ? (
                            <>
                                <PlayCircle className="h-4 w-4" />
                                <span>Retry Failed Pairs</span>
                            </>
                        ) : (
                            <>
                                <PlayCircle className="h-4 w-4" />
                                <span>Confirm & Pair All</span>
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
