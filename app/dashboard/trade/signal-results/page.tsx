"use client"

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { FlaskConical } from 'lucide-react'

const VolatilityTimingCard = dynamic(() => import('@/components/chart/VolatilityTimingCard'), {
    ssr: false,
    loading: () => null
})

type Tally = {
    graded: number
    resolved: number
    a: number
    b: number
    c: number
    x: number
    independent: number
    a_rate: number | null
    win_rate: number | null
}

type Results = {
    days: number
    setting: string
    score_version: 'v1' | 'v2'
    luck_a_rate: number
    signals: number
    overall: Record<string, Tally>
    buckets: { label: string, sources: Record<string, Tally> }[]
    checks?: Record<string, { passed: Tally, failed: Tally }>
    error?: string
}

// Support/resistance checks saved with each signal (tracked only, not in the score)
const CHECKS: { key: string, label: string }[] = [
    { key: 'trigger_beyond_8h', label: 'Hedge trigger beyond support/resistance (8h levels)' },
    { key: 'trigger_beyond_24h', label: 'Hedge trigger beyond support/resistance (24h levels)' },
    { key: 'sl_gt_range_8h', label: 'SL distance wider than the support-resistance range (8h)' },
    { key: 'sl_gt_range_24h', label: 'SL distance wider than the support-resistance range (24h)' },
]

const SOURCES = [
    { key: 'ai', label: 'AI (qwen)' },
    { key: 'tv', label: 'TradingView rating' },
    { key: 'coin', label: 'Coin flip' },
]

const SETTINGS = [
    { key: 't10_tp1', label: 'Trigger 10%, TP = SL' },
    { key: 't15_tp1', label: 'Trigger 15%, TP = SL' },
    { key: 't10_tpai', label: "Trigger 10%, AI's TP" },
    { key: 't15_tpai', label: "Trigger 15%, AI's TP" },
]

// Below ~70 independent signals, a 1-in-10 vs 2-in-10 difference is still mostly noise
const ENOUGH_INDEPENDENT = 70

