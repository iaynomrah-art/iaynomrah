export type PairStatus = 'paired' | 'ongoing' | 'done';

export interface TradePair {
  id: number;
  created_at: string;
  account_1_id: number;
  account_1_purchase_type: 'buy' | 'sell';
  account_1_order_amount: number;
  account_1_tp_ticks: number;
  account_1_sl_ticks: number;
  account_1_start_equity: number;

  account_2_id: number;
  account_2_purchase_type: 'buy' | 'sell';
  account_2_order_amount: number;
  account_2_tp_ticks: number;
  account_2_sl_ticks: number;
  account_2_start_equity: number;

  status: PairStatus;
}

export type CreateTradePairDTO = Omit<TradePair, 'id' | 'created_at' | 'status'>;