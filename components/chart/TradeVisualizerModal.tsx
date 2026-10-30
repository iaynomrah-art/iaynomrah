"use client"

import React, { useEffect, useRef, useState } from 'react'
import { X, CheckCircle2, AlertTriangle, Clock, ArrowRight, ShieldCheck, Sparkles, TrendingUp, TrendingDown, Target, Maximize2 } from 'lucide-react'

export type TradeSignal = {
    id: string
    created_at: string
    close_at?: string | null
    ai: string | null
    tv?: string | null
    coin?: string | null
    score?: number | null
    graded_at?: string | null
    hours?: number | null
    outcome: { ai: string | null, tv?: string | null, coin?: string | null }
    trade: {
        lot: number
        risk: number
        entry: number | null
        sl?: number | null
        tp?: number | null
        trigger?: number | null
        close?: number | null
        hedged?: boolean | null
        pnl?: number | null
        hedge_price?: number | null
        hedge_hours?: number | null
        primary_pnl?: number | null
        hedge_pnl?: number | null
        slippage_pct?: number | null
    } | null
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
        trigger_price?: number
    } | null
    diagnostic?: {
        session?: string
        location?: string
        pos_pct?: number | null
        reason?: string | null
    } | null
}

interface TradeVisualizerModalProps {
    isOpen: boolean
    onClose: () => void
    signal: TradeSignal | null
}

const STORY_INFO: Record<string, { label: string, color: string, badgeCls: string, desc: string }> = {
    TP: {
        label: 'Take Profit Hit',
        color: '#10b981',
        badgeCls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
        desc: 'Position moved directly to its target take profit level.',
    },
    A: {
        label: 'Take Profit Hit',
        color: '#10b981',
        badgeCls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
        desc: 'Position moved directly to its target take profit level.',
    },
    SL: {
        label: 'Stop Loss Hit',
        color: '#ef4444',
        badgeCls: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        desc: 'Position reached its stop loss boundary.',
    },
    B: {
        label: 'Stop Loss Hit',
        color: '#ef4444',
        badgeCls: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        desc: 'Position reached its stop loss boundary.',
    },
    PAIRED: {
        label: 'Take Profit Hit',
        color: '#10b981',
        badgeCls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
        desc: 'Position reached its profit target and closed.',
    },
    C: {
        label: 'Take Profit Hit',
        color: '#10b981',
        badgeCls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
        desc: 'Position reached its profit target and closed.',
    },
    W8: {
        label: 'Closed in Profit',
        color: '#10b981',
        badgeCls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        desc: 'Position closed in net profit in the trade direction.',
    },
    X: {
        label: 'Position Closed',
        color: '#a1a1aa',
        badgeCls: 'bg-zinc-800 text-zinc-300 border-zinc-700',
        desc: 'Position reached holding duration and was marked to market at the closing price.',
    },
    MANUAL: {
        label: 'Manual Close',
        color: '#38bdf8',
        badgeCls: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
        desc: 'Position was closed manually by the trading team or trader.',
    },
    M: {
        label: 'Manual Close',
        color: '#38bdf8',
        badgeCls: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
        desc: 'Position was closed manually by the trading team or trader.',
    },
}

