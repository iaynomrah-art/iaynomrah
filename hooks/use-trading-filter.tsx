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
    const [selectedFunders, setSelectedFunders] = useState<string[]>([])
    const [selectedPhases, setSelectedPhases] = useState<string[]>([])
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
    const [selectedUnits, setSelectedUnits] = useState<string[]>([])
    const [selectedFranchises, setSelectedFranchises] = useState<string[]>([])
    const [pairableOnly, setPairableOnly] = useState(false)
    const [pairedOnly, setPairedOnly] = useState(false)
    const [showBurned, setShowBurned] = useState(true)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) {
                try {
                    const parsed = JSON.parse(saved)
                    if (parsed.funders) setSelectedFunders(parsed.funders)
                    if (parsed.phases) setSelectedPhases(parsed.phases)
                    if (parsed.statuses) setSelectedStatuses(parsed.statuses)
                    if (parsed.units) setSelectedUnits(parsed.units)
                    if (parsed.franchises) setSelectedFranchises(parsed.franchises)
                    if (parsed.pairable !== undefined) setPairableOnly(parsed.pairable)
                    if (parsed.pairedOnly !== undefined) setPairedOnly(parsed.pairedOnly)
                    if (parsed.showBurned !== undefined) setShowBurned(parsed.showBurned)
                } catch (e) {
                    console.error("Failed to parse filters", e)
                }
            }
        }
        setIsLoaded(true)
    }, [])

    useEffect(() => {
        if (isLoaded && typeof window !== 'undefined') {
            const filters = {
                funders: selectedFunders,
                phases: selectedPhases,
                statuses: selectedStatuses,
                units: selectedUnits,
                franchises: selectedFranchises,
                pairable: pairableOnly,
                pairedOnly: pairedOnly,
                showBurned
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
        }
    }, [selectedFunders, selectedPhases, selectedStatuses, selectedUnits, selectedFranchises, pairableOnly, pairedOnly, showBurned, isLoaded])

    // Derive all unique units from data (unit name is in package_ref.account.units.unit_name)
    const allUnits = useMemo(() => {
        const unitSet = new Set<string>()
        data.forEach(item => {
            // Try multiple paths since the data is flattened
            const unit = (item as any).package_ref?.account?.units?.unit_name
                || (item as any).accounts?.units?.unit_name
            if (unit) unitSet.add(unit)
        })
        return Array.from(unitSet).sort()
    }, [data])

    // Derive franchises from unit name prefix (e.g. IAYN-01 → IAYN)
    const allFranchises = useMemo(() => {
        const franchiseSet = new Set<string>()
        data.forEach(item => {
            const unit = (item as any).package_ref?.account?.units?.unit_name
                || (item as any).accounts?.units?.unit_name
            if (unit) {
                const prefix = unit.split('-')[0]
                if (prefix) franchiseSet.add(prefix)
            }
        })
        return Array.from(franchiseSet).sort()
    }, [data])

    const isAccountBurned = (item: TradingAccount) => {
        if ((item.status as string) === 'burned') return true
        const balance = item.package_ref?.balance || 0
        const maxDailyLoss = item.package_ref?.max_daily_loss || 0
        const maxTotalLoss = item.package_ref?.max_total_loss || 0
        const liveEquity = item.live_equity || 0
        const dailyStartingEquity = item.daily_starting_equity || balance
        const dailyDrawdown = Math.max(0, dailyStartingEquity - liveEquity)
        if (maxDailyLoss > 0 && dailyDrawdown >= maxDailyLoss) return true
        const totalDrawdown = Math.max(0, balance - liveEquity)
        if (maxTotalLoss > 0 && totalDrawdown >= maxTotalLoss) return true
        return false
    }

    const filteredData = useMemo(() => {
        return data.filter(item => {
            // Burned filter
            const burned = isAccountBurned(item)
            if (!showBurned && burned) return false

            const funderName = item.funder || item.package_ref?.funders?.name || ''
            const matchesFunder = selectedFunders.length === 0 || selectedFunders.includes(funderName)

            const itemPhase = (item.package_ref?.phase || item.package || '').toLowerCase()
            const matchesPhase = selectedPhases.length === 0 || selectedPhases.some(phase =>
                itemPhase.includes(phase.toLowerCase())
            )

            const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(item.status?.toLowerCase())

            const currentStatus = item.status?.toLowerCase() || 'idle'
            const matchesPairable = !pairableOnly || (currentStatus !== 'paired' && ['idle', 'trading'].includes(currentStatus))
            
            const matchesPairedOnly = !pairedOnly || (currentStatus === 'paired')

            // Unit filter (check multiple paths)
            const unitName = (item as any).package_ref?.account?.units?.unit_name
                || (item as any).accounts?.units?.unit_name || ''
            const matchesUnit = selectedUnits.length === 0 || selectedUnits.includes(unitName)

            // Franchise filter (derived from unit_name prefix)
            const franchisePrefix = unitName ? unitName.split('-')[0] : ''
            const matchesFranchise = selectedFranchises.length === 0 || selectedFranchises.includes(franchisePrefix)

            return matchesFunder && matchesPhase && matchesStatus && matchesPairable && matchesPairedOnly && matchesUnit && matchesFranchise
        })
    }, [data, selectedFunders, selectedPhases, selectedStatuses, selectedUnits, selectedFranchises, pairableOnly, pairedOnly, showBurned])

    const toggleFilter = (list: string[], setList: Dispatch<SetStateAction<string[]>>, value: string) => {
        setList(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value])
    }

    const resetFilters = () => {
        setSelectedFunders([])
        setSelectedPhases([])
        setSelectedStatuses([])
        setSelectedUnits([])
        setSelectedFranchises([])
        setPairableOnly(false)
        setPairedOnly(false)
        setShowBurned(true)
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY)
        }
    }

    const activeFilterCount = [
        selectedFunders.length,
        selectedPhases.length,
        selectedStatuses.length,
        selectedUnits.length,
        selectedFranchises.length,
        pairableOnly ? 1 : 0,
        pairedOnly ? 1 : 0,
        !showBurned ? 1 : 0,
    ].reduce((a, b) => a + b, 0)

    return {
        selectedFunders, setSelectedFunders,
        selectedPhases, setSelectedPhases,
        selectedStatuses, setSelectedStatuses,
        selectedUnits, setSelectedUnits,
        selectedFranchises, setSelectedFranchises,
        pairableOnly, setPairableOnly,
        pairedOnly, setPairedOnly,
        showBurned, setShowBurned,
        filteredData,
        allUnits,
        allFranchises,
        toggleFilter,
        resetFilters,
        activeFilterCount,
    }
}
