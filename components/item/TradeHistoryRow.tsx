"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, History, X, Monitor, Calendar } from "lucide-react"
import Row from "@/components/ui/row"

export default function TradeHistoryRow({ pair }: { pair: any }) {
    const [isOpen, setIsOpen] = useState(false)

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
                        {account.accounts?.units?.unit_name || `UNIT ${account.id}`}
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

    const formattedDate = pair.updated_at
        ? new Date(pair.updated_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : 'N/A';

    return (
        <div className="border border-[#1a1a1a] rounded-xl overflow-hidden bg-[#0d0d0d] shadow-sm opacity-80 hover:opacity-100 transition-opacity">
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
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest bg-[#1a1a1a] px-2 py-1 rounded">
                                {pair.primary_account?.accounts?.units?.unit_name}
                            </span>
                            <span className="text-muted-foreground mx-1">/</span>
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest bg-[#1a1a1a] px-2 py-1 rounded">
                                {pair.secondary_account?.accounts?.units?.unit_name}
                            </span>
                        </div>

                        <div className="h-4 w-px bg-[#2b3139]" />

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                <span className="text-[11px] font-medium uppercase tracking-wider">{formattedDate}</span>
                            </div>
                            <div className="bg-gray-800 text-gray-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-gray-700">
                                Completed
                            </div>
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
