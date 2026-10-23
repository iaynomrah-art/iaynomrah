"use client"

// Temporary presentation page: live view of the AI prediction test (shadow mode)
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Activity, Brain, CandlestickChart, CheckCircle2, Clock, Gauge, LineChart } from 'lucide-react'
import GoldCandleChart from '@/components/chart/GoldCandleChart'
import { CartesianGrid, Line, LineChart as RunningTotalChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

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
}

type StrategyTotals = { net: number, main: number, backup: number, backup_used: number }
type Comparison = { trades: number, delayed: StrategyTotals, natural: StrategyTotals, series: { t: string, delayed: number, natural: number }[] }

type Tally = { graded: number, resolved: number, a: number, b: number, c: number, x: number, pnl: number, a_rate: number | null, hedges?: number, slippage_avg_pct?: number | null, slippage_max_pct?: number | null }

type Status = {
    now: string
    shadow_enabled: boolean
    next_shadow_run: string
    volatility: { computed_at: string, forecast_6h: number, ratio_now: number | null, source: string } | null
    candles: { last: { minute: string, close: number, ticks: number } | null, last_hour: number }
    counts: { shadow: number, graded: number }
    reference?: { risk: number, max_lot: number, trigger_pct: number, tp: string }
    scoreboard?: Record<'ai' | 'tv' | 'coin', Tally>
    comparison?: Comparison
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

type Past = {
    runs: { run: string, signals: number, from: string, to: string }[]
    run: string | null
    reference?: { risk: number }
    scoreboard?: Record<'ai' | 'tv' | 'coin', Tally>
    comparison?: Comparison
    signals: Signal[]
    error?: string
}

const RUN_LABEL: Record<string, string> = {
    'v1': 'Original prompt',
    'v2-candles-6h': 'Prompt with 6-hour candles (current)',
}

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

const money = (v: number) => `${v >= 0 ? '+' : '−'}$${Math.abs(v).toFixed(2)}`

// Totals over every graded shadow signal, per picker
const Scoreboard = ({ board, risk, luck }: { board: Record<'ai' | 'tv' | 'coin', Tally>, risk: number, luck: number | null }) => {
    const rows: { key: 'ai' | 'tv' | 'coin', label: string, cls: string }[] = [
        { key: 'ai', label: 'AI (qwen)', cls: 'text-violet-300' },
        { key: 'tv', label: 'TradingView rating', cls: 'text-sky-300' },
        { key: 'coin', label: 'Coin flip', cls: 'text-zinc-300' },
    ]
    return (
        <div className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1a1a1a] flex flex-col md:flex-row md:items-end justify-between gap-2">
                <div>
                    <div className="text-sm font-semibold text-white flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Scoreboard: graded signals</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                        Each signal as if traded at ${risk} risk (lot sized to it, max 0.30), TP = SL distance, equal-lot hedge at a 10% dip
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
                TP without hedge = +${risk} · hedged either way = −${(risk * 0.1).toFixed(0)} (the 10% dip) · unfinished = not counted. Spread and fees not included.
                Slippage = (actual hedge loss − planned 10% loss) ÷ planned loss, from 1-minute prices (real broker fills can slip more).
            </div>
        </div>
    )
}

// Delayed hedge vs normal hedge on the same trades, explained for beginners
const StrategyCompare = ({ c, risk }: { c: Comparison, risk: number }) => {
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
                <div className="text-sm text-muted-foreground">Same {c.trades} finished trades, same lot sizes (about ${risk} risk each). Only the way the backup account is used changes.</div>
            </div>

            {/* The three situations, in plain words */}
            <div className="overflow-x-auto rounded-xl border border-[#1a1a1a]">
                <table className="w-full text-sm">
                    <thead className="text-[11px] uppercase tracking-widest text-muted-foreground bg-white/[0.02]">
                        <tr>
                            <th className="px-4 py-2.5 text-left">If the price...</th>
                            <th className="px-4 py-2.5 text-left">Normal hedge (both open at once)</th>
                            <th className="px-4 py-2.5 text-left">Delayed hedge (backup waits for a 10% dip)</th>
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
                            <td className="px-4 py-3 text-muted-foreground">Main +${risk}, backup −${Math.round(risk * 1.1)} = <b className="text-red-400">−${Math.round(risk * 0.1)}</b></td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 text-white">goes against you</td>
                            <td className="px-4 py-3 text-muted-foreground">Main −${risk}, backup +${risk} = <b className="text-white">$0</b></td>
                            <td className="px-4 py-3 text-muted-foreground">Main −${risk}, backup +${Math.round(risk * 0.9)} = <b className="text-red-400">−${Math.round(risk * 0.1)}</b></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Side title="Normal hedge" how="Main and backup open together, opposite sides" t={c.natural} tone="border-[#1a1a1a]" />
                <Side title="Delayed hedge" how="Backup opens only if the price dips 10% against the main" t={c.delayed} tone="border-violet-500/30" />
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
                        <span className="flex items-center gap-1.5"><span className="inline-block w-4 border-t-2 border-zinc-400" /> Normal hedge (always about $0)</span>
                        <span>Bottom axis = trade number. Spread and fees not included.</span>
                    </div>
                </div>
            )}
        </div>
    )
}

