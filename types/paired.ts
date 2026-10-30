export type TradeStatus = 'paired' | 'ongoing' | 'done' | 'initializing' | 'failed';

export type PairedTradingAccount = {
  id: string;
  created_at: string;
  updated_at: string | null;
  
  // Foreign keys
  primary_account_id: string;
  secondary_account_id: string;
  
  // Automation status
  primary_automation_status: string | null;
  secondary_automation_status: string | null;
  
  // Trading parameters
  symbol: string;
  
  // Primary account parameters
  primary_order_amount: number;
  primary_stop_loss: number | null;
  primary_take_profit: number | null;
  primary_order_type: string;
  
  // Secondary account parameters
  secondary_order_amount: number;
  secondary_stop_loss: number | null;
  secondary_take_profit: number | null;
  secondary_order_type: string;
  
  // Strategy (migration_delayed_hedge.sql)
  strategy?: 'natural' | 'delayed_hedge';
  hedge_status?: 'standby' | 'armed' | 'pending' | 'triggered' | 'placed' | 'cancelled' | 'failed' | null;
  hedge_entry_price?: number | null;
  hedge_fill_price?: number | null;

  // Status
  trade_status: TradeStatus;
  is_active: boolean;
  notes: string | null;
  duration_seconds?: number | null;

  // Execution IPs
  primary_execution_ip?: string | null;
  secondary_execution_ip?: string | null;
};

// Aliases for compatibility if needed
export type TradePair = PairedTradingAccount;
export type CreateTradePairDTO = Omit<PairedTradingAccount, 'id' | 'created_at' | 'updated_at' | 'trade_status' | 'is_active'>;

export type CreatePairedAccountDTO = Omit<PairedTradingAccount, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePairedAccountDTO = Partial<CreatePairedAccountDTO>;