"use client"

import React, { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { portalLogout } from "@/lib/portal/owner-actions"
import { PortalChangePasswordDialog } from "@/components/modal/PortalChangePasswordDialog"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarRail,
    SidebarTrigger,
    useSidebar,
} from "@/components/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    AlertTriangle, ArrowDownRight, ArrowUpRight, Building2, CreditCard, History, KeyRound,
    LayoutDashboard, LogOut, ShieldCheck, TrendingUp, Wallet,
    ChevronDown, ChevronRight, BrainCircuit, User
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { PortalAccount, PortalOwner, PortalPayout, PortalTrade } from "@/types/portal"

interface OwnerPortalProps {
    owner: PortalOwner | null
    email: string
    accounts: PortalAccount[]
    trades: PortalTrade[]
    payouts: PortalPayout[]
    loadFailed: boolean
}

type View = "overview" | "accounts" | "trades" | "payouts"

const formatCurrency = (value: number | null | undefined) =>
    value == null
        ? "—"
        : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value))

const formatDateTime = (value: string | null | undefined) =>
    value
        ? new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : "—"

const pnlColor = (value: number | null | undefined) =>
    value == null || Number(value) === 0 ? "text-white/70" : Number(value) > 0 ? "text-emerald-500" : "text-red-500"

const PHASE_LABELS: Record<string, string> = {
    "phase 1": "Phase 1",
    "phase 2": "Phase 2",
    live: "Funded",
}

const STATUS_LABELS: Record<string, string> = {
    idle: "Idle",
    trading: "In trade",
    paired: "In trade",
    waiting: "Waiting",
    kyc: "KYC",
    "for payout": "Ready for payout",
}

const BURN_LABELS: Record<string, string> = {
    daily_drawdown: "Breached — daily loss limit",
    total_drawdown: "Breached — total loss limit",
    manual: "Closed",
}

const PAYOUT_STYLES: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    approved: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    done: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    rejected: "bg-red-500/10 text-red-500 border-red-500/20",
}

/** Plain-language account of why a trade closed — straight from what the system recorded. */
function describeClose(trade: PortalTrade): { text: string; tone: string } {
    if (trade.trade_status === "failed") return { text: "Trade did not open", tone: "text-white/50" }
    switch (trade.close_reason) {
        case "own_exit":
            if (trade.own_exit_signal === "pair_tp") return { text: "Take profit hit", tone: "text-emerald-500" }
            if (trade.own_exit_signal === "pair_sl") return { text: "Stop loss hit", tone: "text-red-500" }
            return { text: "Closed at the broker", tone: "text-white/70" }
        case "paired_exit":
            return { text: "Closed automatically when the paired position closed", tone: "text-white/70" }
        case "manual":
            return { text: "Closed manually by the trading team", tone: "text-white/70" }
        case "close_failed":
            return { text: "Automatic close failed — under review", tone: "text-amber-500" }
        default:
            return trade.trade_status === "ongoing"
                ? { text: "Open", tone: "text-blue-400" }
                : { text: "—", tone: "text-white/50" }
    }
}

const accountLabel = (account: PortalAccount | undefined) =>
    account
        ? `${account.funder_alias || account.funder_name || "Account"}${account.platform_login ? ` · ${account.platform_login}` : ""}`
        : "Account"

const FunderBadge = ({ account }: { account: PortalAccount | undefined }) => (
    <span
        className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-white/10 whitespace-nowrap"
        style={{
            color: account?.funder_text_color || undefined,
            backgroundColor: account?.funder_alias_color || undefined,
        }}
    >
        {account?.funder_alias || account?.funder_name || "—"}
    </span>
)

// ─── Shell (same frame as the admin dashboard) ──────────────────────────────

