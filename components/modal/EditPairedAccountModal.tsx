"use client"

import React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { X } from "lucide-react"

import { confirmTrade } from "@/helper/automation"
import Row from "@/components/ui/row"
import PlayIcon from "@/components/ui/playicon"

import { updatePairedAccount } from "@/helper/paired_accounts"
import { PairedTradingAccount } from "@/types/paired"

const AccountSection = ({
    isPrimary,
    account,
    localParams,
    updateField
}: {
    isPrimary: boolean,
    account: any,
    localParams: any,
    updateField: (field: string, value: any) => void
}) => {
    const prefix = isPrimary ? "primary" : "secondary"
    const orderType = isPrimary ? localParams.primary_order_type : localParams.secondary_order_type;

    return (
        <div className="flex flex-col bg-[#161a1e]">
            {/* Header */}
            <div className={cn(
                "px-4 py-2.5 flex items-center justify-between",
                orderType === 'buy' ? "bg-[#2ebc66]" : "bg-[#cf304a]"
            )}>
                <div className="flex items-center gap-1.5">
                    <div className="bg-[#f0b90b] text-black px-1.5 py-0.5 rounded-[3px] text-[10px] font-black uppercase">
                        {account.package_ref?.funders?.allias || "UPFT"}
                    </div>
                    <div className="bg-[#ffffff20] text-white px-1.5 py-0.5 rounded-[3px] text-[10px] font-bold uppercase truncate max-w-[70px]">
                        {account.package_ref?.phase || "PHASE 1"}
                    </div>
                </div>
                <div className="text-white font-black text-[12px] uppercase tracking-tighter flex items-center gap-2">
                    {account.accounts?.units?.unit_name || "NO UNIT"}
                </div>
            </div>

            {/* Table Grid */}
            <div className="divide-y divide-[#2b3139]">
                <Row label="Latest Equity" value={`$${(account.live_equity || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                <Row label="Daily P&L" value={`$${(account.daily_pnl || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} color={(account.daily_pnl || 0) >= 0 ? "text-[#2ebc66]" : "text-[#f6465d]"} />

                {/* Actionable Fields */}
                <div className="grid grid-cols-2 px-4 py-2.5 items-center hover:bg-[#2b3139]/30 transition-colors">
                    <span className="text-[#848e9c] text-[13px] font-medium">Symbol</span>
                    <div className="flex justify-end border border-[#2b3139] bg-[#0b0e11] px-2 py-0.5 rounded-[4px]">
                        <input
                            type="text"
                            value={localParams.symbol}
                            onChange={(e) => updateField('symbol', e.target.value)}
                            className="bg-transparent border-none text-white text-[13px] font-bold text-right focus:outline-none w-full uppercase"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 px-4 py-2.5 items-center hover:bg-[#2b3139]/30 transition-colors">
                    <span className="text-[#4788ff] text-[13px] font-medium">Order Amount</span>
                    <div className="flex justify-end border border-[#2b3139] bg-[#0b0e11] px-2 py-0.5 rounded-[4px]">
                        <input
                            type="number"
                            step="0.01"
                            value={localParams[`${prefix}_order_amount` as keyof typeof localParams]}
                            onChange={(e) => updateField(`${prefix}_order_amount`, Number(e.target.value))}
                            className="bg-transparent border-none text-white text-[13px] font-bold text-right focus:outline-none w-full"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 px-4 py-2.5 items-center hover:bg-[#2b3139]/30 transition-colors">
                    <span className="text-[#4788ff] text-[13px] font-medium">TP (Ticks)</span>
                    <div className="flex justify-end border border-[#2b3139] bg-[#0b0e11] px-2 py-0.5 rounded-[4px]">
                        <input
                            type="number"
                            value={localParams[`${prefix}_take_profit` as keyof typeof localParams]}
                            onChange={(e) => updateField(`${prefix}_take_profit`, Number(e.target.value))}
                            className="bg-transparent border-none text-white text-[13px] font-bold text-right focus:outline-none w-full"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 px-4 py-2.5 items-center hover:bg-[#2b3139]/30 transition-colors">
                    <span className="text-[#4788ff] text-[13px] font-medium">SL (Ticks)</span>
                    <div className="flex justify-end border border-[#2b3139] bg-[#0b0e11] px-2 py-0.5 rounded-[4px]">
                        <input
                            type="number"
                            value={localParams[`${prefix}_stop_loss` as keyof typeof localParams]}
                            onChange={(e) => updateField(`${prefix}_stop_loss`, Number(e.target.value))}
                            className="bg-transparent border-none text-white text-[13px] font-bold text-right focus:outline-none w-full"
                        />
                    </div>
                </div>

                {/* Purchase Type */}
                <div className="grid grid-cols-2 px-4 py-3 items-center hover:bg-[#2b3139]/30 transition-colors">
                    <span className="text-[#848e9c] text-[13px] font-medium">Purchase Type</span>
                    <Select
                        value={orderType}
                        onValueChange={(value) => updateField(`${prefix}_order_type`, value)}
                    >
                        <SelectTrigger className="bg-[#0b0e11] border-[#2b3139] h-8 text-[13px] font-bold focus:ring-0 focus:ring-offset-0">
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

interface EditPairedAccountModalProps {
    isOpen: boolean
    onClose: () => void
    pair: any // Existing pair from database
    onConfirm: () => void
}

export const EditPairedAccountModal = ({
    isOpen,
    onClose,
    pair,
    onConfirm
}: EditPairedAccountModalProps) => {
    const [isLoading, setIsLoading] = React.useState(false)
    const multiplier = 0.01

    // Local state for the editable fields
    const [localParams, setLocalParams] = React.useState({
        symbol: pair.symbol || "XAUUSD",
        primary_order_amount: pair.primary_order_amount || 0.1,
        primary_stop_loss: pair.primary_stop_loss || 50,
        primary_take_profit: pair.primary_take_profit || 100,
        primary_order_type: pair.primary_order_type || "buy",
        secondary_order_amount: pair.secondary_order_amount || 0.1,
        secondary_stop_loss: pair.secondary_stop_loss || 50,
        secondary_take_profit: pair.secondary_take_profit || 100,
        secondary_order_type: pair.secondary_order_type || "sell"
    })

    React.useEffect(() => {
        if (pair && isOpen) {
            setLocalParams({
                symbol: pair.symbol || "XAUUSD",
                primary_order_amount: pair.primary_order_amount || 0.1,
                primary_stop_loss: pair.primary_stop_loss || 50,
                primary_take_profit: pair.primary_take_profit || 100,
                primary_order_type: pair.primary_order_type || "buy",
                secondary_order_amount: pair.secondary_order_amount || 0.1,
                secondary_take_profit: pair.secondary_take_profit || 100,
                secondary_stop_loss: pair.secondary_stop_loss || 50,
                secondary_order_type: pair.secondary_order_type || "sell"
            })
        }
    }, [pair, isOpen])

    const updateField = (field: string, value: any) => {
        setLocalParams(prev => {
            const newParams = { ...prev, [field]: value }

            // Sync symbol across both
            if (field === 'symbol') {
                newParams.symbol = value.toUpperCase()
            }

            // Sync reciprocal order types if length == 2 (always true here)
            if (field === 'primary_order_type') {
                newParams.secondary_order_type = value === 'buy' ? 'sell' : 'buy'
            } else if (field === 'secondary_order_type') {
                newParams.primary_order_type = value === 'buy' ? 'sell' : 'buy'
            }

            return newParams
        })
    }

    const handleConfirm = async () => {
        try {
            setIsLoading(true)

            // 1. Update DB first
            await updatePairedAccount(pair.id, {
                symbol: localParams.symbol,
                primary_order_amount: localParams.primary_order_amount,
                primary_stop_loss: localParams.primary_stop_loss,
                primary_take_profit: localParams.primary_take_profit,
                primary_order_type: localParams.primary_order_type as any,
                secondary_order_amount: localParams.secondary_order_amount,
                secondary_stop_loss: localParams.secondary_stop_loss,
                secondary_take_profit: localParams.secondary_take_profit,
                secondary_order_type: localParams.secondary_order_type as any,
            })

            // 2. Trigger automation
            const primaryApiUrl = pair.primary_account?.accounts?.units?.api_base_url;
            const secondaryApiUrl = pair.secondary_account?.accounts?.units?.api_base_url;

            if (!primaryApiUrl || !secondaryApiUrl) {
                toast.error("API URL missing for one or both units");
                return;
            }

            const normalizeUrl = (url: string) => url.endsWith('/') ? url : `${url}/`;

            const primaryPayload = {
                username: String(pair.primary_account?.credentials?.username || ""),
                password: String(pair.primary_account?.credentials?.password || ""),
                symbol: String(localParams.symbol),
                order_amount: String(localParams.primary_order_amount),
                tp_ticks: String(localParams.primary_take_profit),
                sl_ticks: String(localParams.primary_stop_loss),
                purchase_type: String(localParams.primary_order_type),
                account_number: String(pair.primary_account?.credentials?.username || pair.primary_account?.id),
                latest_equity: String(pair.primary_account?.live_equity || 0),
                daily_pnl: String(pair.primary_account?.daily_pnl || 0),
                rdd: String(pair.primary_account?.rdd || 0)
            }

            const secondaryPayload = {
                username: String(pair.secondary_account?.credentials?.username || ""),
                password: String(pair.secondary_account?.credentials?.password || ""),
                symbol: String(localParams.symbol),
                order_amount: String(localParams.secondary_order_amount),
                tp_ticks: String(localParams.secondary_take_profit),
                sl_ticks: String(localParams.secondary_stop_loss),
                purchase_type: String(localParams.secondary_order_type),
                account_number: String(pair.secondary_account?.credentials?.username || pair.secondary_account?.id),
                latest_equity: String(pair.secondary_account?.live_equity || 0),
                daily_pnl: String(pair.secondary_account?.daily_pnl || 0),
                rdd: String(pair.secondary_account?.rdd || 0)
            }

            await Promise.all([
                confirmTrade(normalizeUrl(primaryApiUrl), primaryPayload),
                confirmTrade(normalizeUrl(secondaryApiUrl), secondaryPayload)
            ])

            toast.success("Trade parameters updated and session started")
            onConfirm()
        } catch (error: any) {
            console.error("Update error:", error)
            toast.error(error.message || "Failed to update and start")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#1e2329] border-[#2b3139] text-white max-w-[800px] overflow-hidden flex flex-col max-h-[95vh] p-0 gap-0 shadow-2xl">
                <DialogTitle className="sr-only">Confirm Trade Parameters</DialogTitle>
                <DialogDescription className="sr-only">Edit your trade parameters before starting the session.</DialogDescription>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-[60] p-2 text-muted-foreground hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0b0e11]">
                    <div className="grid grid-cols-2 divide-x divide-[#2b3139]">
                        <AccountSection
                            isPrimary={true}
                            account={pair.primary_account}
                            localParams={localParams}
                            updateField={updateField}
                        />
                        <AccountSection
                            isPrimary={false}
                            account={pair.secondary_account}
                            localParams={localParams}
                            updateField={updateField}
                        />
                    </div>
                </div>

                <DialogFooter className="px-5 py-4 bg-[#1e2329] border-t border-[#2b3139] flex items-center justify-end w-full">

                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="bg-[#2f66d4] hover:bg-[#3b7ef6] text-white h-[38px] px-5 rounded-[4px] font-bold text-[13px] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                <span>Starting...</span>
                            </div>
                        ) : (
                            <>
                                <PlayIcon className="w-3.5 h-3.5" />
                                <span>Save & Start Trading</span>
                            </>
                        )}
                    </Button>
                </DialogFooter>

                <style>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #3a3e43; border-radius: 10px; }
                `}</style>
            </DialogContent>
        </Dialog>
    )
}
