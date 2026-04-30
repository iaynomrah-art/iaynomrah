"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, RefreshCw, X, Monitor, Save } from "lucide-react"
import Row from "@/components/ui/row"
import { toast } from "sonner"
import { updatePairedAccount } from "@/helper/paired_accounts"
import { broadcastToUnit } from "@/helper/realtime"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface AccountColumnProps {
    account: any;
    isPrimary: boolean;
    params: any;
    setParams: (val: any) => void;
    handleUpdateParameters: (newParams?: any) => Promise<void>;
}

const AccountColumn = ({
    account,
    isPrimary,
    params,
    setParams,
    handleUpdateParameters
}: AccountColumnProps) => {
    const orderType = isPrimary ? params.primary_order_type : params.secondary_order_type;

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
                    {account.accounts?.units?.unit_name || "NO UNIT"}
                </div>
            </div>

            {/* Account Details */}
            <div className="divide-y divide-[#2b3139]">
                <Row label="Phase" value={account.package_ref?.phase || "N/A"} color="text-[#f0b90b]" />
                <Row label="Starting Balance" value={`$${(account.package_ref?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                <Row label="Latest Equity" value={`$${(account.live_equity || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                <Row label="Daily P&L" value={`$${(account.daily_pnl || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} color={(account.daily_pnl || 0) >= 0 ? "text-[#2ebc66]" : "text-[#f6465d]"} />
                <Row label="RDD" value={`$${(account.rdd || 0).toLocaleString()}`} />

                {/* Editable Parameters */}
                <div className="grid grid-cols-2 px-4 py-2.5 items-center hover:bg-[#2b3139]/30 transition-colors">
                    <span className="text-[#848e9c] text-[13px] font-medium">Symbol</span>
                    <Input
                        value={params.symbol}
                        onChange={(e) => setParams((prev: any) => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                        onBlur={() => handleUpdateParameters()}
                        className="h-8 bg-[#0b0e11] border-[#2b3139] text-right text-[13px] font-bold uppercase w-32 ml-auto"
                    />
                </div>

                <div className="grid grid-cols-2 px-4 py-2.5 items-center hover:bg-[#2b3139]/30 transition-colors">
                    <span className="text-[#4788ff] text-[13px] font-medium">Order Amount</span>
                    <Input
                        type="number"
                        step="0.01"
                        value={isPrimary ? params.primary_order_amount : params.secondary_order_amount}
                        onChange={(e) => setParams((prev: any) => ({
                            ...prev,
                            [isPrimary ? "primary_order_amount" : "secondary_order_amount"]: Number(e.target.value)
                        }))}
                        onBlur={() => handleUpdateParameters()}
                        className="h-8 bg-[#0b0e11] border-[#2b3139] text-right text-[13px] font-bold w-32 ml-auto"
                    />
                </div>

                <div className="grid grid-cols-2 px-4 py-2.5 items-center hover:bg-[#2b3139]/30 transition-colors">
                    <span className="text-[#4788ff] text-[13px] font-medium">TP</span>
                    <Input
                        type="number"
                        value={isPrimary ? params.primary_take_profit : params.secondary_take_profit}
                        onChange={(e) => setParams((prev: any) => ({
                            ...prev,
                            [isPrimary ? "primary_take_profit" : "secondary_take_profit"]: Number(e.target.value)
                        }))}
                        onBlur={() => handleUpdateParameters()}
                        className="h-8 bg-[#0b0e11] border-[#2b3139] text-right text-[13px] font-bold w-32 ml-auto"
                    />
                </div>

                <div className="grid grid-cols-2 px-4 py-2.5 items-center hover:bg-[#2b3139]/30 transition-colors">
                    <span className="text-[#4788ff] text-[13px] font-medium">SL</span>
                    <Input
                        type="number"
                        value={isPrimary ? params.primary_stop_loss : params.secondary_stop_loss}
                        onChange={(e) => setParams((prev: any) => ({
                            ...prev,
                            [isPrimary ? "primary_stop_loss" : "secondary_stop_loss"]: Number(e.target.value)
                        }))}
                        onBlur={() => handleUpdateParameters()}
                        className="h-8 bg-[#0b0e11] border-[#2b3139] text-right text-[13px] font-bold w-32 ml-auto"
                    />
                </div>

                <div className="grid grid-cols-2 px-4 py-2.5 items-center hover:bg-[#2b3139]/30 transition-colors">
                    <span className="text-[#848e9c] text-[13px] font-medium">Purchase Type</span>
                    <Select
                        value={orderType}
                        onValueChange={(val) => {
                            const newParams = {
                                ...params,
                                [isPrimary ? "primary_order_type" : "secondary_order_type"]: val
                            };
                            setParams(newParams);
                            handleUpdateParameters(newParams);
                        }}
                    >
                        <SelectTrigger className="h-8 bg-[#0b0e11] border-[#2b3139] text-[13px] font-bold w-32 ml-auto">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1e2329] border-[#2b3139] text-white">
                            <SelectItem value="buy">BUY</SelectItem>
                            <SelectItem value="sell">SELL</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    )
}

export default function OngoingTradeRow({ pair }: { pair: any }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isRecovering, setIsRecovering] = useState(false)
    const [isForceClosing, setIsForceClosing] = useState(false)
    const [isForceCloseModalOpen, setIsForceCloseModalOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Local state for editable parameters
    const [params, setParams] = useState({
        symbol: pair.symbol || "XAUUSD",
        primary_order_amount: pair.primary_order_amount || 0.1,
        primary_take_profit: pair.primary_take_profit || 100,
        primary_stop_loss: pair.primary_stop_loss || 50,
        primary_order_type: pair.primary_order_type || "buy",
        secondary_order_amount: pair.secondary_order_amount || 0.1,
        secondary_take_profit: pair.secondary_take_profit || 100,
        secondary_stop_loss: pair.secondary_stop_loss || 50,
        secondary_order_type: pair.secondary_order_type || "sell"
    })

    // Update local state when pair prop changes (sync from DB)
    useEffect(() => {
        setParams({
            symbol: pair.symbol || "XAUUSD",
            primary_order_amount: pair.primary_order_amount || 0.1,
            primary_take_profit: pair.primary_take_profit || 100,
            primary_stop_loss: pair.primary_stop_loss || 50,
            primary_order_type: pair.primary_order_type || "buy",
            secondary_order_amount: pair.secondary_order_amount || 0.1,
            secondary_take_profit: pair.secondary_take_profit || 100,
            secondary_stop_loss: pair.secondary_stop_loss || 50,
            secondary_order_type: pair.secondary_order_type || "sell"
        })
    }, [pair])

    const getPlatform = (acc: any) => {
        const creds = acc.credentials;
        const pkgCreds = acc.package_ref?.credential || acc.package_ref?.credentials;
        return creds?.platform || pkgCreds?.platform;
    }

    const createRealtimePayload = (acc: any, isPrimary: boolean, operation: string) => {
        const creds = acc.credentials;
        const pkgCreds = acc.package_ref?.credential || acc.package_ref?.credentials;
        const platform = getPlatform(acc);

        return {
            event: platform?.toLowerCase() === 'ctrader' ? 'run_ctrader' : 'run_tradelocker',
            payload: {
                username: creds?.username || pkgCreds?.username || "",
                password: creds?.password || pkgCreds?.password || "",
                server: creds?.server || pkgCreds?.server || "",
                purchase_type: isPrimary ? params.primary_order_type : params.secondary_order_type,
                order_amount: isPrimary ? params.primary_order_amount : params.secondary_order_amount,
                take_profit: isPrimary ? params.primary_take_profit : params.secondary_take_profit,
                stop_loss: isPrimary ? params.primary_stop_loss : params.secondary_stop_loss,
                account_id: creds?.account_id || acc.accounts_id,
                db_account_id: acc.accounts_id,
                symbol: String(params.symbol || "XAUUSD"),
                operation: operation
            }
        }
    }

    const handleUpdateParameters = async (newParams = params) => {
        try {
            setIsSaving(true)
            await updatePairedAccount(pair.id, {
                symbol: newParams.symbol,
                primary_order_amount: newParams.primary_order_amount,
                primary_take_profit: newParams.primary_take_profit,
                primary_stop_loss: newParams.primary_stop_loss,
                primary_order_type: newParams.primary_order_type as any,
                secondary_order_amount: newParams.secondary_order_amount,
                secondary_take_profit: newParams.secondary_take_profit,
                secondary_stop_loss: newParams.secondary_stop_loss,
                secondary_order_type: newParams.secondary_order_type as any
            })
        } catch (error) {
            console.error("Failed to update parameters:", error)
            toast.error("Failed to save parameter changes")
        } finally {
            setIsSaving(false)
        }
    }

    const handleRecover = async () => {
        try {
            setIsRecovering(true)

            const unit1Id = pair.primary_account?.accounts?.units?.unit_id;
            const unit2Id = pair.secondary_account?.accounts?.units?.unit_id;

            if (!unit1Id || !unit2Id) {
                throw new Error("One or both units are missing a Unit GUID. Cannot connect to trading PCs.")
            }

            const p1Data = createRealtimePayload(pair.primary_account, true, 'trade-terminator');
            const p2Data = createRealtimePayload(pair.secondary_account, false, 'trade-terminator');

            toast.loading("Sending recovery signal...", { id: 'recover-trade' })

            // Recovery uses the trade-terminator operation to re-sync or recover state
            const [p1Res, p2Res] = await Promise.all([
                broadcastToUnit({ unitId: unit1Id, event: p1Data.event, payload: p1Data.payload, timeoutMs: 60000 }),
                broadcastToUnit({ unitId: unit2Id, event: p2Data.event, payload: p2Data.payload, timeoutMs: 60000 })
            ])

            const p1Result = p1Res?.result || {};
            const p2Result = p2Res?.result || {};

            if (p1Result?.success === false || p1Result?.status === 'failed' || p1Result?.status === 'error') {
                throw new Error(`Primary machine execution failed: ${p1Result?.reason || p1Result?.message || 'Unknown error'}`)
            }
            if (p2Result?.success === false || p2Result?.status === 'failed' || p2Result?.status === 'error') {
                throw new Error(`Secondary machine execution failed: ${p2Result?.reason || p2Result?.message || 'Unknown error'}`)
            }

            toast.success("Trade recovery executed successfully", { id: 'recover-trade' })
        } catch (error: any) {
            console.error("Recovery error:", error)
            toast.error(error.message || "Failed to recover trade", { id: 'recover-trade' })
        } finally {
            setIsRecovering(false)
        }
    }

    const handleForceClose = async () => {
        try {
            setIsForceClosing(true)

            const unit1Id = pair.primary_account?.accounts?.units?.unit_id;
            const unit2Id = pair.secondary_account?.accounts?.units?.unit_id;

            if (!unit1Id || !unit2Id) {
                throw new Error("One or both units are missing a Unit GUID. Cannot connect to trading PCs.")
            }

            const p1Data = createRealtimePayload(pair.primary_account, true, 'close-position');
            const p2Data = createRealtimePayload(pair.secondary_account, false, 'close-position');

            toast.loading("Sending force close signal...", { id: 'force-close' })

            const [p1Res, p2Res] = await Promise.all([
                broadcastToUnit({ unitId: unit1Id, event: p1Data.event, payload: p1Data.payload, timeoutMs: 60000 }),
                broadcastToUnit({ unitId: unit2Id, event: p2Data.event, payload: p2Data.payload, timeoutMs: 60000 })
            ])

            const p1Result = p1Res?.result || {};
            const p2Result = p2Res?.result || {};

            if (p1Result?.success === false || p1Result?.status === 'failed' || p1Result?.status === 'error') {
                throw new Error(`Primary machine execution failed: ${p1Result?.reason || p1Result?.message || 'Unknown error'}`)
            }
            if (p2Result?.success === false || p2Result?.status === 'failed' || p2Result?.status === 'error') {
                throw new Error(`Secondary machine execution failed: ${p2Result?.reason || p2Result?.message || 'Unknown error'}`)
            }

            toast.success("Force close executed successfully", { id: 'force-close' })
            setIsForceCloseModalOpen(false)
        } catch (error: any) {
            console.error("Force close error:", error)
            toast.error(error.message || "Failed to force close trade", { id: 'force-close' })
        } finally {
            setIsForceClosing(false)
        }
    }

    return (
        <div className="border border-[#1a1a1a] rounded-xl overflow-hidden bg-[#0a0a0a] shadow-sm">
            {/* Clickable Header */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-[#1a1a1a]/40 transition-all border-b border-[#2b3139]"
            >
                <div className="flex items-center gap-6 w-full">
                    <div className="p-1 px-1.5 rounded bg-[#1a1a1a] text-muted-foreground">
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>

                    <div className="flex items-center justify-between gap-4 w-full">
                        <div className="flex items-center gap-2">
                            <div className="bg-[#f0b90b] text-black px-1.5 py-0.5 rounded-[3px] text-[10px] font-black uppercase">
                                {pair.primary_account?.package_ref?.funders?.allias || pair.primary_account?.funder || "UPFT"}
                            </div>
                            <div className="bg-[#ffffff20] text-white px-1.5 py-0.5 rounded-[3px] text-[10px] font-bold uppercase truncate max-w-[80px]">
                                {pair.primary_account?.package_ref?.phase || pair.primary_account?.package || "PHASE 1"}
                            </div>
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                                {pair.primary_account?.accounts?.units?.unit_name || "NO UNIT"}
                            </span>
                            <a
                                href="https://remotedesktop.google.com/access"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 px-1.5 rounded bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-all flex items-center justify-center ml-1"
                                title="Remote Desktop"
                            >
                                <Monitor className="h-3 w-3" />
                            </a>
                        </div>

                        <div className="h-4 w-px bg-[#2b3139]" />

                        <div className="flex items-center gap-2">
                            <div className="bg-[#f0b90b] text-black px-1.5 py-0.5 rounded-[3px] text-[10px] font-black uppercase">
                                {pair.secondary_account?.package_ref?.funders?.allias || pair.secondary_account?.funder || "UPFT"}
                            </div>
                            <div className="bg-[#ffffff20] text-white px-1.5 py-0.5 rounded-[3px] text-[10px] font-bold uppercase truncate max-w-[80px]">
                                {pair.secondary_account?.package_ref?.phase || pair.secondary_account?.package || "PHASE 1"}
                            </div>
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                                {pair.secondary_account?.accounts?.units?.unit_name || "NO UNIT"}
                            </span>
                            <a
                                href="https://remotedesktop.google.com/access"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 px-1.5 rounded bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-all flex items-center justify-center ml-1"
                                title="Remote Desktop"
                            >
                                <Monitor className="h-3 w-3" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {isSaving && (
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground animate-pulse">
                            <Save className="h-3 w-3" />
                            Saving...
                        </div>
                    )}
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsForceCloseModalOpen(true);
                        }}
                        disabled={isForceClosing}
                        className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Force Close"
                    >
                        {isForceClosing ? (
                            <div className="h-4 w-4 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
                        ) : (
                            <X className="h-4 w-4" />
                        )}
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
                            params={params}
                            setParams={setParams}
                            handleUpdateParameters={handleUpdateParameters}
                        />
                        <AccountColumn
                            account={pair.secondary_account}
                            isPrimary={false}
                            params={params}
                            setParams={setParams}
                            handleUpdateParameters={handleUpdateParameters}
                        />
                    </div>

                    <div className="p-4 bg-[#161a1e] border-t border-[#2b3139] flex justify-center gap-4">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRecover();
                            }}
                            disabled={isRecovering || isForceClosing}
                            className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-bold py-3 px-12 rounded-lg flex items-center gap-2 transition-all shadow-lg active:scale-95 min-w-[200px] justify-center"
                        >
                            {isRecovering ? (
                                <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <RefreshCw className="h-5 w-5" />
                            )}
                            Recover
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsForceCloseModalOpen(true);
                            }}
                            disabled={isRecovering || isForceClosing}
                            className="bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 text-white font-bold py-3 px-12 rounded-lg flex items-center gap-2 transition-all shadow-lg active:scale-95 min-w-[200px] justify-center"
                        >
                            {isForceClosing ? (
                                <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <X className="h-5 w-5" />
                            )}
                            Force Close
                        </button>
                    </div>
                </div>
            )}
            {/* Confirmation Modal */}
            <Dialog open={isForceCloseModalOpen} onOpenChange={setIsForceCloseModalOpen}>
                <DialogContent className="bg-[#0b0e11] border-[#2b3139] text-white">
                    <DialogHeader>
                        <DialogTitle>Force Close Trade</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Are you sure you want to force close this pair? This action will immediately close both primary and secondary positions.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 flex gap-2 sm:gap-0">
                        <button
                            onClick={() => setIsForceCloseModalOpen(false)}
                            className="px-4 py-2 rounded-lg font-medium bg-[#161a1e] hover:bg-[#2b3139] transition-colors border border-[#2b3139]"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleForceClose}
                            disabled={isForceClosing}
                            className="px-4 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 flex items-center justify-center gap-2 transition-colors"
                        >
                            {isForceClosing && <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                            Confirm Force Close
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