// One row per AI signal, as if traded (used by the live and the past-data views)
const TradeLog = ({ signals, now, risk, title, emptyText }: { signals: Signal[], now: number, risk: number, title: string, emptyText: string }) => (
    <div className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1a1a1a] flex items-center justify-between">
            <div className="text-sm font-semibold text-white flex items-center gap-2"><Activity className="h-4 w-4 text-violet-400" /> {title}</div>
            <div className="text-[11px] text-muted-foreground">As if traded at ${risk} risk · trigger 10% · TP = SL</div>
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
                        <th className="px-3 py-2.5 text-right">Profit / loss (each account)</th>
                        <th className="px-3 py-2.5 text-right">Hours</th>
                        <th className="px-3 py-2.5 text-left">How it ended</th>
                        <th className="px-3 py-2.5 text-left">Compared with</th>
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
                                <td className="px-3 py-3 whitespace-nowrap"><Dir d={x.ai} /> <span className="text-[11px] text-muted-foreground">score {x.score ?? '—'}</span></td>
                                <td className="px-3 py-3 text-right text-white tabular-nums">{t ? t.lot.toFixed(2) : '—'}</td>
                                <td className="px-3 py-3 text-right text-emerald-400 tabular-nums">{px(t?.tp)}</td>
                                <td className="px-3 py-3 text-right text-red-400 tabular-nums">{px(t?.sl)}</td>
                                <td className="px-3 py-3 text-right text-white tabular-nums">{px(t?.entry)}</td>
                                <td className="px-3 py-3 text-right text-white tabular-nums">{t?.close ? px(t.close) : <span className="text-muted-foreground text-[11px]">{x.graded_at ? '—' : 'still open'}</span>}</td>
                                <td className="px-3 py-3 text-right tabular-nums whitespace-nowrap">
                                    {t?.pnl == null ? <span className="text-muted-foreground">—</span> : (
                                        <div className="flex flex-col items-end gap-0.5 text-[11px]">
                                            <div><span className="text-muted-foreground">Main </span><span className={t.primary_pnl! >= 0 ? 'text-emerald-400' : 'text-red-400'}>{money(t.primary_pnl!)}</span></div>
                                            <div><span className="text-muted-foreground">Hedge </span>{t.hedged ? <span className={t.hedge_pnl! >= 0 ? 'text-emerald-400' : 'text-red-400'}>{money(t.hedge_pnl!)}</span> : <span className="text-muted-foreground">not opened</span>}</div>
                                            <div className={`text-sm font-bold border-t border-[#1f1f1f] pt-0.5 ${t.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}><span className="text-[10px] font-normal text-muted-foreground uppercase mr-1">Net</span>{money(t.pnl)}</div>
                                {x.natural && <div className="text-[10px] text-muted-foreground mt-0.5">Normal hedge: {money(x.natural.main)} / {money(x.natural.backup)} = $0</div>}
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
                                    <div className="flex items-center gap-1.5"><span className="w-12 text-[10px] uppercase tracking-wider text-sky-300/80">Rating</span><Dir d={x.tv} /><Outcome story={x.outcome.tv} pendingLabel="" />{x.compare?.tv != null && <span className={`text-[11px] font-semibold tabular-nums ${x.compare.tv >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{money(x.compare.tv)}</span>}</div>
                                    <div className="flex items-center gap-1.5 mt-1"><span className="w-12 text-[10px] uppercase tracking-wider text-zinc-400">Coin</span><Dir d={x.coin} /><Outcome story={x.outcome.coin} pendingLabel="" />{x.compare?.coin != null && <span className={`text-[11px] font-semibold tabular-nums ${x.compare.coin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{money(x.compare.coin)}</span>}</div>
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
                            For moments over the last 8 months, the AI is shown only what was known at that moment (the candles and indicators up to then, nothing after) and asked buy or sell.
                            The trade is then graded on the 8 hours that actually followed, on your broker&apos;s 5-minute prices. Past news headlines can&apos;t be recovered, so news is left out here; the live test includes it.
                        </p>
                        {past?.runs?.length ? (
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="text-muted-foreground">Test run:</span>
                                {past.runs.map((r) => (
                                    <button key={r.run} onClick={() => setRun(r.run)}
                                        className={`px-3 py-1.5 rounded-lg border ${past.run === r.run ? 'border-sky-500/40 bg-sky-500/10 text-white' : 'border-[#1a1a1a] text-muted-foreground hover:text-white'}`}>
                                        {RUN_LABEL[r.run] ?? r.run} · {r.signals} moments · {localTime(r.from)} to {localTime(r.to)}
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

                {view === 'live' && s?.scoreboard && <Scoreboard board={s.scoreboard} risk={s.reference?.risk ?? 100} luck={LUCK_A_RATE} />}
                {view === 'past' && past?.scoreboard && <Scoreboard board={past.scoreboard} risk={past.reference?.risk ?? 100} luck={LUCK_A_RATE} />}

                {view === 'live' && s?.comparison && s.comparison.trades > 0 && <StrategyCompare c={s.comparison} risk={s.reference?.risk ?? 100} />}
                {view === 'past' && past?.comparison && past.comparison.trades > 0 && <StrategyCompare c={past.comparison} risk={past.reference?.risk ?? 100} />}

                {view === 'live' && <GoldCandleChart />}

                <TradeLog
                    signals={view === 'live' ? (s?.signals || []).filter((x) => x.shadow) : (past?.signals || [])}
                    now={now}
                    risk={s?.reference?.risk ?? 100}
                    title={view === 'live' ? 'Trade log: live signals, as if traded' : 'Trade log: past moments, as if traded'}
                    emptyText={view === 'live' ? 'No shadow signals yet. The first one comes at the next :05.' : 'No past-data results yet.'}
                />

                <div className="text-xs text-muted-foreground">
                    Full breakdown by score and settings: <Link href="/dashboard/trade/signal-results" className="text-[#4788ff] hover:text-white">Signal Results</Link>
                </div>
            </div>
        </div>
    )
}

export default PredictionMonitorPage
