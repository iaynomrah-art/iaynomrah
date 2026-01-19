import { Funder } from "./funder";
import { Unit } from "./units";

export interface TradingAccount {
  id: number;
  created_at: string;
  updated_at: string;
  unit_number: string;
  unit_id: number | null;
  account_number: string;
  funder_account_id: number;
  package_id: number | null;
  funder_name: string;
  funder_id: number | null;
  phase: string;
  challenge_type: string | null;
  account_status: string;
  live_equity: number;
  daily_pnl: number;
  rdd: number;
  highest_profit: number;
  consistency: number | null;
  remaining_target_days: number | null;
  remaining_target_profit: number | null;
  is_connected: boolean;
  last_seen_at: string;
  
  // Joined fields
  funders?: Funder | null;
  units?: Unit | null;
}
