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
    trade: { lot: number, risk: number, entry: number, sl: number, tp: number, trigger: number, close: number | null, hedged: boolean | null, pnl: number | null, hedge_price: number | null, hedge_hours: number | null, primary_pnl: number | null, hedge_pnl: number | null, slippage_pct: number | null } | null
    compare?: { tv: number | null, coin: number | null }
    natural?: { lot: number, main: number, backup: number, net: number } | null
    rule?: { support: number, resistance: number, range: number, window_hours: number, pump_dump: boolean } | null
    diagnostic?: { session?: string, location?: string, pos_pct?: number | null, reason?: string | null } | null
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
    reference?: { risk: number, max_lot: number, trigger_pct: number, tp: string, cost?: Cost }
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
    per_day?: { every: DaySummary, one_at_a_time: DaySummary }
}

type Past = {
    runs: { run: string, signals: number, from: string, to: string }[]
    run: string | null
    approaches?: Approach[]
    picker?: 'ai' | 'rating' | 'perfect'
    signals_total?: number
    daily?: Daily
    reference?: { risk: number, trigger_pct?: number, cost?: Cost }
    scoreboard?: Record<'ai' | 'tv' | 'coin', Tally>
    comparison?: Comparison
    signals: Signal[]
    error?: string
}

const RUN_LABEL: Record<string, string> = {
    'v1': 'AI: original prompt',
    'v2-candles-6h': 'AI: prompt with 6-hour candles (current)',
    'sr-budget-8': 'S/R budget 8%',
    'sr-budget-12': 'S/R budget 12%',
    'sr-budget-15': 'S/R budget 15%',
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
// Table sections, in order
const APPROACH_GROUPS: { key: string, title: string, note: string }[] = [
    { key: 'ai', title: 'The AI', note: 'what we run today' },
    { key: 'rating-trigger', title: 'Trade setup: when the backup opens', note: 'same side as the AI (the TradingView rating), same stop as the AI' },
    { key: 'sr-budget', title: 'Your support/resistance budget rule', note: 'trades only when the stop is wider than the recent range' },
    { key: 'perfect-8h', title: 'Ceiling: a perfect forecaster', note: 'knows where gold will be 8 hours later — no AI or prompt can do better than this' },
]
const groupOf = (a: Approach) => a.rule?.name ?? 'ai'
const runLabel = (run: string) => RUN_LABEL[run] ?? run
// How each approach works, in one line
const approachHow = (a: Approach) => {
    const t = Math.round(a.trigger * 100)
    const r = a.rule
    const sessionNote = a.run.includes('-london-ny') ? ' (London & NY: 07:00–17:00 UTC only)' : a.run.includes('-asia') ? ' (Asia/off-hours only)' : ''
    if (r?.name === 'sr-budget') return `Trades only when $${r.target?.toLocaleString()} × ${Math.round((r.f ?? 0) * 100)}% = $${r.budget} is more than the support–resistance gap × ${r.lot} lot. Stop = TP = $${r.sl_distance} move. Side from the TradingView rating.`
    if (r?.name === 'rating-trigger') return `${a.run.endsWith('-hourly') ? 'A signal every hour, like the live test. ' : ''}The TradingView rating picks the side (the AI copies it). Backup opens once the price moves ${t}% of the way to the stop. Stop = 1.5 × hourly ATR (about $${a.avg_sl?.toFixed(0) ?? '—'}), TP = stop.${sessionNote}`
    if (r?.name === 'perfect-8h') return `Cheats: always picks the side gold will be on 8 hours later. Backup at a ${t}% dip, same stop as the AI (about $${a.avg_sl?.toFixed(0) ?? '—'}).${sessionNote}`
    return `The AI (qwen) picks buy or sell at about 1 moment in 4 hours; stop from the AI (about $${a.avg_sl?.toFixed(0) ?? '—'} move), TP = stop, backup at a ${t}% dip.${sessionNote}`
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
const localTime = (iso: string) => new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

const STORY: Record<string, { label: string, cls: string }> = {
    A: { label: 'TP, no hedge', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    B: { label: 'Hedged, SL', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    C: { label: 'Hedged, TP', cls: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
    X: { label: 'Unfinished', cls: 'bg-white/5 text-muted-foreground border-white/10' },
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

// Totals over every graded shadow signal, per picker
const Scoreboard = ({ board, risk, luck, cost, mainLabel = 'AI (qwen)', trig = 0.1 }: { board?: Record<'ai' | 'tv' | 'coin', Tally> | null, risk: number, luck: number | null, cost?: Cost, mainLabel?: string, trig?: number }) => {
    if (!board) return null
    const rows: { key: 'ai' | 'tv' | 'coin', label: string, cls: string }[] = [
        { key: 'ai', label: mainLabel, cls: 'text-violet-300' },
        { key: 'tv', label: 'TradingView rating', cls: 'text-sky-300' },
        { key: 'coin', label: 'Coin flip', cls: 'text-zinc-300' },
    ]
    return (
        <div className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1a1a1a] flex flex-col md:flex-row md:items-end justify-between gap-2">
                <div>
                    <div className="text-sm font-semibold text-white flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Scoreboard: graded signals</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                        Each signal as if traded at ${risk} risk (lot sized to it, max 0.30), TP = SL distance, equal-lot hedge at a {Math.round(trig * 100)}% dip
                    </div>
                </div>
                {luck !== null && <div className="text-xs text-muted-foreground">Luck: about <span className="text-amber-300 font-semibold">{(luck / 10).toFixed(1)} in 10</span> hit TP without the hedge · goal <span className="text-emerald-400 font-semibold">2 in 10</span></div>}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="text-[11px] uppercase tracking-widest text-muted-foreground">
                        <tr className="border-b border-[#1a1a1a]">
                            <th className="px-5 py-2.5 text-left">Picker</th>
                            <th className="px-3 py-2.5 text-left">TP without hedge</th>
                            <th className="px-3 py-2.5 text-left">Hedged, then SL</th>
                            <th className="px-3 py-2.5 text-left">Hedged, then TP</th>
                            <th className="px-3 py-2.5 text-left">Unfinished in 8h</th>
                            <th className="px-3 py-2.5 text-left">Hedge slippage</th>
                            <th className="px-3 py-2.5 text-right pr-5">Result at ${risk} risk</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#141414]">
                        {rows.map((r) => {
                            const t = board?.[r.key] ?? { a: 0, b: 0, c: 0, x: 0, resolved: 0, a_rate: null, a_rate_all: null, pnl: 0, hedges: 0, slippage_avg_pct: null, slippage_max_pct: null }
                            return (
                                <tr key={r.key}>
                                    <td className={`px-5 py-3 font-semibold ${r.cls}`}>{r.label}</td>
                                    <td className="px-3 py-3">
                                        <span className="text-lg font-bold text-emerald-400">{t.a ?? 0}</span>
                                        <span className="text-muted-foreground"> of {t.resolved ?? 0}</span>
                                        {t.a_rate != null && !isNaN(Number(t.a_rate)) && <span className="ml-2 text-xs text-white">({(Number(t.a_rate) / 10).toFixed(1)} in 10)</span>}
                                        {t.a_rate_all != null && (t.x ?? 0) > 0 && <div className="text-[11px] text-muted-foreground">{(Number(t.a_rate_all) / 10).toFixed(1)} in 10 counting unfinished</div>}
                                    </td>
                                    <td className="px-3 py-3 text-amber-400 font-semibold">{t.b ?? 0}</td>
                                    <td className="px-3 py-3 text-sky-400 font-semibold">{t.c ?? 0}</td>
                                    <td className="px-3 py-3 text-muted-foreground">{t.x ?? 0}</td>
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
                TP without hedge = +${risk} · hedged either way = −${(risk * trig).toFixed(0)} (the {Math.round(trig * 100)}% dip) · unfinished after 8h = −${(risk * trig).toFixed(0)} if the hedge had opened (locked), else the price at 8h. {costText(cost)}
                Slippage = (actual hedge loss − planned 10% loss) ÷ planned loss, from 1-minute prices (real broker fills can slip more).
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
                                            <div>{d.b + d.c} hedged · {d.x} unfinished</div>
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
    
    const sorted = (key: string) => list.filter((a) => groupOf(a) === key).sort((a, b) => (a.rule?.f ?? a.trigger) - (b.rule?.f ?? b.trigger) || a.run.localeCompare(b.run))

    const filteredGroups = APPROACH_GROUPS.filter((g) => {
        if (filter === 'all') return sorted(g.key).length > 0
        return g.key === filter && sorted(g.key).length > 0
    })

    const srWinner8 = (list || []).find((a) => a.run === 'sr-budget-8')
    const srWinner12 = (list || []).find((a) => a.run === 'sr-budget-12')

    return (
        <div className="flex flex-col gap-4">
            {/* Champion S/R Highlight Banner */}
            <div className="p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-[#0c150e] to-[#080808] flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-lg">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mt-0.5">
                        <Trophy className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5" /> High-Profit Performer
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                                Recommended
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-white mt-1">
                            Support & Resistance Budget Strategy (+8% & +12%)
                        </h3>
                        <p className="text-xs text-zinc-300 mt-1 max-w-3xl leading-relaxed">
                            Trades only when your target profit budget exceeds the recent S/R boundary gap. By skipping low-conviction chop, it avoided <span className="text-emerald-400 font-bold">-$90,422 in whipsaw losses</span> and yielded <span className="text-emerald-400 font-bold">+$7.86 / trade</span> net profit with <span className="text-white font-semibold">2.6 in 10 clean TPs</span> (vs 0.9 luck).
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    {srWinner8 && (
                        <button
                            onClick={() => onSelect('sr-budget-8')}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                                selected === 'sr-budget-8'
                                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.35)]'
                                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/25'
                            }`}
                        >
                            <span>Inspect 8% Rule</span>
                            <span className="px-1.5 py-0.2 rounded bg-black/30 text-[10px] tabular-nums font-mono">+$7.86/t</span>
                        </button>
                    )}
                    {srWinner12 && (
                        <button
                            onClick={() => onSelect('sr-budget-12')}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                                selected === 'sr-budget-12'
                                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.35)]'
                                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/25'
                            }`}
                        >
                            <span>Inspect 12% Rule</span>
                            <span className="px-1.5 py-0.2 rounded bg-black/30 text-[10px] tabular-nums font-mono">+$3,487</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Main Approaches Comparison Table Card */}
            <div className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden">
                <div className="p-5 border-b border-[#1a1a1a] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                                <Layers className="h-4 w-4" />
                            </div>
                            <h3 className="text-base font-bold text-white">Compare All 17 Approaches</h3>
                            <span className="text-xs text-muted-foreground">8 Months Backtested (5,917 Hours)</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Same gold price candles, same $100 risk, same broker costs. Click any row to load its trade replay log.
                        </p>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#121212] rounded-xl border border-[#1f1f1f]">
                        {[
                            { key: 'all', label: 'All (17)' },
                            { key: 'sr-budget', label: '⭐ S/R Budget (3)' },
                            { key: 'ai', label: 'AI Prompts (2)' },
                            { key: 'rating-trigger', label: 'Fixed Dips (8)' },
                            { key: 'perfect-8h', label: 'Forecaster Ceiling (4)' },
                        ].map((btn) => (
                            <button
                                key={btn.key}
                                onClick={() => setFilter(btn.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    filter === btn.key
                                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm'
                                        : 'text-muted-foreground hover:text-white'
                                }`}
                            >
                                {btn.label}
                            </button>
                        ))}
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
                                <th className="px-3 py-3 text-center">Coin Flip Luck</th>
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
                                        const isSR = a.rule?.name === 'sr-budget'
                                        const totalNet = a.delayed_per_trade != null ? a.delayed_per_trade * a.trades : null
                                        const isProfitable = (a.delayed_per_trade ?? 0) > 0

                                        return (
                                            <tr
                                                key={a.run}
                                                onClick={() => onSelect(a.run)}
                                                className={`cursor-pointer transition-colors ${
                                                    isSelected
                                                        ? 'bg-sky-500/10 border-l-2 border-l-sky-400'
                                                        : isSR
                                                        ? 'bg-emerald-950/10 hover:bg-emerald-950/20 border-l-2 border-l-emerald-500/60'
                                                        : 'hover:bg-white/[0.02]'
                                                }`}
                                            >
                                                {/* Approach Details */}
                                                <td className="px-5 py-3 max-w-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-bold ${
                                                            isSR ? 'text-emerald-300' :
                                                            a.picker === 'perfect' ? 'text-sky-300' :
                                                            a.rule ? 'text-zinc-200' : 'text-violet-300'
                                                        }`}>
                                                            {runLabel(a.run)}
                                                        </span>
                                                        {isSR && (
                                                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                                TOP PERFORMER
                                                            </span>
                                                        )}
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
                                                    <div className="text-xs">{rate(a.coin.a_rate_all)}</div>
                                                    <div className="text-[10px]">coin flip</div>
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
                                                        <span className={`font-bold text-sm ${totalNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            {money(totalNet)}
                                                        </span>
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
const TradeLog = ({ signals, now, risk, title, emptyText, mainLabel = 'AI', total, trig = 0.1 }: { signals: Signal[], now: number, risk: number, title: string, emptyText: string, mainLabel?: string, total?: number, trig?: number }) => {
    const px = (v?: number) => (v ? v.toFixed(2) : '—')

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
                            {mainLabel} signals evaluated on 5-minute broker prices · $100 risk · {Math.round(trig * 100)}% dip hedge
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
                            <th className="px-5 py-3 text-left">Opened / Session</th>
                            <th className="px-3 py-3 text-left">Direction & S/R Level</th>
                            <th className="px-3 py-3 text-right">Lots</th>
                            <th className="px-3 py-3 text-right">TP Target</th>
                            <th className="px-3 py-3 text-right">SL Stop</th>
                            <th className="px-3 py-3 text-right">Entry</th>
                            <th className="px-3 py-3 text-right">Exit Price</th>
                            <th className="px-3 py-3 text-right">Trade Net PnL</th>
                            <th className="px-3 py-3 text-right">Duration</th>
                            <th className="px-3 py-3 text-left">Final Outcome & Diagnostics</th>
                            <th className="px-4 py-3 text-left pr-5">Benchmark Comparison</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#141414]">
                        {signals.map((x) => {
                            const hoursLeft = Math.max(0, GRADE_DELAY_H - (now - new Date(x.created_at).getTime()) / 3600000)
                            const pending = x.skipped ? 'skipped' : hoursLeft > 0 ? `grading in ${Math.ceil(hoursLeft)}h` : 'grading soon'
                            const t = x.trade
                            const session = x.diagnostic?.session || ''

                            return (
                                <tr key={x.id} className="hover:bg-white/[0.02] transition-colors">
                                    {/* Time & Session */}
                                    <td className="px-5 py-3 text-white whitespace-nowrap">
                                        <div className="font-medium">{localTime(x.created_at)}</div>
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
                                                    (x.diagnostic.pos_pct ?? 50) <= 25
                                                        ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
                                                        : (x.diagnostic.pos_pct ?? 50) >= 75
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
                                                        Main {money(t.primary_pnl)} · Hedge {t.hedged && t.hedge_pnl ? money(t.hedge_pnl) : '$0'}
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
                                </tr>
                            )
                        })}
                        {!signals.length && (
                            <tr>
                                <td colSpan={11} className="px-5 py-12 text-center text-sm text-muted-foreground">
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
        </div>
    )
}

const PredictionMonitorPage = () => {
    const [status, setStatus] = useState<Status | null>(null)
    const [loadedAt, setLoadedAt] = useState(Date.now())
    const [clock, setClock] = useState(Date.now())
    const [view, setView] = useState<'live' | 'past'>('live')
    const [past, setPast] = useState<Past | null>(null)
    const [run, setRun] = useState<string>('')

    useEffect(() => {
        if (view !== 'past') return
        fetch(`/api/replay-results${run ? `?run=${encodeURIComponent(run)}` : ''}`, { cache: 'no-store' })
            .then((r) => r.json())
            .then((d) => { setPast(d); if (!run && d.run) setRun(d.run) })
            .catch((e) => setPast({ error: e.message } as Past))
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

    return (
        <div suppressHydrationWarning className="animate-in fade-in duration-500 w-full p-6 bg-[#050505] min-h-screen">
            <div className="w-full flex flex-col gap-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Activity className="h-6 w-6 text-violet-400" />
                            AI Prediction Test
                        </h2>
                        <p className="text-sm text-muted-foreground max-w-2xl">
                            Does the AI pick trades that hit take-profit <span className="text-white font-medium">without the hedge ever opening</span>?
                            Every hour it makes a real signal that is never traded, and 8 hours later the market shows whether it was right.
                        </p>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Dot ok={!!s && !s.error} /> Live · refreshed {Math.round((now - loadedAt) / 1000)}s ago
                    </div>
                </div>

                {s?.error && <div className="p-4 border border-red-500/20 rounded-2xl bg-red-500/5 text-sm text-red-300">Could not reach the orchestrator: {typeof s.error === 'object' ? JSON.stringify(s.error) : String(s.error)}</div>}

                <div className="flex flex-wrap items-center gap-2">
                    {([['live', 'Live test (from now on)'], ['past', 'Past data test (8 months back)']] as const).map(([key, label]) => (
                        <button key={key} onClick={() => setView(key)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${view === key ? 'bg-violet-500/15 border-violet-500/40 text-white' : 'border-[#1a1a1a] text-muted-foreground hover:text-white'}`}>
                            {label}
                        </button>
                    ))}
                </div>

                {view === 'past' && (
                    <div className="p-5 rounded-2xl border border-[#1a1a1a] bg-gradient-to-br from-[#0d0d0d] to-[#080808] flex flex-col gap-3">
                        <div className="text-white font-semibold flex items-center gap-2"><LineChart className="h-5 w-5 text-sky-400" /> Past data test: acting as if it were that moment</div>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-4xl">
                            For moments over the last 8 months, each approach sees only what was known at that moment (the candles and indicators up to then, nothing after) and picks buy or sell.
                            The trade is then graded on the 8 hours that actually followed, on your broker&apos;s 5-minute prices. Past news headlines can&apos;t be recovered, so news is left out here; the live test includes it.
                        </p>
                        {past?.runs?.length ? (
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="text-muted-foreground">Test run:</span>
                                {past.runs.map((r) => (
                                    <button key={r.run} onClick={() => setRun(r.run)}
                                        className={`px-3 py-1.5 rounded-lg border ${past.run === r.run ? 'border-sky-500/40 bg-sky-500/10 text-white' : 'border-[#1a1a1a] text-muted-foreground hover:text-white'}`}>
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
                        { icon: <Brain className="h-5 w-5 text-violet-400" />, title: '1. Predict', text: 'Every hour the AI reads the gold chart, trend and news, and says buy or sell. Nothing is traded.' },
                        { icon: <Clock className="h-5 w-5 text-sky-400" />, title: '2. Wait 8 hours', text: 'The market plays out. Gold prices are recorded every 2 seconds into 1-minute candles.' },
                        { icon: <CheckCircle2 className="h-5 w-5 text-emerald-400" />, title: '3. Grade', text: 'Did it hit TP before dipping 10% (no hedge needed)? Compared with the TradingView rating and a coin flip.' },
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
                        icon={<Brain className="h-4 w-4" />} label="Shadow signals" ok={!!s?.shadow_enabled}
                        value={s?.counts ? s.counts.shadow : '—'}
                        sub={s?.counts ? <>Last {lastSignal ? ago(lastSignal.created_at, now) : 'none yet'} · next in {isNaN(nextIn) ? '—' : `${Math.floor(nextIn / 60)}:${String(nextIn % 60).padStart(2, '0')}`}</> : s?.error ? 'Status unavailable' : 'Loading...'}
                    />
                    <Card
                        icon={<CheckCircle2 className="h-4 w-4" />} label="Graded"
                        value={s?.counts ? `${s.counts.graded ?? 0} / ${s.counts.shadow ?? 0}` : '—'}
                        sub="Each signal is graded 8 hours after it is made"
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

                {view === 'live' && s?.scoreboard && <Scoreboard board={s.scoreboard} risk={s.reference?.risk ?? 100} luck={LUCK_A_RATE} cost={s.reference?.cost} />}
                {view === 'past' && <VolatilityTimingCard />}
                {view === 'past' && !!past?.approaches?.length && <ApproachCompare list={past.approaches} selected={past.run} onSelect={setRun} cost={past.reference?.cost} />}
                {view === 'past' && past?.run && <div className="text-sm text-white font-semibold -mb-4">Selected: <span className="text-sky-300">{runLabel(past.run)}</span></div>}
                {view === 'past' && past?.scoreboard && <Scoreboard board={past.scoreboard} risk={past.reference?.risk ?? 100} luck={luckRate(pastTrig)} cost={past.reference?.cost}
                    mainLabel={past.picker === 'perfect' ? 'Perfect forecaster' : past.picker === 'rating' ? 'This rule (TV rating side)' : 'AI (qwen)'} trig={pastTrig} />}

                {view === 'live' && !!s?.daily?.every.summary.days && <DailyTp daily={s.daily} title="Live shadow signals (one every hour)" />}
                {view === 'past' && !!past?.daily?.every.summary.days && past.run && <DailyTp daily={past.daily} title={runLabel(past.run)} />}

                {view === 'live' && s?.comparison && s.comparison.trades > 0 && <StrategyCompare c={s.comparison} risk={s.reference?.risk ?? 100} cost={s.reference?.cost} />}
                {view === 'past' && past?.comparison && past.comparison.trades > 0 && <StrategyCompare c={past.comparison} risk={past.reference?.risk ?? 100} cost={past.reference?.cost} trig={pastTrig} />}

                {view === 'live' && <VolatilityTimingCard />}
                {view === 'live' && <GoldCandleChart />}

                <TradeLog
                    signals={view === 'live' ? (s?.signals || []).filter((x) => x.shadow) : (past?.signals || [])}
                    now={now}
                    risk={s?.reference?.risk ?? 100}
                    title={view === 'live' ? 'Trade log: live signals, as if traded' : 'Trade log: past moments, as if traded'}
                    emptyText={view === 'live' ? 'No shadow signals yet. The first one comes at the next :05.' : 'No past-data results yet.'}
                    mainLabel={view === 'past' && past?.picker === 'perfect' ? 'Forecaster' : view === 'past' && past?.picker === 'rating' ? 'Rule' : 'AI'}
                    total={view === 'past' ? past?.signals_total : undefined}
                    trig={view === 'past' ? pastTrig : 0.1}
                />

                <div className="text-xs text-muted-foreground">
                    Full breakdown by score and settings: <Link href="/dashboard/trade/signal-results" className="text-[#4788ff] hover:text-white">Signal Results</Link>
                </div>
            </div>
        </div>
    )
}

export default PredictionMonitorPage
