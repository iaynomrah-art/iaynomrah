export type TradeStatus = 'paired' | 'ongoing' | 'done' | 'initializing';

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
  
  // Status
  trade_status: TradeStatus;
  is_active: boolean;
  notes: string | null;
};

// Aliases for compatibility if needed
export type TradePair = PairedTradingAccount;
export type CreateTradePairDTO = Omit<PairedTradingAccount, 'id' | 'created_at' | 'updated_at' | 'trade_status' | 'is_active'>;

export type CreatePairedAccountDTO = Omit<PairedTradingAccount, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePairedAccountDTO = Partial<CreatePairedAccountDTO>;