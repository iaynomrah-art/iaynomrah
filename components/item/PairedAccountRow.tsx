"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, PlayCircle, X, Monitor } from "lucide-react"
import Row from "@/components/ui/row"
import { inputCtraderOrder } from "@/helper/automation"
import { toast } from "sonner"

export default function PairedAccountRow({ pair }: { pair: any }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isStarting, setIsStarting] = useState(false)

    const handleStartTrading = async () => {
        try {
            setIsStarting(true)
            const accounts = [
                {
                    data: pair.primary_account,
                    params: {
                        trade_type: pair.primary_order_type,
                        order_amount: pair.primary_order_amount,
                        tp_ticks: pair.primary_take_profit,
                        sl_ticks: pair.primary_stop_loss,
                    }
                },
                {
                    data: pair.secondary_account,
                    params: {
                        trade_type: pair.secondary_order_type,
                        order_amount: pair.secondary_order_amount,
                        tp_ticks: pair.secondary_take_profit,
                        sl_ticks: pair.secondary_stop_loss,
                    }
                }
            ]

            // Demo Mode: Simulate network delay without running actual automation
            await new Promise(resolve => setTimeout(resolve, 2000));

            toast.success("Trading session started successfully")
        } catch (error: any) {
            console.error("Start trading error:", error)
            toast.error(error.message || "Failed to start trading")
        } finally {
            setIsStarting(false)
        }
    }

    const AccountColumn = ({ account, tradeParams }: { account: any, tradeParams: any }) => (
        <div className="flex flex-col bg-[#161a1e] w-full">
            {/* Account Header */}
            <div className={cn(
                "px-4 py-2.5 flex items-center justify-between transition-colors",
                tradeParams.purchase_type === 'buy' ? "bg-[#2ebc66]" : "bg-[#cf304a]"
            )}>
                <div className="flex items-center gap-1.5">
                    <div className="bg-[#f0b90b] text-black px-1.5 py-0.5 rounded-[3px] text-[10px] font-black uppercase">
                        {account.funders?.allias || "UPFT"}
                    </div>
                    <div className="bg-[#ffffff20] text-white px-1.5 py-0.5 rounded-[3px] text-[10px] font-bold uppercase truncate ">
                        {account.package?.phase || account.package?.name || "Standard Phase"}
                    </div>
                </div>
                <div className="text-white font-black text-[12px] uppercase tracking-tighter flex items-center gap-2">
                    {tradeParams.unit_name || `UNIT ${account.id}`}
                </div>
            </div>

            {/* Account Details */}
            <div className="divide-y divide-[#2b3139]">
                <Row label="Phase" value={account.package?.phase || "N/A"} color="text-[#f0b90b]" />
                <Row label="Starting Balance" value={`$${(account.package?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                <Row label="Starting Daily Equity" value={`$${(tradeParams.start_equity || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                <Row label="Latest Equity" value={`$${(account.live_equity || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                <Row label="Daily P&L" value={`$${(account.daily_pnl || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} color={(account.daily_pnl || 0) >= 0 ? "text-[#2ebc66]" : "text-[#f6465d]"} />
                <Row label="RDD" value={`$${(account.rdd || 0).toLocaleString()}`} />
                <Row label="Symbol" value={account.package?.symbol || "N/A"} />
                <Row label="Order Amount" value={String(tradeParams.order_amount)} />
                <Row label="Take Profit (Ticks)" value={String(tradeParams.tp_ticks)} />
                <Row label="Stop Loss (Ticks)" value={String(tradeParams.sl_ticks)} />

                <div className="grid grid-cols-2 px-4 py-3 items-center hover:bg-[#2b3139]/30 transition-colors">
                    <span className="text-[#848e9c] text-[13px] font-medium">Purchase Type</span>
                    <div className="flex justify-end">
                        <div className="bg-[#0b0e11] border border-[#2b3139] h-8 px-3 flex items-center text-[13px] font-bold rounded-[4px] min-w-[100px] justify-between text-white">
                            {tradeParams.purchase_type === 'buy' ? 'Buy' : 'Sell'}
                            <ChevronDown className="h-3 w-3 opacity-50" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

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
                                {pair.primary_account?.funders?.allias || "UPFT"}
                            </div>
                            <div className="bg-[#ffffff20] text-white px-1.5 py-0.5 rounded-[3px] text-[10px] font-bold uppercase truncate max-w-[80px]">
                                {pair.primary_account?.package?.phase || "PHASE 1"}
                            </div>
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                                {pair.primary_unit?.unit_name || pair.primary_account?.units?.unit_name}
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
                                {pair.secondary_account?.funders?.allias || "UPFT"}
                            </div>
                            <div className="bg-[#ffffff20] text-white px-1.5 py-0.5 rounded-[3px] text-[10px] font-bold uppercase truncate max-w-[80px]">
                                {pair.secondary_account?.package?.phase || "PHASE 1"}
                            </div>
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                                {pair.secondary_unit?.unit_name || pair.secondary_account?.units?.unit_name}
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
                            tradeParams={{
                                unit_name: pair.primary_unit?.unit_name,
                                purchase_type: pair.primary_order_type,
                                order_amount: pair.primary_order_amount,
                                tp_ticks: pair.primary_take_profit,
                                sl_ticks: pair.primary_stop_loss,
                                start_equity: pair.primary_account?.live_equity // Fallback if start_equity isn't explicitly in schema
                            }}
                        />
                        <AccountColumn
                            account={pair.secondary_account}
                            tradeParams={{
                                unit_name: pair.secondary_unit?.unit_name,
                                purchase_type: pair.secondary_order_type,
                                order_amount: pair.secondary_order_amount,
                                tp_ticks: pair.secondary_take_profit,
                                sl_ticks: pair.secondary_stop_loss,
                                start_equity: pair.secondary_account?.live_equity
                            }}
                        />
                    </div>

                    <div className="p-4 bg-[#161a1e] border-t border-[#2b3139] flex justify-center">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleStartTrading();
                            }}
                            disabled={isStarting}
                            className="bg-[#2ebc66] hover:bg-[#34d399] disabled:bg-[#2ebc66]/50 text-white font-bold py-3 px-12 rounded-lg flex items-center gap-2 transition-all shadow-lg active:scale-95 min-w-[200px] justify-center"
                        >
                            {isStarting ? (
                                <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <PlayCircle className="h-5 w-5" />
                            )}
                            Start Trading
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}