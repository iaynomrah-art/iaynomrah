"use client"

// Temporary presentation page: live view of the AI prediction test (shadow mode)
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Activity, Brain, CandlestickChart, CheckCircle2, Clock, Coins, Gauge, LineChart, XCircle } from 'lucide-react'

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
}

type Status = {
    now: string
    shadow_enabled: boolean
    next_shadow_run: string
    volatility: { computed_at: string, forecast_6h: number, ratio_now: number | null, source: string } | null
    candles: { last: { minute: string, close: number, ticks: number } | null, last_hour: number }
    counts: { shadow: number, graded: number }
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

const REFRESH_MS = 30000
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

const Bars = ({ title, data }: { title: string, data: { ai: number, tv: number, coin: number, luck: number, resolved: number } }) => {
    const rows = [
        { label: 'AI (qwen)', value: data.ai, cls: 'bg-violet-500' },
        { label: 'TradingView rating', value: data.tv, cls: 'bg-sky-500' },
        { label: 'Coin flip', value: data.coin, cls: 'bg-zinc-500' },
    ]
    const max = Math.max(25, ...rows.map((r) => r.value), data.luck)
    return (
        <div className="flex flex-col gap-3">
            <div className="text-sm font-semibold text-white">{title}</div>
            {rows.map((r) => (
                <div key={r.label} className="flex items-center gap-3">
                    <div className="w-36 text-xs text-muted-foreground shrink-0">{r.label}</div>
                    <div className="relative flex-1 h-7 rounded-lg bg-white/[0.04] overflow-hidden">
                        <div className={`h-full ${r.cls} rounded-lg transition-all duration-700`} style={{ width: `${(r.value / max) * 100}%` }} />
                        <div className="absolute top-0 h-full border-l-2 border-dashed border-amber-300/80" style={{ left: `${(data.luck / max) * 100}%` }} />
                        <div className="absolute top-0 h-full border-l-2 border-emerald-400/80" style={{ left: `${(20 / max) * 100}%` }} />
                    </div>
                    <div className="w-20 text-right text-sm font-bold text-white">{(r.value / 10).toFixed(1)} in 10</div>
                </div>
            ))}
            <div className="flex gap-5 text-[11px] text-muted-foreground pl-[9.75rem]">
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 border-t-2 border-dashed border-amber-300/80" /> Luck {(data.luck / 10).toFixed(1)} in 10</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 border-t-2 border-emerald-400/80" /> Goal 2 in 10</span>
                <span>{data.resolved} finished trades</span>
            </div>
        </div>
    )
}

const PredictionMonitorPage = () => {
    const [status, setStatus] = useState<Status | null>(null)
    const [loadedAt, setLoadedAt] = useState(Date.now())
    const [clock, setClock] = useState(Date.now())

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
                        sub={s?.volatility ? <>Expected move next 6h{s.volatility.ratio_now != null ? ` · now ${Number(s.volatility.ratio_now).toFixed(1)}x normal` : ''} · {ago(s.volatility.computed_at, now)}</> : 'No numbers yet'}
                    />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                    {/* Live feed */}
                    <div className="xl:col-span-3 rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden">
                        <div className="px-5 py-4 border-b border-[#1a1a1a] flex items-center justify-between">
                            <div className="text-sm font-semibold text-white flex items-center gap-2"><Activity className="h-4 w-4 text-violet-400" /> Live signal feed</div>
                            <div className="text-[11px] text-muted-foreground">Trigger 10%, TP = SL</div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-[11px] uppercase tracking-widest text-muted-foreground">
                                    <tr className="border-b border-[#1a1a1a]">
                                        <th className="px-5 py-2.5 text-left">Time</th>
                                        <th className="px-3 py-2.5 text-left">AI</th>
                                        <th className="px-3 py-2.5 text-left">Score</th>
                                        <th className="px-3 py-2.5 text-left">AI result</th>
                                        <th className="px-3 py-2.5 text-left">Rating</th>
                                        <th className="px-3 py-2.5 text-left">Coin</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#141414]">
                                    {(s?.signals || []).filter((x) => x.shadow).slice(0, 12).map((x) => {
                                        const hoursLeft = Math.max(0, GRADE_DELAY_H - (now - new Date(x.created_at).getTime()) / 3600000)
                                        const pending = x.skipped ? 'skipped' : hoursLeft > 0 ? `grading in ${Math.ceil(hoursLeft)}h` : 'grading soon'
                                        return (
                                            <tr key={x.id} className="hover:bg-white/[0.02]">
                                                <td className="px-5 py-3 text-white whitespace-nowrap">{localTime(x.created_at)}</td>
                                                <td className="px-3 py-3"><Dir d={x.ai} /></td>
                                                <td className="px-3 py-3 text-white">{x.score ?? '—'}</td>
                                                <td className="px-3 py-3"><Outcome story={x.outcome.ai} pendingLabel={pending} /></td>
                                                <td className="px-3 py-3"><div className="flex items-center gap-2"><Dir d={x.tv} /><Outcome story={x.outcome.tv} pendingLabel="" /></div></td>
                                                <td className="px-3 py-3"><div className="flex items-center gap-2"><Dir d={x.coin} /><Outcome story={x.outcome.coin} pendingLabel="" /></div></td>
                                            </tr>
                                        )
                                    })}
                                    {s && !s.signals.some((x) => x.shadow) && (
                                        <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">No shadow signals yet. The first one comes at the next :05.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-5 py-3 border-t border-[#1a1a1a] flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                            {Object.entries(STORY).map(([k, v]) => <span key={k} className={`px-2 py-0.5 rounded-md border ${v.cls}`}>{v.label}</span>)}
                        </div>
                    </div>

                    {/* Replay */}
                    <div className="xl:col-span-2 rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-5 flex flex-col gap-6">
                        <div>
                            <div className="text-sm font-semibold text-white flex items-center gap-2"><LineChart className="h-4 w-4 text-sky-400" /> Historical replay</div>
                            {s?.replay ? (
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    {s.replay.signals} past moments ({localTime(s.replay.from)} to {localTime(s.replay.to)}), rebuilt from broker candles and asked to the same AI.
                                    Share of trades that hit TP without the hedge opening:
                                </p>
                            ) : <p className="text-xs text-muted-foreground mt-1">No replay results on this orchestrator.</p>}
                        </div>
                        {s?.replay && (
                            <>
                                <Bars title="Hedge at a 10% dip" data={s.replay.t10} />
                                <Bars title="Hedge at a 15% dip" data={s.replay.t15} />
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-xl bg-white/[0.03] border border-[#1a1a1a]">
                                        <div className="text-[11px] text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"><Coins className="h-3.5 w-3.5" /> vs luck</div>
                                        <div className="text-lg font-bold text-white mt-1">{s.replay.t10.ai > s.replay.t10.luck + 3 ? 'Above' : 'At luck'}</div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/[0.03] border border-[#1a1a1a]">
                                        <div className="text-[11px] text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5" /> AI = rating</div>
                                        <div className="text-lg font-bold text-white mt-1">{s.replay.agree_pct}% of picks</div>
                                    </div>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    Replay has no news headlines and approximates the TradingView rating; the live feed above is the exact test.
                                </p>
                            </>
                        )}
                    </div>
                </div>

                <div className="text-xs text-muted-foreground">
                    Full breakdown by score and settings: <Link href="/dashboard/trade/signal-results" className="text-[#4788ff] hover:text-white">Signal Results</Link>
                </div>
            </div>
        </div>
    )
}

export default PredictionMonitorPage
