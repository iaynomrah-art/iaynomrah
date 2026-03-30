"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, PlayCircle, X, Monitor } from "lucide-react"
import Row from "@/components/ui/row"
import { toast } from "sonner"
import Swal from 'sweetalert2'
import { EditPairedAccountModal } from "@/components/modal/EditPairedAccountModal"
import { deletePairedAccount } from "@/helper/paired_accounts"

const AccountColumn = ({
    account,
    isPrimary,
    pair
}: {
    account: any,
    isPrimary: boolean,
    pair: any
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
                <div className="text-white font-black text-[11px] uppercase tracking-tighter flex flex-col items-end leading-none">
                    <span>{account.accounts?.units?.unit_name || `UNIT ${account.id}`}</span>
                    <span className="text-[9px] text-white/50 mt-1">
                        {account.accounts ? `${account.accounts.first_name} ${account.accounts.last_name}` : ""}
                    </span>
                </div>
            </div>

            {/* Account Details */}
            <div className="divide-y divide-[#2b3139]">
                <Row label="Phase" value={account.package_ref?.phase || "N/A"} color="text-[#f0b90b]" />
                <Row label="Starting Balance" value={`$${(account.package_ref?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                <Row label="Latest Equity" value={`$${(account.live_equity || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                <Row label="Daily P&L" value={`$${(account.daily_pnl || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} color={(account.daily_pnl || 0) >= 0 ? "text-[#2ebc66]" : "text-[#f6465d]"} />
                <Row label="RDD" value={`$${(account.rdd || 0).toLocaleString()}`} />

                {/* Static Parameters */}
                <Row label="Symbol" value={pair.symbol} color="text-white font-bold uppercase" />
                <Row
                    label="Order Amount"
                    value={isPrimary ? pair.primary_order_amount : pair.secondary_order_amount}
                    color="text-[#4788ff] font-bold"
                />
                <Row
                    label="TP"
                    value={isPrimary ? pair.primary_take_profit : pair.secondary_take_profit}
                    color="text-[#4788ff] font-bold"
                />
                <Row
                    label="SL"
                    value={isPrimary ? pair.primary_stop_loss : pair.secondary_stop_loss}
                    color="text-[#4788ff] font-bold"
                />
                <Row
                    label="Purchase Type"
                    value={(isPrimary ? pair.primary_order_type : pair.secondary_order_type).toUpperCase()}
                    color={orderType === 'buy' ? "text-[#2ebc66] font-bold" : "text-[#cf304a] font-bold"}
                />
            </div>
        </div>
    )
}

export default function PairedAccountRow({ pair }: { pair: any }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isStarting, setIsStarting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    const handleStartTradingDirectly = async () => {
        try {
            setIsStarting(true)

            // 1. Prepare payload for Edge Function
            const payload = {
                primary_account_id: String(pair.primary_account_id),
                secondary_account_id: String(pair.secondary_account_id),
                details: "place-order",
                primary: {
                    symbol: String(pair.symbol),
                    order_amount: pair.primary_order_amount,
                    stop_loss: pair.primary_stop_loss,
                    take_profit: pair.primary_take_profit,
                    order_type: pair.primary_order_type,
                    accounts_id: pair.primary_account?.accounts_id
                },
                secondary: {
                    symbol: String(pair.symbol),
                    order_amount: pair.secondary_order_amount,
                    stop_loss: pair.secondary_stop_loss,
                    take_profit: pair.secondary_take_profit,
                    order_type: pair.secondary_order_type,
                    accounts_id: pair.secondary_account?.accounts_id
                }
            }

            // 2. Call Edge Function
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
            const response = await fetch('https://cisszbamrleoxcnyeoku.supabase.co/functions/v1/pairing-trading-accounts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'apikey': `${supabaseKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
                toast.error(errorData.error || errorData.message || `Edge Function Error: ${response.statusText}`);
                return;
            }

            toast.success("Trading session started with existing parameters")
        } catch (error: any) {
            console.error("Start trading error:", error)
            toast.error(error.message || error.error || "Failed to start trading")
        } finally {
            setIsStarting(false)
        }
    }

    const handleStartClick = () => {
        Swal.fire({
            title: 'Start Trading Session?',
            text: "Do you want to edit parameters before starting?",
            icon: 'question',
            showCancelButton: false,
            showDenyButton: true,
            showCloseButton: true,
            confirmButtonText: 'Edit Parameters',
            denyButtonText: 'Start Immediately',
            background: '#1e2329',
            color: '#ffffff',
            confirmButtonColor: '#2f66d4',
            denyButtonColor: '#2ebc66',
            cancelButtonColor: '#2a2e33',
        }).then((result) => {
            if (result.isConfirmed) {
                setIsEditModalOpen(true)
            } else if (result.isDenied) {
                handleStartTradingDirectly()
            }
        })
    }

    const handleDeletePair = () => {
        Swal.fire({
            title: 'Remove Pair?',
            text: "Are you sure you want to unpair these accounts? This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Unpair',
            cancelButtonText: 'Cancel',
            background: '#1e2329',
            color: '#ffffff',
            confirmButtonColor: '#cf304a',
            cancelButtonColor: '#2a2e33',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    setIsDeleting(true)
                    await deletePairedAccount(pair.id)
                    toast.success("Accounts successfully unpaired")
                } catch (error: any) {
                    console.error("Delete pair error:", error)
                    toast.error(error.message || "Failed to unpair accounts")
                } finally {
                    setIsDeleting(false)
                }
            }
        })
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
                            <div className="flex flex-col leading-none">
                                <span className="text-[10px] text-white font-black uppercase tracking-widest">
                                    {pair.primary_account?.accounts?.units?.unit_name}
                                </span>
                                <span className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5">
                                    {pair.primary_account?.accounts?.first_name} {pair.primary_account?.accounts?.last_name}
                                </span>
                            </div>
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
                            <div className="flex flex-col leading-none">
                                <span className="text-[10px] text-white font-black uppercase tracking-widest">
                                    {pair.secondary_account?.accounts?.units?.unit_name}
                                </span>
                                <span className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5">
                                    {pair.secondary_account?.accounts?.first_name} {pair.secondary_account?.accounts?.last_name}
                                </span>
                            </div>
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
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePair();
                        }}
                        disabled={isDeleting}
                        className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                    >
                        {isDeleting ? (
                            <div className="h-4 w-4 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
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
                            pair={pair}
                        />
                        <AccountColumn
                            account={pair.secondary_account}
                            isPrimary={false}
                            pair={pair}
                        />
                    </div>

                    {pair.trade_status === 'initializing' && (
                        <div className="p-4 bg-[#161a1e] border-t border-[#2b3139] flex justify-center items-center">
                            <div className="flex items-center gap-3 text-blue-500 font-bold uppercase tracking-[0.2em] text-sm animate-pulse">
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                                </div>
                                Initializing
                            </div>
                        </div>
                    )}

                    {pair.trade_status === 'paired' && (
                        <div className="p-4 bg-[#161a1e] border-t border-[#2b3139] flex justify-center">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartClick();
                                }}
                                disabled={isStarting}
                                className="bg-[#2ebc66] hover:bg-[#34d399] disabled:bg-[#2ebc66]/50 text-white font-bold py-3 px-12 rounded-lg flex items-center gap-2 transition-all shadow-lg active:scale-95 min-w-[300px] justify-center"
                            >
                                {isStarting ? (
                                    <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <PlayCircle className="h-5 w-5" />
                                )}
                                Start Trading
                            </button>
                        </div>
                    )}
                </div>
            )}

            <EditPairedAccountModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                pair={pair}
                onConfirm={() => {
                    setIsEditModalOpen(false)
                    // The modal handles automation and DB update
                }}
            />
        </div>
    )
}
