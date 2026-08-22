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
  id: string; // Changed from number to string (generate_hex_id)
  created_at: string;
  package_id: string | null;
  acount_id: string | null; // Note: user specified "acount_id" with one 'c'
  credential_id: string | null;
  user: string | null;
  funder: string | null; // This is the text column
  package: string | null; // This is the text column name in SQL
  status: TradeStatus; // Matches trading_account_status
  live_equity?: number;
  daily_pnl?: number;
  total_pnl?: number;
  daily_starting_equity?: number | null;
  rdd?: number;
  highest_profit?: number;
  consistency?: number | null;
  remaining_target_days?: number | null;
  remaining_target_profit?: number | null;
  challenge_type?: string | null;
  funder_account_id?: string | null;

  // Joined fields
  package_ref?: Package | null;
  accounts?: (any & { units?: Unit | null }) | null; // Joined accounts
  credentials?: Credential | null;
  accounts_id?: string | null;
}
