"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, RefreshCw, X, Monitor } from "lucide-react"
import Row from "@/components/ui/row"
import { toast } from "sonner"
import { confirmTrade } from "@/helper/automation"

export default function OngoingTradeRow({ pair }: { pair: any }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isRecovering, setIsRecovering] = useState(false)

    const handleRecover = async () => {
        try {
            setIsRecovering(true)

            const primaryPayload = {
                username: String(pair.primary_account?.credentials?.username || ""),
                password: String(pair.primary_account?.credentials?.password || ""),
                symbol: String(pair.symbol || "XAUUSD"),
                order_amount: String(pair.primary_order_amount),
                tp_ticks: String(pair.primary_take_profit),
                sl_ticks: String(pair.primary_stop_loss),
                purchase_type: String(pair.primary_order_type),
                account_number: String(pair.primary_account?.credentials?.username || pair.primary_account?.id),
                latest_equity: String(pair.primary_account?.live_equity || 0),
                daily_pnl: String(pair.primary_account?.daily_pnl || 0),
                rdd: String(pair.primary_account?.rdd || 0)
            }

            const secondaryPayload = {
                username: String(pair.secondary_account?.credentials?.username || ""),
                password: String(pair.secondary_account?.credentials?.password || ""),
                symbol: String(pair.symbol || "XAUUSD"),
                order_amount: String(pair.secondary_order_amount),
                tp_ticks: String(pair.secondary_take_profit),
                sl_ticks: String(pair.secondary_stop_loss),
                purchase_type: String(pair.secondary_order_type),
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

    const AccountColumn = ({
        account,
        isPrimary
    }: {
        account: any,
        isPrimary: boolean
    }) => {
        const orderType = isPrimary ? pair.primary_order_type : pair.secondary_order_type;

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
