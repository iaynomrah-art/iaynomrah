// Rows returned by the portal_* database functions (see migration_owner_portal.sql)

export interface PortalOwner {
    first_name: string | null
    last_name: string | null
    email: string | null
}

export interface PortalAccount {
    trading_account_id: string
    funder_name: string | null
    funder_alias: string | null
    funder_text_color: string | null
    funder_alias_color: string | null
    package_name: string | null
    package_balance: number | null
    phase: string | null
    platform: string | null
    platform_login: string | null
    account_status: string | null
    burn_reason: string | null
    live_equity: number | null
    daily_pnl: number | null
    total_pnl: number | null
    profit_target: number | null
    remaining_target_profit: number | null
    remaining_target_days: number | null
    max_daily_loss: number | null
    max_total_loss: number | null
    created_at: string
}

export type PortalCloseReason = "own_exit" | "paired_exit" | "manual" | "close_failed" | null

export interface PortalTrade {
    trade_id: string
    trading_account_id: string
    symbol: string
    side: string
    lot: number | null
    stop_loss: number | null
    take_profit: number | null
    entry_time: string | null
    close_time: string | null
    starting_balance: number | null
    final_balance: number | null
    pnl: number | null
    trade_status: string
    close_reason: PortalCloseReason
    own_exit_signal: string | null
    created_at: string
    // AI signal recorded when the pair was opened (null when the direction was set manually).
    // reasoning / confidence / inputs are only present on the leg that followed the signal.
    signal_direction: string | null
    signal_followed: boolean | null
    signal_reasoning: string | null
    signal_confidence: number | null
    signal_source: "ai" | "technicals_fallback" | null
    signal_model: string | null
    signal_inputs: PortalSignalInputs | null
    signal_generated_at: string | null
}

export interface PortalSignalInputs {
    price?: number
    sma_200?: number
    atr?: number
    rsi?: number
    micro_timeframe?: string
    micro_trend?: string
    macro_timeframe?: string
    macro_trend?: string
    indicator_summary?: string
    technical_basis?: string
    headlines?: string[]
}

export interface PortalPayout {
    payout_id: string
    trading_account_id: string
    amount: number
    status: string
    requested_at: string
    reviewed_at: string | null
}
