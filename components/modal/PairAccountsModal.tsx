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
import { broadcastToUnit } from "@/helper/realtime"
import { deletePairedAccount, updatePairedAccount } from "@/helper/paired_accounts"
import { createClient } from "@/lib/supabase/client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Row from "@/components/ui/row"
import PlayIcon from "@/components/ui/playicon"

import { TradeStatus } from "@/types/paired"
import Swal from "sweetalert2"

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
    sl_type: 'price' | 'dollar'
    tp_type: 'price' | 'dollar'

    // Calculated fields for UI
    loss_profit: number
    win_profit: number
    loss_balance: number
    win_balance: number
    loss_price: number
    win_price: number
}

type StrategyCheck = {
    status: 'idle' | 'checking' | 'done' | 'error'
    allowed?: boolean
    reason?: string
    score?: number | null
    swap?: boolean
    hedge?: { order_amount: number; stop_loss: number; take_profit: number } | null
    triggerPct?: number | null
    testModeAvailable?: boolean
}

type QuoteResult = {
    price?: number
    sl?: number
    tp?: number
    sl_points?: number
    tp_points?: number
    valid?: boolean
    adjustments?: { field: string; from: number; to: number }[]
    clearance_reason?: string | null
    min_stop_points?: number
    min_stop_distance?: number
    error?: string
    unsupported?: boolean
}

