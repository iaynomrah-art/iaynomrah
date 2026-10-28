"use client"

import React, { useState, useEffect } from 'react'
import { Clock, Calendar, BarChart3, TrendingUp, Activity, AlertTriangle } from 'lucide-react'
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Cell,
    ReferenceLine
} from 'recharts'

// Everything here is measured from the broker's 5-minute candles by the orchestrator's
// scripts/timingStats.js (served at /market/timing); nothing is typed in by hand.
type RuleResult = { trades: number, clean: number, pnl: number }
type Timing = {
    generated_at: string
    source: { file: string, from: string, to: string, candles: number, hours: number }
    rule: { name: string, lot: number, sl_distance: number, live_pht_hour: number, coin_runs: number }
    hourly: { pht_hour: number, utc_hour: number, avg_move: number, samples: number, bounce: RuleResult & { beats_pct: number | null } }[]
    weekday: { day: string, avg_move: number, samples: number, nine_am: RuleResult }[]
    monthly: { month: string, avg_move: number, samples: number, nine_am: RuleResult }[]
}

const POS = '#34d399', NEG = '#f87171', LIVE = '#38bdf8', MOVE = '#94a3b8'
const money = (v: number) => `${v >= 0 ? '+' : '−'}$${Math.abs(v).toFixed(0)}`
const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'am' : 'pm'}`
const monthLabel = (key: string) => new Date(`${key}-01T00:00:00Z`).toLocaleString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' })

const TipBox = ({ children }: { children: React.ReactNode }) => (
    <div className="p-3 rounded-xl border border-[#27272a] bg-[#0c0c0e] text-xs shadow-xl space-y-1">{children}</div>
)
const TipRow = ({ label, value, cls = 'text-white' }: { label: string, value: string, cls?: string }) => (
    <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">{label}</span><span className={`font-semibold ${cls}`}>{value}</span></div>
)

export const VolatilityTimingCard = () => {
    const [data, setData] = useState<Timing | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [tab, setTab] = useState<'hour' | 'day' | 'month'>('hour')
    const [metric, setMetric] = useState<'rule' | 'move'>('rule')
    const [nowHour, setNowHour] = useState<number | null>(null)

    useEffect(() => {
        fetch('/api/market-timing', { cache: 'no-store' })
            .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Could not load timing statistics'); setData(j) })
            .catch((e) => setError(e.message))
        // Current hour in Manila (UTC+8)
        const update = () => setNowHour((new Date().getUTCHours() + 8) % 24)
        update()
        const timer = setInterval(update, 30000)
        return () => clearInterval(timer)
    }, [])

    if (error) {
        return (
            <div className="rounded-2xl border border-[#1a1a1a] bg-[#080808] p-6 text-xs text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" /> Market timing: {error}
            </div>
        )
    }
    if (!data) {
        return (
            <div className="rounded-2xl border border-[#1a1a1a] bg-[#080808] p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 animate-spin text-violet-400" /> Loading market timing...
            </div>
        )
    }

    const live = data.hourly.find((h) => h.pht_hour === data.rule.live_pht_hour)!
    const winners = data.hourly.filter((h) => h.bounce.pnl > 0).length
    const byMove = [...data.hourly].sort((a, b) => b.avg_move - a.avg_move)
    const busiest = byMove.slice(0, 3), calmest = byMove.slice(-3).reverse()
    const nowRow = nowHour == null ? null : data.hourly.find((h) => h.pht_hour === nowHour)
    const from = data.source.from.slice(0, 10), to = data.source.to.slice(0, 10)

    const hourBars = data.hourly.map((h) => ({ ...h, label: hourLabel(h.pht_hour), value: metric === 'rule' ? h.bounce.pnl : h.avg_move }))
    const colorFor = (v: number, isLive: boolean) => metric === 'move' ? (isLive ? LIVE : MOVE) : isLive ? LIVE : v >= 0 ? POS : NEG

    return (
        <div className="rounded-2xl border border-[#1a1a1a] bg-[#080808] overflow-hidden shadow-xl">
            {/* Header */}
            <div className="p-5 border-b border-[#1a1a1a] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0d0d0d] to-[#080808]">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
                            Market Timing (Manila time)
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
                                {data.source.hours.toLocaleString()} hours measured
                            </span>
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Measured from the broker&apos;s 5-minute candles, {from} to {to}: how much gold moves at each hour, and how the live rule ({data.rule.name}) did when entered at that hour.
                        </p>
                    </div>
                </div>
                {nowRow && (
                    <div className="flex flex-col text-right bg-[#111111] px-3.5 py-2 rounded-xl border border-[#222222]">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Now in Manila: {hourLabel(nowRow.pht_hour)}</span>
                        <span className="text-xs text-white">
                            avg move ${nowRow.avg_move.toFixed(1)}/h · rule at this hour{' '}
                            <span className={nowRow.bounce.pnl >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>{money(nowRow.bounce.pnl)}</span>
                        </span>
                    </div>
                )}
            </div>

            {/* Measured highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#1a1a1a] border-b border-[#1a1a1a] bg-[#0a0a0a]">
                <div className="p-4 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 mt-0.5"><TrendingUp className="h-4 w-4" /></div>
                    <div>
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Live entry: {hourLabel(live.pht_hour)}</div>
                        <div className={`text-lg font-bold mt-0.5 ${live.bounce.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{money(live.bounce.pnl)}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 leading-snug">
                            {live.bounce.trades} delayed trades, {live.bounce.clean} clean TPs; beats {live.bounce.beats_pct}% of {data.rule.coin_runs} coin flips.
                            Only <span className="text-white font-medium">{winners} of 24</span> entry hours made money with this rule.
                        </div>
                    </div>
                </div>
                <div className="p-4 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 mt-0.5"><Activity className="h-4 w-4" /></div>
                    <div>
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Busiest hours</div>
                        <div className="text-lg font-bold text-white mt-0.5">{busiest.map((h) => hourLabel(h.pht_hour)).join(', ')}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 leading-snug">
                            Average move {busiest.map((h) => `$${h.avg_move.toFixed(1)}`).join(', ')} per hour (US data and New York open; 9am is the Tokyo/China open).
                        </div>
                    </div>
                </div>
                <div className="p-4 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5"><Clock className="h-4 w-4" /></div>
                    <div>
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Calmest hours</div>
                        <div className="text-lg font-bold text-white mt-0.5">{calmest.map((h) => hourLabel(h.pht_hour)).join(', ')}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 leading-snug">
                            Average move {calmest.map((h) => `$${h.avg_move.toFixed(1)}`).join(', ')} per hour. Calm did not help the rule: {calmest.map((h) => `${hourLabel(h.pht_hour)} ${money(h.bounce.pnl)}`).join(', ')}.
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-5 pt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 p-1 bg-[#121212] rounded-xl border border-[#1f1f1f]">
                    {([['hour', 'By hour', Clock], ['day', 'By weekday', Calendar], ['month', 'By month', BarChart3]] as const).map(([key, label, Icon]) => (
                        <button key={key} onClick={() => setTab(key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${tab === key ? 'bg-violet-600 text-white shadow-sm' : 'text-muted-foreground hover:text-white'}`}>
                            <Icon className="h-3.5 w-3.5" /> {label}
                        </button>
                    ))}
                </div>
                {tab === 'hour' && (
                    <div className="flex items-center gap-1.5 p-1 bg-[#121212] rounded-xl border border-[#1f1f1f]">
                        {([['rule', 'Rule result if entered at this hour'], ['move', 'Average move']] as const).map(([key, label]) => (
                            <button key={key} onClick={() => setMetric(key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${metric === key ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white'}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-5">
                {tab === 'hour' && (
                    <div className="flex flex-col gap-3">
                        <div className="h-56 min-h-[220px] w-full">
                            <ResponsiveContainer width="100%" height={220} minWidth={0}>
                                <BarChart data={hourBars} margin={{ top: 10, right: 10, bottom: 0, left: -5 }}>
                                    <CartesianGrid stroke="#18181b" vertical={false} strokeDasharray="3 3" />
                                    <XAxis dataKey="label" stroke="#71717a" fontSize={10} interval={1} />
                                    <YAxis stroke="#71717a" fontSize={10} tickFormatter={(v) => metric === 'rule' ? money(v) : `$${v}`} />
                                    {metric === 'rule' && <ReferenceLine y={0} stroke="#3f3f46" />}
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                                        content={({ active, payload }) => {
                                            if (!active || !payload?.length) return null
                                            const d = payload[0].payload as Timing['hourly'][number]
                                            return (
                                                <TipBox>
                                                    <div className="text-white font-bold">{hourLabel(d.pht_hour)} Manila ({String(d.utc_hour).padStart(2, '0')}:00 UTC){d.pht_hour === data.rule.live_pht_hour ? ' · live entry' : ''}</div>
                                                    <TipRow label="Average move" value={`$${d.avg_move.toFixed(2)}/h`} />
                                                    <TipRow label="Rule if entered here" value={money(d.bounce.pnl)} cls={d.bounce.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
                                                    <TipRow label="Delayed trades / clean TPs" value={`${d.bounce.trades} / ${d.bounce.clean}`} />
                                                    {d.bounce.beats_pct != null && <TipRow label="Beats coin flips" value={`${d.bounce.beats_pct}%`} />}
                                                </TipBox>
                                            )
                                        }}
                                    />
                                    <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                                        {hourBars.map((h) => <Cell key={h.pht_hour} fill={colorFor(h.value, h.pht_hour === data.rule.live_pht_hour)} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                            {metric === 'rule'
                                ? `* The live rule replayed with one entry a day at each hour, held until SL or TP with swaps, one pair at a time. Blue = the live 9am entry. Only a couple of hours stand out, so a single good hour may partly be luck.`
                                : `* Average high-to-low gold range of each one-hour candle, by Manila hour (${data.source.hours.toLocaleString()} hours). A busy hour is not a bad hour for the rule: 9am is one of the busiest.`}
                        </div>
                    </div>
                )}

                {tab === 'day' && (
                    <SplitChart
                        rows={data.weekday.map((d) => ({ key: d.day, label: d.day, move: d.avg_move, rule: d.nine_am }))}
                        note={`* Average move per hour on each weekday (Manila days), and the live 9am rule's trades on that day. Monday 9am never trades: the market reopens only about 3 hours earlier, so there are no 12-hour levels yet.`}
                    />
                )}

                {tab === 'month' && (
                    <SplitChart
                        rows={data.monthly.map((m) => ({ key: m.month, label: monthLabel(m.month), move: m.avg_move, rule: m.nine_am }))}
                        note={`* Average move per hour in each month, and the live 9am rule's trades that month. The first and last months are partial.`}
                    />
                )}
            </div>
        </div>
    )
}

// Two side-by-side charts: average move, and the live 9am rule's result, per group
const SplitChart = ({ rows, note }: { rows: { key: string, label: string, move: number, rule: RuleResult }[], note: string }) => (
    <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {([['move', 'Average move per hour'], ['rule', 'Live 9am rule result']] as const).map(([kind, title]) => (
                <div key={kind}>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{title}</div>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height={190} minWidth={0}>
                            <BarChart data={rows.map((r) => ({ ...r, value: kind === 'move' ? r.move : r.rule.pnl }))} margin={{ top: 10, right: 10, bottom: 0, left: -5 }}>
                                <CartesianGrid stroke="#18181b" vertical={false} strokeDasharray="3 3" />
                                <XAxis dataKey="label" stroke="#71717a" fontSize={10} />
                                <YAxis stroke="#71717a" fontSize={10} tickFormatter={(v) => kind === 'move' ? `$${v}` : money(v)} />
                                {kind === 'rule' && <ReferenceLine y={0} stroke="#3f3f46" />}
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null
                                        const d = payload[0].payload as { label: string, move: number, rule: RuleResult }
                                        return (
                                            <TipBox>
                                                <div className="text-white font-bold">{d.label}</div>
                                                <TipRow label="Average move" value={`$${d.move.toFixed(2)}/h`} />
                                                <TipRow label="9am rule" value={d.rule.trades ? money(d.rule.pnl) : 'no trades'} cls={d.rule.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
                                                <TipRow label="Delayed trades / clean TPs" value={`${d.rule.trades} / ${d.rule.clean}`} />
                                            </TipBox>
                                        )
                                    }}
                                />
                                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                                    {rows.map((r) => <Cell key={r.key} fill={kind === 'move' ? MOVE : r.rule.pnl >= 0 ? POS : NEG} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            ))}
        </div>
        <div className="text-[11px] text-muted-foreground">{note}</div>
    </div>
)

export default VolatilityTimingCard