const NAV: { view: View; title: string; icon: React.ReactNode }[] = [
    { view: "overview", title: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
    { view: "accounts", title: "Accounts", icon: <Building2 className="w-4 h-4" /> },
    { view: "trades", title: "Trade Log", icon: <History className="w-4 h-4" /> },
    { view: "payouts", title: "Payouts", icon: <CreditCard className="w-4 h-4" /> },
]

function PortalSidebar({ view, onSelect }: { view: View; onSelect: (view: View) => void }) {
    const { setOpenMobile } = useSidebar()

    return (
        <Sidebar collapsible="icon" className="border-r border-[#1a1a1a] bg-[#050505]">
            <SidebarHeader className="h-16 flex items-center px-6 border-b border-[#1a1a1a] bg-[#050505]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                        <span className="text-white font-black text-sm">H</span>
                    </div>
                    <span className="text-white font-bold text-lg group-data-[collapsible=icon]:hidden">Harmony AI</span>
                </div>
            </SidebarHeader>
            <SidebarContent className="py-4">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-[#444] text-[10px] font-black uppercase tracking-widest px-4 mb-2 group-data-[collapsible=icon]:hidden">
                        My Accounts
                    </SidebarGroupLabel>
                    <SidebarMenu>
                        {NAV.map((item) => (
                            <SidebarMenuItem key={item.view}>
                                <SidebarMenuButton
                                    isActive={view === item.view}
                                    tooltip={item.title}
                                    onClick={() => {
                                        onSelect(item.view)
                                        setOpenMobile(false)
                                    }}
                                    className={cn(
                                        "text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-all duration-200 px-4 py-6",
                                        // The shared active style uses light-theme colors (near-black text)
                                        "data-[active=true]:text-blue-400 data-[active=true]:bg-blue-400/5 data-[active=true]:font-bold"
                                    )}
                                >
                                    {item.icon}
                                    <span className="font-semibold text-xs tracking-tight group-data-[collapsible=icon]:hidden">{item.title}</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    )
}

function PortalHeader({ name, email, onChangePassword }: { name: string; email: string; onChangePassword: () => void }) {
    const router = useRouter()
    const initials = name
        ? name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()
        : (email[0] || "U").toUpperCase()

    const logout = async () => {
        await portalLogout()
        router.replace("/portal/login")
    }

    return (
        <header suppressHydrationWarning className="sticky top-0 z-40 h-16 border-b border-[#1a1a1a] bg-[#050505]/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 w-full">
            <div className="flex items-center gap-4">
                <SidebarTrigger className="text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-all" />
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-black uppercase tracking-wider">Owner Portal</span>
                </div>
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button suppressHydrationWarning className="flex items-center gap-3 p-1 rounded-full hover:bg-[#1a1a1a] transition-all outline-none group">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center border border-white/10 shadow-lg group-hover:scale-105 transition-transform">
                            <span className="text-white text-[11px] font-black leading-none">{initials}</span>
                        </div>
                        <div className="hidden lg:flex flex-col items-start leading-none pr-2">
                            <span className="text-white text-xs font-bold mb-1">{name || email}</span>
                            <span className="text-gray-500 text-[9px] font-medium tracking-tight">Account Owner</span>
                        </div>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-[#0d0d0d] border-[#1a1a1a] text-white p-2 mt-2 shadow-2xl">
                    <DropdownMenuLabel className="px-3 py-4">
                        <div className="flex flex-col gap-1">
                            <p className="text-xs font-bold text-white">Active Session</p>
                            <p className="text-[10px] text-gray-400 font-medium truncate">{email}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-[#1a1a1a]" />
                    <DropdownMenuItem
                        onClick={onChangePassword}
                        className="flex items-center gap-3 px-3 py-3 text-sm text-gray-300 hover:text-white focus:bg-[#1a1a1a] focus:text-white rounded-lg transition-colors cursor-pointer group"
                    >
                        <KeyRound className="w-4 h-4 group-hover:text-blue-400" />
                        <span className="font-medium">Change Password</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#1a1a1a]" />
                    <DropdownMenuItem
                        onClick={logout}
                        className="flex items-center gap-3 px-3 py-3 text-sm text-red-400 hover:text-red-300 focus:bg-red-400/10 focus:text-red-300 rounded-lg transition-colors cursor-pointer"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="font-bold">Log Out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    )
}

// ─── Content ────────────────────────────────────────────────────────────────

const StatTile = ({ title, value, icon: Icon, color }: { title: string; value: string; icon: React.ElementType; color: string }) => (
    <div className="p-3 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-sm hover:border-gray-500/30 transition-all flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-2 mb-1">
            <Icon className={`h-4 w-4 ${color} shrink-0`} />
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">{title}</p>
        </div>
        <h2 className={`text-lg font-bold truncate ${value.startsWith("-") ? "text-red-500" : "text-white"}`}>{value}</h2>
    </div>
)

function accountStatus(account: PortalAccount): { label: string; burned: boolean } {
    if (account.burn_reason) return { label: BURN_LABELS[account.burn_reason] || "Breached", burned: true }
    return { label: STATUS_LABELS[account.account_status || ""] || (account.account_status || "—").toUpperCase(), burned: false }
}

/** Progress toward the profit target as 0–100, or null when there's no target. */
function targetProgress(account: PortalAccount): number | null {
    const target = Number(account.profit_target || 0)
    return target > 0 ? Math.max(0, Math.min(100, (Number(account.total_pnl || 0) / target) * 100)) : null
}

const StatusBadge = ({ account }: { account: PortalAccount }) => {
    const { label, burned } = accountStatus(account)
    return (
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border whitespace-nowrap ${burned ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-[#111] text-white/70 border-[#262626]"}`}>
            {label}
        </span>
    )
}

const AccountCard = ({ account, onViewTrades }: { account: PortalAccount; onViewTrades: () => void }) => {
    const target = Number(account.profit_target || 0)
    const totalPnl = Number(account.total_pnl || 0)
    const progress = targetProgress(account)
    const lossLimits = [
        account.max_daily_loss ? `${formatCurrency(account.max_daily_loss)} daily` : null,
        account.max_total_loss ? `${formatCurrency(account.max_total_loss)} total` : null,
    ].filter(Boolean)

    return (
        <div className="p-4 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-lg hover:border-gray-500/30 transition-all flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <FunderBadge account={account} />
                        {account.phase && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60 bg-[#1a1a1a] px-2 py-0.5 rounded">
                                {PHASE_LABELS[account.phase] || account.phase}
                            </span>
                        )}
                    </div>
                    <p className="text-sm font-semibold text-white truncate">{account.package_name || account.funder_name || "Account"}</p>
                    <p className="text-xs text-muted-foreground truncate">
                        {[account.platform, account.platform_login ? `Login ${account.platform_login}` : null, account.package_balance ? formatCurrency(account.package_balance) : null]
                            .filter(Boolean).join(" · ") || "—"}
                    </p>
                </div>
                <StatusBadge account={account} />
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-lg bg-[#0d0d0d] border border-[#161616] p-3">
                <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Equity</p>
                    <p className="text-sm font-bold text-white truncate">{formatCurrency(account.live_equity)}</p>
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Daily P&L</p>
                    <p className={`text-sm font-bold truncate ${pnlColor(account.daily_pnl)}`}>{formatCurrency(account.daily_pnl)}</p>
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total P&L</p>
                    <p className={`text-sm font-bold truncate ${pnlColor(account.total_pnl)}`}>{formatCurrency(account.total_pnl)}</p>
                </div>
            </div>

            {progress !== null && (
                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>Profit target</span>
                        <span>{formatCurrency(totalPnl)} / {formatCurrency(target)}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#1a1a1a] overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            )}

            <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-muted-foreground truncate">
                    {lossLimits.length > 0 ? `Loss limits: ${lossLimits.join(" · ")}` : ""}
                </p>
                <button onClick={onViewTrades} className="text-xs font-medium text-blue-400 hover:text-blue-300 whitespace-nowrap">
                    View trades →
                </button>
            </div>
        </div>
    )
}

function AccountsSummaryTable({ accounts, onViewTrades }: { accounts: PortalAccount[]; onViewTrades: (id: string) => void }) {
    return (
        <div className="w-full overflow-x-auto">
            <Table>
                <TableHeader className="bg-[#0d0d0d]">
                    <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                        <TableHead className="text-muted-foreground text-xs">ACCOUNT</TableHead>
                        <TableHead className="text-muted-foreground text-xs">PHASE</TableHead>
                        <TableHead className="text-muted-foreground text-xs">STATUS</TableHead>
                        <TableHead className="text-muted-foreground text-xs text-right">EQUITY</TableHead>
                        <TableHead className="text-muted-foreground text-xs text-right">TOTAL P&L</TableHead>
                        <TableHead className="text-muted-foreground text-xs w-[180px]">PROFIT TARGET</TableHead>
                        <TableHead className="w-[100px]" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {accounts.map((account) => {
                        const progress = targetProgress(account)
                        return (
                            <TableRow key={account.trading_account_id} className="border-[#1a1a1a] hover:bg-[#111]">
                                <TableCell className="py-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <FunderBadge account={account} />
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm text-white truncate">{account.package_name || account.funder_name || "Account"}</span>
                                            <span className="text-[11px] text-muted-foreground">
                                                {[account.platform, account.platform_login].filter(Boolean).join(" · ")}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="py-3 text-xs text-white/70 whitespace-nowrap">
                                    {account.phase ? PHASE_LABELS[account.phase] || account.phase : "—"}
                                </TableCell>
                                <TableCell className="py-3"><StatusBadge account={account} /></TableCell>
                                <TableCell className="py-3 text-sm font-semibold text-right text-white whitespace-nowrap">
                                    {formatCurrency(account.live_equity)}
                                </TableCell>
                                <TableCell className={`py-3 text-sm font-semibold text-right whitespace-nowrap ${pnlColor(account.total_pnl)}`}>
                                    {formatCurrency(account.total_pnl)}
                                </TableCell>
                                <TableCell className="py-3">
                                    {progress === null ? (
                                        <span className="text-xs text-muted-foreground">—</span>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 flex-1 rounded-full bg-[#1a1a1a] overflow-hidden">
                                                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
                                            </div>
                                            <span className="text-[11px] text-muted-foreground w-9 text-right">{Math.round(progress)}%</span>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="py-3 text-right">
                                    <button
                                        onClick={() => onViewTrades(account.trading_account_id)}
                                        className="text-xs font-medium text-blue-400 hover:text-blue-300 whitespace-nowrap"
                                    >
                                        Trades →
                                    </button>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}

const Panel = ({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) => (
    <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-lg flex flex-col min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-[#1a1a1a]">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            {action}
        </div>
        {children}
    </div>
)

const EmptyState = ({ text }: { text: string }) => (
    <div className="py-12 text-center text-sm text-muted-foreground">{text}</div>
)

function TradeDetailsPanel({ trade }: { trade: PortalTrade }) {
    if (!trade.signal_direction) {
        return (
            <div className="p-4 pl-10 border-l-2 border-l-gray-600 bg-[#0d0d0d]">
                <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-semibold text-white">Manual Trade</span>
                </div>
                <p className="text-xs text-muted-foreground">This trade was opened manually or the pair had no AI signal attached.</p>
            </div>
        )
    }

    if (!trade.signal_followed) {
        return (
            <div className="p-4 pl-10 border-l-2 border-l-blue-600 bg-[#0d0d0d]">
                <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-semibold text-white">Hedging Leg</span>
                </div>
                <p className="text-xs text-muted-foreground">
                    This account took the opposite side ({trade.side?.toUpperCase()}) of the AI's {trade.signal_direction.toUpperCase()} signal to hedge risk.
                </p>
            </div>
        )
    }

    return (
        <div className="p-4 pl-10 border-l-2 border-l-emerald-600 bg-[#0d0d0d] flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm font-semibold text-white">
                            AI Signal: {trade.signal_direction.toUpperCase()}
                        </span>
                        {trade.signal_confidence != null && (
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                {trade.signal_confidence}% Confidence
                            </span>
                        )}
                        {trade.signal_source === 'technicals_fallback' && (
                            <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20">
                                Technicals Fallback
                            </span>
                        )}
                    </div>
                    {trade.signal_model && (
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            Model: {trade.signal_model} {trade.signal_generated_at ? `· ${formatDateTime(trade.signal_generated_at)}` : ''}
                        </p>
                    )}
                </div>
            </div>

            {trade.signal_reasoning && (
                <div className="bg-[#111] p-3 rounded border border-[#1a1a1a]">
                    <p className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap">
                        {trade.signal_reasoning}
                    </p>
                </div>
            )}
        </div>
    )
}

function TradesTable({ trades, accountsById }: { trades: PortalTrade[]; accountsById: Map<string, PortalAccount> }) {
    const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null)
    
    const toggleExpand = (id: string) => {
        setExpandedTradeId(prev => prev === id ? null : id)
    }

    if (trades.length === 0) return <EmptyState text="No trades yet." />
    return (
        <div className="w-full overflow-x-auto">
            <Table>
                <TableHeader className="bg-[#0d0d0d]">
                    <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                        <TableHead className="text-muted-foreground text-xs pl-8">ACCOUNT</TableHead>
                        <TableHead className="text-muted-foreground text-xs">TRADE</TableHead>
                        <TableHead className="text-muted-foreground text-xs">SL / TP</TableHead>
                        <TableHead className="text-muted-foreground text-xs">OPENED</TableHead>
                        <TableHead className="text-muted-foreground text-xs">CLOSED</TableHead>
                        <TableHead className="text-muted-foreground text-xs text-right">RESULT</TableHead>
                        <TableHead className="text-muted-foreground text-xs">CLOSE REASON</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {trades.map((trade) => {
                        const account = accountsById.get(trade.trading_account_id)
                        const isBuy = trade.side?.toLowerCase() === "buy"
                        const close = describeClose(trade)
                        const isExpanded = expandedTradeId === `${trade.trade_id}-${trade.trading_account_id}`
                        
                        return (
                            <React.Fragment key={`${trade.trade_id}-${trade.trading_account_id}`}>
                                <TableRow 
                                    className="border-[#1a1a1a] hover:bg-[#111] cursor-pointer"
                                    onClick={() => toggleExpand(`${trade.trade_id}-${trade.trading_account_id}`)}
                                >
                                    <TableCell className="py-3">
                                        <div className="flex items-center gap-2">
                                            {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                                            <FunderBadge account={account} />
                                            {account?.platform_login && (
                                                <span className="text-[11px] text-muted-foreground">{account.platform_login}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className={`inline-flex items-center gap-0.5 font-semibold uppercase ${isBuy ? "text-emerald-500" : "text-red-500"}`}>
                                                {isBuy ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                                                {trade.side}
                                            </span>
                                            <span className="text-white">{trade.symbol}</span>
                                            <span className="text-muted-foreground text-xs">{trade.lot ?? "—"} lot</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3 text-xs text-white/70 whitespace-nowrap">
                                        {formatCurrency(trade.stop_loss)} / {formatCurrency(trade.take_profit)}
                                    </TableCell>
                                    <TableCell className="py-3 text-xs text-white/70 whitespace-nowrap" suppressHydrationWarning>
                                        {formatDateTime(trade.entry_time || trade.created_at)}
                                    </TableCell>
                                    <TableCell className="py-3 text-xs text-white/70 whitespace-nowrap" suppressHydrationWarning>
                                        {formatDateTime(trade.close_time)}
                                    </TableCell>
                                    <TableCell className={`py-3 text-sm font-semibold text-right whitespace-nowrap ${pnlColor(trade.pnl)}`}>
                                        {trade.pnl == null ? "—" : formatCurrency(trade.pnl)}
                                    </TableCell>
                                    <TableCell className={`py-3 text-xs ${close.tone} min-w-[220px]`}>
                                        {close.text}
                                    </TableCell>
                                </TableRow>
                                {isExpanded && (
                                    <TableRow className="bg-[#0a0a0a] border-[#1a1a1a]">
                                        <TableCell colSpan={7} className="p-0 border-b-0">
                                            <TradeDetailsPanel trade={trade} />
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}

function PayoutsTable({ payouts, accountsById }: { payouts: PortalPayout[]; accountsById: Map<string, PortalAccount> }) {
    if (payouts.length === 0) return <EmptyState text="No payouts yet." />
    return (
        <div className="w-full overflow-x-auto">
            <Table>
                <TableHeader className="bg-[#0d0d0d]">
                    <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                        <TableHead className="text-muted-foreground text-xs">REQUESTED</TableHead>
                        <TableHead className="text-muted-foreground text-xs">ACCOUNT</TableHead>
                        <TableHead className="text-muted-foreground text-xs text-right">AMOUNT</TableHead>
                        <TableHead className="text-muted-foreground text-xs">STATUS</TableHead>
                        <TableHead className="text-muted-foreground text-xs">UPDATED</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {payouts.map((payout) => (
                        <TableRow key={payout.payout_id} className="border-[#1a1a1a] hover:bg-[#111]">
                            <TableCell className="py-3 text-xs text-white/70 whitespace-nowrap" suppressHydrationWarning>
                                {formatDateTime(payout.requested_at)}
                            </TableCell>
                            <TableCell className="py-3 text-sm text-white">
                                {accountLabel(accountsById.get(payout.trading_account_id))}
                            </TableCell>
                            <TableCell className="py-3 text-sm font-semibold text-right text-white whitespace-nowrap">
                                {formatCurrency(payout.amount)}
                            </TableCell>
                            <TableCell className="py-3">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${PAYOUT_STYLES[payout.status] || "bg-[#111] text-white/70 border-[#262626]"}`}>
                                    {payout.status}
                                </span>
                            </TableCell>
                            <TableCell className="py-3 text-xs text-white/70 whitespace-nowrap" suppressHydrationWarning>
                                {formatDateTime(payout.reviewed_at)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

// ─── Page ───────────────────────────────────────────────────────────────────

const VIEW_TITLES: Record<View, { title: string; subtitle: string }> = {
    overview: { title: "Overview", subtitle: "A summary of your funder accounts and latest trades." },
    accounts: { title: "Accounts", subtitle: "Every funder account registered under your name." },
    trades: {
        title: "Trade Log",
        subtitle: "Trades are placed by the trading team as paired positions. Each row shows your account's side and why it closed.",
    },
    payouts: { title: "Payouts", subtitle: "Payout requests on your accounts." },
}

export const OwnerPortal = ({ owner, email, accounts, trades, payouts, loadFailed }: OwnerPortalProps) => {
    const [view, setView] = useState<View>("overview")
    const [accountFilter, setAccountFilter] = useState("all")
    const [passwordOpen, setPasswordOpen] = useState(false)

    const viewTradesFor = (tradingAccountId: string) => {
        setAccountFilter(tradingAccountId)
        setView("trades")
    }
    const selectView = (next: View) => {
        // The sidebar's Trade Log always opens unfiltered; "View trades" sets a filter
        if (next === "trades") setAccountFilter("all")
        setView(next)
    }

    const accountsById = useMemo(
        () => new Map(accounts.map((a) => [a.trading_account_id, a])),
        [accounts]
    )
    const filteredTrades = useMemo(
        () => (accountFilter === "all" ? trades : trades.filter((t) => t.trading_account_id === accountFilter)),
        [trades, accountFilter]
    )

    const totalEquity = accounts.reduce((sum, a) => sum + Number(a.live_equity || 0), 0)
    const totalPnl = accounts.reduce((sum, a) => sum + Number(a.total_pnl || 0), 0)
    const dailyPnl = accounts.reduce((sum, a) => sum + Number(a.daily_pnl || 0), 0)
    const paidOut = payouts
        .filter((p) => ["completed", "approved", "done"].includes(p.status))
        .reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const closedTrades = trades.filter((t) => t.trade_status === "done").length

    const name = [owner?.first_name, owner?.last_name].filter(Boolean).join(" ")
    const stats = [
        { title: "Accounts", value: String(accounts.length), icon: Building2, color: "text-blue-500" },
        { title: "Total Equity", value: formatCurrency(totalEquity), icon: Wallet, color: "text-blue-400" },
        { title: "Total PnL", value: formatCurrency(totalPnl), icon: TrendingUp, color: totalPnl >= 0 ? "text-emerald-500" : "text-red-500" },
        { title: "Daily PnL", value: formatCurrency(dailyPnl), icon: TrendingUp, color: dailyPnl >= 0 ? "text-emerald-500" : "text-red-500" },
        { title: "Closed Trades", value: String(closedTrades), icon: History, color: "text-orange-400" },
        { title: "Paid Out", value: formatCurrency(paidOut), icon: CreditCard, color: "text-purple-400" },
    ]

    const accountFilterSelect = accounts.length > 1 && (
        <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="w-full sm:w-[240px] h-8 bg-[#0d0d0d] border-[#1f1f1f] text-white text-xs">
                <SelectValue placeholder="All accounts" />
            </SelectTrigger>
            <SelectContent className="bg-[#0d0d0d] border-[#1f1f1f] text-white">
                <SelectItem value="all" className="text-xs focus:bg-[#1a1a1a] focus:text-white">All accounts</SelectItem>
                {accounts.map((a) => (
                    <SelectItem key={a.trading_account_id} value={a.trading_account_id} className="text-xs focus:bg-[#1a1a1a] focus:text-white">
                        {accountLabel(a)}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-[#050505]">
                <PortalSidebar view={view} onSelect={selectView} />
                <SidebarInset className="bg-[#050505] flex flex-col min-h-screen">
                    <PortalHeader name={name} email={email} onChangePassword={() => setPasswordOpen(true)} />
                    <main className="flex-1 overflow-y-auto overflow-x-hidden">
                        <div className="p-4 flex flex-col gap-4">
                            <div>
                                <h1 className="text-xl font-bold text-white leading-tight">{VIEW_TITLES[view].title}</h1>
                                <p className="text-xs text-muted-foreground">{VIEW_TITLES[view].subtitle}</p>
                            </div>

                            {loadFailed && (
                                <div className="flex items-center gap-2 text-sm text-amber-500 bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-3">
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    Some of your data couldn&apos;t be loaded. Please refresh, or contact the team if this keeps happening.
                                </div>
                            )}

                            {view === "overview" && (
                                <>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                        {stats.map((stat) => (
                                            <StatTile key={stat.title} {...stat} />
                                        ))}
                                    </div>

                                    <Panel
                                        title={`Accounts (${accounts.length})`}
                                        action={
                                            accounts.length > 0 && (
                                                <button onClick={() => selectView("accounts")} className="text-xs font-medium text-blue-400 hover:text-blue-300">
                                                    View details →
                                                </button>
                                            )
                                        }
                                    >
                                        {accounts.length === 0 ? (
                                            <EmptyState text="No funder accounts are registered under your name yet." />
                                        ) : (
                                            <AccountsSummaryTable accounts={accounts} onViewTrades={viewTradesFor} />
                                        )}
                                    </Panel>

                                    <Panel
                                        title="Recent Trades"
                                        action={
                                            trades.length > 5 && (
                                                <button onClick={() => selectView("trades")} className="text-xs font-medium text-blue-400 hover:text-blue-300">
                                                    View all {trades.length} →
                                                </button>
                                            )
                                        }
                                    >
                                        <TradesTable trades={trades.slice(0, 5)} accountsById={accountsById} />
                                    </Panel>
                                </>
                            )}

                            {view === "accounts" && (
                                accounts.length === 0 ? (
                                    <Panel title="Accounts">
                                        <EmptyState text="No funder accounts are registered under your name yet." />
                                    </Panel>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                                        {accounts.map((account) => (
                                            <AccountCard
                                                key={account.trading_account_id}
                                                account={account}
                                                onViewTrades={() => viewTradesFor(account.trading_account_id)}
                                            />
                                        ))}
                                    </div>
                                )
                            )}

                            {view === "trades" && (
                                <Panel title={`All Trades (${filteredTrades.length})`} action={accountFilterSelect}>
                                    <TradesTable trades={filteredTrades} accountsById={accountsById} />
                                </Panel>
                            )}

                            {view === "payouts" && (
                                <Panel title={`Payouts (${payouts.length})`}>
                                    <PayoutsTable payouts={payouts} accountsById={accountsById} />
                                </Panel>
                            )}
                        </div>
                    </main>
                </SidebarInset>
            </div>
            <PortalChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
        </SidebarProvider>
    )
}