export default function TradeVisualizerModal({ isOpen, onClose, signal }: TradeVisualizerModalProps) {
    const chartBox = useRef<HTMLDivElement>(null)
    const chartRef = useRef<any>(null)
    const seriesRef = useRef<any>(null)
    const extraSeriesRef = useRef<any[]>([])
    const linesRef = useRef<any[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [candleCount, setCandleCount] = useState<number>(0)
    const [error, setError] = useState<string | null>(null)
    const [displayLevels, setDisplayLevels] = useState<{ entry?: number | null, tp?: number | null, sl?: number | null, close?: number | null, exitSec?: number | null, hours?: number | null } | null>(null)

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        if (isOpen) window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose])

    // Load lightweight-charts and fetch candles when modal opens
    useEffect(() => {
        if (!isOpen || !signal) return
        let disposed = false
        setLoading(true)
        setError(null)

        // Clean up previous chart instance
        if (chartRef.current) {
            chartRef.current.remove()
            chartRef.current = null
            seriesRef.current = null
            extraSeriesRef.current = []
            linesRef.current = []
        }

        const initChart = async () => {
            try {
                const { createChart, ColorType, CrosshairMode, LineStyle } = await import('lightweight-charts')
                if (disposed || !chartBox.current) return

                const chart = createChart(chartBox.current, {
                    autoSize: true,
                    layout: {
                        background: { type: ColorType.Solid, color: '#09090b' },
                        textColor: '#94a3b8',
                        fontSize: 11,
                    },
                    grid: {
                        vertLines: { color: '#18181b' },
                        horzLines: { color: '#18181b' },
                    },
                    rightPriceScale: {
                        borderColor: '#27272a',
                        scaleMargins: { top: 0.1, bottom: 0.1 },
                    },
                    timeScale: {
                        borderColor: '#27272a',
                        timeVisible: true,
                        secondsVisible: false,
                    },
                    crosshair: { mode: CrosshairMode.Normal },
                })

                const series = chart.addCandlestickSeries({
                    upColor: '#10b981',
                    downColor: '#ef4444',
                    borderVisible: false,
                    wickUpColor: '#10b981',
                    wickDownColor: '#ef4444',
                })

                chartRef.current = chart
                seriesRef.current = series

                // Fetch 5m candles surrounding the trade entry
                const res = await fetch(`/api/trade-chart?time=${encodeURIComponent(signal.created_at)}&before=4&after=12`, { cache: 'no-store' })
                const data = await res.json()
                if (disposed) return
                if (!res.ok) throw new Error(data.error || 'Failed to fetch trade candles')

                const candles = data.candles || []
                if (!candles.length) throw new Error('No candle data available for this trade timestamp')

                // Offset time to viewer's local timezone
                const shift = -new Date().getTimezoneOffset() * 60
                const shiftedCandles = candles.map((c: any) => ({
                    time: c.time + shift,
                    open: c.open,
                    high: c.high,
                    low: c.low,
                    close: c.close,
                }))

                series.setData(shiftedCandles)
                setCandleCount(shiftedCandles.length)

                // Add horizontal price lines for Entry, TP, SL, S/R
                const t = signal.trade
                const r = signal.rule
                linesRef.current.forEach((l) => series.removePriceLine(l))
                linesRef.current = []

                const entrySec = Math.floor(new Date(signal.created_at).getTime() / 1000) + shift
                const isBuy = signal.ai === 'buy'

                // Find nearest candle to entry time
                const snappedEntryCandle = shiftedCandles.reduce((prev: any, curr: any) =>
                    Math.abs(curr.time - entrySec) < Math.abs(prev.time - entrySec) ? curr : prev,
                    shiftedCandles[0]
                )
                const snappedEntryTime = snappedEntryCandle?.time ?? entrySec

                // Effective price levels (with fallback to candle price if entry wasn't pre-recorded)
                const effectiveEntry = t?.entry || snappedEntryCandle?.open || null
                let effectiveSl = t?.sl || null
                let effectiveTp = t?.tp || null
                let effectiveClose = t?.close || null

                if (effectiveEntry && t) {
                    const lot = t.lot || 0.02
                    const dollarsPerDollar = lot * 100
                    if (!effectiveSl && t.risk && dollarsPerDollar > 0) {
                        const delta = t.risk / dollarsPerDollar
                        effectiveSl = isBuy ? effectiveEntry - delta : effectiveEntry + delta
                    }
                    if (!effectiveTp && t.risk && dollarsPerDollar > 0) {
                        const delta = t.risk / dollarsPerDollar
                        effectiveTp = isBuy ? effectiveEntry + delta : effectiveEntry - delta
                    }
                    if (!effectiveClose && t.pnl != null && dollarsPerDollar > 0) {
                        const delta = t.pnl / dollarsPerDollar
                        effectiveClose = isBuy ? effectiveEntry + delta : effectiveEntry - delta
                    }
                }

                // Determine exact exit timestamp and price
                const story = signal.outcome?.ai ?? (t?.pnl && t.pnl >= 0 ? 'TP' : 'SL')
                let computedExitSec: number | null = null

                // 1. Explicit close time from signal
                if (signal.close_at) {
                    const rawCloseSec = Math.floor(new Date(signal.close_at).getTime() / 1000) + shift
                    if (!isNaN(rawCloseSec) && rawCloseSec > entrySec) {
                        computedExitSec = rawCloseSec
                    }
                } else if (signal.hours != null && Number(signal.hours) > 0) {
                    computedExitSec = entrySec + Math.round(Number(signal.hours) * 3600)
                }

                // 2. Candle-based resolution if timestamp was missing
                const futureCandles = shiftedCandles.filter((c: any) => c.time >= snappedEntryTime)
                if (!computedExitSec && futureCandles.length > 0) {
                    if (story === 'TP' || story === 'A') {
                        const tpHit = futureCandles.find((c: any) =>
                            isBuy ? (effectiveTp && c.high >= effectiveTp) : (effectiveTp && c.low <= effectiveTp)
                        )
                        if (tpHit) {
                            computedExitSec = tpHit.time
                            if (!effectiveClose && effectiveTp) effectiveClose = effectiveTp
                        }
                    } else if (story === 'SL' || story === 'B') {
                        const slHit = futureCandles.find((c: any) =>
                            isBuy ? (effectiveSl && c.low <= effectiveSl) : (effectiveSl && c.high >= effectiveSl)
                        )
                        if (slHit) {
                            computedExitSec = slHit.time
                            if (!effectiveClose && effectiveSl) effectiveClose = effectiveSl
                        }
                    }

                    // Check if price reached effectiveClose
                    const targetClose = effectiveClose
                    if (!computedExitSec && targetClose != null) {
                        const closeCross = futureCandles.find((c: any) =>
                            c.low <= targetClose && c.high >= targetClose
                        )
                        if (closeCross) {
                            computedExitSec = closeCross.time
                        }
                    }

                    // Fallback to closest candle to effectiveClose
                    if (!computedExitSec && targetClose != null) {
                        const closestCandle = futureCandles.reduce((prev: any, curr: any) =>
                            Math.abs(curr.close - targetClose) < Math.abs(prev.close - targetClose) ? curr : prev,
                            futureCandles[futureCandles.length - 1]
                        )
                        computedExitSec = closestCandle.time
                    }
                }

                // Snap exit time to valid candle
                const snappedExitCandle = computedExitSec
                    ? shiftedCandles.reduce((prev: any, curr: any) =>
                        Math.abs(curr.time - computedExitSec!) < Math.abs(prev.time - computedExitSec!) ? curr : prev,
                        shiftedCandles[shiftedCandles.length - 1]
                      )
                    : (futureCandles[futureCandles.length - 1] || shiftedCandles[shiftedCandles.length - 1])

                const snappedExitTime = Math.max(snappedEntryTime, snappedExitCandle?.time ?? snappedEntryTime)
                const finalClosePrice = effectiveClose ?? snappedExitCandle?.close ?? effectiveEntry
                const durationHours = Math.max(0.1, (snappedExitTime - snappedEntryTime) / 3600)

                setDisplayLevels({
                    entry: effectiveEntry,
                    tp: effectiveTp,
                    sl: effectiveSl,
                    close: finalClosePrice,
                    exitSec: snappedExitTime,
                    hours: durationHours,
                })

                if (effectiveEntry) {
                    const addLine = (price: number, color: string, title: string, lineStyle: number, lineWidth: 1 | 2 = 1) => {
                        linesRef.current.push(
                            series.createPriceLine({
                                price,
                                color,
                                lineWidth,
                                lineStyle,
                                axisLabelVisible: true,
                                title,
                            })
                        )
                    }

                    // 1. Entry Line (Solid Blue/White)
                    addLine(effectiveEntry, '#38bdf8', `Entry: $${effectiveEntry.toFixed(2)}`, LineStyle.Solid, 2)

                    // 2. Take Profit Line (Dashed Green)
                    if (effectiveTp) {
                        addLine(effectiveTp, '#10b981', `Target TP: $${effectiveTp.toFixed(2)}`, LineStyle.Dashed, 2)
                    }

                    // 3. Stop Loss Line (Dashed Red)
                    if (effectiveSl) {
                        addLine(effectiveSl, '#ef4444', `Stop Loss: $${effectiveSl.toFixed(2)}`, LineStyle.Dashed, 2)
                    }

                    // 4. Support Boundary (Dashed Emerald/Teal)
                    if (r && r.support != null) {
                        addLine(r.support, '#059669', `Support Floor: $${r.support.toFixed(2)}`, LineStyle.LargeDashed, 1)
                    }

                    // 5. Resistance Boundary (Dashed Rose/Amber)
                    if (r && r.resistance != null) {
                        addLine(r.resistance, '#f43f5e', `Resistance Ceiling: $${r.resistance.toFixed(2)}`, LineStyle.LargeDashed, 1)
                    }
                }

                // Add Markers for Entry and Exit
                const markers: any[] = []

                // Entry Marker
                if (effectiveEntry != null) {
                    markers.push({
                        time: snappedEntryTime,
                        position: isBuy ? 'belowBar' : 'aboveBar',
                        color: isBuy ? '#38bdf8' : '#f43f5e',
                        shape: isBuy ? 'arrowUp' : 'arrowDown',
                        text: `${isBuy ? '▲ BUY' : '▼ SELL'} @ $${effectiveEntry.toFixed(2)}`,
                    })
                }

                // Exit Marker
                const isWin = (t?.pnl != null && t.pnl >= 0)
                const isLoss = (t?.pnl != null && t.pnl < 0)

                let outcomeText = isWin
                    ? `🎯 Take Profit Hit @ $${finalClosePrice.toFixed(2)}`
                    : `🛑 Stop Loss Hit @ $${finalClosePrice.toFixed(2)}`
                if (story === 'TP' || story === 'A') {
                    outcomeText = `🎯 Take Profit Hit @ $${finalClosePrice.toFixed(2)}`
                } else if (story === 'SL' || story === 'B') {
                    outcomeText = `🛑 Stop Loss Hit @ $${finalClosePrice.toFixed(2)}`
                } else if (story === 'MANUAL' || story === 'M') {
                    outcomeText = `🔒 Closed @ $${finalClosePrice.toFixed(2)}`
                }

                markers.push({
                    time: snappedExitTime,
                    position: isBuy ? (isLoss ? 'belowBar' : 'aboveBar') : (isLoss ? 'aboveBar' : 'belowBar'),
                    color: isLoss ? '#ef4444' : '#10b981',
                    shape: isLoss ? 'arrowDown' : 'arrowUp',
                    text: outcomeText,
                })

                series.setMarkers(markers)

                // Clean up previous extra series (points, connector line)
                if (extraSeriesRef.current.length && chartRef.current) {
                    extraSeriesRef.current.forEach((s) => {
                        try { chartRef.current.removeSeries(s) } catch {}
                    })
                    extraSeriesRef.current = []
                }

                // 1. Precise Opening Point directly on the candle coordinate
                if (effectiveEntry != null) {
                    const openPointSeries = chart.addLineSeries({
                        color: isBuy ? '#38bdf8' : '#f43f5e',
                        lineWidth: 1,
                        lineVisible: false,
                        pointMarkersVisible: true,
                        pointMarkersRadius: 7,
                        priceLineVisible: false,
                        lastValueVisible: false,
                        crosshairMarkerVisible: false,
                    })
                    openPointSeries.setData([{ time: snappedEntryTime as any, value: Number(effectiveEntry.toFixed(2)) }])
                    extraSeriesRef.current.push(openPointSeries)
                }

                // 2. Precise Closing Point directly on the exit candle coordinate
                if (finalClosePrice != null) {
                    const closePointSeries = chart.addLineSeries({
                        color: isWin ? '#10b981' : '#ef4444',
                        lineWidth: 1,
                        lineVisible: false,
                        pointMarkersVisible: true,
                        pointMarkersRadius: 7,
                        priceLineVisible: false,
                        lastValueVisible: false,
                        crosshairMarkerVisible: false,
                    })
                    closePointSeries.setData([{ time: snappedExitTime as any, value: Number(finalClosePrice.toFixed(2)) }])
                    extraSeriesRef.current.push(closePointSeries)
                }

                // 3. Trade Execution Line (connecting opening position to closing position)
                if (effectiveEntry != null && finalClosePrice != null) {
                    const tradeLine = chart.addLineSeries({
                        color: isWin ? '#10b981' : '#ef4444',
                        lineWidth: 2,
                        lineStyle: LineStyle.Dashed,
                        priceLineVisible: false,
                        lastValueVisible: false,
                        crosshairMarkerVisible: true,
                    })
                    extraSeriesRef.current.push(tradeLine)

                    const positionCandles = shiftedCandles.filter(
                        (c: any) => c.time >= snappedEntryTime && c.time <= snappedExitTime
                    )

                    const linePoints: { time: any; value: number }[] = []
                    if (snappedExitTime > snappedEntryTime && positionCandles.length >= 2) {
                        const totalDuration = snappedExitTime - snappedEntryTime
                        positionCandles.forEach((c: any) => {
                            const fraction = (c.time - snappedEntryTime) / totalDuration
                            const val = effectiveEntry + fraction * (finalClosePrice - effectiveEntry)
                            linePoints.push({
                                time: c.time,
                                value: Number(val.toFixed(2)),
                            })
                        })
                    } else {
                        linePoints.push({ time: snappedEntryTime, value: Number(effectiveEntry.toFixed(2)) })
                        if (snappedExitTime > snappedEntryTime) {
                            linePoints.push({ time: snappedExitTime, value: Number(finalClosePrice.toFixed(2)) })
                        }
                    }

                    if (linePoints.length > 0) {
                        tradeLine.setData(linePoints)
                    }
                }

                chart.timeScale().fitContent()
                setLoading(false)
            } catch (err: any) {
                if (!disposed) {
                    setError(err.message || 'Failed to render trade chart')
                    setLoading(false)
                }
            }
        }

        initChart()

        return () => {
            disposed = true
            if (chartRef.current) {
                chartRef.current.remove()
                chartRef.current = null
                seriesRef.current = null
                extraSeriesRef.current = []
                linesRef.current = []
            }
        }
    }, [isOpen, signal])

    if (!isOpen || !signal) return null

    const t = signal.trade
    const r = signal.rule
    const isWin = (t?.pnl != null && t.pnl >= 0)
    const rawStory = signal.outcome?.ai ?? (isWin ? 'TP' : 'SL')
    const story = (rawStory === 'PAIRED' || rawStory === 'C')
        ? (isWin ? 'TP' : 'SL')
        : rawStory
    const storyMeta = STORY_INFO[story] ?? (isWin ? STORY_INFO.TP : STORY_INFO.SL)

    // Format Philippine Time
    const d = new Date(signal.created_at)
    const phTime = d.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', hour12: true })
    const phDate = d.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' })
    const utcTime = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`
    
    const shift = -new Date().getTimezoneOffset() * 60
    const effectiveHours = displayLevels?.hours ?? signal.hours
    const closeD = displayLevels?.exitSec
        ? new Date((displayLevels.exitSec - shift) * 1000)
        : (effectiveHours ? new Date(d.getTime() + Number(effectiveHours) * 3600 * 1000) : null)
    const phCloseTime = closeD ? closeD.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', hour12: true }) : '—'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-5xl rounded-3xl border border-[#27272a] bg-[#0c0c0e] shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
                
                {/* Header HUD */}
                <div className="p-6 border-b border-[#1f1f23] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#121216] via-[#0e0e12] to-[#09090b]">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-2xl border ${signal.ai === 'buy' ? 'bg-sky-500/15 border-sky-500/30 text-sky-400' : 'bg-rose-500/15 border-rose-500/30 text-rose-400'}`}>
                            {signal.ai === 'buy' ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <span className={`text-xs px-2.5 py-1 rounded-lg font-bold border ${storyMeta.badgeCls}`}>
                                    {storyMeta.label}
                                </span>
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300">
                                    XAUUSD · {signal.ai?.toUpperCase()}
                                </span>
                                <span className="text-xs text-zinc-300 flex items-center gap-1.5 font-medium">
                                    <Clock className="h-3.5 w-3.5 text-emerald-400" />
                                    <span>Opened: {phTime}</span>
                                    <span className="text-zinc-500">→</span>
                                    <span className="text-emerald-300 font-semibold">Closed: {phCloseTime}</span>
                                    <span className="text-zinc-500">({phDate} · <span className="font-mono text-zinc-500">{utcTime}</span>)</span>
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2">
                                <span>Trade Replay Visualizer</span>
                                <span className="text-xs text-muted-foreground font-normal">
                                    ({effectiveHours ? `${Number(effectiveHours).toFixed(1)}h duration` : '8h horizon'})
                                </span>
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {t?.pnl != null && (
                            <div className={`px-4 py-2 rounded-2xl border text-right ${t.pnl >= 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                                <div className="text-[10px] uppercase tracking-wider font-semibold opacity-75">Net Result</div>
                                <div className="text-lg font-bold tabular-nums">
                                    {t.pnl >= 0 ? '+' : '−'}${Math.abs(t.pnl).toFixed(2)}
                                </div>
                            </div>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors border border-zinc-700/60"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Metrics Bar */}
                <div className="px-6 py-3 border-b border-[#18181b] bg-[#09090b] grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 text-xs">
                    <div>
                        <span className="text-zinc-500 block text-[10px] uppercase tracking-wider">Entry Price</span>
                        <span className="font-mono font-bold text-sky-400">
                            {displayLevels?.entry != null ? `$${displayLevels.entry.toFixed(2)}` : (t?.entry != null ? `$${t.entry.toFixed(2)}` : '—')}
                        </span>
                    </div>
                    <div>
                        <span className="text-zinc-500 block text-[10px] uppercase tracking-wider">Target TP</span>
                        <span className="font-mono font-bold text-emerald-400">
                            {displayLevels?.tp != null ? `$${displayLevels.tp.toFixed(2)}` : (t?.tp != null ? `$${t.tp.toFixed(2)}` : '—')}
                        </span>
                    </div>
                    <div>
                        <span className="text-zinc-500 block text-[10px] uppercase tracking-wider">Stop Loss</span>
                        <span className="font-mono font-bold text-red-400">
                            {displayLevels?.sl != null ? `$${displayLevels.sl.toFixed(2)}` : (t?.sl != null ? `$${t.sl.toFixed(2)}` : '—')}
                        </span>
                    </div>
                    <div>
                        <span className="text-zinc-500 block text-[10px] uppercase tracking-wider">Lot Size</span>
                        <span className="font-mono font-bold text-white">
                            {t?.lot != null ? `${t.lot} lot` : '—'}
                        </span>
                    </div>
                    <div>
                        <span className="text-zinc-500 block text-[10px] uppercase tracking-wider">Exit Price</span>
                        <span className="font-mono font-bold text-white">
                            {displayLevels?.close != null ? `$${displayLevels.close.toFixed(2)}` : (t?.close != null ? `$${t.close.toFixed(2)}` : '—')}
                        </span>
                    </div>
                    <div>
                        <span className="text-zinc-500 block text-[10px] uppercase tracking-wider">S/R Channel</span>
                        <span className="font-mono font-bold text-zinc-300">
                            {r ? `$${r.support.toFixed(1)}–$${r.resistance.toFixed(1)}` : '—'}
                        </span>
                    </div>
                    <div>
                        <span className="text-zinc-500 block text-[10px] uppercase tracking-wider">S/R Proximity</span>
                        <span className={`font-mono font-bold ${
                            (r?.proximity_pct ?? 50) <= 15 ? 'text-emerald-400' : (r?.proximity_pct ?? 50) >= 85 ? 'text-rose-400' : 'text-amber-400'
                        }`}>
                            {r?.proximity_pct != null ? `${Number(r.proximity_pct).toFixed(1)}%` : '—'}
                            <span className="text-[10px] font-normal ml-0.5 text-zinc-400">
                                {(r?.proximity_pct ?? 50) <= 15 ? '(Support)' : (r?.proximity_pct ?? 50) >= 85 ? '(Resistance)' : '(Mid)'}
                            </span>
                        </span>
                    </div>
                    <div>
                        <span className="text-zinc-500 block text-[10px] uppercase tracking-wider">Past Trend</span>
                        <span className={`font-semibold uppercase ${
                            (r?.past_trend ?? '').includes('buy') ? 'text-emerald-400' : (r?.past_trend ?? '').includes('sell') ? 'text-rose-400' : 'text-zinc-400'
                        }`}>
                            {r?.past_trend ?? '—'}
                            {r?.past_score != null && <span className="font-mono text-[10px] text-zinc-500 ml-1">({r.past_score > 0 ? '+' : ''}{Number(r.past_score).toFixed(2)})</span>}
                        </span>
                    </div>
                </div>

                {/* Chart Canvas Area */}
                <div className="relative flex-1 min-h-[420px] bg-[#09090b]">
                    {loading && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#09090b]/90 text-zinc-400">
                            <Clock className="h-6 w-6 animate-spin text-emerald-400" />
                            <span className="text-xs font-medium">Reconstructing 5-minute price action & levels...</span>
                        </div>
                    )}
                    {error && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#09090b]/90 text-rose-400 p-6 text-center">
                            <AlertTriangle className="h-6 w-6" />
                            <span className="text-sm font-semibold">{error}</span>
                            <span className="text-xs text-zinc-500">Could not retrieve candlestick bars for this timestamp.</span>
                        </div>
                    )}
                    <div ref={chartBox} className="w-full h-full min-h-[420px]" />
                </div>

                {/* Legend & Narrative Footer */}
                <div className="p-5 border-t border-[#1f1f23] bg-[#0c0c0e] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400">
                        <span className="flex items-center gap-1.5">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#38bdf8]" /> Open Point
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: (t?.pnl != null && t.pnl >= 0) ? '#10b981' : '#ef4444' }} /> Close Point
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="inline-block w-4 h-0.5 border-t-2 border-dashed" style={{ borderColor: (t?.pnl != null && t.pnl >= 0) ? '#10b981' : '#ef4444' }} /> Position Line (Open → Close)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="inline-block w-3 h-0.5 bg-[#38bdf8]" /> Entry Level
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="inline-block w-3 h-0.5 bg-[#10b981] border-dashed" /> Target TP
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="inline-block w-3 h-0.5 bg-[#ef4444] border-dashed" /> Stop Loss
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="inline-block w-3 h-0.5 bg-[#059669]" /> Support Floor
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="inline-block w-3 h-0.5 bg-[#f43f5e]" /> Resistance Ceiling
                        </span>
                    </div>

                    <div className="text-zinc-400 text-xs">
                        {candleCount > 0 && <span className="font-mono text-zinc-500">{candleCount} 5m candles · </span>}
                        <span className="text-zinc-300 font-medium">{storyMeta.desc}</span>
                    </div>
                </div>

            </div>
        </div>
    )
}
