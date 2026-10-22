"use client"

// Candlestick chart of the gold prices the orchestrator records, with each shadow
// signal marked and the latest signal's entry / SL / TP / hedge trigger drawn as lines.
import React, { useEffect, useRef, useState } from 'react'

type Bar = { time: number, open: number, high: number, low: number, close: number }
type ChartSignal = { id: string, time: number, direction: 'buy' | 'sell', score: number | null, entry: number | null, stop: number | null, outcome: string | null }

const OUTCOME_COLOR: Record<string, string> = { A: '#34d399', B: '#fbbf24', C: '#38bdf8', X: '#71717a' }
const PENDING_COLOR = '#a78bfa'
const TRIGGER_PCT = 0.10

// The chart shows UTC; shift times so the axis reads in the viewer's local time
const localShift = () => -new Date().getTimezoneOffset() * 60

const GoldCandleChart = () => {
    const box = useRef<HTMLDivElement>(null)
    const chartRef = useRef<any>(null)
    const seriesRef = useRef<any>(null)
    const linesRef = useRef<any[]>([])
    const [tf, setTf] = useState(5)
    const [hours, setHours] = useState(12)
    const [info, setInfo] = useState<{ last: number | null, bars: number, latest: ChartSignal | null }>({ last: null, bars: 0, latest: null })
    const [error, setError] = useState<string | null>(null)

    // Create the chart once
    useEffect(() => {
        let disposed = false
        import('lightweight-charts').then(({ createChart, ColorType, CrosshairMode }) => {
            if (disposed || !box.current) return
            const chart = createChart(box.current, {
                autoSize: true,
                layout: { background: { type: ColorType.Solid, color: '#0a0a0a' }, textColor: '#848e9c', fontSize: 11 },
                grid: { vertLines: { color: '#131313' }, horzLines: { color: '#131313' } },
                rightPriceScale: { borderColor: '#1a1a1a' },
                timeScale: { borderColor: '#1a1a1a', timeVisible: true, secondsVisible: false },
                crosshair: { mode: CrosshairMode.Normal },
            })
            seriesRef.current = chart.addCandlestickSeries({
                upColor: '#26a69a', downColor: '#ef5350', borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350',
            })
            chartRef.current = chart
        })
        return () => { disposed = true; chartRef.current?.remove(); chartRef.current = null; seriesRef.current = null }
    }, [])

    // Load (and refresh every minute) for the chosen timeframe
    useEffect(() => {
        let stop = false
        const load = async () => {
            try {
                const res = await fetch(`/api/chart-candles?hours=${hours}&tf=${tf}`, { cache: 'no-store' })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || data.msg || `HTTP ${res.status}`)
                if (stop) return
                // The chart may still be loading its library on the first call
                for (let i = 0; i < 20 && !seriesRef.current; i++) await new Promise((r) => setTimeout(r, 100))
                const series = seriesRef.current
                if (!series) return
                const shift = localShift()
                const bars: Bar[] = data.candles.map((b: Bar) => ({ ...b, time: b.time + shift }))
                series.setData(bars)

                const step = tf * 60
                const markers = (data.signals as ChartSignal[])
                    .map((s) => ({
                        time: Math.floor(s.time / step) * step + shift,
                        position: s.direction === 'buy' ? 'belowBar' : 'aboveBar',
                        shape: s.direction === 'buy' ? 'arrowUp' : 'arrowDown',
                        color: s.outcome ? OUTCOME_COLOR[s.outcome] : PENDING_COLOR,
                        text: `${s.direction.toUpperCase()} ${s.score ?? ''}`,
                    }))
                    .filter((m) => bars.length && m.time >= bars[0].time)
                    .sort((a, b) => a.time - b.time)
                series.setMarkers(markers)

                // Latest signal's levels: entry, SL, TP (= SL distance, as graded), hedge trigger
                linesRef.current.forEach((l) => series.removePriceLine(l))
                linesRef.current = []
                const latest = [...(data.signals as ChartSignal[])].reverse().find((s) => s.entry && s.stop) || null
                if (latest && latest.entry && latest.stop) {
                    const side = latest.direction === 'buy' ? 1 : -1
                    const sl = Math.abs(latest.entry - latest.stop)
                    const add = (price: number, color: string, title: string, lineStyle: number) =>
                        linesRef.current.push(series.createPriceLine({ price, color, lineWidth: 1, lineStyle, axisLabelVisible: true, title }))
                    add(latest.entry, '#e4e4e7', 'Entry', 0)
                    add(latest.entry - side * TRIGGER_PCT * sl, '#fbbf24', 'Hedge trigger (10%)', 2)
                    add(latest.entry - side * sl, '#ef4444', 'SL', 2)
                    add(latest.entry + side * sl, '#22c55e', 'TP', 2)
                }
                chartRef.current?.timeScale().fitContent()
                setInfo({ last: bars.length ? bars[bars.length - 1].close : null, bars: bars.length, latest })
                setError(null)
            } catch (e: any) {
                if (!stop) setError(e.message)
            }
        }
        load()
        const timer = setInterval(load, 60000)
        return () => { stop = true; clearInterval(timer) }
    }, [tf, hours])

    const btn = (active: boolean) => `px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${active ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white'}`
    const triggerGap = info.latest?.entry && info.latest?.stop ? TRIGGER_PCT * Math.abs(info.latest.entry - info.latest.stop) : null

    return (
        <div className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1a1a1a] flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <div className="text-sm font-semibold text-white">Gold (XAUUSD), recorded live by the VPS</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                        {info.last ? <>Last ${info.last.toFixed(2)} · {info.bars} candles</> : 'Waiting for candles...'}
                        {triggerGap ? <> · latest signal&apos;s hedge trigger is only <span className="text-amber-300 font-semibold">${triggerGap.toFixed(2)}</span> from entry</> : null}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {[5, 15].map((v) => <button key={v} className={btn(tf === v)} onClick={() => setTf(v)}>{v}m</button>)}
                    <span className="w-px h-4 bg-[#1a1a1a] mx-1" />
                    {[6, 12, 24].map((v) => <button key={v} className={btn(hours === v)} onClick={() => setHours(v)}>{v}h</button>)}
                </div>
            </div>
            {error && <div className="px-5 py-2 text-xs text-red-300 bg-red-500/5">Chart data unavailable: {error}</div>}
            <div ref={box} className="w-full h-[380px]" />
            <div className="px-5 py-3 border-t border-[#1a1a1a] flex flex-wrap gap-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: PENDING_COLOR }} /> Signal waiting to be graded</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: OUTCOME_COLOR.A }} /> TP, no hedge</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: OUTCOME_COLOR.B }} /> Hedged, SL</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: OUTCOME_COLOR.C }} /> Hedged, TP</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 border-t border-dashed border-amber-300" /> Hedge trigger of the latest signal</span>
            </div>
        </div>
    )
}

export default GoldCandleChart