// Compact visual "ruler": current price, SL/TP markers, and the broker's
// minimum-stop zone shaded around price, so you can see at a glance whether a
// stop is sitting inside the zone that would get it auto-adjusted or rejected.
//
// `livePrice` comes from a fast, local-worker-independent market feed (polled
// every ~2s) and drives the moving price marker between the slower authoritative
// checks against the actual MT5 terminal (which alone knows the broker's real
// minimum-stop rule, min_stop_distance). SL/TP are re-anchored to livePrice by
// preserving their fixed offset from the last authoritative price, since a
// dollar-risk stop's distance from entry doesn't change with price — only its
// absolute level does, once "entry" itself is wherever price is right now.
function LiveQuoteRuler({ quote, hasSl, hasTp, livePrice }: { quote: QuoteResult; hasSl: boolean; hasTp: boolean; livePrice?: number }) {
    if (quote.price === undefined) return null

    const anchorPrice = quote.price
    const price = livePrice ?? anchorPrice
    const slOffset = hasSl && quote.sl !== undefined ? anchorPrice - quote.sl : undefined
    const tpOffset = hasTp && quote.tp !== undefined ? quote.tp - anchorPrice : undefined
    const sl = slOffset !== undefined ? price - slOffset : undefined
    const tp = tpOffset !== undefined ? price + tpOffset : undefined
    const minDist = quote.min_stop_distance ?? 0
    const isLive = livePrice !== undefined

    // Live re-check of "is this stop inside the too-close zone right now" — a
    // simple distance comparison, not the full tolerance/auto-widen logic (that
    // stays server-side); this is a fast-moving estimate, the badge below the
    // ruler is still the authoritative last-checked verdict.
    const slInZone = sl !== undefined && minDist > 0 && Math.abs(price - sl) < minDist
    const tpInZone = tp !== undefined && minDist > 0 && Math.abs(price - tp) < minDist

    const candidateDistances = [
        minDist,
        sl !== undefined ? Math.abs(price - sl) : 0,
        tp !== undefined ? Math.abs(price - tp) : 0,
    ]
    // Guarantee a sane minimum span so the ruler never collapses to zero width
    // when SL/TP aren't set yet.
    const maxDistance = Math.max(...candidateDistances, price * 0.0005)
    const halfSpan = maxDistance * 1.25
    const rangeMin = price - halfSpan
    const rangeMax = price + halfSpan

    const toPercent = (value: number) => {
        const pct = ((value - rangeMin) / (rangeMax - rangeMin)) * 100
        return Math.max(0, Math.min(100, pct))
    }

    const zoneLeftPct = toPercent(price - minDist)
    const zoneRightPct = toPercent(price + minDist)

    return (
        <div className="px-4 pt-2">
            <div className="relative h-6 rounded bg-[#0b0e11] border border-[#2b3139] overflow-hidden">
                {minDist > 0 && (
                    <div
                        className="absolute top-0 bottom-0 bg-[#f6465d]/15 border-x border-[#f6465d]/30"
                        style={{ left: `${zoneLeftPct}%`, width: `${Math.max(0, zoneRightPct - zoneLeftPct)}%` }}
                        title="Broker minimum-stop zone — a stop inside here gets auto-adjusted or rejected"
                    />
                )}
                <div className={cn("absolute top-0 bottom-0 w-[2px] bg-white", isLive && "transition-[left] duration-500 ease-linear")} style={{ left: `${toPercent(price)}%` }} title={`Price: ${price}`} />
                {sl !== undefined && (
                    <div className={cn("absolute top-0 bottom-0 w-[2px] bg-[#f6465d]", slInZone && "animate-pulse")} style={{ left: `${toPercent(sl)}%` }} title={`SL: ${sl}${slInZone ? ' — inside minimum-stop zone' : ''}`} />
                )}
                {tp !== undefined && (
                    <div className={cn("absolute top-0 bottom-0 w-[2px] bg-[#2ebc66]", tpInZone && "animate-pulse")} style={{ left: `${toPercent(tp)}%` }} title={`TP: ${tp}${tpInZone ? ' — inside minimum-stop zone' : ''}`} />
                )}
            </div>
            <div className="flex justify-between text-[9px] mt-0.5">
                <span className="text-[#f6465d] flex items-center gap-1">{sl !== undefined && <><span className={cn("w-1.5 h-1.5 rounded-full bg-[#f6465d]", slInZone && "animate-pulse")} />SL {sl.toFixed(2)}</>}</span>
                <span className="text-white font-mono flex items-center gap-1">
                    {isLive && <span className="w-1.5 h-1.5 rounded-full bg-[#2ebc66] animate-pulse" title="Live price feed" />}
                    {price.toFixed(2)}
                </span>
                <span className="text-[#2ebc66] flex items-center gap-1">{tp !== undefined && <><span className={cn("w-1.5 h-1.5 rounded-full bg-[#2ebc66]", tpInZone && "animate-pulse")} />TP {tp.toFixed(2)}</>}</span>
            </div>
        </div>
    )
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
}: PairAccountsModalProps): React.JSX.Element | null => {
    const [basePrice, setBasePrice] = React.useState<number>(2000)
    const [pairs, setPairs] = React.useState<Pair[]>([])
    const [isLoading, setIsLoading] = React.useState(false)
    const [isSuggesting, setIsSuggesting] = React.useState(false)
    // The AI signal applied to the primary, sent with the pair so the trade links to its recorded explanation
    const [aiSignal, setAiSignal] = React.useState<{ id: string; direction: 'buy' | 'sell' } | null>(null)
    const [livePrice, setLivePrice] = React.useState<number | undefined>(undefined)
    const autoSuggestAttempted = React.useRef(false)
    // SL distance for a ~4-8h trade at current volatility; the lot is sized from it once, then editable
    const [sizing, setSizing] = React.useState<{ distance: number; source: 'mt5' | 'atr' } | null>(null)
    const lotAutoApplied = React.useRef(false)
    // XAUUSD: $ per 1.00 price move per 1.0 lot. Must match the local server's
    // calculate_price() (tick_value / tick_size = 1.0 / 0.01), which converts
    // dollar SL/TP into price levels when the order is actually placed.
    const CONTRACT_SIZE = 100
    // Auto-sized lots never go above this; a bigger lot would mean a closer SL (faster trade), not more risk
    const MAX_AUTO_LOT = 0.3

    // Lot that puts the primary's dollar SL at the 4-8h distance (nearest 0.01; the $ risk
    // stays as set either way, rounding only moves the SL slightly closer or further)
    const suggestLot = (slDollars: number, distance: number) => {
        const raw = slDollars / (distance * CONTRACT_SIZE)
        const lot = Math.max(0.01, Math.min(MAX_AUTO_LOT, Math.round(raw * 100) / 100))
        return { lot, capped: raw > MAX_AUTO_LOT }
    }

    // Price level an SL/TP lands at. Dollar mode = risk in $ for this lot size;
    // price mode = the value already is the literal price level.
    const levelFor = (p: Pair, value: number, isTp: boolean, entry: number) => {
        const mode = isTp ? p.tp_type : p.sl_type
        if (mode === 'price') return value
        const distance = value / (CONTRACT_SIZE * (Number(p.order_amount) || 0.01))
        const up = (p.trade_type === 'buy') === isTp
        return up ? entry + distance : entry - distance
    }

    const getAccountSafeLimit = (acc: TradingAccount | Pair) => {
        const p = acc as Pair;
        const parseNum = (val: any, fallback: number) => {
            if (val === undefined || val === null || val === '') return fallback;
            const parsed = parseFloat(String(val).replace(/[^0-9.-]+/g, ""));
            return isNaN(parsed) || parsed <= 0 ? fallback : parsed;
        };

        // Aggressively parse equity to fallback chains
        const liveEquity = parseNum(p.starting_equity ?? acc.live_equity ?? acc.package_ref?.balance, 100000);
        const dailyEq = parseNum(p.starting_balance ?? acc.daily_starting_equity ?? acc.package_ref?.balance, liveEquity);
        const initialBalance = parseNum(acc.package_ref?.balance, dailyEq);

        // Daily Constraint
        const dailyLossDollar = parseNum(acc.package_ref?.max_daily_loss ?? acc.package_ref?.profit_target, 0);
        let dailyLossPercent = 0.05;
        if (dailyLossDollar > 0 && initialBalance > 0) {
            dailyLossPercent = dailyLossDollar / initialBalance;
        }

        const dailyFloor = dailyEq * (1 - dailyLossPercent);
        let dailyAllowance = liveEquity - dailyFloor;

        // Total Constraint
        const totalLossDollar = parseNum(acc.package_ref?.max_total_loss, 0);
        let totalLossPercent = 0.10;
        if (totalLossDollar > 0 && initialBalance > 0) {
            totalLossPercent = totalLossDollar / initialBalance;
        }

        const totalFloor = initialBalance * (1 - totalLossPercent);
        let totalAllowance = liveEquity - totalFloor;

        // Consistency Constraint
        const consistencyPercent = parseNum(acc.package_ref?.consistency_rule, 0); // e.g. 40
        const profitTarget = parseNum(acc.package_ref?.profit_target, 0);
        let consistencyAllowance = Infinity;

        if (consistencyPercent > 0 && profitTarget > 0) {
            // Absolute maximum profit allowed in a single day to pass consistency rule
            const maxDailyProfit = profitTarget * (consistencyPercent / 100);

            // Subtract profit already made today to find remaining allowance
            const incurredProfit = parseNum(p.daily_pnl ?? acc.daily_pnl, 0);
            consistencyAllowance = Math.max(0, maxDailyProfit - (incurredProfit > 0 ? incurredProfit : 0));
        }

        // Sanity check: prevent mathematically returning 0 if the values are identical due to testing quirks
        if (dailyAllowance <= 0) dailyAllowance = liveEquity * dailyLossPercent;
        if (totalAllowance <= 0) totalAllowance = liveEquity * totalLossPercent;

        // Take the smallest allowed risk based on all constraints
        const allowance = Math.min(dailyAllowance, totalAllowance, consistencyAllowance);
        return Number((Math.max(0, allowance) * 0.70).toFixed(2));
    };

    const recalculateMetrics = (pair: Pair): Pair => {
        const lProfit = pair.sl_ticks;
        const wProfit = pair.tp_ticks;

        return {
            ...pair,
            loss_profit: lProfit,
            win_profit: wProfit,
            loss_price: levelFor(pair, pair.sl_ticks, false, basePrice),
            win_price: levelFor(pair, pair.tp_ticks, true, basePrice),
            loss_balance: pair.starting_equity - lProfit,
            win_balance: pair.starting_equity + wProfit,
        };
    };

    const assignTradeTypesByStartingBalance = (p: Pair[]): Pair[] => {
        if (p.length !== 2) return p;
        const sorted = [...p].sort((a, b) => b.starting_balance - a.starting_balance);
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
        if (!isOpen || selectedAccounts.length < 2) return

        // Shared calculation for the pair
        const acc1 = selectedAccounts[0]
        const acc2 = selectedAccounts[1]

        const getAccMetrics = (acc: TradingAccount) => {
            const pkg = acc.package_ref
            const target = acc.remaining_target_profit || pkg?.profit_target || 1000
            const dailyLimit = pkg?.max_daily_loss || 5000
            const incurredLoss = acc.daily_pnl || 0
            const remainingDailyLoss = Math.max(0, dailyLimit + incurredLoss)
            return { target, remainingDailyLoss }
        }

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
                symbol: "XAUUSD", // Forced to XAUUSD
                sl_type: 'dollar',
                tp_type: 'dollar',

                loss_profit: lProfit,
                win_profit: wProfit,
                loss_price: isBuy ? basePrice - slTicks / (CONTRACT_SIZE * orderAmount) : basePrice + slTicks / (CONTRACT_SIZE * orderAmount),
                win_price: isBuy ? basePrice + tpTicks / (CONTRACT_SIZE * orderAmount) : basePrice - tpTicks / (CONTRACT_SIZE * orderAmount),
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
                newPair.sl_ticks = Math.abs(value - basePrice) * CONTRACT_SIZE * (Number(newPair.order_amount) || 0.01)
            } else if (field === 'win_price') {
                newPair.tp_ticks = Math.abs(value - basePrice) * CONTRACT_SIZE * (Number(newPair.order_amount) || 0.01)
            } else if (field === 'symbol') {
                updatedPairs = updatedPairs.map(p => ({ ...p, symbol: value.toUpperCase() }))
                newPair = { ...updatedPairs[index] }
            } else if (field === 'order_amount') {
                updatedPairs = updatedPairs.map(p => ({ ...p, order_amount: value }))
                newPair = { ...updatedPairs[index] }
            } else if (field === 'tp_type' || field === 'sl_type') {
                updatedPairs = updatedPairs.map(p => ({ ...p, tp_type: value, sl_type: value }))
                newPair = { ...updatedPairs[index] }
            }

            // Inverse logic for 2 accounts when trade_type changes
            if (field === 'trade_type') {
                const otherIndex = index === 0 ? 1 : 0
                const otherType = value === 'buy' ? 'sell' : 'buy'

                // SAFEGUARD: If they are in Price mode and switch direction, their typed prices are mathematically invalid for the new direction.
                // Revert all to dollar mode and reset to safe limits.
                if (updatedPairs[0].sl_type === 'price' || updatedPairs[0].tp_type === 'price') {
                    updatedPairs = updatedPairs.map((p, idx) => {
                        const safeLimit = getAccountSafeLimit(p)
                        const sl = idx === 0 ? safeLimit : Number((safeLimit * 1.02).toFixed(2))
                        const tp = idx === 0 ? safeLimit : Number((safeLimit * 0.98).toFixed(2))
                        
                        return {
                            ...p,
                            sl_type: 'dollar',
                            tp_type: 'dollar',
                            sl_ticks: sl,
                            tp_ticks: tp
                        }
                    })
                    toast.info("Switched back to Dollar mode to protect against invalid Price levels for the new direction.")
                }

                if (prev.length === 2) {
                    updatedPairs[otherIndex] = {
                        ...updatedPairs[otherIndex],
                        trade_type: otherType,
                    }
                }
                
                // Re-fetch editedPair after potential safeguard override, but preserve the new trade_type
                newPair = { ...updatedPairs[index], trade_type: value }
            }

            // Apply base recalculation to the changed pair first
            updatedPairs[index] = recalculateMetrics(newPair)

            // Now apply the related TP/SL logic if there are 2 accounts
            if (updatedPairs.length === 2 && (field === 'tp_ticks' || field === 'sl_ticks' || field === 'trade_type' || field === 'win_price' || field === 'loss_price')) {
                const editedIndex = index
                const otherIndex = editedIndex === 0 ? 1 : 0

                let editedPair = updatedPairs[editedIndex]
                let otherPair = { ...updatedPairs[otherIndex] }

                // If in Price mode, bypass auto-capping and cross-account ratio syncing (since values are literal market prices, not distances).
                if (editedPair.sl_type === 'price' || editedPair.tp_type === 'price') {
                    updatedPairs[editedIndex] = recalculateMetrics(editedPair)
                    updatedPairs[otherIndex] = recalculateMetrics(otherPair)
                    return updatedPairs
                }

                const primarySafeLimit = getAccountSafeLimit(editedIndex === 0 ? editedPair : otherPair);
                const secondarySafeLimit = getAccountSafeLimit(editedIndex === 1 ? editedPair : otherPair);

                const constraintA = primarySafeLimit;
                const constraintB = Number((secondarySafeLimit / 1.02).toFixed(2));
                const maxPrimarySL = Math.min(constraintA, constraintB);

                const maxSecondarySL = Number((maxPrimarySL * 1.02).toFixed(2));
                const maxSecondaryTP = Number((maxPrimarySL * 0.98).toFixed(2));

                if (editedIndex === 0) {
                    // We edited the Primary account (Index 0). Secondary (Index 1) gets the worse odds.
                    if (field === 'tp_ticks' || field === 'win_price' || field === 'trade_type') {
                        let potentialTP = editedPair.tp_ticks;
                        if (potentialTP > maxPrimarySL) {
                            potentialTP = maxPrimarySL;
                        }
                        editedPair.tp_ticks = potentialTP;
                        otherPair.tp_ticks = Number((potentialTP * 0.98).toFixed(2));
                    }
                    if (field === 'sl_ticks' || field === 'loss_price' || field === 'trade_type') {
                        let potentialSL = editedPair.sl_ticks;
                        if (potentialSL > maxPrimarySL) {
                            potentialSL = maxPrimarySL;
                        }
                        editedPair.sl_ticks = potentialSL;
                        otherPair.sl_ticks = Number((potentialSL * 1.02).toFixed(2));
                    }
                    if (field === 'trade_type') {
                        otherPair.trade_type = editedPair.trade_type === 'buy' ? 'sell' : 'buy';
                    }
                } else {
                    // We edited the Secondary account (Index 1). Primary (Index 0) gets the better odds.
                    if (field === 'tp_ticks' || field === 'win_price' || field === 'trade_type') {
                        let potentialTP = editedPair.tp_ticks;
                        if (potentialTP > maxSecondaryTP) {
                            potentialTP = maxSecondaryTP;
                        }
                        editedPair.tp_ticks = potentialTP;
                        otherPair.tp_ticks = Number((potentialTP / 0.98).toFixed(2));
                    }
                    if (field === 'sl_ticks' || field === 'loss_price' || field === 'trade_type') {
                        let potentialSL = editedPair.sl_ticks;
                        if (potentialSL > maxSecondarySL) {
                            potentialSL = maxSecondarySL;
                        }
                        editedPair.sl_ticks = potentialSL;
                        otherPair.sl_ticks = Number((potentialSL / 1.02).toFixed(2));
                    }
                    if (field === 'trade_type') {
                        otherPair.trade_type = editedPair.trade_type === 'buy' ? 'sell' : 'buy';
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

    const handleSuggestDirection = async (isAuto = false) => {
        if (pairs.length < 2) return

        try {
            if (isAuto) {
                const lastCalled = localStorage.getItem('ai_signal_last_called')
                if (lastCalled) {
                    const elapsed = Date.now() - parseInt(lastCalled)
                    // 30 minutes in ms = 30 * 60 * 1000 = 1800000
                    if (elapsed < 1800000) {
                        return // Skip auto suggestion, cooldown active
                    }
                }
            }

            setIsSuggesting(true)
            const symbol = pairs[0].symbol || 'XAUUSD'

            const res = await fetch(`/api/signal?symbol=${symbol}`)
            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to fetch suggestion')
            }

            if (data.suggestion === 'neutral') {
                if (!isAuto) toast.info(`Market is neutral for ${symbol}. Trend: ${data.summary}`)
                return
            }

            toast.success(`AI Suggestion: ${data.summary}. Applying ${data.suggestion.toUpperCase()} to Primary.`)
            updatePair(pairs[0].id, 'trade_type', data.suggestion.toLowerCase() as 'buy' | 'sell')
            setAiSignal(data.signal_id ? { id: data.signal_id, direction: data.suggestion.toLowerCase() } : null)

            // When the S/R rule picks the delayed hedge, use the trade it was tested with
            // (0.03 lot, $40 stop, TP = the S/R range); otherwise the direction is all that
            // changes and the account's dollar SL/TP stay
            const rule = data.data
            if (rule?.passed && rule.suggested_sl_dollars > 0 && rule.suggested_tp_dollars > 0) {
                updatePair(pairs[0].id, 'sl_type', 'dollar')
                updatePair(pairs[0].id, 'tp_type', 'dollar')
                updatePair(pairs[0].id, 'sl_ticks', rule.suggested_sl_dollars)
                updatePair(pairs[0].id, 'tp_ticks', rule.suggested_tp_dollars)
                toast.info(`Delayed hedge setup: ${rule.suggested_lot} lot, SL $${rule.suggested_sl_dollars}, TP $${rule.suggested_tp_dollars}`)
            } else if (rule?.skip_reason) {
                toast.info(`Normal hedge today: ${rule.skip_reason}`)
            }

            // The lot is re-sized from the signal's SL distance (the rule's $40 gives 0.03 at a $120 SL)
            const distance = Number(data.data?.suggested_sl_distance)
            if (distance > 0) {
                lotAutoApplied.current = false
                setSizing({ distance, source: 'mt5' })
            }
            localStorage.setItem('ai_signal_last_called', Date.now().toString())

        } catch (error: any) {
            console.error(error)
            if (!isAuto) toast.error(error.message || 'Error fetching market direction')
        } finally {
            setIsSuggesting(false)
        }
    }

    const formatStopLoss = (slTicks: number, platform?: string | null) => {
        // cTrader only accepts negative value in sl of target profit
        return platform?.toLowerCase() === 'ctrader' ? -Math.abs(slTicks) : slTicks;
    }

    const getPlatform = (acc: Pair) => {
        const creds = Array.isArray(acc.credentials) ? acc.credentials[0] : (acc.credentials as any);
        const pkgCredsObj = (acc.package_ref as any)?.credential || (acc.package_ref as any)?.credentials;
        const pkgCreds = Array.isArray(pkgCredsObj) ? pkgCredsObj[0] : pkgCredsObj;
        return creds?.platform || pkgCreds?.platform;
    }

    const createRealtimePayload = (acc: Pair, operation: string) => {
        const creds = Array.isArray(acc.credentials) ? acc.credentials[0] : (acc.credentials as any);
        const pkgCredsObj = (acc.package_ref as any)?.credential || (acc.package_ref as any)?.credentials;
        const pkgCreds = Array.isArray(pkgCredsObj) ? pkgCredsObj[0] : pkgCredsObj;
        const platform = getPlatform(acc);

        return {
            event: platform?.toLowerCase() === 'ctrader' ? 'run_ctrader' : (platform?.toLowerCase().includes('mt5') || platform?.toLowerCase().includes('metatrader')) ? 'run_metatrader5' : 'run_tradelocker',
            payload: {
                username: creds?.username || pkgCreds?.username || "",
                password: creds?.password || pkgCreds?.password || "",
                server: creds?.server || pkgCreds?.server || "",
                purchase_type: acc.trade_type,
                order_amount: acc.order_amount,
                take_profit: acc.tp_ticks,
                stop_loss: formatStopLoss(acc.sl_ticks, platform),
                account_id: creds?.platform_id || pkgCreds?.platform_id || "",
                db_account_id: acc.id,
                symbol: String(acc.symbol || "XAUUSD"),
                sl_type: acc.sl_type || 'dollar',
                tp_type: acc.tp_type || 'dollar',
                operation: operation
            }
        }
    }

    // SL distance for a ~4-8h trade (MT5 volatility, or 1.5x ATR when that's stale). No AI call.
    const fetchSizing = async (symbol: string) => {
        try {
            const orchestratorUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'https://orchestrator.iaynomrah.cloud';
            const res = await fetch(`${orchestratorUrl}/api/v1/market/volatility?symbol=${symbol}`);
            if (!res.ok) return;
            const data = await res.json();
            if (Number(data.sl_distance) > 0) setSizing({ distance: Number(data.sl_distance), source: data.source })
        } catch (error) {
            console.error('Failed to fetch volatility for lot sizing:', error);
        }
    };

    // A signal belongs to the accounts it was applied to; never carry it over to another pairing
    React.useEffect(() => {
        setAiSignal(null)
        setSizing(null)
        lotAutoApplied.current = false
    }, [selectedAccounts])

    React.useEffect(() => {
        if (isOpen && pairs.length === 2 && !autoSuggestAttempted.current) {
            autoSuggestAttempted.current = true
            handleSuggestDirection(true)
        }
    }, [isOpen, pairs.length])

    // Fields reset on every open, so size the lot again from fresh volatility each time
    React.useEffect(() => {
        if (!isOpen) return
        lotAutoApplied.current = false
        fetchSizing('XAUUSD')
    }, [isOpen])

    // Fill the lot once per sizing (opening the modal, or a new AI signal); edits after that stay
    React.useEffect(() => {
        if (!isOpen || !sizing || lotAutoApplied.current || pairs.length !== 2) return
        if (pairs[0].sl_type !== 'dollar' || !(pairs[0].sl_ticks > 0)) return
        lotAutoApplied.current = true
        updatePair(pairs[0].id, 'order_amount', suggestLot(pairs[0].sl_ticks, sizing.distance).lot)
    }, [isOpen, sizing, pairs.length, pairs[0]?.sl_ticks])

    const lotSuggestion = sizing && pairs.length === 2 && pairs[0].sl_type === 'dollar' && pairs[0].sl_ticks > 0
        ? { ...suggestLot(pairs[0].sl_ticks, sizing.distance), distance: sizing.distance, source: sizing.source }
        : null

    // Fast live price polling via Supabase Realtime (independent of authoritative quotes)
    React.useEffect(() => {
        if (!isOpen || pairs.length === 0) {
            setLivePrice(undefined)
            return
        }

        const supabase = createClient()
        const expectedSymbol = pairs[0]?.symbol || 'XAUUSD'

        const channel = supabase.channel('market-data')
            .on('broadcast', { event: 'price-update' }, (payload: any) => {
                if (payload.payload?.symbol === expectedSymbol) {
                    setLivePrice(Number(payload.payload.price))
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [isOpen, pairs[0]?.symbol])

    // removed pre-trade quote validation completely in favor of Strategy 1 & 2
    // (Database Caching & Optimistic Execution)

    const handleConfirmButton = () => {
        if (pairs.length < 2) {
            toast.error("At least two accounts are required for pairing")
            return
        }

        const primary = pairs[0]
        const secondary = pairs[1]

        // 0. Validation: Burned Account Guard
        const isBurned = (acc: TradingAccount) => (acc.status as string) === 'burned'
        if (isBurned(primary) || isBurned(secondary)) {
            const burnedName = isBurned(primary)
                ? `${primary.accounts?.first_name} ${primary.accounts?.last_name}`
                : `${secondary.accounts?.first_name} ${secondary.accounts?.last_name}`
            toast.error(`Cannot pair: "${burnedName}" is a burned account and can no longer be traded.`)
            return
        }

        // 1. Validation: Same Funder Warning
        const funderId1 = primary.package_ref?.funder_id
        const funderId2 = secondary.package_ref?.funder_id

        if (funderId1 && funderId2 && funderId1 === funderId2) {
            const proceed = window.confirm(
                `Warning: Both accounts belong to the same funder (${primary.package_ref?.funders?.name || 'Same Funder'}). \n\nMultiple accounts from the same funder might violate their rules. Do you want to proceed?`
            )
            if (!proceed) return
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
            if (!proceed) return
        }

        // 3. Validation: Unit Health
        const unit1 = primary.accounts?.units
        const unit2 = secondary.accounts?.units

        if (!unit1?.unit_id || unit1?.status !== 'enabled') {
            toast.error(`Unit missing or offline.`)
            return
        }

        if (!unit2?.unit_id || unit2?.status !== 'enabled') {
            toast.error(`Unit missing or offline.`)
            return
        }

        // ALL validations passed, directly execute pairing
        executePairing()
    }

    const getOperation = (acc: any, baseOp: string) => {
        const automation = acc.package_ref?.funders?.automation || acc.funder?.automation || 'API';
        return automation === 'GUI' ? `${baseOp}-gui` : baseOp;
    };

    // The /pair request body. The strategy check is built from the same fields so its answer matches.
    const buildPairPayload = (primary: Pair, secondary: Pair) => {
        const p1Data = createRealtimePayload(primary, getOperation(primary, 'input-order'));
        const p2Data = createRealtimePayload(secondary, getOperation(secondary, 'input-order'));

        const payload = {
            primary_id: primary.id,
            secondary_id: secondary.id,
            symbol: primary.symbol || "XAUUSD",
            primary_order_amount: primary.order_amount,
            primary_order_type: primary.trade_type,
            primary_take_profit: primary.tp_ticks,
            primary_stop_loss: primary.sl_ticks,
            primary_sl_type: primary.sl_type,
            primary_tp_type: primary.tp_type,
            secondary_order_amount: secondary.order_amount,
            secondary_order_type: secondary.trade_type,
            secondary_take_profit: secondary.tp_ticks,
            secondary_stop_loss: secondary.sl_ticks,
            secondary_sl_type: secondary.sl_type,
            secondary_tp_type: secondary.tp_type,
            unit1Id: primary.accounts?.units?.unit_id,
            unit2Id: secondary.accounts?.units?.unit_id,
            p1Event: p1Data.event,
            p1Payload: p1Data.payload,
            p2Event: p2Data.event,
            p2Payload: p2Data.payload,
            // Only when the primary still has the AI's direction (it may have been changed by hand)
            signal_id: aiSignal && primary.trade_type === aiSignal.direction ? aiSignal.id : null,
            // Lets the orchestrator check the delayed hedge's worst case fits an account
            primary_safe_limit: getAccountSafeLimit(primary),
            secondary_safe_limit: getAccountSafeLimit(secondary),
            // Demo testing: skip the AI score check (only honored when the orchestrator allows test mode)
            test_mode: testMode,
            fireAndForget: true
        };
        return { p1Data, p2Data, payload }
    }

    // ── Hedge strategy: ask the orchestrator whether the delayed hedge is allowed ──
    const [strategyCheck, setStrategyCheck] = React.useState<StrategyCheck>({ status: 'idle' })
    const [strategyChoice, setStrategyChoice] = React.useState<'delayed_hedge' | 'natural'>('natural')
    const [testMode, setTestMode] = React.useState(false)
    const userPickedStrategy = React.useRef(false)

    React.useEffect(() => {
        if (!isOpen) { userPickedStrategy.current = false; setTestMode(false); setStrategyCheck({ status: 'idle' }); return }
        if (pairs.length !== 2) return
        const { payload } = buildPairPayload(pairs[0], pairs[1])
        const timer = setTimeout(async () => {
            setStrategyCheck(prev => ({ ...prev, status: 'checking' }))
            try {
                const { data: { session } } = await createClient().auth.getSession()
                const orchestratorUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'https://orchestrator.iaynomrah.cloud'
                const res = await fetch(`${orchestratorUrl}/api/v1/units/pair/strategy`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
                    // Only what the rules need — no account credentials
                    body: JSON.stringify({
                        ...payload,
                        p1Payload: { operation: payload.p1Payload.operation },
                        p2Payload: { operation: payload.p2Payload.operation },
                    })
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.message || "Strategy check failed")
                setStrategyCheck({ status: 'done', allowed: data.delayed_allowed, reason: data.reason, score: data.score, swap: data.swap, hedge: data.hedge, triggerPct: data.trigger_pct, testModeAvailable: data.test_mode_available })
                // Default to delayed when allowed, unless the user already picked; never keep a pick that's no longer allowed
                if (!data.delayed_allowed) setStrategyChoice('natural')
                else if (!userPickedStrategy.current) setStrategyChoice('delayed_hedge')
            } catch (e: any) {
                setStrategyCheck({ status: 'error', allowed: false, reason: e.message || "Strategy check failed" })
                setStrategyChoice('natural')
            }
        }, 500)
        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, JSON.stringify(pairs.map(p => [p.id, p.trade_type, p.order_amount, p.sl_ticks, p.tp_ticks, p.sl_type, p.tp_type])), aiSignal?.id, testMode])

    const isExecutingRef = React.useRef(false);

    const executePairing = async () => {
        if (isExecutingRef.current) return;
        isExecutingRef.current = true;

        let savedPairId: string | null = null;
        const primary = pairs[0]
        const secondary = pairs[1]

        try {
            setIsLoading(true)

            const unit1 = primary.accounts?.units
            const unit2 = secondary.accounts?.units

            if (!unit1?.unit_id || !unit2?.unit_id) {
                throw new Error("One or both units are missing a Unit GUID. Cannot connect to trading PCs.")
            }

            const unit1Id = unit1.unit_id
            const unit2Id = unit2.unit_id

            // Call Orchestrator to handle the full pairing flow
            toast.loading("Initiating pairing via Orchestrator...", { id: 'pair-trade' });

            const supabaseForToken = createClient();
            const { data: { session } } = await supabaseForToken.auth.getSession();
            const token = session?.access_token;
            const orchestratorUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'https://orchestrator.iaynomrah.cloud';

            const { p1Data, p2Data, payload: basePayload } = buildPairPayload(primary, secondary)
            const payload = { ...basePayload, strategy_choice: strategyChoice }

            if (p1Data.event === 'run_tradelocker' && (!p1Data.payload.username || !p1Data.payload.password)) {
                toast.error(`Primary Account is missing TradeLocker username or password in the database. Please edit the account credentials and ensure they are linked.`);
                setIsLoading(false);
                return;
            }
            if (p2Data.event === 'run_tradelocker' && (!p2Data.payload.username || !p2Data.payload.password)) {
                toast.error(`Secondary Account is missing TradeLocker username or password in the database. Please edit the account credentials and ensure they are linked.`);
                setIsLoading(false);
                return;
            }
            if (p1Data.event === 'run_metatrader5' && (!p1Data.payload.username || !p1Data.payload.password)) {
                toast.error(`Primary Account is missing MetaTrader 5 username or password in the database. Please edit the account credentials and ensure they are linked.`);
                setIsLoading(false);
                return;
            }
            if (p2Data.event === 'run_metatrader5' && (!p2Data.payload.username || !p2Data.payload.password)) {
                toast.error(`Secondary Account is missing MetaTrader 5 username or password in the database. Please edit the account credentials and ensure they are linked.`);
                setIsLoading(false);
                return;
            }
            if (!p1Data.payload.account_id) {
                toast.error(`Primary Account is missing Platform ID in the database. Please edit the account credentials and add the Platform ID.`);
                setIsLoading(false);
                return;
            }
            if (!p2Data.payload.account_id) {
                toast.error(`Secondary Account is missing Platform ID in the database. Please edit the account credentials and add the Platform ID.`);
                setIsLoading(false);
                return;
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
                throw new Error(data.message || errorMessage || "Failed to pair accounts via Orchestrator");
            }

            if (data.strategy === 'delayed_hedge') {
                toast.success(`Paired with delayed hedge: only the primary opens; the secondary waits for a 10% loss.${data.swapped ? ' Accounts were swapped so the hedge is on the account with more room.' : ''}`, { id: 'pair-trade', duration: 8000 })
            } else {
                toast.success("Accounts successfully paired and staged! You can now start trading.", { id: 'pair-trade', duration: 5000 })
            }
            onConfirm(pairs)
            onClose()

        } catch (error: any) {
            console.error("Pairing error:", error)
            toast.dismiss('pair-trade')

            // Cleanup on failure if the backend didn't clean it up or if it failed before the fetch
            // Let the backend handle the DB rollback since the Orchestrator does it natively now
            const supabase = createClient();
            try {
                await supabase.from('trading_accounts').update({ account_status: 'idle' }).in('id', [primary.id, secondary.id])
            } catch (e) { }

            // Show "Try Again" Modal (Requirement: failed = remove the record in the database, add a modal to with option to try again)
            Swal.fire({
                title: 'Pairing Failed',
                text: error.message || "Failed to initiate pairing. Ensure local scripts are active.",
                icon: 'error',
                showCancelButton: true,
                confirmButtonText: 'Try Again',
                cancelButtonText: 'Close',
                background: '#1e2329',
                color: '#ffffff',
                confirmButtonColor: '#f0b90b',
                cancelButtonColor: '#2b3139',
            }).then((result) => {
                if (result.isConfirmed) {
                    executePairing(); // RECURSIVE RETRY
                }
            });
        } finally {
            setIsLoading(false)
            isExecutingRef.current = false;
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
                                    <Row label="Est. Loss" value={`-$${account.loss_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} color="text-[#f6465d]" />
                                    <Row label="Est. Profit" value={`+$${account.win_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} color="text-[#2ebc66]" />

                                    {/* Actionable Fields */}
                                    <div className="grid grid-cols-2 px-4 py-2.5 items-center hover:bg-[#2b3139]/30 transition-colors">
                                        <span className="text-[#848e9c] text-[13px] font-medium">Instrument</span>
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

                                    {lotSuggestion && (
                                        <div className="px-4 pb-2 -mt-1 text-[11px] text-[#848e9c] text-right leading-snug">
                                            Suggested {lotSuggestion.lot.toFixed(2)} lots: SL about ${lotSuggestion.distance.toFixed(1)} away,
                                            {' '}~4-8h at {lotSuggestion.source === 'mt5' ? "today's" : 'ATR'} volatility
                                            {lotSuggestion.capped && <span className="text-[#f0b90b]"> (capped at {MAX_AUTO_LOT.toFixed(2)}, so the SL sits closer)</span>}
                                            {Number(account.order_amount) !== lotSuggestion.lot && (
                                                <button
                                                    onClick={() => updatePair(account.id, 'order_amount', lotSuggestion.lot)}
                                                    className="ml-2 text-[#4788ff] font-semibold hover:text-white transition-colors"
                                                >
                                                    Apply
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 px-4 py-2.5 items-center hover:bg-[#2b3139]/30 transition-colors">
                                        <span className="text-[#4788ff] text-[13px] font-medium">TP</span>
                                        <div className="flex justify-end border border-[#2b3139] bg-[#0b0e11] px-2 py-0.5 rounded-[4px] gap-2 items-center">
                                            <input
                                                type="number"
                                                value={account.tp_ticks}
                                                onChange={(e) => updatePair(account.id, 'tp_ticks', Number(e.target.value))}
                                                className="bg-transparent border-none text-white text-[13px] font-bold text-right focus:outline-none w-full"
                                            />
                                            <button 
                                                onClick={() => updatePair(account.id, 'tp_type', account.tp_type === 'dollar' ? 'price' : 'dollar')} 
                                                className="text-[10px] uppercase font-bold text-[#f0b90b] min-w-[20px] hover:text-white transition-colors"
                                                title={`Toggle Type (Current: ${account.tp_type})`}
                                            >
                                                {account.tp_type === 'dollar' ? '$' : 'Px'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 px-4 py-2.5 items-center hover:bg-[#2b3139]/30 transition-colors">
                                        <span className="text-[#4788ff] text-[13px] font-medium">SL</span>
                                        <div className="flex justify-end border border-[#2b3139] bg-[#0b0e11] px-2 py-0.5 rounded-[4px] gap-2 items-center">
                                            <input
                                                type="number"
                                                value={account.sl_ticks}
                                                onChange={(e) => updatePair(account.id, 'sl_ticks', Number(e.target.value))}
                                                className="bg-transparent border-none text-white text-[13px] font-bold text-right focus:outline-none w-full"
                                            />
                                            <button 
                                                onClick={() => updatePair(account.id, 'sl_type', account.sl_type === 'dollar' ? 'price' : 'dollar')} 
                                                className="text-[10px] uppercase font-bold text-[#f0b90b] min-w-[20px] hover:text-white transition-colors"
                                                title={`Toggle Type (Current: ${account.sl_type})`}
                                            >
                                                {account.sl_type === 'dollar' ? '$' : 'Px'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Live Quote Preview */}
                                    {(() => {
                                        // Construct an optimistic quote based on cached DB limits or generic default
                                        const cachedMinDist = account.min_stop_distance ?? 0.25;
                                        const entry = livePrice ?? basePrice;
                                        const sl = levelFor(account, account.sl_ticks, false, entry);
                                        const tp = levelFor(account, account.tp_ticks, true, entry);
                                        const isBuy = account.trade_type === 'buy';
                                        // SL must sit on the losing side and TP on the winning side, each at least min distance away
                                        const slOk = !(account.sl_ticks > 0) || (isBuy ? entry - sl : sl - entry) >= cachedMinDist;
                                        const tpOk = !(account.tp_ticks > 0) || (isBuy ? tp - entry : entry - tp) >= cachedMinDist;

                                        const quote: QuoteResult = {
                                            price: entry,
                                            sl,
                                            tp,
                                            min_stop_distance: cachedMinDist,
                                            valid: slOk && tpOk
                                        };

                                        return (
                                            <div className="bg-[#0b0e11]/60">
                                                <LiveQuoteRuler quote={quote} hasSl={account.sl_ticks > 0} hasTp={account.tp_ticks > 0} livePrice={livePrice} />
                                            <div className="px-4 py-2.5 text-[11px] space-y-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[#848e9c] flex items-center gap-1">
                                                        <span className={cn("w-1.5 h-1.5 rounded-full", livePrice ? "bg-[#2ebc66]" : "bg-[#f0b90b] animate-pulse")} />
                                                        Live Price
                                                    </span>
                                                    <span className="font-mono text-white">{livePrice ?? '—'}</span>
                                                </div>
                                                {account.tp_ticks > 0 && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[#848e9c]">TP →</span>
                                                        <span className="font-mono text-white">{quote.tp?.toFixed(2) ?? '—'} <span className="text-[#848e9c]">({Math.abs(tp - entry).toFixed(2)} away)</span></span>
                                                    </div>
                                                )}
                                                {account.sl_ticks > 0 && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[#848e9c]">SL →</span>
                                                        <span className="font-mono text-white">{quote.sl?.toFixed(2) ?? '—'} <span className="text-[#848e9c]">({Math.abs(entry - sl).toFixed(2)} away)</span></span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[#848e9c]">Broker min distance</span>
                                                    <span className="font-mono text-white">
                                                        {cachedMinDist}{account.min_stop_distance == null && <span className="text-[#848e9c]"> (default — learned after first order)</span>}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className={cn("inline-block px-1.5 py-0.5 rounded-[3px] text-[10px] font-bold", quote.valid ? "bg-[#2ebc66]/20 text-[#2ebc66]" : "bg-[#f6465d]/20 text-[#f6465d]")}>
                                                        {quote.valid ? 'Valid' : `Too close (min ${cachedMinDist})`}
                                                    </div>
                                                    <span className="text-[9px] text-[#848e9c]/70 italic">Any final limits will be auto-adjusted on submit</span>
                                                </div>
                                            </div>
                                            </div>
                                        )
                                    })()}

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

                {/* Hedge strategy */}
                {pairs.length === 2 && (
                    <div className="px-5 py-3 bg-[#181a20] border-t border-[#2b3139] flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <span className="text-[#848e9c] text-[13px] font-medium">Hedge strategy</span>
                            <div className="flex rounded-[4px] border border-[#2b3139] overflow-hidden">
                                {([
                                    { value: 'delayed_hedge', label: 'Delayed hedge' },
                                    { value: 'natural', label: 'Natural hedge' },
                                ] as const).map(opt => {
                                    const disabled = isLoading || (opt.value === 'delayed_hedge' && !strategyCheck.allowed)
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            disabled={disabled}
                                            onClick={() => { userPickedStrategy.current = true; setStrategyChoice(opt.value) }}
                                            className={cn(
                                                "px-3 h-8 text-[12px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                                                strategyChoice === opt.value ? "bg-[#2f66d4] text-white" : "bg-[#0b0e11] text-[#848e9c] hover:text-white"
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                        <div className="text-[12px] leading-snug">
                            {strategyCheck.status === 'idle' || strategyCheck.status === 'checking' ? (
                                <span className="text-[#848e9c]">Checking if the delayed hedge is allowed...</span>
                            ) : strategyCheck.allowed ? (
                                <span className="text-[#2ebc66]">
                                    {testMode ? 'Delayed hedge allowed (test mode — AI score ignored).' : `Delayed hedge allowed (score ${strategyCheck.score}).`}{' '}
                                    <span className="text-[#848e9c]">
                                        {strategyChoice === 'delayed_hedge'
                                            ? `Only the primary opens. If it loses ${Math.round((strategyCheck.triggerPct ?? 0.1) * 1000) / 10}% of its SL, the secondary opens ${strategyCheck.hedge?.order_amount} lots the other way (worst case $${strategyCheck.hedge?.stop_loss}).${strategyCheck.swap ? ' The accounts will be swapped so the hedge is on the one with more room.' : ''}`
                                            : 'Both accounts will open at the same time.'}
                                    </span>
                                </span>
                            ) : (
                                <span className="text-[#848e9c]">
                                    <span className="text-[#f0b90b]">Delayed hedge not allowed:</span> {strategyCheck.reason}. Both accounts will open at the same time.
                                </span>
                            )}
                        </div>
                        {(strategyCheck.testModeAvailable || testMode) && (
                            <label className="flex items-center gap-2 text-[12px] text-[#f0b90b] cursor-pointer select-none w-fit">
                                <input
                                    type="checkbox"
                                    checked={testMode}
                                    disabled={isLoading}
                                    onChange={(e) => setTestMode(e.target.checked)}
                                    className="accent-[#f0b90b]"
                                />
                                Test mode: ignore AI score (demo accounts only)
                            </label>
                        )}
                    </div>
                )}

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
                            onClick={() => handleSuggestDirection(false)}
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
                        onClick={handleConfirmButton}
                        disabled={isLoading || isSuggesting || strategyCheck.status === 'checking'}
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
