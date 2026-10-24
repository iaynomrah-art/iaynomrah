"use client"

// Temporary presentation page: live view of the AI prediction test (shadow mode)
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Activity, Brain, CandlestickChart, CheckCircle2, Clock, Gauge, LineChart } from 'lucide-react'
import GoldCandleChart from '@/components/chart/GoldCandleChart'
import { Bar, BarChart as DailyBarChart, CartesianGrid, Line, LineChart as RunningTotalChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

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

const money = (v: number) => `${v >= 0 ? '+' : '−'}$${Math.abs(v).toFixed(2)}`

// Totals over every graded shadow signal, per picker
const Scoreboard = ({ board, risk, luck, cost, mainLabel = 'AI (qwen)', trig = 0.1 }: { board: Record<'ai' | 'tv' | 'coin', Tally>, risk: number, luck: number | null, cost?: Cost, mainLabel?: string, trig?: number }) => {
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
                            const t = board[r.key]
                            return (
                                <tr key={r.key}>
                                    <td className={`px-5 py-3 font-semibold ${r.cls}`}>{r.label}</td>
                                    <td className="px-3 py-3">
                                        <span className="text-lg font-bold text-emerald-400">{t.a}</span>
                                        <span className="text-muted-foreground"> of {t.resolved}</span>
                                        {t.a_rate !== null && <span className="ml-2 text-xs text-white">({(t.a_rate / 10).toFixed(1)} in 10)</span>}
                                        {t.a_rate_all != null && t.x > 0 && <div className="text-[11px] text-muted-foreground">{(t.a_rate_all / 10).toFixed(1)} in 10 counting unfinished</div>}
                                    </td>
                                    <td className="px-3 py-3 text-amber-400 font-semibold">{t.b}</td>
                                    <td className="px-3 py-3 text-sky-400 font-semibold">{t.c}</td>
                                    <td className="px-3 py-3 text-muted-foreground">{t.x}</td>
                                    <td className="px-3 py-3 text-xs">
                                        {t.slippage_avg_pct != null
                                            ? <><span className={t.slippage_avg_pct > 0 ? 'text-red-400 font-semibold' : 'text-white font-semibold'}>{t.slippage_avg_pct.toFixed(1)}% avg</span><span className="text-muted-foreground"> · max {t.slippage_max_pct?.toFixed(1)}% · {t.hedges} hedges</span></>
                                            : <span className="text-muted-foreground">no hedges</span>}
                                    </td>
                                    <td className={`px-3 py-3 pr-5 text-right font-bold ${t.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{money(t.pnl)}</td>
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
const StrategyCompare = ({ c, risk, cost, trig = 0.1 }: { c: Comparison, risk: number, cost?: Cost, trig?: number }) => {
    const diff = c.delayed.net - c.natural.net
    const spared = c.trades - c.delayed.backup_used
    const cls = (v: number) => v > 0 ? 'text-emerald-400' : v < 0 ? 'text-red-400' : 'text-white'
    const Side = ({ title, how, t, tone }: { title: string, how: string, t: StrategyTotals, tone: string }) => (
        <div className={`p-5 rounded-2xl border ${tone} bg-[#0a0a0a] flex flex-col gap-4`}>
            <div>
                <div className="text-base font-bold text-white">{title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{how}</div>
            </div>
            <div>
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Total, both accounts</div>
                <div className={`text-3xl font-bold ${cls(t.net)}`}>{money(t.net)}</div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-[#1a1a1a]">
                    <div className="text-[11px] text-muted-foreground">Main account</div>
                    <div className={`font-bold ${cls(t.main)}`}>{money(t.main)}</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-[#1a1a1a]">
                    <div className="text-[11px] text-muted-foreground">Backup account</div>
                    <div className={`font-bold ${cls(t.backup)}`}>{money(t.backup)}</div>
                </div>
            </div>
            <div className="text-xs text-muted-foreground">
                Backup account had to trade in <span className="text-white font-semibold">{t.backup_used} of {c.trades}</span> trades
            </div>
        </div>
    )
    return (
        <div className="rounded-2xl border border-[#1a1a1a] bg-[#080808] p-5 flex flex-col gap-5">
            <div>
                <div className="text-lg font-bold text-white">Delayed hedge vs normal hedge</div>
                <div className="text-sm text-muted-foreground">Same {c.trades} trades (unfinished ones at their 8-hour result), same lot sizes (about ${risk} risk each). Only the way the backup account is used changes.</div>
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
                In plain words: over these {c.trades} trades the delayed hedge ended <b className={cls(diff)}>{money(diff)}</b> {diff >= 0 ? 'ahead of' : 'behind'} normal hedging,
                and the backup account stayed out of <b>{spared}</b> trades ({c.trades ? Math.round((spared / c.trades) * 100) : 0}%). With normal hedging it trades every time.
            </div>

            {c.series.length > 1 && (
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
const DailyTp = ({ daily, title }: { daily: Daily, title: string }) => {
    const [mode, setMode] = useState<'one_at_a_time' | 'every'>('one_at_a_time')
    const { days, summary: m } = daily[mode]
    if (!m.days) return null
    const pct = (n: number) => `${Math.round((n / m.days) * 100)}%`
    const dayLabel = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString([], { month: 'short', day: 'numeric', timeZone: 'UTC' })
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
                    <div className="text-2xl font-bold text-emerald-400">{m.a_per_day.toFixed(2)}</div>
                    <div className="text-[11px] text-muted-foreground">{m.a_per_day > 0 ? `about 1 every ${(1 / m.a_per_day).toFixed(1)} days` : 'none'} · out of {m.trades_per_day} trades a day</div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-[#1a1a1a]">
                    <div className="text-[11px] text-muted-foreground uppercase tracking-widest">Days with at least one</div>
                    <div className="text-2xl font-bold text-white">{pct(m.days - m.days_by_tp['0'])}</div>
                    <div className="text-[11px] text-muted-foreground">{m.days - m.days_by_tp['0']} of {m.days} trading days · best day {m.best_day}</div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-[#1a1a1a]">
                    <div className="text-[11px] text-muted-foreground uppercase tracking-widest">Result a day</div>
                    <div className={`text-2xl font-bold ${m.pnl_per_day >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{money(m.pnl_per_day)}</div>
                    <div className="text-[11px] text-muted-foreground">both accounts, delayed hedge, costs included</div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-[#1a1a1a]">
                    <div className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1.5">Days by TP count</div>
                    {(['0', '1', '2', '3+'] as const).map((k) => (
                        <div key={k} className="flex items-center gap-2 text-[11px]">
                            <span className="w-14 text-muted-foreground">{k} TP</span>
                            <div className="flex-1 h-2 rounded bg-white/5 overflow-hidden"><div className={`h-full ${k === '0' ? 'bg-zinc-600' : 'bg-emerald-500'}`} style={{ width: pct(m.days_by_tp[k]) }} /></div>
                            <span className="w-16 text-right text-white tabular-nums">{m.days_by_tp[k]} days</span>
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
    const rate = (v: number | null | undefined) => v == null ? '—' : `${(v / 10).toFixed(1)} in 10`
    const usd = (v: number | null) => v == null ? '—' : money(v)
    const sorted = (key: string) => list.filter((a) => groupOf(a) === key).sort((a, b) => (a.rule?.f ?? a.trigger) - (b.rule?.f ?? b.trigger) || a.run.localeCompare(b.run))
    return (
        <div className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1a1a1a] flex flex-col md:flex-row md:items-end justify-between gap-2">
                <div>
                    <div className="text-lg font-bold text-white">Compare approaches</div>
                    <div className="text-xs text-muted-foreground mt-0.5 max-w-3xl">
                        Each approach on the same 8 months of gold prices, traded the same way: about $100 risk, TP = stop, backup opens at a 10% dip unless the row says otherwise, results taken at 8 hours at the latest.
                        Click a row to see its trades below.
                    </div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">Goal <span className="text-emerald-400 font-semibold">2 in 10</span> · luck = the coin flip column</div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="text-[11px] uppercase tracking-widest text-muted-foreground">
                        <tr className="border-b border-[#1a1a1a] align-bottom">
                            <th className="px-5 py-2.5 text-left">Approach</th>
                            <th className="px-3 py-2.5 text-right">Trades</th>
                            <th className="px-3 py-2.5 text-left">TP without hedge<div className="normal-case tracking-normal text-[10px]">out of every trade</div></th>
                            <th className="px-3 py-2.5 text-left">TP per day<div className="normal-case tracking-normal text-[10px]">one trade at a time</div></th>
                            <th className="px-3 py-2.5 text-left">Coin flip<div className="normal-case tracking-normal text-[10px]">same moments</div></th>
                            <th className="px-3 py-2.5 text-left">Not finished<div className="normal-case tracking-normal text-[10px]">within 8 hours</div></th>
                            <th className="px-3 py-2.5 text-right">Per trade<div className="normal-case tracking-normal text-[10px]">delayed hedge</div></th>
                            <th className="px-3 py-2.5 text-right">Per trade<div className="normal-case tracking-normal text-[10px]">normal hedge</div></th>
                            <th className="px-3 py-2.5 text-left pr-5">Moments it skipped<div className="normal-case tracking-normal text-[10px]">how they would have done</div></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#141414]">
                        {APPROACH_GROUPS.filter((g) => sorted(g.key).length).map((g) => (
                            <React.Fragment key={g.key}>
                            <tr className="bg-white/[0.025]">
                                <td colSpan={9} className="px-5 py-2 text-[11px]">
                                    <span className="text-white font-semibold uppercase tracking-wider">{g.title}</span>
                                    <span className="text-muted-foreground"> · {g.note}</span>
                                </td>
                            </tr>
                            {sorted(g.key).map((a) => {
                            const allRate = a.main.a_rate_all ?? 0
                            return (
                                <tr key={a.run} onClick={() => onSelect(a.run)}
                                    className={`cursor-pointer align-top ${selected === a.run ? 'bg-sky-500/[0.06]' : 'hover:bg-white/[0.02]'}`}>
                                    <td className="px-5 py-3 max-w-md">
                                        <div className={`font-semibold ${a.picker === 'perfect' ? 'text-emerald-300' : a.rule ? 'text-sky-300' : 'text-violet-300'}`}>{runLabel(a.run)}</div>
                                        <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">{approachHow(a)}</div>
                                    </td>
                                    <td className="px-3 py-3 text-right text-white tabular-nums">{a.trades}{a.skipped && <div className="text-[10px] text-muted-foreground">of {a.moments} hours</div>}</td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <div className={`text-lg font-bold ${allRate >= 20 ? 'text-emerald-400' : allRate >= 10 ? 'text-white' : 'text-amber-300'}`}>{rate(a.main.a_rate_all)}</div>
                                        <div className="text-[11px] text-muted-foreground">{a.main.a} of {a.main.graded} · {rate(a.main.a_rate)} of finished</div>
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        {a.per_day ? <>
                                            <div className="text-white font-bold">{a.per_day.one_at_a_time.a_per_day.toFixed(2)} <span className="text-[11px] font-normal text-muted-foreground">a day</span></div>
                                            <div className="text-[10px] text-muted-foreground">{a.per_day.one_at_a_time.days_by_tp['0']} of {a.per_day.one_at_a_time.days} days with none · all signals {a.per_day.every.a_per_day.toFixed(2)}</div>
                                        </> : '—'}
                                    </td>
                                    <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">{rate(a.coin.a_rate_all)}{a.trigger !== 0.1 && <div className="text-[10px]">luck rises with the trigger ({(luckRate(a.trigger) / 10).toFixed(1)} of finished)</div>}</td>
                                    <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">{a.main.graded ? Math.round((a.main.x / a.main.graded) * 100) : 0}%</td>
                                    <td className={`px-3 py-3 text-right font-bold tabular-nums ${(a.delayed_per_trade ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{usd(a.delayed_per_trade)}</td>
                                    <td className={`px-3 py-3 text-right font-bold tabular-nums ${(a.natural_per_trade ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{usd(a.natural_per_trade)}</td>
                                    <td className="px-3 py-3 pr-5 text-[11px] text-muted-foreground whitespace-nowrap">
                                        {a.skipped ? <>{a.skipped.moments} skipped · <span className="text-white">{rate(a.skipped.a_rate_all)}</span> · {usd(a.skipped.delayed_per_trade)} per trade</> : 'trades every moment'}
                                    </td>
                                </tr>
                            )
                            })}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="px-5 py-3 border-t border-[#1a1a1a] text-[11px] text-muted-foreground leading-relaxed">
                <b className="text-white">Why &quot;out of every trade&quot;:</b> a wider stop takes longer to reach, so more trades are still open after 8 hours. Counting only the finished ones makes a wide stop look better than it is.
                Out of every trade is what the accounts actually feel. A rule helps only if its trades beat the coin flip and the moments it skipped.
                A wider trigger lets more trades reach TP without the hedge, but every hedged trade then loses more (15% or 20% of the stop instead of 10%), so compare the per-trade dollars too.
                The S/R rule and the hourly row check every hour (like the live test); the other rows use the same moments as the AI, about 1 in 4 hours, so they have fewer chances per day. TP per day counts trading days with signals; &quot;one trade at a time&quot; opens the next trade only after the last one closed (what one pair of accounts can do). {costText(cost)}
            </div>
        </div>
    )
}

// One row per AI signal, as if traded (used by the live and the past-data views)
const TradeLog = ({ signals, now, risk, title, emptyText, mainLabel = 'AI', total, trig = 0.1 }: { signals: Signal[], now: number, risk: number, title: string, emptyText: string, mainLabel?: string, total?: number, trig?: number }) => (
    <div className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1a1a1a] flex items-center justify-between">
            <div className="text-sm font-semibold text-white flex items-center gap-2"><Activity className="h-4 w-4 text-violet-400" /> {title}</div>
            <div className="text-[11px] text-muted-foreground text-right">
                Each row is the {mainLabel === 'AI' ? 'AI’s' : mainLabel === 'Forecaster' ? 'perfect forecaster’s' : 'rule’s'} trade, as if traded at about ${risk} risk · trigger {Math.round(trig * 100)}% · TP = SL · costs included
                {total != null && total > signals.length && <div>Showing the latest {signals.length} of {total}</div>}
            </div>
        </div>
        <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
            <table className="w-full text-sm">
                <thead className="text-[11px] uppercase tracking-widest text-muted-foreground sticky top-0 bg-[#0a0a0a] z-10">
                    <tr className="border-b border-[#1a1a1a]">
                        <th className="px-5 py-2.5 text-left">Opened</th>
                        <th className="px-3 py-2.5 text-left">Position</th>
                        <th className="px-3 py-2.5 text-right">Lots</th>
                        <th className="px-3 py-2.5 text-right">TP</th>
                        <th className="px-3 py-2.5 text-right">SL</th>
                        <th className="px-3 py-2.5 text-right">Open price</th>
                        <th className="px-3 py-2.5 text-right">Close price</th>
                        <th className="px-3 py-2.5 text-right">{mainLabel} trade: profit / loss</th>
                        <th className="px-3 py-2.5 text-right">Hours</th>
                        <th className="px-3 py-2.5 text-left">How it ended</th>
                        <th className="px-3 py-2.5 text-left">If instead this picked the side (net)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#141414]">
                    {signals.map((x) => {
                        const hoursLeft = Math.max(0, GRADE_DELAY_H - (now - new Date(x.created_at).getTime()) / 3600000)
                        const pending = x.skipped ? 'skipped' : hoursLeft > 0 ? `grading in ${Math.ceil(hoursLeft)}h` : 'grading soon'
                        const t = x.trade
                        const px = (v?: number) => v ? v.toFixed(2) : '—'
                        return (
                            <tr key={x.id} className="hover:bg-white/[0.02]">
                                <td className="px-5 py-3 text-white whitespace-nowrap">{localTime(x.created_at)}</td>
                                <td className="px-3 py-3 whitespace-nowrap">
                                    <Dir d={x.ai} /> {x.score != null && <span className="text-[11px] text-muted-foreground">score {x.score}</span>}
                                    {x.rule && <div className="text-[10px] text-muted-foreground mt-0.5">S/R {x.rule.support.toFixed(2)}–{x.rule.resistance.toFixed(2)} (${x.rule.range.toFixed(2)}, last {x.rule.window_hours}h{x.rule.pump_dump ? ', after a pump/dump' : ''})</div>}
                                </td>
                                <td className="px-3 py-3 text-right text-white tabular-nums">{t ? t.lot.toFixed(2) : '—'}</td>
                                <td className="px-3 py-3 text-right text-emerald-400 tabular-nums">{px(t?.tp)}</td>
                                <td className="px-3 py-3 text-right text-red-400 tabular-nums">{px(t?.sl)}</td>
                                <td className="px-3 py-3 text-right text-white tabular-nums">{px(t?.entry)}</td>
                                <td className="px-3 py-3 text-right text-white tabular-nums">{t?.close ? px(t.close) : <span className="text-muted-foreground text-[11px]">{x.graded_at ? '—' : 'still open'}</span>}</td>
                                <td className="px-3 py-3 text-right tabular-nums whitespace-nowrap">
                                    {t?.pnl == null ? <span className="text-muted-foreground">—</span> : (
                                        <div className="flex flex-col items-end gap-0.5 text-[11px]">
                                            {t.primary_pnl != null && <div><span className="text-muted-foreground">Main </span><span className={t.primary_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>{money(t.primary_pnl)}</span></div>}
                                            {t.primary_pnl != null && <div><span className="text-muted-foreground">Hedge </span>{t.hedged ? <span className={t.hedge_pnl! >= 0 ? 'text-emerald-400' : 'text-red-400'}>{money(t.hedge_pnl!)}</span> : <span className="text-muted-foreground">not opened</span>}</div>}
                                            <div className={`text-sm font-bold border-t border-[#1f1f1f] pt-0.5 ${t.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}><span className="text-[10px] font-normal text-muted-foreground uppercase mr-1">Net</span>{money(t.pnl)}</div>
                                {x.natural && <div className="text-[10px] text-muted-foreground mt-0.5">With normal hedge: {money(x.natural.main)} / {money(x.natural.backup)} = {money(x.natural.net)}</div>}
                                        </div>
                                    )}
                                </td>
                                <td className="px-3 py-3 text-right text-white tabular-nums">{x.hours != null ? `${x.hours.toFixed(1)}h` : '—'}</td>
                                <td className="px-3 py-3">
                                    <Outcome story={x.outcome.ai} pendingLabel={pending} />
                                    {t?.hedged && (
                                        <div className="text-[11px] text-amber-300/90 mt-1 whitespace-nowrap">
                                            Hedge opened at <span className="font-semibold">{px(t.hedge_price ?? t.trigger)}</span>
                                            {t.hedge_hours != null && <> · {t.hedge_hours < 1 ? `${Math.max(1, Math.round(t.hedge_hours * 60))} min` : `${t.hedge_hours.toFixed(1)} h`} after open</>}
                                            {t.hedge_price != null && Math.abs(t.hedge_price - t.trigger) >= 0.01 && <span className="text-red-400"> (jumped past {px(t.trigger)})</span>}
                                            {t.slippage_pct != null && <span className={t.slippage_pct > 0 ? 'text-red-400' : 'text-muted-foreground'}> · slippage {t.slippage_pct.toFixed(1)}%</span>}
                                        </div>
                                    )}
                                    {!x.graded_at && t && <div className="text-[11px] text-muted-foreground mt-1 whitespace-nowrap">hedge would open at {px(t.trigger)}</div>}
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5"><span className="w-20 text-[10px] uppercase tracking-wider text-sky-300/80">TV rating</span><Dir d={x.tv} /><Outcome story={x.outcome.tv} pendingLabel="" />{x.compare?.tv != null && <span className={`text-[11px] font-semibold tabular-nums ${x.compare.tv >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{money(x.compare.tv)}</span>}</div>
                                    <div className="flex items-center gap-1.5 mt-1"><span className="w-20 text-[10px] uppercase tracking-wider text-zinc-400">Coin flip</span><Dir d={x.coin} /><Outcome story={x.outcome.coin} pendingLabel="" />{x.compare?.coin != null && <span className={`text-[11px] font-semibold tabular-nums ${x.compare.coin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{money(x.compare.coin)}</span>}</div>
                                </td>
                            </tr>
                        )
                    })}
                    {!signals.length && (
                        <tr><td colSpan={11} className="px-5 py-10 text-center text-sm text-muted-foreground">{emptyText}</td></tr>
                    )}
                </tbody>
            </table>
        </div>
        <div className="px-5 py-3 border-t border-[#1a1a1a] flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            {Object.entries(STORY).map(([k, v]) => <span key={k} className={`px-2 py-0.5 rounded-md border ${v.cls}`}>{v.label}</span>)}
        </div>
    </div>
)

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
    const nextIn = s ? Math.max(0, Math.round((new Date(s.next_shadow_run).getTime() - now) / 1000)) : 0
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

                {s?.error && <div className="p-4 border border-red-500/20 rounded-2xl bg-red-500/5 text-sm text-red-300">Could not reach the orchestrator: {s.error}</div>}

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
                        ) : past?.error ? <div className="text-xs text-red-300">Could not load past data: {past.error}</div>
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
                        value={s ? s.counts.shadow : '—'}
                        sub={s ? <>Last {lastSignal ? ago(lastSignal.created_at, now) : 'none yet'} · next in {Math.floor(nextIn / 60)}:{String(nextIn % 60).padStart(2, '0')}</> : 'Loading...'}
                    />
                    <Card
                        icon={<CheckCircle2 className="h-4 w-4" />} label="Graded"
                        value={s ? `${s.counts.graded} / ${s.counts.shadow}` : '—'}
                        sub="Each signal is graded 8 hours after it is made"
                    />
                    <Card
                        icon={<CandlestickChart className="h-4 w-4" />} label="Price recording" ok={candlesFresh}
                        value={s?.candles?.last ? `$${Number(s.candles.last.close).toFixed(2)}` : '—'}
                        sub={s?.candles?.last ? <>{s.candles.last_hour} minute candles in the last hour · {ago(s.candles.last.minute, now)}</> : 'Not recording yet'}
                    />
                    <Card
                        icon={<Gauge className="h-4 w-4" />} label="Volatility" ok={volFresh}
                        value={s?.volatility ? `$${Number(s.volatility.forecast_6h).toFixed(1)}/h` : '—'}
                        sub={s?.volatility ? <>Expected move next 6h{s.volatility.ratio_now != null ? ` · now ${Number(s.volatility.ratio_now).toFixed(1)}x normal` : ''} · {ago(s.volatility.computed_at, now)} · {s.volatility.source?.startsWith('VPS') ? 'VPS' : 'MT5'}</> : 'No numbers yet'}
                    />
                </div>

                </>}

                {view === 'live' && s?.scoreboard && <Scoreboard board={s.scoreboard} risk={s.reference?.risk ?? 100} luck={LUCK_A_RATE} cost={s.reference?.cost} />}
                {view === 'past' && !!past?.approaches?.length && <ApproachCompare list={past.approaches} selected={past.run} onSelect={setRun} cost={past.reference?.cost} />}
                {view === 'past' && past?.run && <div className="text-sm text-white font-semibold -mb-4">Selected: <span className="text-sky-300">{runLabel(past.run)}</span></div>}
                {view === 'past' && past?.scoreboard && <Scoreboard board={past.scoreboard} risk={past.reference?.risk ?? 100} luck={luckRate(pastTrig)} cost={past.reference?.cost}
                    mainLabel={past.picker === 'perfect' ? 'Perfect forecaster' : past.picker === 'rating' ? 'This rule (TV rating side)' : 'AI (qwen)'} trig={pastTrig} />}

                {view === 'live' && !!s?.daily?.every.summary.days && <DailyTp daily={s.daily} title="Live shadow signals (one every hour)" />}
                {view === 'past' && !!past?.daily?.every.summary.days && past.run && <DailyTp daily={past.daily} title={runLabel(past.run)} />}

                {view === 'live' && s?.comparison && s.comparison.trades > 0 && <StrategyCompare c={s.comparison} risk={s.reference?.risk ?? 100} cost={s.reference?.cost} />}
                {view === 'past' && past?.comparison && past.comparison.trades > 0 && <StrategyCompare c={past.comparison} risk={past.reference?.risk ?? 100} cost={past.reference?.cost} trig={pastTrig} />}

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
