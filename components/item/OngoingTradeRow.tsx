"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, RefreshCw, X, Monitor, Save } from "lucide-react"
import Row from "@/components/ui/row"
import { toast } from "sonner"
import { confirmTrade } from "@/helper/automation"
import { updatePairedAccount } from "@/helper/paired_accounts"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

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
                    <span className="text-[#4788ff] text-[13px] font-medium">TP (Ticks)</span>
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
                    <span className="text-[#4788ff] text-[13px] font-medium">SL (Ticks)</span>
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

            const primaryPayload = {
                username: String(pair.primary_account?.credentials?.username || ""),
                password: String(pair.primary_account?.credentials?.password || ""),
                symbol: String(params.symbol),
                order_amount: String(params.primary_order_amount),
                tp_ticks: String(params.primary_take_profit),
                sl_ticks: String(params.primary_stop_loss),
                purchase_type: String(params.primary_order_type),
                account_number: String(pair.primary_account?.credentials?.username || pair.primary_account?.id),
                latest_equity: String(pair.primary_account?.live_equity || 0),
                daily_pnl: String(pair.primary_account?.daily_pnl || 0),
                rdd: String(pair.primary_account?.rdd || 0)
            }

            const secondaryPayload = {
                username: String(pair.secondary_account?.credentials?.username || ""),
                password: String(pair.secondary_account?.credentials?.password || ""),
                symbol: String(params.symbol),
                order_amount: String(params.secondary_order_amount),
                tp_ticks: String(params.secondary_take_profit),
                sl_ticks: String(params.secondary_stop_loss),
                purchase_type: String(params.secondary_order_type),
                account_number: String(pair.secondary_account?.credentials?.username || pair.secondary_account?.id),
                latest_equity: String(pair.secondary_account?.live_equity || 0),
                daily_pnl: String(pair.secondary_account?.daily_pnl || 0),
                rdd: String(pair.secondary_account?.rdd || 0)
            }

            const unit1 = pair.primary_account?.accounts?.units;
            const unit2 = pair.secondary_account?.accounts?.units;

            if (!unit1?.api_base_url || !unit2?.api_base_url) {
                throw new Error("API URL missing for one or both units");
            }

            const normalizeUrl = (url: string) => url.endsWith('/') ? url : `${url}/`;
            const api1 = normalizeUrl(unit1.api_base_url);
            const api2 = normalizeUrl(unit2.api_base_url);

            // Recovery uses the same confirmTrade logic to re-sync state
            await Promise.all([
                confirmTrade(api1, primaryPayload),
                confirmTrade(api2, secondaryPayload)
            ]);

            toast.success("Trade recovery signal sent")
        } catch (error: any) {
            console.error("Recovery error:", error)
            toast.error(error.message || "Failed to recover trade")
        } finally {
            setIsRecovering(false)
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

                    <div className="p-4 bg-[#161a1e] border-t border-[#2b3139] flex justify-center">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRecover();
                            }}
                            disabled={isRecovering}
                            className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-bold py-3 px-12 rounded-lg flex items-center gap-2 transition-all shadow-lg active:scale-95 min-w-[300px] justify-center"
                        >
                            {isRecovering ? (
                                <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <RefreshCw className="h-5 w-5" />
                            )}
                            Recover
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
