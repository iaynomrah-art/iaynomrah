"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, History, X, Monitor, Calendar, AlertTriangle, RotateCcw } from "lucide-react"
import Row from "@/components/ui/row"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { updatePairedAccount } from "@/helper/paired_accounts"

const buildClosePayload = (account: any, symbol: string) => {
    const creds = Array.isArray(account?.credentials) ? account.credentials[0] : account?.credentials
    const pkgCredsObj = account?.package_ref?.credential || account?.package_ref?.credentials
    const pkgCreds = Array.isArray(pkgCredsObj) ? pkgCredsObj[0] : pkgCredsObj
    const platform = creds?.platform || pkgCreds?.platform
    const automation = account?.package_ref?.funders?.automation || account?.funder?.automation || 'API'
    const isGui = automation === 'GUI'
    const event = platform?.toLowerCase() === 'ctrader'
        ? 'run_ctrader'
        : (platform?.toLowerCase().includes('mt5') || platform?.toLowerCase().includes('metatrader'))
            ? 'run_metatrader5'
            : 'run_tradelocker'

    return {
        event,
        payload: {
            username: creds?.username || pkgCreds?.username || "",
            password: creds?.password || pkgCreds?.password || "",
            server: creds?.server || pkgCreds?.server || "",
            account_id: creds?.platform_id || pkgCreds?.platform_id || "",
            db_account_id: account?.id,
            symbol: String(symbol || "XAUUSD"),
            operation: isGui ? 'close-position-gui' : 'close-position',
        }
    }
}

