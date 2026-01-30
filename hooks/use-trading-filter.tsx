import { useState, useMemo, Dispatch, SetStateAction, useEffect } from 'react'
import { TradingAccount } from "@/types/trading_accounts"

export const PHASES = ['Live', 'phase 1', 'phase 2', 'phase 3']
export const STATUSES = [
    'Idle',
    'Trading',
    'Paired',
    'ABS',
    'BRC',
    'BRC-CHECK',
    'WAITING',
    'OH',
    'KYC',
    'FOR PAYOUT'
]

const STORAGE_KEY = 'trading-filters'

export const useTradingFilter = (data: TradingAccount[]) => {
    // Filter states
    const [selectedFunders, setSelectedFunders] = useState<string[]>([])
    const [selectedPhases, setSelectedPhases] = useState<string[]>([])
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
    const [pairableOnly, setPairableOnly] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)

    // Load from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) {
                try {
                    const parsed = JSON.parse(saved)
                    if (parsed.funders) setSelectedFunders(parsed.funders)
                    if (parsed.phases) setSelectedPhases(parsed.phases)
                    if (parsed.statuses) setSelectedStatuses(parsed.statuses)
                    if (parsed.pairable !== undefined) setPairableOnly(parsed.pairable)
                } catch (e) {
                    console.error("Failed to parse filters", e)
                }
            }
        }
        setIsLoaded(true)
    }, [])

    // Save to localStorage when filters change
    useEffect(() => {
        if (isLoaded && typeof window !== 'undefined') {
            const filters = {
                funders: selectedFunders,
                phases: selectedPhases,
                statuses: selectedStatuses,
                pairable: pairableOnly
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
        }
    }, [selectedFunders, selectedPhases, selectedStatuses, pairableOnly, isLoaded])

    const filteredData = useMemo(() => {
        return data.filter(item => {
            const funderName = item.funder || item.package_ref?.funders?.name || ''
            const matchesFunder = selectedFunders.length === 0 || selectedFunders.includes(funderName)

            const itemPhase = (item.package_ref?.phase || item.package || '').toLowerCase()
            const matchesPhase = selectedPhases.length === 0 || selectedPhases.some(phase =>
                itemPhase.includes(phase.toLowerCase())
            )

            const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(item.status?.toLowerCase())

            const currentStatus = item.status?.toLowerCase() || 'idle'
            const matchesPairable = !pairableOnly || (currentStatus !== 'paired' && ['idle', 'trading'].includes(currentStatus))

            return matchesFunder && matchesPhase && matchesStatus && matchesPairable
        })
    }, [data, selectedFunders, selectedPhases, selectedStatuses, pairableOnly])

    const toggleFilter = (list: string[], setList: Dispatch<SetStateAction<string[]>>, value: string) => {
        setList(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value])
    }

    const resetFilters = () => {
        setSelectedFunders([])
        setSelectedPhases([])
        setSelectedStatuses([])
        setPairableOnly(false)
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY)
        }
    }

    return {
        // States
        selectedFunders,
        setSelectedFunders,
        selectedPhases,
        setSelectedPhases,
        selectedStatuses,
        setSelectedStatuses,
        pairableOnly,
        setPairableOnly,

        // Derived data
        filteredData,

        // Helpers
        toggleFilter,
        resetFilters
    }
}
