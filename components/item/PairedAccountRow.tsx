"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, X } from "lucide-react"
import Row from "@/components/ui/row"

export default function PairedAccountRow({ pair }: { pair: any }) {
    const [isOpen, setIsOpen] = useState(false)

    const AccountColumn = ({ account, tradeParams }: { account: any, tradeParams: any }) => (
        <div className="flex flex-col flex-1 bg-[#161a1e] border-x border-[#2b3139] last:border-r-0">
            {/* Account Header */}
            <div className={cn(
                "px-4 py-2.5 flex items-center justify-between transition-colors",
                tradeParams.purchase_type === 'buy' ? "bg-[#2ebc66]" : "bg-[#cf304a]"
            )}>
                <div className="flex items-center gap-1.5">
                    <div className="bg-[#f0b90b] text-black px-1.5 py-0.5 rounded-[3px] text-[10px] font-black uppercase">
                        {account.funders?.allias || "UPFT"}
                    </div>
                    <div className="bg-[#ffffff20] text-white px-1.5 py-0.5 rounded-[3px] text-[10px] font-bold uppercase truncate max-w-[100px]">
                        {account.package?.name || "Standard Phase"}
                    </div>
                    <span className="text-white text-[11px] font-bold ml-1">{account.credentials?.username || account.id}</span>
                </div>
                <div className="text-white font-black text-[12px] uppercase tracking-tighter flex items-center gap-2">
                    {account.units?.unit_name || `UNIT ${account.id}`}
                </div>
            </div>

            {/* Account Details */}
            <div className="divide-y divide-[#2b3139]">
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
                <div className="flex items-center gap-6">
                    <div className="p-1 px-1.5 rounded bg-[#1a1a1a] text-muted-foreground">
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="bg-[#f0b90b] text-black px-1.5 py-0.5 rounded-[3px] text-[10px] font-black">UPFT</div>
                            <span className="text-sm font-bold text-white">{pair.account_1?.credentials?.username || pair.account_1?.id}</span>
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{pair.account_1?.units?.unit_name}</span>
                        </div>

                        <div className="h-4 w-px bg-[#2b3139]" />

                        <div className="flex items-center gap-2">
                            <div className="bg-[#f0b90b] text-black px-1.5 py-0.5 rounded-[3px] text-[10px] font-black">UPFT</div>
                            <span className="text-sm font-bold text-white">{pair.account_2?.credentials?.username || pair.account_2?.id}</span>
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{pair.account_2?.units?.unit_name}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className={cn(
                        "text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded",
                        pair.status === 'paired' ? "bg-green-500/10 text-green-500" :
                            pair.status === 'ongoing' ? "bg-blue-500/10 text-blue-500" :
                                "bg-white/10 text-white"
                    )}>
                        {pair.status}
                    </span>
                    <button className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Dropdown Content */}
            {isOpen && (
                <div className="grid grid-cols-1 lg:grid-cols-2 bg-[#0b0e11] animate-in slide-in-from-top-2 duration-300">
                    <AccountColumn
                        account={pair.account_1}
                        tradeParams={{
                            purchase_type: pair.account_1_purchase_type,
                            order_amount: pair.account_1_order_amount,
                            tp_ticks: pair.account_1_tp_ticks,
                            sl_ticks: pair.account_1_sl_ticks,
                            start_equity: pair.account_1_start_equity
                        }}
                    />
                    <AccountColumn
                        account={pair.account_2}
                        tradeParams={{
                            purchase_type: pair.account_2_purchase_type,
                            order_amount: pair.account_2_order_amount,
                            tp_ticks: pair.account_2_tp_ticks,
                            sl_ticks: pair.account_2_sl_ticks,
                            start_equity: pair.account_2_start_equity
                        }}
                    />
                </div>
            )}
        </div>
    )
}