export default function TradeHistoryRow({ pair }: { pair: any }) {
    const [isOpen, setIsOpen] = useState(false)
    const [retrying, setRetrying] = useState<{ primary: boolean; secondary: boolean }>({ primary: false, secondary: false })

    const primaryCloseFailed = pair.primary_termination_status === 'close_failed'
    const secondaryCloseFailed = pair.secondary_termination_status === 'close_failed'
    const needsAttention = primaryCloseFailed || secondaryCloseFailed

    const handleRetryClose = async (role: 'primary' | 'secondary') => {
        const account = role === 'primary' ? pair.primary_account : pair.secondary_account
        const unitId = account?.accounts?.units?.unit_id

        if (!unitId) {
            toast.error('Unit GUID missing for this account — cannot connect to the trading PC.')
            return
        }

        setRetrying(prev => ({ ...prev, [role]: true }))
        try {
            const { event, payload } = buildClosePayload(account, pair.symbol)
            const orchestratorUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'https://orchestrator.iaynomrah.cloud'
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            const res = await fetch(`${orchestratorUrl}/api/v1/units/broadcast`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    unitId,
                    event,
                    payload,
                    timeoutMs: 30000,
                    expectedReplyEvent: 'trade_result',
                })
            })

            const data = await res.json()
            const result = data?.data?.result
            const succeeded = res.ok && result && result.status === 'success'

            if (!succeeded) {
                throw new Error(result?.message || result?.reason || data?.message || 'Retry close failed')
            }

            await updatePairedAccount(pair.id, {
                [role === 'primary' ? 'primary_termination_status' : 'secondary_termination_status']: 'completed'
            } as any)

            toast.success(`${role === 'primary' ? 'Primary' : 'Secondary'} leg closed successfully.`)
        } catch (error: any) {
            console.error('Retry close failed:', error)
            toast.error(error.message || 'Failed to retry close')
        } finally {
            setRetrying(prev => ({ ...prev, [role]: false }))
        }
    }

    const formatDuration = (ms: number) => {
        if (ms < 0) return "0s";
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor(ms / (1000 * 60 * 60));
        
        if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
        if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
    };

    const AccountColumn = ({
        account,
        isPrimary
    }: {
        account: any,
        isPrimary: boolean
    }) => {
        const orderType = isPrimary ? pair.primary_order_type : pair.secondary_order_type;
        const tradeStartBalance = isPrimary ? pair.primary_starting_balance : pair.secondary_starting_balance;
        const tradeFinalBalance = isPrimary ? pair.primary_final_balance : pair.secondary_final_balance;
        const tradePnl = (tradeStartBalance != null && tradeFinalBalance != null)
            ? (tradeFinalBalance - tradeStartBalance)
            : 0;

        const entryTime = isPrimary ? pair.primary_execution_time : pair.secondary_execution_time;
        const closeTime = isPrimary ? pair.primary_close_time : pair.secondary_close_time;
        
        const formatTime = (t: any) => t ? new Date(t).toLocaleTimeString() : "N/A";
        const getDelay = (time1: any, time2: any) => {
            if (!time1 || !time2) return null;
            const diff = (new Date(time2).getTime() - new Date(time1).getTime()) / 1000;
            return diff > 0 ? `+${diff.toFixed(2)}s` : `${diff.toFixed(2)}s`;
        };
        
        const getHoldDuration = (start: any, end: any) => {
            if (!start || !end) return "N/A";
            return formatDuration(new Date(end).getTime() - new Date(start).getTime());
        };

        return (
            <div className="flex flex-col bg-[#161a1e] w-full">
                {/* Account Header */}
                <div className={cn(
                    "px-4 py-2.5 flex items-center justify-between transition-colors",
                    orderType === 'buy' ? "bg-[#2ebc66]" : "bg-[#cf304a]"
                )}>
                    <div className="flex items-center gap-1.5">
                        <div className="bg-[#f0b90b] text-black px-1.5 py-0.5 rounded-[3px] text-[10px] font-black uppercase">
                            {account.package_ref?.funders?.allias || account.funder || "UPFT"}
                        </div>
                        <div className="bg-[#ffffff20] text-white px-1.5 py-0.5 rounded-[3px] text-[10px] font-bold uppercase truncate ">
                            {account.package_ref?.phase || account.package || "Standard Phase"}
                        </div>
                    </div>
                    <div className="text-white font-black text-[12px] uppercase tracking-tighter flex items-center gap-2">
                        {account.accounts?.units?.unit_name || `UNIT ${account.id}`}
                    </div>
                </div>

                {/* Close-Failure Banner */}
                {(isPrimary ? primaryCloseFailed : secondaryCloseFailed) && (
                    <div className="px-4 py-2.5 bg-[#f6465d]/10 border-b border-[#f6465d]/30 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[11px] text-[#f6465d] font-semibold">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            Failed to close — position may still be open
                        </div>
                        <button
                            onClick={() => handleRetryClose(isPrimary ? 'primary' : 'secondary')}
                            disabled={retrying[isPrimary ? 'primary' : 'secondary']}
                            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#f6465d] border border-[#f6465d]/50 rounded px-2 py-1 hover:bg-[#f6465d]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        >
                            <RotateCcw className={cn("h-3 w-3", retrying[isPrimary ? 'primary' : 'secondary'] && "animate-spin")} />
                            {retrying[isPrimary ? 'primary' : 'secondary'] ? "Retrying..." : "Retry Close"}
                        </button>
                    </div>
                )}

                {/* Account Details */}
                <div className="divide-y divide-[#2b3139]">
                    <Row label="Phase" value={account.package_ref?.phase || "N/A"} color="text-[#f0b90b]" />
                    <Row label="Session Start Balance" value={`$${(tradeStartBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                    <Row label="Session End Balance" value={`$${(tradeFinalBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                    <Row label="Session P&L" value={`$${tradePnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} color={tradePnl >= 0 ? "text-[#2ebc66]" : "text-[#f6465d]"} />

                    <Row label="Entry Time" value={formatTime(entryTime)} />
                    {!isPrimary && pair.primary_execution_time && pair.secondary_execution_time && (
                        <Row label="Entry Delay" value={getDelay(pair.primary_execution_time, pair.secondary_execution_time)!} color="text-[#f0b90b] font-bold" />
                    )}
                    <Row label="Close Time" value={formatTime(closeTime)} />
                    {!isPrimary && pair.primary_close_time && pair.secondary_close_time && (
                        <Row label="Exit Delay" value={getDelay(pair.primary_close_time, pair.secondary_close_time)!} color="text-[#f0b90b] font-bold" />
                    )}
                    <Row label="Hold Duration" value={getHoldDuration(entryTime, closeTime)} color="text-white" />

                    <Row label="Symbol" value={pair.symbol || "XAUUSD"} color="text-white font-bold" />
                    <Row
                        label="Order Amount"
                        value={isPrimary ? pair.primary_order_amount : pair.secondary_order_amount}
                    />
                    <Row
                        label="Take Profit"
                        value={`${isPrimary ? pair.primary_take_profit : pair.secondary_take_profit} Ticks`}
                    />
                    <Row
                        label="Stop Loss"
                        value={`${isPrimary ? pair.primary_stop_loss : pair.secondary_stop_loss} Ticks`}
                    />
                    <Row
                        label="Purchase Type"
                        value={orderType}
                        color={orderType === 'buy' ? "text-[#2ebc66] font-bold uppercase" : "text-[#f6465d] font-bold uppercase"}
                    />
                </div>
            </div>
        )
    }

    const formattedDate = pair.updated_at
        ? new Date(pair.updated_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : 'N/A';

    const primaryPnl = (pair.primary_final_balance != null && pair.primary_starting_balance != null)
        ? (pair.primary_final_balance - pair.primary_starting_balance) : 0;
    const secondaryPnl = (pair.secondary_final_balance != null && pair.secondary_starting_balance != null)
        ? (pair.secondary_final_balance - pair.secondary_starting_balance) : 0;
    const totalPnl = primaryPnl + secondaryPnl;
    
    const tradeDuration = pair.duration_seconds != null
        ? formatDuration(pair.duration_seconds * 1000)
        : "N/A";

    return (
        <div className="border border-[#1a1a1a] rounded-xl overflow-hidden bg-[#0d0d0d] shadow-sm opacity-80 hover:opacity-100 transition-opacity">
            {/* Clickable Header */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-[#1a1a1a]/40 transition-all border-b border-[#2b3139] w-full"
            >
                {/* Left Side: Chevron and Names */}
                <div className="flex items-center gap-4">
                    <div className="p-1 px-1.5 rounded bg-[#1a1a1a] text-muted-foreground">
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest bg-[#1a1a1a] px-2 py-1 rounded">
                            {pair.primary_account?.accounts?.units?.unit_name}
                        </span>
                        <span className="text-muted-foreground mx-1">/</span>
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest bg-[#1a1a1a] px-2 py-1 rounded">
                            {pair.secondary_account?.accounts?.units?.unit_name}
                        </span>
                    </div>
                </div>

                {/* Right Side: PnL, Date, Status, Delete */}
                <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                    {/* PnL */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span className={cn(
                            "text-[12px] font-bold tracking-widest px-2.5 py-0.5 rounded-full",
                            totalPnl >= 0 ? "bg-[#2ebc66]/20 text-[#2ebc66]" : "bg-[#f6465d]/20 text-[#f6465d]"
                        )}>
                            {totalPnl >= 0 ? "+" : ""}${totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    <div className="h-4 w-px bg-[#2b3139]" />

                    {/* Date */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-medium uppercase tracking-wider">{formattedDate}</span>
                    </div>

                    <div className="h-4 w-px bg-[#2b3139]" />

                    {/* Duration */}
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="text-[11px] font-bold uppercase tracking-wider bg-[#1a1a1a] px-2 py-0.5 rounded border border-[#2b3139]">
                            ⏱ {tradeDuration}
                        </span>
                    </div>

                    <div className="h-4 w-px bg-[#2b3139]" />

                    {/* Status */}
                    <div className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border flex items-center gap-1",
                        needsAttention
                            ? "bg-[#f6465d]/20 text-[#f6465d] border-[#f6465d]/40"
                            : "bg-gray-800 text-gray-400 border-gray-700"
                    )}>
                        {needsAttention && <AlertTriangle className="h-3 w-3" />}
                        {needsAttention ? "Needs Attention" : "Completed"}
                    </div>

                    <div className="h-4 w-px bg-[#2b3139]" />

                    {/* Close/Delete Action */}
                    <button className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Dropdown Content */}
            {isOpen && (
                <div className="flex flex-col bg-[#0b0e11] border-t border-[#2b3139] animate-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-2 w-full divide-x divide-[#2b3139]">
                        <AccountColumn
                            account={pair.primary_account}
                            isPrimary={true}
                        />
                        <AccountColumn
                            account={pair.secondary_account}
                            isPrimary={false}
                        />
                    </div>

                    <div className="p-4 bg-[#0a0a0a] border-t border-[#2b3139] flex justify-between items-center px-8">
                        <div className="flex items-center gap-2 text-muted-foreground text-[11px] font-medium uppercase tracking-widest">
                            <History className="h-3.5 w-3.5" />
                            Session Ended
                        </div>
                        <span className="text-muted-foreground text-[11px] italic">
                            {pair.notes || "No additional notes for this session."}
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}
