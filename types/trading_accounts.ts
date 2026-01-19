import { Funder } from "./funder";
import { Unit } from "./units";
import { Package } from "./package";
import { Credential } from "./credentials";

export type TradeStatus =
  | "idle"
  | "trading"
  | "paired"
  | "abs"
  | "brc"
  | "brc-check"
  | "waiting"
  | "oh"
  | "kyc"
  | "for payout";
export interface TradingAccount {
  id: number;
  created_at: string;
  updated_at: string;
  account_number: string;
  funder_account_id: number;
  package_id: number | null;
  challenge_type: string | null;
  account_status: TradeStatus;
  live_equity: number;
  daily_pnl: number;
  rdd: number;
  highest_profit: number;
  consistency: number | null;
  remaining_target_days: number | null;
  remaining_target_profit: number | null;
  is_connected: boolean;
  last_seen_at: string;
  package?: Package | null;
  // Joined fields
  funders?: Funder | null;
  units?: Unit | null;
  credentials: Credential | null
}
