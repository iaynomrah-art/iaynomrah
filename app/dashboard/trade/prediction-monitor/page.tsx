"use client"

// Temporary presentation page: live view of the AI prediction test (shadow mode)
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Activity, Brain, CandlestickChart, CheckCircle2, Clock, Gauge, LineChart, Sparkles, Filter, ChevronDown, ChevronUp, ArrowRight, ShieldCheck, Trophy, Layers, TrendingUp, AlertTriangle } from 'lucide-react'
import GoldCandleChart from '@/components/chart/GoldCandleChart'
import { Bar, BarChart as DailyBarChart, CartesianGrid, Line, LineChart as RunningTotalChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const VolatilityTimingCard = dynamic(() => import('@/components/chart/VolatilityTimingCard'), {
    ssr: false,
    loading: () => (
        <div className="rounded-2xl border border-[#1a1a1a] bg-[#080808] p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Clock className="h-4 w-4 animate-spin text-violet-400" />
            Loading market volatility analytics...
        </div>
    )
})

const TradeVisualizerModal = dynamic(() => import('@/components/chart/TradeVisualizerModal'), {
    ssr: false,
})

type Signal = {
    id: string
    created_at: string
    shadow: boolean
    entry_price: number | null
    ai: string | null
    tv: string | null
    coin: string | null
    score: number | null
    graded_at: string | null
    skipped: string | null
    outcome: { ai: string | null, tv: string | null, coin: string | null }
    hours: number | null
    trade: { lot: number, risk: number, entry: number, sl: number, tp: number, trigger: number, close: number | null, hedged: boolean | null, pnl: number | null, hedge_price: number | null, hedge_hours: number | null, primary_pnl: number | null, hedge_pnl: number | null, slippage_pct: number | null, swap?: number | null } | null
    compare?: { tv: number | null, coin: number | null }
    natural?: { lot: number, main: number, backup: number, net: number } | null
    rule?: {
        support: number
        resistance: number
        range: number
        window_hours?: number
        pump_dump?: boolean
        proximity_pct?: number
        is_near_boundary?: boolean
        past_trend?: string
        past_score?: number
        past_counter_trend?: boolean
        us_news_at?: string[] | null
        trigger_price?: number
    } | null
    diagnostic?: { session?: string, location?: string, pos_pct?: number | null, reason?: string | null } | null
    // Live S/R rule signals: what the rule chose for this trade
    hedge_mode?: 'delayed' | 'normal' | null
    skip_reason?: string | null
}

type Cost = { per_lot_per_account: number, pairs: number, measured: boolean, avg_pair_net?: number | null }
type StrategyTotals = { net: number, main: number, backup: number, backup_used: number }
type Comparison = { trades: number, delayed: StrategyTotals, natural: StrategyTotals, series: { t: string, delayed: number, natural: number }[] }

type DaySummary = { days: number, trades_per_day: number, a_per_day: number, pnl_per_day: number, best_day: number, days_by_tp: Record<'0' | '1' | '2' | '3+', number> }
type Day = { date: string, trades: number, a: number, b: number, c: number, x: number, pnl: number }
type Daily = { every: { days: Day[], summary: DaySummary }, one_at_a_time: { days: Day[], summary: DaySummary } }

type Tally = { graded: number, resolved: number, a: number, b: number, c: number, x: number, pnl: number, a_rate: number | null, a_rate_all?: number | null, hedges?: number, slippage_avg_pct?: number | null, slippage_max_pct?: number | null }

type Status = {
    now: string
    shadow_enabled: boolean
    next_shadow_run: string
    volatility: { computed_at: string, forecast_6h: number, ratio_now: number | null, source: string } | null
    candles: { last: { minute: string, close: number, ticks: number } | null, last_hour: number }
    counts: { shadow: number, graded: number }
    reference?: { risk: number, max_lot: number, trigger_pct: number, tp: string, cost?: Cost, rule_mode?: boolean, lot?: number, hold?: string }
    scoreboard?: Record<'ai' | 'tv' | 'coin', Tally>
    comparison?: Comparison
    daily?: Daily
    signals: Signal[]
    replay: {
        signals: number
        agree_pct: number
        from: string
        to: string
        t10: { ai: number, tv: number, coin: number, luck: number, resolved: number }
        t15: { ai: number, tv: number, coin: number, luck: number, resolved: number }
    } | null
    error?: string
}

// Luck test of a past-data run: its total vs 1,000 coin flips trading the same moments
type Luck = {
    trades: number, coin_runs: number, pnl: number, beats_pct: number
    coin_pnl: { p5: number, median: number, p95: number }
    clean: number, clean_beats_pct: number, coin_clean_median: number
    halves: { from: string, pnl: number }[]
    slippage: { per_hedge: number, pnl: number }
}
type RateTally = { graded: number, a: number, b: number, c: number, x: number, resolved: number, a_rate: number | null, a_rate_all: number | null }
type Approach = {
    run: string
    picker: 'ai' | 'rating' | 'perfect'
    trigger: number
    rule: { name: string, f?: number, target?: number, lot?: number, budget?: number, sl_distance?: number, stop?: string } | null
    moments: number
    trades: number
    avg_sl: number | null
    main: RateTally
    coin: RateTally
    delayed_per_trade: number | null
    natural_per_trade: number | null
    skipped: (RateTally & { moments: number, delayed_per_trade: number | null }) | null
    luck?: Luck | null
    per_day?: { every: DaySummary, one_at_a_time: DaySummary }
}

type Past = {
    runs: { run: string, signals: number, from: string, to: string }[]
    run: string | null
    approaches?: Approach[]
    picker?: 'ai' | 'rating' | 'perfect'
    signals_total?: number
    daily?: Daily
    reference?: { risk: number, trigger_pct?: number, cost?: Cost, lot?: number | null, tp?: string, hold?: string }
    scoreboard?: Record<'ai' | 'tv' | 'coin', Tally>
    comparison?: Comparison
    signals: Signal[]
    error?: string
}

const RUN_LABEL: Record<string, string> = {
    'v1': 'AI: original prompt',
    'v2-candles-6h': 'AI: prompt with 6-hour candles (current)',
    'sr-tv-30d': '30-Day Macro Trend + 6h S/R Synergy (New)',
    'sr-adaptive': 'Adaptive Regime (Breakout & Bounce)',
    'sr-tv-combined': 'S/R + TradingView Synergy (Combined)',
    'sr-budget-8': 'S/R budget × 8%',
    'sr-budget-12': 'S/R budget × 12%',
    'sr-budget-15': 'S/R budget × 15%',
    'sr-bounce': 'Plain S/R bounce, $50 stop',
    'sr-bounce-40': 'S/R bounce ×12% ($40 stop), 12h levels (live)',
    'sr-bounce-40-6h': 'S/R bounce ×12% ($40 stop), 6h levels',
    'sr-bounce-40-2h': 'S/R bounce ×12% ($40 stop), 2h levels',
    'sr-bounce-20': 'S/R bounce ×20% ($66.67 stop), 12h levels',
    'sr-bounce-20-6h': 'S/R bounce ×20% ($66.67 stop), 6h levels',
    'sr-bounce-20-2h': 'S/R bounce ×20% ($66.67 stop), 2h levels',
    'sr-bounce-40-z20': 'S/R bounce ×12%, 20% zone, 12h levels',
    'sr-bounce-40-2h-m30': 'S/R bounce ×12%, 2h levels, 30-day bias',
    'sr-bounce-40-2h-month': 'S/R bounce ×12%, 2h levels, month bias (hindsight)',
    'sr-bounce-40-m30': 'S/R bounce ×12%, 12h levels, 30-day bias',
    'sr-bounce-40-9am-8pm': 'S/R bounce ×12%, 12h levels, 9 AM + 8 PM PHT (more trades)',
    'sr-bounce-40-9am-8pm-z40': 'S/R bounce ×12%, 12h levels, 9 AM + 8 PM PHT, 40% zone',
    'sr-bounce-40-9am-830pm': 'S/R bounce ×12%, 12h levels, 9 AM + 8:30 PM PHT',
    'sr-bounce-lot10': 'S/R bounce, 0.1 lot ($40 stop, hedged loss cap $66.67), 9 AM PHT',
    'sr-bounce-lot01-x10': 'S/R bounce, 0.01 lot ×10% ($100 stop, $20 cap), 9 AM PHT',
    'sr-bounce-m30-lot02': '30-day bias, 0.02 lot ($60 stop), 9 AM PHT',
    'sr-bounce-m30-lot02-9am-8pm': '30-day bias, 0.02 lot ($60 stop), 9 AM + 8 PM PHT',
    'sr-bounce-m30-lot02-8am-9am': '30-day bias, 0.02 lot ($60 stop), 8 AM + 9 AM PHT',
    'sr-bounce-m30-lot03': '30-day bias, 0.03 lot ($40 stop), 9 AM PHT',
    'sr-bounce-m30-lot03-9am-8pm': '30-day bias, 0.03 lot ($40 stop), 9 AM + 8 PM PHT',
    'sr-bounce-m30-lot03-8am-9am': '30-day bias, 0.03 lot ($40 stop), 8 AM + 9 AM PHT',
    'sr-bounce-40-830': 'S/R bounce ×12%, 12h levels, 8:30 AM + 8:30 PM PHT',
    'sr-bounce-40-830-z40': 'S/R bounce ×12%, 12h levels, 8:30 AM + 8:30 PM PHT, 40% zone',
    'sr-bounce-40-month': 'S/R bounce ×12%, 12h levels, month bias (hindsight)',
    'sr-bounce-40-z20-6h': 'S/R bounce ×12%, 20% zone, 6h levels',
    'sr-bounce-40-z20-2h': 'S/R bounce ×12%, 20% zone, 2h levels',
    'rating-t10': 'Hedge at a 10% dip',
    'rating-t15': 'Hedge at a 15% dip',
    'rating-t20': 'Hedge at a 20% dip',
    'rating-t10-london-ny': 'Hedge at 10% dip (London & NY)',
    'rating-t15-london-ny': 'Hedge at 15% dip (London & NY)',
    'rating-t20-london-ny': 'Hedge at 20% dip (London & NY)',
    'perfect-t10': 'Perfect forecaster, hedge at 10%',
    'perfect-t15': 'Perfect forecaster, hedge at 15%',
    'perfect-t20': 'Perfect forecaster, hedge at 20%',
    'perfect-t15-london-ny': 'Perfect forecaster, hedge at 15% (London & NY)',
    'rating-t10-hourly': 'Hourly signals, hedge at 10% (like live)',
    'rating-t15-hourly': 'Hourly signals, hedge at 15%',
}
// Table sections, in order - 30-Day Macro, Adaptive Regime, Combined Synergy, and S/R Budget
// The run being considered for live: shown first in the ranking and in its table section
const FEATURED_RUN = 'sr-bounce-40-9am-8pm'
const featuredFirst = (a: Approach, b: Approach) => Number(b.run === FEATURED_RUN) - Number(a.run === FEATURED_RUN)
const APPROACH_GROUPS: { key: string, title: string, note: string }[] = [
    { key: 'sr-bounce', title: 'S/R Bounce', note: 'Buy the bottom of the range, sell the top; variants by budget, lookback, zone and monthly bias' },
    { key: 'sr-tv-30d', title: '30-Day Macro Trend + 6h Local S/R Synergy (New)', note: '30-day macro trend bias from daily chart + tight 6h Asian session S/R execution levels' },
    { key: 'sr-adaptive', title: 'Adaptive Regime Model (Breakout + Bounce Synergy)', note: 'Bounce when TV agrees, breakout when it disagrees: either way the trade follows TradingView' },
    { key: 'sr-tv-synergy', title: 'S/R + TradingView Synergy Model (Combined)', note: 'TradingView 18-indicator macro trend consensus + S/R value pullback entry (9:00 AM PHT)' },
    { key: 'sr-budget', title: 'Support & Resistance Budget Strategy (× 8%, × 12%, × 15%)', note: '9:00 AM PHT trades within 25% of S/R boundary with past chart trend confirmation' },
]
const groupOf = (a: Approach) => {
    if (a.rule?.name === 'sr-tv-30d' || a.run === 'sr-tv-30d') return 'sr-tv-30d'
    if (a.rule?.name === 'sr-adaptive' || a.run === 'sr-adaptive') return 'sr-adaptive'
    if (a.rule?.name === 'sr-tv-synergy' || a.run === 'sr-tv-combined') return 'sr-tv-synergy'
    if (a.rule?.name?.startsWith('sr-budget') || a.run.startsWith('sr-budget')) return 'sr-budget'
    if (a.rule?.name === 'sr-bounce' || a.run === 'sr-bounce') return 'sr-bounce'
    return a.rule?.name ?? 'ai'
}
const runLabel = (run: string) => RUN_LABEL[run] ?? run
// How each approach works, in one line
const approachHow = (a: Approach) => {
    const t = Math.round(a.trigger * 100)
    const r = a.rule
    const sessionNote = a.run.includes('-london-ny') ? ' (London & NY: 07:00–17:00 UTC only)' : a.run.includes('-asia') ? ' (Asia/off-hours only)' : ''
    if (r?.name === 'sr-tv-30d') return `9:00 AM PHT: Direction locked to past 30-day macro trend (above/below 30d SMA); entry precision & hedge trigger derived from local 6h Asian session S/R. Delayed hedge capped at $20.`
    if (r?.name === 'sr-adaptive') return `9:00 AM PHT, near S/R only: bounces when TV agrees, rides the breakout when TV disagrees, so it always trades the TradingView side. Delayed hedge capped at $20.`
    if (r?.name === 'sr-bounce') return `${a.run.includes('-8am-9am') ? '8:00 AM and 9:00 AM PHT' : a.run.includes('-9am-8pm') ? '9:00 AM and 8:00 PM PHT' : a.run.includes('-9am-830pm') ? '9:00 AM and 8:30 PM PHT' : a.run.includes('-830') ? '8:30 AM and 8:30 PM PHT' : '9:00 AM PHT'}: buys in the bottom ${a.run.includes('-z20') ? 20 : a.run.includes('-z40') ? 40 : 25}% of the ${a.run.endsWith('-2h') ? '2h' : a.run.endsWith('-6h') ? '6h' : '12h'} range, sells in the top ${a.run.includes('-z20') ? 20 : a.run.includes('-z40') ? 40 : 25}%. ${a.run.endsWith('-m30') || a.run.includes('-m30-') ? 'Only the side the last 30 days moved (up: buys, down: sells).' : a.run.endsWith('-month') ? 'Only the side the calendar month actually moved (hindsight, not tradable).' : 'No TradingView or trend check.'} $${r.sl_distance?.toFixed(0) ?? '—'} stop (range under that), TP = range, delayed hedge capped at $20.`
    if (r?.name === 'sr-tv-synergy') return `9:00 AM PHT: Direction guided by TradingView 18-indicator macro trend consensus, entering on S/R pullback value zone. Delayed hedge capped at $20 max loss.`
    if (r?.name === 'sr-budget') return `9:00 AM PHT: Buys Support (≤25%), Sells Resistance (≥75%). Skips middle 50% chop. Confirms past chart trend before entry. Delayed hedge capped at $20 max loss.`
    if (r?.name === 'rating-trigger') return `${a.run.endsWith('-hourly') ? 'A signal every hour, like the live test. ' : ''}The TradingView rating picks the side (the AI copies it). Backup opens once the price moves ${t}% of the way to the stop. Stop = 1.5 × hourly ATR (about $${a.avg_sl?.toFixed(0) ?? '—'}), TP = stop.${sessionNote}`
    if (r?.name === 'perfect-8h') return `Cheats: always picks the side gold will be on 8 hours later. Backup at a ${t}% dip, same stop as the AI (about $${a.avg_sl?.toFixed(0) ?? '—'}).${sessionNote}`
    return `The AI (qwen) picks buy or sell at about 1 moment in 4 hours; stop from the AI (about $${a.avg_sl?.toFixed(0) ?? '—'} move), TP = stop, backup at a ${t}% dip.${sessionNote}`
}
// Does a run beat luck? Needs 95% of coin flips, a profit in both halves and after slippage
const verdict = (l?: Luck | null) => {
    if (!l) return { label: 'No luck test', cls: 'bg-zinc-800 text-zinc-400 border-zinc-700' }
    const steady = l.halves.every((h) => h.pnl > 0) && l.slippage.pnl > 0
    if (l.beats_pct >= 95 && steady) return { label: 'Beats luck', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
    if (l.beats_pct >= 80 && steady) return { label: 'Promising, not proven', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' }
    return { label: 'Luck-level', cls: 'bg-rose-500/10 text-rose-300 border-rose-500/30' }
}

// Luck at a trigger t with TP = SL: t / (1 + t), in %
const luckRate = (trigger: number) => (trigger / (1 + trigger)) * 100

const REFRESH_MS = 30000
// Luck at a 10% trigger with TP = SL: 0.10 / (1 + 0.10), in %
const LUCK_A_RATE = 9.1
const GRADE_DELAY_H = 8

const minutesAgo = (iso: string, now: number) => Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000))
const ago = (iso: string, now: number) => {
    const m = minutesAgo(iso, now)
    return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.floor(m / 60)} h ${m % 60} min ago` : `${Math.floor(m / 1440)} d ago`
}
const phFormattedTime = (iso: string, durationHours?: number | null) => {
    try {
        const d = new Date(iso)
        if (isNaN(d.getTime())) return { phTime: '—', phDate: '—', utc: '—', phCloseTime: '—' }
        const phTime = d.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', hour12: true })
        const phDate = d.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' })
        const utcHours = String(d.getUTCHours()).padStart(2, '0')
        const utcMins = String(d.getUTCMinutes()).padStart(2, '0')

        let phCloseTime = '—'
        if (durationHours != null && !isNaN(Number(durationHours))) {
            const closeD = new Date(d.getTime() + Number(durationHours) * 3600 * 1000)
            phCloseTime = closeD.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', hour12: true })
        }
        return { phTime: `${phTime} PHT`, phDate, utc: `${utcHours}:${utcMins} UTC`, phCloseTime: `${phCloseTime} PHT` }
    } catch {
        return { phTime: '—', phDate: '—', utc: '—', phCloseTime: '—' }
    }
}
const localTime = (iso: string) => phFormattedTime(iso).phTime

const STORY: Record<string, { label: string, cls: string }> = {
    A: { label: 'Clean TP (No Hedge)', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    W8: { label: '8h Win (Unhedged)', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    B: { label: 'Hedged, SL', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    C: { label: 'Hedged Reversal', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    X: { label: 'Resolved at Close', cls: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
}

const Dot = ({ ok }: { ok: boolean }) => (
    <span className={`inline-block h-2.5 w-2.5 rounded-full ${ok ? 'bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400/60 animate-pulse' : 'bg-red-500'}`} />
)

const Card = ({ icon, label, value, sub, ok }: { icon: React.ReactNode, label: string, value: React.ReactNode, sub: React.ReactNode, ok?: boolean }) => (
    <div className="p-5 rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-widest">
            <span className="flex items-center gap-2">{icon}{label}</span>
            {ok !== undefined && <Dot ok={ok} />}
        </div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-muted-foreground leading-snug">{sub}</div>
    </div>
)

const Dir = ({ d }: { d: string | null }) => d
    ? <span className={`font-bold uppercase text-xs ${d === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>{d}</span>
    : <span className="text-muted-foreground">—</span>

const Outcome = ({ story, pendingLabel }: { story: string | null, pendingLabel: string }) => story
    ? <span className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold whitespace-nowrap ${STORY[story]?.cls}`}>{STORY[story]?.label ?? story}</span>
    : <span className="text-[11px] text-muted-foreground whitespace-nowrap">{pendingLabel}</span>

const costText = (c?: Cost) => c
    ? `Includes trading costs measured from your ${c.pairs} real normal-hedge pairs: about $${(c.per_lot_per_account / 100).toFixed(2)} per 0.01 lot for each account that trades${c.avg_pair_net != null ? ` (your pairs averaged ${c.avg_pair_net.toFixed(2)} per pair)` : ''}.`
    : 'Spread and fees not included.'

const money = (v: number | null | undefined) => {
    if (v == null || isNaN(Number(v))) return '—'
    const num = Number(v)
    return `${num >= 0 ? '+' : '−'}$${Math.abs(num).toFixed(2)}`
}

// Totals over every graded signal, per picker (Instant resolution, zero unfinished)
const Scoreboard = ({ board, risk, luck, cost, mainLabel = 'S/R Budget', trig = 0.1, sizing }: { board?: Record<'ai' | 'tv' | 'coin', Tally> | null, risk: number, luck: number | null, cost?: Cost, mainLabel?: string, trig?: number, sizing?: string }) => {
    if (!board) return null
    const rows: { key: 'ai' | 'tv' | 'coin', label: string, cls: string }[] = [
        { key: 'ai', label: mainLabel, cls: 'text-emerald-300' },
        { key: 'tv', label: 'TradingView rating', cls: 'text-sky-300' },
        { key: 'coin', label: 'Coin flip baseline', cls: 'text-zinc-300' },
    ]
    return (
        <div className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1a1a1a] flex flex-col md:flex-row md:items-end justify-between gap-2">
                <div>
                    <div className="text-sm font-semibold text-white flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Scoreboard: Instant Graded Results</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                        {sizing
                            ? <>Each signal as if traded at {sizing}, equal-lot hedge at its trigger · 100% resolved · the coin flip row is one random seed (the luck test above uses 1,000)</>
                            : <>Each signal as if traded at ${risk} risk (lot sized to it, max 0.30), TP = SL distance, equal-lot hedge at a {Math.round(trig * 100)}% dip · 100% resolved</>}
                    </div>
                </div>
                {luck !== null && <div className="text-xs text-muted-foreground">Luck: about <span className="text-amber-300 font-semibold">{(luck / 10).toFixed(1)} in 10</span> hit TP without the hedge · goal <span className="text-emerald-400 font-semibold">2 in 10</span></div>}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="text-[11px] uppercase tracking-widest text-muted-foreground">
                        <tr className="border-b border-[#1a1a1a]">
                            <th className="px-5 py-2.5 text-left">Strategy / Picker</th>
                            <th className="px-3 py-2.5 text-left">Clean TP (No Hedge)</th>
                            <th className="px-3 py-2.5 text-left">Hedged, then TP</th>
                            <th className="px-3 py-2.5 text-left">Hedged, then SL</th>
                            <th className="px-3 py-2.5 text-left">Win Rate (Total TP)</th>
                            <th className="px-3 py-2.5 text-left">Hedge slippage</th>
                            <th className="px-3 py-2.5 text-right pr-5">Total Result ($)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#141414]">
                        {rows.map((r) => {
                            const t = board?.[r.key] ?? { a: 0, b: 0, c: 0, x: 0, resolved: 0, a_rate: null, a_rate_all: null, pnl: 0, hedges: 0, slippage_avg_pct: null, slippage_max_pct: null }
                            const totalWon = (t.a ?? 0) + (t.c ?? 0)
                            const totalTrades = t.resolved ?? (t.a + t.b + t.c)
                            const winRatePct = totalTrades > 0 ? Math.round((totalWon / totalTrades) * 100) : 0

                            return (
                                <tr key={r.key}>
                                    <td className={`px-5 py-3 font-semibold ${r.cls}`}>{r.label}</td>
                                    <td className="px-3 py-3">
                                        <span className="text-lg font-bold text-emerald-400">{t.a ?? 0}</span>
                                        <span className="text-muted-foreground"> of {totalTrades}</span>
                                        {t.a_rate != null && !isNaN(Number(t.a_rate)) && <span className="ml-2 text-xs text-white font-medium">({(Number(t.a_rate) / 10).toFixed(1)} in 10)</span>}
                                    </td>
                                    <td className="px-3 py-3 text-sky-400 font-semibold">{t.c ?? 0}</td>
                                    <td className="px-3 py-3 text-amber-400 font-semibold">{t.b ?? 0}</td>
                                    <td className="px-3 py-3">
                                        <span className="text-white font-bold">{winRatePct}%</span>
                                        <div className="text-[10px] text-muted-foreground">{totalWon} of {totalTrades} trades won</div>
                                    </td>
                                    <td className="px-3 py-3 text-xs">
                                        {t.slippage_avg_pct != null
                                            ? <><span className={Number(t.slippage_avg_pct) > 0 ? 'text-red-400 font-semibold' : 'text-white font-semibold'}>{Number(t.slippage_avg_pct).toFixed(1)}% avg</span><span className="text-muted-foreground"> · max {t.slippage_max_pct != null ? `${Number(t.slippage_max_pct).toFixed(1)}%` : '—'} · {t.hedges ?? 0} hedges</span></>
                                            : <span className="text-muted-foreground">no hedges</span>}
                                    </td>
                                    <td className={`px-3 py-3 pr-5 text-right font-bold ${(t.pnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{money(t.pnl ?? 0)}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            <div className="px-5 py-2.5 border-t border-[#1a1a1a] text-[11px] text-muted-foreground">
                {!sizing && <>TP without hedge = +${risk} · </>}Hedged then TP/SL resolved on real broker prices · Instant results (zero unfinished trades). {costText(cost)}
            </div>
        </div>
    )
}

// Delayed hedge vs normal hedge on the same trades, explained for beginners
const StrategyCompare = ({ c, risk, cost, trig = 0.1 }: { c?: Comparison | null, risk: number, cost?: Cost, trig?: number }) => {
    if (!c || !c.delayed || !c.natural) return null
    const diff = (c.delayed.net ?? 0) - (c.natural.net ?? 0)
    const spared = (c.trades ?? 0) - (c.delayed.backup_used ?? 0)
    const cls = (v: number) => v > 0 ? 'text-emerald-400' : v < 0 ? 'text-red-400' : 'text-white'
    const Side = ({ title, how, t, tone }: { title: string, how: string, t?: StrategyTotals, tone: string }) => {
        const net = t?.net ?? 0
        const main = t?.main ?? 0
        const backup = t?.backup ?? 0
        const used = t?.backup_used ?? 0
        return (
            <div className={`p-5 rounded-2xl border ${tone} bg-[#0a0a0a] flex flex-col gap-4`}>
                <div>
                    <div className="text-base font-bold text-white">{title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{how}</div>
                </div>
                <div>
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Total, both accounts</div>
                    <div className={`text-3xl font-bold ${cls(net)}`}>{money(net)}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-[#1a1a1a]">
                        <div className="text-[11px] text-muted-foreground">Main account</div>
                        <div className={`font-bold ${cls(main)}`}>{money(main)}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-[#1a1a1a]">
                        <div className="text-[11px] text-muted-foreground">Backup account</div>
                        <div className={`font-bold ${cls(backup)}`}>{money(backup)}</div>
                    </div>
                </div>
                <div className="text-xs text-muted-foreground">
                    Backup account had to trade in <span className="text-white font-semibold">{used} of {c.trades ?? 0}</span> trades
                </div>
            </div>
        )
    }
    return (
        <div className="rounded-2xl border border-[#1a1a1a] bg-[#080808] p-5 flex flex-col gap-5">
            <div>
                <div className="text-lg font-bold text-white">Delayed hedge vs normal hedge</div>
                <div className="text-sm text-muted-foreground">Same {c.trades ?? 0} trades (unfinished ones at their 8-hour result), same lot sizes (about ${risk} risk each). Only the way the backup account is used changes.</div>
            </div>

            {/* The three situations, in plain words */}
            <div className="overflow-x-auto rounded-xl border border-[#1a1a1a]">
                <table className="w-full text-sm">
                    <thead className="text-[11px] uppercase tracking-widest text-muted-foreground bg-white/[0.02]">
                        <tr>
                            <th className="px-4 py-2.5 text-left">If the price...</th>
                            <th className="px-4 py-2.5 text-left">Normal hedge (both open at once)</th>
                            <th className="px-4 py-2.5 text-left">Delayed hedge (backup waits for a {Math.round(trig * 100)}% dip)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#141414]">
                        <tr>
                            <td className="px-4 py-3 text-white">goes straight your way</td>
                            <td className="px-4 py-3 text-muted-foreground">Main +${risk}, backup −${risk} = <b className="text-white">$0</b></td>
                            <td className="px-4 py-3 text-muted-foreground">Main +${risk}, backup never opens = <b className="text-emerald-400">+${risk}</b></td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 text-white">dips a little, then goes your way</td>
                            <td className="px-4 py-3 text-muted-foreground">Main +${risk}, backup −${risk} = <b className="text-white">$0</b></td>
                            <td className="px-4 py-3 text-muted-foreground">Main +${risk}, backup −${Math.round(risk * (1 + trig))} = <b className="text-red-400">−${Math.round(risk * trig)}</b></td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 text-white">goes against you</td>
                            <td className="px-4 py-3 text-muted-foreground">Main −${risk}, backup +${risk} = <b className="text-white">$0</b></td>
                            <td className="px-4 py-3 text-muted-foreground">Main −${risk}, backup +${Math.round(risk * (1 - trig))} = <b className="text-red-400">−${Math.round(risk * trig)}</b></td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 text-white">dips, then goes nowhere for 8 hours</td>
                            <td className="px-4 py-3 text-muted-foreground">The pair still cancels out = <b className="text-white">$0</b></td>
                            <td className="px-4 py-3 text-muted-foreground">Backup opened at the dip, so the pair is locked at <b className="text-red-400">−${Math.round(risk * trig)}</b> whatever happens next</td>
                        </tr>
                    </tbody>
                </table>
                <div className="px-4 py-2.5 border-t border-[#1a1a1a] text-[11px] text-muted-foreground">
                    Before costs. On top of this, every account that trades pays spread and commission, so normal hedging always pays it twice; the delayed hedge pays it only once when the backup never opens.
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Side title="Normal hedge" how="Main and backup open together, opposite sides" t={c.natural} tone="border-[#1a1a1a]" />
                <Side title="Delayed hedge" how={`Backup opens only if the price dips ${Math.round(trig * 100)}% against the main`} t={c.delayed} tone="border-violet-500/30" />
            </div>

            <div className={`p-4 rounded-xl border ${diff >= 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'} text-sm text-white`}>
                In plain words: over these {c.trades ?? 0} trades the delayed hedge ended <b className={cls(diff)}>{money(diff)}</b> {diff >= 0 ? 'ahead of' : 'behind'} normal hedging,
                and the backup account stayed out of <b>{spared}</b> trades ({c.trades ? Math.round((spared / c.trades) * 100) : 0}%). With normal hedging it trades every time.
            </div>

            {c.series && c.series.length > 1 && (
                <div>
                    <div className="text-sm font-semibold text-white mb-1">Running total, both accounts together</div>
                    <div className="text-xs text-muted-foreground mb-3">Each step is one trade. A line going up means that strategy is making money overall.</div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <RunningTotalChart data={c.series.map((p, i) => ({ ...p, n: i + 1 }))} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                                <CartesianGrid stroke="#141414" />
                                <XAxis dataKey="n" stroke="#52525b" fontSize={11} />
                                <YAxis stroke="#52525b" fontSize={11} tickFormatter={(v) => `$${v}`} />
                                <ReferenceLine y={0} stroke="#3f3f46" />
                                <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid #27272a', fontSize: 12 }}
                                    labelFormatter={(n) => `After trade ${n}`}
                                    formatter={(v: any, name: any) => [money(Number(v)), name === 'delayed' ? 'Delayed hedge' : 'Normal hedge']} />
                                <Line type="monotone" dataKey="natural" stroke="#a1a1aa" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="delayed" stroke="#a78bfa" strokeWidth={2.5} dot={false} />
                            </RunningTotalChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-5 text-[11px] text-muted-foreground mt-1">
                        <span className="flex items-center gap-1.5"><span className="inline-block w-4 border-t-2 border-violet-400" /> Delayed hedge</span>
                        <span className="flex items-center gap-1.5"><span className="inline-block w-4 border-t-2 border-zinc-400" /> Normal hedge</span>
                        <span>Bottom axis = trade number. {costText(cost)}</span>
                    </div>
                </div>
            )}
        </div>
    )
}

// TP without the hedge per day: summary, how many days had 0 / 1 / 2 / 3+, and a bar per day
const DailyTp = ({ daily, title }: { daily?: Daily | null, title: string }) => {
    const [mode, setMode] = useState<'one_at_a_time' | 'every'>('one_at_a_time')
    const current = daily?.[mode]
    if (!current || !current.summary || !current.summary.days) return null
    const { days = [], summary: m } = current
    const pct = (n: number) => `${Math.round(((n ?? 0) / (m.days || 1)) * 100)}%`
    const dayLabel = (d: string) => {
        try {
            return new Date(`${d}T00:00:00Z`).toLocaleDateString([], { month: 'short', day: 'numeric', timeZone: 'UTC' })
        } catch {
            return String(d)
        }
    }
    return (
        <div className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-5 flex flex-col gap-5">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
                <div>
                    <div className="text-lg font-bold text-white">TP without hedge, day by day</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{title}</div>
                </div>
                <div className="flex gap-2 text-xs">
                    {([['one_at_a_time', 'One trade at a time'], ['every', 'Every signal']] as const).map(([k, label]) => (
                        <button key={k} onClick={() => setMode(k)}
                            className={`px-3 py-1.5 rounded-lg border ${mode === k ? 'border-emerald-500/40 bg-emerald-500/10 text-white' : 'border-[#1a1a1a] text-muted-foreground hover:text-white'}`}>{label}</button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-[#1a1a1a]">
                    <div className="text-[11px] text-muted-foreground uppercase tracking-widest">TP without hedge a day</div>
                    <div className="text-2xl font-bold text-emerald-400">{(m.a_per_day ?? 0).toFixed(2)}</div>
                    <div className="text-[11px] text-muted-foreground">{(m.a_per_day ?? 0) > 0 ? `about 1 every ${(1 / (m.a_per_day || 1)).toFixed(1)} days` : 'none'} · out of {m.trades_per_day ?? 0} trades a day</div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-[#1a1a1a]">
                    <div className="text-[11px] text-muted-foreground uppercase tracking-widest">Days with at least one</div>
                    <div className="text-2xl font-bold text-white">{pct(m.days - (m.days_by_tp?.['0'] ?? 0))}</div>
                    <div className="text-[11px] text-muted-foreground">{m.days - (m.days_by_tp?.['0'] ?? 0)} of {m.days} trading days · best day {m.best_day ?? 0}</div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-[#1a1a1a]">
                    <div className="text-[11px] text-muted-foreground uppercase tracking-widest">Result a day</div>
                    <div className={`text-2xl font-bold ${(m.pnl_per_day ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{money(m.pnl_per_day ?? 0)}</div>
                    <div className="text-[11px] text-muted-foreground">both accounts, delayed hedge, costs included</div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-[#1a1a1a]">
                    <div className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1.5">Days by TP count</div>
                    {(['0', '1', '2', '3+'] as const).map((k) => (
                        <div key={k} className="flex items-center gap-2 text-[11px]">
                            <span className="w-14 text-muted-foreground">{k} TP</span>
                            <div className="flex-1 h-2 rounded bg-white/5 overflow-hidden"><div className={`h-full ${k === '0' ? 'bg-zinc-600' : 'bg-emerald-500'}`} style={{ width: pct(m.days_by_tp?.[k] ?? 0) }} /></div>
                            <span className="w-16 text-right text-white tabular-nums">{m.days_by_tp?.[k] ?? 0} days</span>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <div className="text-xs text-muted-foreground mb-2">Each bar is one trading day: how many trades hit TP before the hedge opened.</div>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <DailyBarChart data={days} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                            <CartesianGrid stroke="#141414" vertical={false} />
                            <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickFormatter={dayLabel} minTickGap={30} />
                            <YAxis stroke="#52525b" fontSize={11} allowDecimals={false} width={28} />
                            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ background: '#0a0a0a', border: '1px solid #27272a', fontSize: 12 }}
                                content={({ active, payload }) => {
                                    const d = active && payload?.[0]?.payload as Day | undefined
                                    if (!d) return null
                                    return (
                                        <div className="p-2 rounded-lg border border-[#27272a] bg-[#0a0a0a] text-[11px] text-muted-foreground">
                                            <div className="text-white font-semibold">{dayLabel(d.date)}</div>
                                            <div>{d.trades} trades · <span className="text-emerald-400">{d.a} TP without hedge</span></div>
                                            <div>{d.b + d.c} hedged ({d.c} TP, {d.b} SL)</div>
                                            <div className={d.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>{money(d.pnl)}</div>
                                        </div>
                                    )
                                }} />
                            <Bar dataKey="a" fill="#34d399" radius={[2, 2, 0, 0]} />
                        </DailyBarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="text-[11px] text-muted-foreground">
                One trade at a time = a new trade opens only after the last one closed (or after 8 hours): what one pair of accounts can do. Every signal = every signal traded, even while others are still open. Days are UTC days that had signals.
            </div>
        </div>
    )
}

// Every past-data run side by side: the AI prompts and the rule-based approaches
const ApproachCompare = ({ list, selected, onSelect, cost }: { list: Approach[], selected: string | null, onSelect: (run: string) => void, cost?: Cost }) => {
    const [filter, setFilter] = useState<string>('all')
    const [showNotes, setShowNotes] = useState<boolean>(false)

    const rate = (v: number | null | undefined) => v == null ? '—' : `${(v / 10).toFixed(1)} in 10`
    const usd = (v: number | null) => v == null ? '—' : money(v)
    
    const sorted = (key: string) => list.filter((a) => groupOf(a) === key).sort((a, b) => featuredFirst(a, b) || (a.rule?.f ?? a.trigger) - (b.rule?.f ?? b.trigger) || a.run.localeCompare(b.run))

    const filteredGroups = APPROACH_GROUPS.filter((g) => {
        if (filter === 'all') return sorted(g.key).length > 0
        return g.key === filter && sorted(g.key).length > 0
    })

    // Runs with a luck test, best first
    const ranked = (list || []).filter((a) => a.luck).sort((x, y) => featuredFirst(x, y) || y.luck!.beats_pct - x.luck!.beats_pct || y.luck!.pnl - x.luck!.pnl)
    const slip = ranked[0]?.luck?.slippage.per_hedge ?? 1.5

    return (
        <div className="flex flex-col gap-4">
            {/* Luck test: each model against coin flips that trade the same moments */}
            {ranked.length > 0 && (
                <div className="p-5 rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] flex flex-col gap-4">
                    <div>
                        <div className="text-[11px] uppercase tracking-wider font-bold text-amber-400 flex items-center gap-1.5">
                            <Trophy className="h-3.5 w-3.5" /> Luck test · {ranked[0].luck!.coin_runs.toLocaleString()} coin flips on the same days
                        </div>
                        <p className="text-xs text-zinc-300 mt-1 max-w-4xl leading-relaxed">
                            Each model is replayed against {ranked[0].luck!.coin_runs.toLocaleString()} coin flips that trade the same moments with the same lot, stop, TP and $20 hedge, only picking buy or sell at random.
                            A model has an edge only if it <span className="text-emerald-300 font-semibold">beats about 95% of them</span>, makes money in <span className="text-white font-semibold">both halves</span> of the period, and still makes money with <span className="text-white font-semibold">${slip.toFixed(2)} of slippage</span> on every hedge.
                            With {ranked.length} models tested on the same days, one of them can pass by chance, so confirm the winner on new signals.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                        {ranked.map((a) => {
                            const v = verdict(a.luck)
                            return (
                                <button
                                    key={a.run}
                                    onClick={() => onSelect(a.run)}
                                    className={`px-3 py-2 rounded-xl text-xs border text-left transition-all ${selected === a.run ? 'bg-white/10 border-white/30' : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'}`}
                                >
                                    <div className="font-bold text-white">{runLabel(a.run)}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-1.5 rounded text-[10px] font-bold border ${v.cls}`}>{v.label}</span>
                                        <span className="tabular-nums text-muted-foreground">beats {a.luck!.beats_pct}% · {money(a.luck!.pnl)}</span>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Main Approaches Comparison Table Card */}
            <div className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden">
                <div className="p-5 border-b border-[#1a1a1a] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                                <Layers className="h-4 w-4" />
                            </div>
                            <h3 className="text-base font-bold text-white">Support & Resistance & Combined Model Backtest</h3>
                            <span className="text-xs text-muted-foreground">1+ Year Backtested (14 Months · Sept 2025 – Oct 2026)</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Evaluated at 9:00 AM PHT with the 25% boundary rule. Low-conviction mid-range chop is skipped automatically. Click any row to load its trade replay log.
                        </p>
                    </div>

                    {/* Mode Focus Indicator */}
                    <div className="flex items-center gap-2 p-1.5 bg-[#121212] rounded-xl border border-emerald-500/30">
                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Active Focus: S/R & Combined TV Models</span>
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-[#0f0f11] border-b border-[#1a1a1a]">
                            <tr>
                                <th className="px-5 py-3 text-left">Approach / Strategy</th>
                                <th className="px-3 py-3 text-right">Trades Taken</th>
                                <th className="px-3 py-3 text-center">Clean TP Rate</th>
                                <th className="px-3 py-3 text-center">Daily Clean TPs</th>
                                <th className="px-3 py-3 text-center">Vs Coin Flips</th>
                                <th className="px-3 py-3 text-right">Net PnL / Trade</th>
                                <th className="px-3 py-3 text-right">Total Net PnL</th>
                                <th className="px-4 py-3 text-center pr-5">Replay Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#141414]">
                            {filteredGroups.map((g) => (
                                <React.Fragment key={g.key}>
                                    <tr className="bg-white/[0.02]">
                                        <td colSpan={8} className="px-5 py-2 text-[11px]">
                                            <span className="text-white font-bold uppercase tracking-wider">{g.title}</span>
                                            <span className="text-muted-foreground"> · {g.note}</span>
                                        </td>
                                    </tr>
                                    {sorted(g.key).map((a) => {
                                        const allRate = a.main.a_rate_all ?? 0
                                        const isSelected = selected === a.run
                                        const isSR = a.rule?.name === 'sr-budget' || a.rule?.name === 'sr-tv-synergy' || a.rule?.name === 'sr-adaptive' || a.rule?.name === 'sr-bounce'
                                        const isAdaptive = a.run === 'sr-adaptive'
                                        const isCombined = a.run === 'sr-tv-combined'
                                        const totalNet = a.delayed_per_trade != null ? a.delayed_per_trade * a.trades : null
                                        const isProfitable = (a.delayed_per_trade ?? 0) > 0

                                        return (
                                            <tr
                                                key={a.run}
                                                onClick={() => onSelect(a.run)}
                                                className={`cursor-pointer transition-colors ${
                                                    isSelected
                                                        ? 'bg-amber-500/15 border-l-2 border-l-amber-400'
                                                        : isAdaptive
                                                        ? 'bg-amber-950/20 hover:bg-amber-950/30 border-l-2 border-l-amber-400/80'
                                                        : isCombined
                                                        ? 'bg-sky-950/10 hover:bg-sky-950/20 border-l-2 border-l-sky-400/60'
                                                        : isSR
                                                        ? 'bg-emerald-950/10 hover:bg-emerald-950/20 border-l-2 border-l-emerald-500/60'
                                                        : 'hover:bg-white/[0.02]'
                                                }`}
                                            >
                                                {/* Approach Details */}
                                                <td className="px-5 py-3 max-w-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-bold ${
                                                            isAdaptive ? 'text-amber-300' :
                                                            isCombined ? 'text-sky-300' :
                                                            isSR ? 'text-emerald-300' :
                                                            a.picker === 'perfect' ? 'text-sky-300' :
                                                            a.rule ? 'text-zinc-200' : 'text-violet-300'
                                                        }`}>
                                                            {runLabel(a.run)}
                                                        </span>
                                                        {(() => {
                                                            const v = verdict(a.luck)
                                                            return <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${v.cls}`}>{v.label.toUpperCase()}</span>
                                                        })()}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground leading-snug mt-1">
                                                        {approachHow(a)}
                                                    </div>
                                                </td>

                                                {/* Trades Taken / Skipped */}
                                                <td className="px-3 py-3 text-right">
                                                    <div className="text-white font-bold tabular-nums">{a.trades}</div>
                                                    {a.skipped ? (
                                                        <div className="text-[10px] text-emerald-400/90 font-medium">
                                                            {(a.skipped.moments ?? 0).toLocaleString()} chop skipped
                                                        </div>
                                                    ) : (
                                                        <div className="text-[10px] text-muted-foreground">all {a.moments ?? 0} hours</div>
                                                    )}
                                                </td>

                                                {/* Clean TP Rate */}
                                                <td className="px-3 py-3 text-center whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                                        allRate >= 20
                                                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                                            : allRate >= 10
                                                            ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                                                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                                    }`}>
                                                        {rate(a.main.a_rate_all)}
                                                    </span>
                                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                                        {a.main.a} of {a.main.graded} trades
                                                    </div>
                                                </td>

                                                {/* Daily TP */}
                                                <td className="px-3 py-3 text-center whitespace-nowrap">
                                                    {a.per_day?.one_at_a_time?.a_per_day != null ? (
                                                        <div>
                                                            <div className="text-white font-bold">
                                                                {a.per_day.one_at_a_time.a_per_day.toFixed(2)}{' '}
                                                                <span className="text-[10px] font-normal text-muted-foreground">/ day</span>
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground">
                                                                all signals {(a.per_day.every?.a_per_day ?? 0).toFixed(2)}/d
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </td>

                                                {/* Luck Baseline */}
                                                <td className="px-3 py-3 text-center text-muted-foreground whitespace-nowrap">
                                                    {a.luck ? (
                                                        <div>
                                                            <div className={`text-xs font-bold ${a.luck.beats_pct >= 95 ? 'text-emerald-400' : a.luck.beats_pct >= 80 ? 'text-amber-300' : 'text-zinc-300'}`}>beats {a.luck.beats_pct}%</div>
                                                            <div className="text-[10px]">coin median {money(a.luck.coin_pnl.median)}</div>
                                                            <div className="text-[10px]">90% of flips {money(a.luck.coin_pnl.p5)} to {money(a.luck.coin_pnl.p95)}</div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="text-xs">{rate(a.coin.a_rate_all)}</div>
                                                            <div className="text-[10px]">coin flip</div>
                                                        </>
                                                    )}
                                                </td>

                                                {/* Net PnL / Trade */}
                                                <td className="px-3 py-3 text-right tabular-nums whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                                        isProfitable
                                                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-sm'
                                                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                                    }`}>
                                                        {usd(a.delayed_per_trade)}
                                                    </span>
                                                </td>

                                                {/* Total Net PnL */}
                                                <td className="px-3 py-3 text-right tabular-nums whitespace-nowrap">
                                                    {totalNet != null ? (
                                                        <div>
                                                            <span className={`font-bold text-sm ${totalNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                {money(totalNet)}
                                                            </span>
                                                            {a.luck && (
                                                                <>
                                                                    <div className="text-[10px] text-muted-foreground">halves {money(a.luck.halves[0].pnl)} / {money(a.luck.halves[1].pnl)}</div>
                                                                    <div className="text-[10px] text-muted-foreground">with ${a.luck.slippage.per_hedge.toFixed(2)} slippage {money(a.luck.slippage.pnl)}</div>
                                                                </>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </td>

                                                {/* Action */}
                                                <td className="px-4 py-3 text-center pr-5 whitespace-nowrap">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            onSelect(a.run)
                                                        }}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                                            isSelected
                                                                ? 'bg-sky-500 text-black border-sky-400'
                                                                : 'bg-white/5 border-white/10 text-muted-foreground hover:text-white hover:bg-white/10'
                                                        }`}
                                                    >
                                                        {isSelected ? 'Loaded ✓' : 'Inspect'}
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Collapsible Methodology Notes */}
                <div className="border-t border-[#1a1a1a]">
                    <button
                        onClick={() => setShowNotes(!showNotes)}
                        className="w-full px-5 py-3 flex items-center justify-between text-xs text-muted-foreground hover:text-white transition-colors bg-[#080808]"
                    >
                        <span className="flex items-center gap-2 font-medium">
                            <ShieldCheck className="h-4 w-4 text-emerald-400" />
                            How to interpret this comparison (Methodology & Costs)
                        </span>
                        {showNotes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {showNotes && (
                        <div className="px-5 py-4 bg-[#060606] border-t border-[#141414] text-xs text-muted-foreground space-y-2 leading-relaxed">
                            <p>
                                <b className="text-white">Why &quot;out of every trade&quot;:</b> A wider stop takes longer to reach, so more trades remain open at 8 hours. Counting only finished trades distorts wide stops. Out of every trade is what your accounts actually experience.
                            </p>
                            <p>
                                <b className="text-white">Why S/R Budget beats brute-force trading:</b> Standard approaches take trades every hour regardless of chop, losing -$90,422 to false breakouts. The S/R budget rule tests whether expected payout can absorb the boundary spread; if not, it skips the trade.
                            </p>
                            <p>
                                <b className="text-white">Luck test:</b> every moment is also graded on the opposite side (with its own hedge trigger), and 1,000 coin flips pick a side at random on the same moments. &quot;Beats 90%&quot; means only 1 random picker in 10 did better. Even random sides make money here when gold trends, because the hedge caps a wrong side at about -$20 while a right side can win the whole range, so a profit alone does not show an edge.
                            </p>
                            <p>
                                <b className="text-white">Sizing:</b> the S/R runs are priced at their own 0.03 lot and TP (the S/R range, at least $5), not the $100-risk reference. Hedges fill exactly at the trigger in the replay; the slippage figure shows the total with ${slip.toFixed(2)} worse fills on every hedge. Trades are held until their SL or TP (not closed at 8 hours), every open leg pays the broker&apos;s overnight swap (long gold about -$3.92 a night at 0.03 lot, Wednesday x3), and a day&apos;s signal is skipped while the last pair is still open.
                            </p>
                            <p className="text-[11px] text-zinc-500">
                                {costText(cost)}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// One row per AI signal, as if traded (used by the live and the past-data views)
const TradeLog = ({ signals, now, risk, title, emptyText, mainLabel = 'AI', total, trig = 0.1, sizing }: { signals: Signal[], now: number, risk: number, title: string, emptyText: string, mainLabel?: string, total?: number, trig?: number, sizing?: string }) => {
    const px = (v?: number) => (v ? v.toFixed(2) : '—')
    const [inspectingSignal, setInspectingSignal] = useState<Signal | null>(null)

    return (
        <div className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1a1a1a] flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400">
                        <Activity className="h-4 w-4" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white">{title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                            {sizing
                                ? <>Evaluated on 5-minute broker prices · {sizing}</>
                                : <>{mainLabel} signals evaluated on 5-minute broker prices · ${risk} risk · {Math.round(trig * 100)}% dip hedge</>}
                        </div>
                    </div>
                </div>
                {total != null && total > signals.length && (
                    <div className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-400">
                        Showing latest <span className="text-white font-semibold">{signals.length}</span> of {total}
                    </div>
                )}
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="text-[11px] uppercase tracking-wider text-muted-foreground sticky top-0 bg-[#0f0f11] z-10 border-b border-[#1a1a1a]">
                        <tr>
                            <th className="px-5 py-3 text-left">Trade Schedule (PH Time)</th>
                            <th className="px-3 py-3 text-left">Direction & S/R Level</th>
                            <th className="px-3 py-3 text-right">Lots</th>
                            <th className="px-3 py-3 text-right">TP Target</th>
                            <th className="px-3 py-3 text-right">SL Stop</th>
                            <th className="px-3 py-3 text-right">Entry</th>
                            <th className="px-3 py-3 text-right">Exit Price</th>
                            <th className="px-3 py-3 text-right">Trade Net PnL</th>
                            <th className="px-3 py-3 text-right">Duration</th>
                            <th className="px-3 py-3 text-left">Final Outcome & Diagnostics</th>
                            <th className="px-4 py-3 text-left">Benchmark Comparison</th>
                            <th className="px-3 py-3 text-center pr-5">Chart Visual</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#141414]">
                        {signals.map((x) => {
                            const timeInfo = phFormattedTime(x.created_at, x.hours)
                            const pending = x.skipped ? 'skipped' : 'active'
                            const t = x.trade
                            const session = x.diagnostic?.session || ''

                            return (
                                <tr key={x.id} className="hover:bg-white/[0.02] transition-colors">
                                    {/* Trade Open & Close Time (Philippine Time Primary) */}
                                    <td className="px-5 py-3 whitespace-nowrap">
                                        <div className="font-bold text-white flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5 text-emerald-400" />
                                            <span>Open: {timeInfo.phTime}</span>
                                        </div>
                                        <div className="text-xs font-semibold text-zinc-300 mt-0.5 flex items-center gap-1.5">
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                            <span>Close: {timeInfo.phCloseTime}</span>
                                            <span className="text-zinc-500 font-normal">({x.hours ? `${Number(x.hours).toFixed(1)}h` : '8h'})</span>
                                        </div>
                                        <div className="text-[11px] text-zinc-400 mt-0.5">
                                            {timeInfo.phDate} · <span className="text-zinc-500 font-mono">{timeInfo.utc}</span>
                                        </div>
                                        {session && (
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium mt-1 inline-block border ${
                                                session.includes('Asian')
                                                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                                    : session.includes('London')
                                                    ? 'text-sky-400 bg-sky-500/10 border-sky-500/20'
                                                    : session.includes('New York')
                                                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                                                    : 'text-zinc-400 bg-zinc-800/80 border-zinc-700/50'
                                            }`}>
                                                {session}
                                            </span>
                                        )}
                                    </td>

                                    {/* Direction & S/R position */}
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                            <Dir d={x.ai} />
                                            {x.score != null && <span className="text-[11px] text-muted-foreground font-mono">({x.score}pts)</span>}
                                            {x.diagnostic?.location && (
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                                                    (x.diagnostic.pos_pct ?? 50) <= 15
                                                        ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
                                                        : (x.diagnostic.pos_pct ?? 50) >= 85
                                                        ? 'text-rose-300 bg-rose-500/15 border-rose-500/30'
                                                        : 'text-amber-300 bg-amber-500/10 border-amber-500/20'
                                                }`}>
                                                    {x.diagnostic.location}
                                                </span>
                                            )}
                                        </div>
                                        {x.rule && x.rule.support != null && x.rule.resistance != null && (
                                            <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                                                S/R: ${Number(x.rule.support).toFixed(1)}–${Number(x.rule.resistance).toFixed(1)} (gap ${Number(x.rule.range ?? (x.rule.resistance - x.rule.support)).toFixed(1)})
                                            </div>
                                        )}
                                        {x.rule?.past_trend && (
                                            <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1">
                                                <span className="text-zinc-500">Past Data:</span>
                                                <span className={`font-semibold uppercase ${
                                                    x.rule.past_trend.includes('buy') ? 'text-emerald-400' : 'text-rose-400'
                                                }`}>
                                                    {x.rule.past_trend}
                                                </span>
                                                {x.rule.past_score != null && (
                                                    <span className="font-mono text-zinc-500">({x.rule.past_score > 0 ? '+' : ''}{Number(x.rule.past_score).toFixed(2)})</span>
                                                )}
                                            </div>
                                        )}
                                    </td>

                                    {/* Lots & Levels */}
                                    <td className="px-3 py-3 text-right text-white font-mono">{t && t.lot != null ? Number(t.lot).toFixed(2) : '—'}</td>
                                    <td className="px-3 py-3 text-right text-emerald-400 font-mono">{px(t?.tp)}</td>
                                    <td className="px-3 py-3 text-right text-red-400 font-mono">{px(t?.sl)}</td>
                                    <td className="px-3 py-3 text-right text-white font-mono">{px(t?.entry)}</td>
                                    <td className="px-3 py-3 text-right text-white font-mono">
                                        {t?.close ? px(t.close) : <span className="text-muted-foreground text-[11px]">{x.graded_at ? '—' : 'active'}</span>}
                                    </td>

                                    {/* PnL breakdown */}
                                    <td className="px-3 py-3 text-right tabular-nums whitespace-nowrap">
                                        {t?.pnl == null ? (
                                            <span className="text-muted-foreground">—</span>
                                        ) : (
                                            <div className="flex flex-col items-end gap-0.5">
                                                <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                                                    t.pnl >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                                }`}>
                                                    {money(t.pnl)}
                                                </span>
                                                {t.primary_pnl != null && (
                                                    <span className="text-[10px] text-muted-foreground">
                                                        Main {money(t.primary_pnl)} · Hedge {t.hedged && t.hedge_pnl ? money(t.hedge_pnl) : '$0'}{t.swap ? <> · incl. swap {money(t.swap)}</> : null}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>

                                    {/* Duration */}
                                    <td className="px-3 py-3 text-right text-white tabular-nums">
                                        {x.hours != null ? `${Number(x.hours).toFixed(1)}h` : '—'}
                                    </td>

                                    {/* Outcome & Reason */}
                                    <td className="px-3 py-3">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <Outcome story={x.outcome?.ai ?? null} pendingLabel={pending} />
                                            {x.diagnostic?.reason && x.outcome?.ai && x.outcome.ai !== 'A' && (
                                                <span className="text-[10px] text-zinc-300 bg-zinc-800/90 px-1.5 py-0.5 rounded border border-zinc-700/60">
                                                    {x.diagnostic.reason}
                                                </span>
                                            )}
                                            {x.hedge_mode && (
                                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${x.hedge_mode === 'delayed' ? 'text-sky-300 bg-sky-500/10 border-sky-500/30' : 'text-zinc-400 bg-zinc-800/80 border-zinc-700/60'}`}
                                                    title={x.skip_reason ? `Normal hedge: ${x.skip_reason}` : 'The S/R rule picked the delayed hedge'}>
                                                    {x.hedge_mode === 'delayed' ? 'Delayed hedge' : `Normal hedge${x.skip_reason ? `: ${x.skip_reason}` : ''}`}
                                                </span>
                                            )}
                                            {!!x.rule?.us_news_at?.length && (
                                                <span className="text-[10px] font-semibold text-rose-300 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30"
                                                    title="A US data release (8:30 or 10:00 AM New York) moved gold sharply while this trade was open">
                                                    US news hit {new Date(x.rule.us_news_at[0]).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' })} PHT
                                                </span>
                                            )}
                                        </div>
                                        {t?.hedged && (
                                            <div className="text-[10px] text-amber-300/90 mt-1 whitespace-nowrap">
                                                Hedge at <span className="font-mono font-bold">{px(t.hedge_price ?? t.trigger)}</span>
                                                {t.hedge_hours != null && ` (+${Number(t.hedge_hours).toFixed(1)}h)`}
                                                {t.slippage_pct != null && Number(t.slippage_pct) > 0 && (
                                                    <span className="text-rose-400 font-semibold"> (slip {Number(t.slippage_pct).toFixed(1)}%)</span>
                                                )}
                                            </div>
                                        )}
                                    </td>

                                    {/* TV & Coin Comparison */}
                                    <td className="px-4 py-3 whitespace-nowrap pr-5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-14 text-[10px] uppercase tracking-wider text-sky-400 font-medium">TV</span>
                                            <Dir d={x.tv} />
                                            <Outcome story={x.outcome?.tv ?? null} pendingLabel="" />
                                            {x.compare?.tv != null && (
                                                <span className={`text-[11px] font-mono font-semibold ${x.compare.tv >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {money(x.compare.tv)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className="w-14 text-[10px] uppercase tracking-wider text-zinc-400 font-medium">COIN</span>
                                            <Dir d={x.coin} />
                                            <Outcome story={x.outcome?.coin ?? null} pendingLabel="" />
                                            {x.compare?.coin != null && (
                                                <span className={`text-[11px] font-mono font-semibold ${x.compare.coin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {money(x.compare.coin)}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Action: View Chart Visualizer */}
                                    <td className="px-3 py-3 text-center whitespace-nowrap pr-5">
                                        <button
                                            onClick={() => setInspectingSignal(x)}
                                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 hover:border-emerald-400 transition-all flex items-center gap-1.5 shadow-sm mx-auto"
                                            title="View exact visual candlestick chart for this trade"
                                        >
                                            <CandlestickChart className="h-3.5 w-3.5" />
                                            <span>View Chart</span>
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                        {!signals.length && (
                            <tr>
                                <td colSpan={12} className="px-5 py-12 text-center text-sm text-muted-foreground">
                                    {emptyText}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="px-5 py-3 border-t border-[#1a1a1a] flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2">
                    {Object.entries(STORY).map(([k, v]) => (
                        <span key={k} className={`px-2 py-0.5 rounded-md border ${v.cls}`}>
                            {v.label}
                        </span>
                    ))}
                </div>
                <span>* Trades evaluated under identical risk sizing with spread & fees included</span>
            </div>

            {inspectingSignal && (
                <TradeVisualizerModal
                    isOpen={!!inspectingSignal}
                    onClose={() => setInspectingSignal(null)}
                    signal={inspectingSignal}
                />
            )}
        </div>
    )
}

const PredictionMonitorPage = () => {
    const [status, setStatus] = useState<Status | null>(null)
    const [loadedAt, setLoadedAt] = useState(Date.now())
    const [clock, setClock] = useState(Date.now())
    const [view, setView] = useState<'live' | 'past'>('live')
    const [past, setPast] = useState<Past | null>(null)
    // Empty until a run is clicked: the orchestrator then picks its default (featured) run
    const [run, setRun] = useState<string>('')

    useEffect(() => {
        if (view !== 'past') return
        let cancelled = false
        fetch(`/api/replay-results${run ? `?run=${encodeURIComponent(run)}` : ''}`, { cache: 'no-store' })
            .then((r) => r.json())
            .then((d) => { if (!cancelled) setPast(d) })
            .catch((e) => { if (!cancelled) setPast({ error: e.message } as Past) })
        // A slower answer for an earlier click must not replace the run picked since
        return () => { cancelled = true }
    }, [view, run])

    useEffect(() => {
        const load = () => fetch('/api/shadow-status', { cache: 'no-store' })
            .then((r) => r.json())
            .then((d) => { setStatus(d); setLoadedAt(Date.now()) })
            .catch((e) => setStatus({ error: e.message } as Status))
        load()
        const refresh = setInterval(load, REFRESH_MS)
        const tick = setInterval(() => setClock(Date.now()), 1000)
        return () => { clearInterval(refresh); clearInterval(tick) }
    }, [])

    const now = clock
    const s = status
    const lastSignal = s?.signals?.find((x) => x.shadow)
    const volFresh = !!s?.volatility && minutesAgo(s.volatility.computed_at, now) <= 15
    const candlesFresh = !!s?.candles?.last && minutesAgo(s.candles.last.minute, now) <= 3
    const nextIn = s && s.next_shadow_run && !isNaN(new Date(s.next_shadow_run).getTime()) ? Math.max(0, Math.round((new Date(s.next_shadow_run).getTime() - now) / 1000)) : 0
    const pastTrig = (past?.reference?.trigger_pct ?? 10) / 100
    // Live signals from the S/R rule are priced at its lot and TP, held until SL/TP
    const liveSizing = s?.reference?.rule_mode
        ? [`${s.reference.lot} lot`, '$40 stop', s.reference.tp, s.reference.hold].filter(Boolean).join(', ')
        : undefined
    // How the selected past-data run was priced, when it has its own lot (the S/R rules)
    const pastSizing = past?.reference?.lot
        ? [`${past.reference.lot} lot`, `$${past.approaches?.find((a) => a.run === past.run)?.rule?.sl_distance ?? '—'} stop`, past.reference.tp, past.reference.hold].filter(Boolean).join(', ')
        : undefined

    return (
        <div suppressHydrationWarning className="animate-in fade-in duration-500 w-full p-6 bg-[#050505] min-h-screen">
            <div className="w-full flex flex-col gap-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Activity className="h-6 w-6 text-emerald-400" />
                            Support & Resistance & Adaptive Strategy Monitor
                        </h2>
                        <p className="text-sm text-muted-foreground max-w-2xl">
                            Evaluates the <span className="text-white font-medium">Adaptive Regime, Combined Synergy, and S/R Budget models</span> during 9:00 AM PHT evaluations.
                            Trades only when price tests key levels and target profit budget fits within boundary limits.
                        </p>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Dot ok={!!s && !s.error} /> Live · refreshed {Math.round((now - loadedAt) / 1000)}s ago
                    </div>
                </div>

                {s?.error && <div className="p-4 border border-red-500/20 rounded-2xl bg-red-500/5 text-sm text-red-300">Could not reach the orchestrator: {typeof s.error === 'object' ? JSON.stringify(s.error) : String(s.error)}</div>}

                <div className="flex flex-wrap items-center gap-2">
                    {([['live', 'Live S/R Monitor (Current Market)'], ['past', 'Past Data Backtest (1+ Year / 14 Months)']] as const).map(([key, label]) => (
                        <button key={key} onClick={() => setView(key)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${view === key ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm' : 'border-[#1a1a1a] text-muted-foreground hover:text-white'}`}>
                            {label}
                        </button>
                    ))}
                </div>

                {view === 'past' && (
                    <div className="p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-[#0d0d0d] to-[#080808] flex flex-col gap-3">
                        <div className="text-white font-semibold flex items-center gap-2"><LineChart className="h-5 w-5 text-emerald-400" /> S/R & TradingView Backtest: 1+ Year of Historical Data (14 Months)</div>
                        <p className="text-xs text-zinc-300 leading-relaxed max-w-4xl">
                            Evaluates every trading day at 9:00 AM Philippine Time (01:00 UTC) over 14 months (80,000 5-minute candles) using the 25% boundary proximity rule. Low-conviction chop in the middle 50% is skipped automatically.
                        </p>
                        {past?.runs?.length ? (
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="text-muted-foreground font-medium">Select Model:</span>
                                {past.runs.filter((r) => r.run.startsWith('sr-budget') || r.run === 'sr-tv-combined' || r.run === 'sr-adaptive').map((r) => (
                                    <button key={r.run} onClick={() => setRun(r.run)}
                                        className={`px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                                            past.run === r.run
                                                ? (r.run === 'sr-adaptive'
                                                    ? 'border-amber-400 bg-amber-500/25 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                                                    : r.run === 'sr-tv-combined'
                                                    ? 'border-sky-400 bg-sky-500/25 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                                                    : 'border-emerald-500/60 bg-emerald-500/25 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.3)]')
                                                : 'border-[#1a1a1a] text-muted-foreground hover:text-white'
                                        }`}>
                                        {runLabel(r.run)} · {r.signals} trades
                                    </button>
                                ))}
                            </div>
                        ) : past?.error ? <div className="text-xs text-red-300">Could not load past data: {typeof past.error === 'object' ? JSON.stringify(past.error) : String(past.error)}</div>
                          : past ? <div className="text-xs text-muted-foreground">No past-data runs saved yet.</div>
                          : <div className="text-xs text-muted-foreground">Loading...</div>}
                    </div>
                )}

                {view === 'live' && <>
                {/* How it works */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { icon: <Clock className="h-5 w-5 text-emerald-400" />, title: '1. Daily 9:00 AM PH Time', text: 'Executes every market weekday at 9:00 AM Philippine Time (01:00 UTC) during the calm Asian session (78% S/R hold rate).' },
                        { icon: <ShieldCheck className="h-5 w-5 text-sky-400" />, title: '2. S/R Budget Filter', text: 'Trades only when target profit budget exceeds recent range. Avoids whipsaws and skips low-conviction chop.' },
                        { icon: <CheckCircle2 className="h-5 w-5 text-emerald-400" />, title: '3. Instant Results', text: 'All trades resolve completely to Clean TP, Hedged TP, or Hedged SL on broker prices. Zero unfinished trades.' },
                    ].map((step) => (
                        <div key={step.title} className="p-5 rounded-2xl border border-[#1a1a1a] bg-gradient-to-br from-[#0d0d0d] to-[#080808]">
                            <div className="flex items-center gap-2 text-white font-semibold">{step.icon}{step.title}</div>
                            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{step.text}</p>
                        </div>
                    ))}
                </div>

                {/* Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <Card
                        icon={<Clock className="h-4 w-4" />} label="Trading Window" ok={true}
                        value="9:00 AM PHT"
                        sub="01:00 UTC · Mon–Fri (Asian Session Calm)"
                    />
                    <Card
                        icon={<CheckCircle2 className="h-4 w-4" />} label="Resolved Trades"
                        value={s?.counts ? `${s.counts.graded ?? 0} / ${s.counts.shadow ?? 0}` : '—'}
                        sub="Zero unfinished trades · Fully resolved"
                    />
                    <Card
                        icon={<CandlestickChart className="h-4 w-4" />} label="Price recording" ok={candlesFresh}
                        value={s?.candles?.last ? `$${Number(s.candles.last.close).toFixed(2)}` : '—'}
                        sub={s?.candles?.last ? <>{s.candles.last_hour ?? 0} minute candles in the last hour · {ago(s.candles.last.minute, now)}</> : 'Not recording yet'}
                    />
                    <Card
                        icon={<Gauge className="h-4 w-4" />} label="Volatility" ok={volFresh}
                        value={s?.volatility ? `$${Number(s.volatility.forecast_6h).toFixed(1)}/h` : '—'}
                        sub={s?.volatility ? <>Expected move next 6h{s.volatility.ratio_now != null ? ` · now ${Number(s.volatility.ratio_now).toFixed(1)}x normal` : ''} · {ago(s.volatility.computed_at, now)} · {s.volatility.source?.startsWith('VPS') ? 'VPS' : 'MT5'}</> : 'No numbers yet'}
                    />
                </div>

                </>}

                {view === 'live' && s?.scoreboard && <Scoreboard board={s.scoreboard} risk={s.reference?.risk ?? 100} luck={LUCK_A_RATE} cost={s.reference?.cost} sizing={liveSizing}
                    mainLabel={s.reference?.rule_mode ? 'S/R bounce (live)' : undefined} />}
                {view === 'past' && <VolatilityTimingCard />}
                {view === 'past' && !!past?.approaches?.length && <ApproachCompare list={past.approaches} selected={past.run} onSelect={setRun} cost={past.reference?.cost} />}
                {view === 'past' && past?.run && <div className="text-sm text-white font-semibold -mb-4">Selected Model: <span className={past.run === 'sr-adaptive' ? "text-amber-300 font-bold" : past.run === 'sr-tv-combined' ? "text-sky-300 font-bold" : "text-emerald-400 font-bold"}>{runLabel(past.run)}</span></div>}
                {view === 'past' && past?.scoreboard && <Scoreboard board={past.scoreboard} risk={past.reference?.risk ?? 100} luck={luckRate(pastTrig)} cost={past.reference?.cost}
                    sizing={pastSizing}
                    mainLabel={past.run === 'sr-adaptive' ? 'Adaptive Regime' : past.run === 'sr-tv-combined' ? 'S/R + TradingView Synergy' : past.run?.startsWith('sr-budget') ? `S/R Budget (${runLabel(past.run)})` : past.run?.startsWith('sr-bounce') ? 'Plain S/R bounce' : 'S/R Budget'} trig={pastTrig} />}

                {view === 'live' && !!s?.daily?.every.summary.days && <DailyTp daily={s.daily} title="Live S/R signals" />}
                {view === 'past' && !!past?.daily?.every.summary.days && past.run && <DailyTp daily={past.daily} title={runLabel(past.run)} />}

                {view === 'live' && s?.comparison && s.comparison.trades > 0 && <StrategyCompare c={s.comparison} risk={s.reference?.risk ?? 100} cost={s.reference?.cost} />}
                {view === 'past' && past?.comparison && past.comparison.trades > 0 && <StrategyCompare c={past.comparison} risk={past.reference?.risk ?? 100} cost={past.reference?.cost} trig={pastTrig} />}

                {view === 'live' && <VolatilityTimingCard />}
                {view === 'live' && <GoldCandleChart />}

                <TradeLog
                    signals={view === 'live' ? (s?.signals || []).filter((x) => x.shadow) : (past?.signals || [])}
                    now={now}
                    risk={s?.reference?.risk ?? 100}
                    title={view === 'live' ? 'Trade log: live signals, as if traded' : `Trade log: ${runLabel(past?.run ?? '')} (1+ Year / 14 Months), as if traded`}
                    emptyText={view === 'live' ? 'No shadow signals yet. The first one comes at the next :05 in low-volatility hours.' : 'No past-data results yet.'}
                    mainLabel={view === 'past' ? 'S/R Budget' : 'AI'}
                    total={view === 'past' ? past?.signals_total : undefined}
                    trig={view === 'past' ? pastTrig : 0.1}
                    sizing={view === 'past' ? pastSizing : liveSizing}
                />

                <div className="text-xs text-muted-foreground">
                    Full breakdown by score and settings: <Link href="/dashboard/trade/signal-results" className="text-[#4788ff] hover:text-white">Signal Results</Link>
                </div>
            </div>
        </div>
    )
}

export default PredictionMonitorPage