const Select = ({ value, onChange, options }: { value: string, onChange: (v: string) => void, options: { key: string, label: string }[] }) => (
    <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[#0d0d0d] border border-[#1a1a1a] text-sm text-white h-10 rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-white/10"
    >
        {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
    </select>
)

const Cell = ({ tally, luck }: { tally?: Tally, luck: number }) => {
    if (!tally || !tally.resolved) return <td className="px-4 py-3 text-muted-foreground">—</td>
    const beatsLuck = tally.a_rate !== null && tally.a_rate > luck
    return (
        <td className="px-4 py-3">
            <div className={`font-semibold ${beatsLuck ? 'text-emerald-400' : 'text-white'}`}>
                {(tally.a_rate! / 10).toFixed(1)} in 10
            </div>
            <div className="text-xs text-muted-foreground">
                {tally.a} of {tally.resolved} · {tally.independent} independent · wins {tally.win_rate}%
            </div>
        </td>
    )
}

const SignalResultsPage = () => {
    const [days, setDays] = useState('30')
    const [setting, setSetting] = useState('t10_tp1')
    const [score, setScore] = useState('v1')
    const [results, setResults] = useState<Results | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        setIsLoading(true)
        fetch(`/api/signal-results?days=${days}&setting=${setting}&score=${score}`)
            .then((r) => r.json())
            .then(setResults)
            .catch((e) => setResults({ error: e.message } as Results))
            .finally(() => setIsLoading(false))
    }, [days, setting, score])

    const aiIndependent = results?.overall?.ai?.independent ?? 0

    return (
        <div suppressHydrationWarning className="animate-in fade-in duration-500 w-full p-6 bg-[#050505] min-h-screen">
            <div className="w-full flex flex-col gap-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <FlaskConical className="h-6 w-6 text-muted-foreground" />
                            Signal Results
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            How often each signal reached TP without the delayed hedge opening, graded 8 hours later on broker prices.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Select value={setting} onChange={setSetting} options={SETTINGS} />
                        <Select value={score} onChange={setScore} options={[{ key: 'v1', label: 'Current score' }, { key: 'v2', label: 'Volatility score' }]} />
                        <Select value={days} onChange={setDays} options={[{ key: '7', label: 'Last 7 days' }, { key: '30', label: 'Last 30 days' }, { key: '90', label: 'Last 90 days' }]} />
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-16 text-center text-sm text-muted-foreground">Loading results...</div>
                ) : results?.error ? (
                    <div className="p-6 border border-red-500/20 rounded-2xl bg-red-500/5 text-sm text-red-300">Could not load results: {typeof results.error === 'object' ? JSON.stringify(results.error) : String(results.error)}</div>
                ) : !results || results.signals === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16 border border-dashed border-[#1a1a1a] rounded-2xl bg-[#0a0a0a]/30">
                        <FlaskConical className="h-7 w-7 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold text-white">No graded signals yet</h3>
                        <p className="text-sm text-muted-foreground text-center max-w-sm mt-2 leading-relaxed">
                            Signals are graded 8 hours after they are made, while a unit with MT5 is online.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-5 rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a]">
                                <div className="text-xs text-muted-foreground uppercase tracking-widest">Luck level</div>
                                <div className="text-2xl font-bold text-white mt-1">{(results.luck_a_rate / 10).toFixed(1)} in 10</div>
                                <div className="text-xs text-muted-foreground mt-1">What a coin flip gets in theory with these settings</div>
                            </div>
                            <div className="p-5 rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a]">
                                <div className="text-xs text-muted-foreground uppercase tracking-widest">Goal</div>
                                <div className="text-2xl font-bold text-white mt-1">2 in 10</div>
                                <div className="text-xs text-muted-foreground mt-1">1 in 10 is acceptable</div>
                            </div>
                            <div className="p-5 rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a]">
                                <div className="text-xs text-muted-foreground uppercase tracking-widest">Enough data?</div>
                                <div className="text-2xl font-bold text-white mt-1">{aiIndependent} / {ENOUGH_INDEPENDENT}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {aiIndependent >= ENOUGH_INDEPENDENT ? 'Enough independent signals to judge' : 'Independent signals so far; too early to judge'}
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a]">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase tracking-widest text-muted-foreground border-b border-[#1a1a1a]">
                                    <tr>
                                        <th className="px-4 py-3">Score</th>
                                        {SOURCES.map((s) => <th key={s.key} className="px-4 py-3">{s.label}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1a1a1a]">
                                    {results.buckets.map((b) => (
                                        <tr key={b.label}>
                                            <td className="px-4 py-3 font-medium text-white">{b.label}</td>
                                            {SOURCES.map((s) => <Cell key={s.key} tally={b.sources[s.key]} luck={results.luck_a_rate} />)}
                                        </tr>
                                    ))}
                                    <tr className="bg-white/[0.02]">
                                        <td className="px-4 py-3 font-semibold text-white">All</td>
                                        {SOURCES.map((s) => <Cell key={s.key} tally={results.overall[s.key]} luck={results.luck_a_rate} />)}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <VolatilityTimingCard />

                        <div className="overflow-x-auto rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a]">
                            <div className="px-4 pt-4 pb-1">
                                <div className="text-sm font-semibold text-white">Support / resistance checks</div>
                                <div className="text-xs text-muted-foreground">Tracked with every signal, not used in the score. AI signals only: did they hit TP without the hedge more often when the check passed?</div>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase tracking-widest text-muted-foreground border-b border-[#1a1a1a]">
                                    <tr>
                                        <th className="px-4 py-3">Check</th>
                                        <th className="px-4 py-3">When it passed</th>
                                        <th className="px-4 py-3">When it didn&apos;t</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1a1a1a]">
                                    {CHECKS.map((c) => (
                                        <tr key={c.key}>
                                            <td className="px-4 py-3 text-white">{c.label}</td>
                                            <Cell tally={results.checks?.[c.key]?.passed} luck={results.luck_a_rate} />
                                            <Cell tally={results.checks?.[c.key]?.failed} luck={results.luck_a_rate} />
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Green = above luck. Signals in the same direction within 4 hours count as one independent call.
                            The TradingView and coin-flip columns use the same signals, so you can see whether the AI adds anything.
                        </p>
                    </>
                )}
            </div>
        </div>
    )
}

export default SignalResultsPage
