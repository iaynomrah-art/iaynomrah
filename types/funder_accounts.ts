import { Account } from "./accounts";
import { Credential } from "./credentials";
import { Package } from "./package";
import { Unit } from "./units";
import { Funder } from "./funder";

export type AccountStatus =
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
export interface FunderAccount {
  id: number;
  created_at: string;
  package_id: number | null;
  status: AccountStatus;
  acount_id: number | null;
  credential_id: number | null;
  
  // Denormalized/Alias fields from database or helper
  user?: string | null;
  funder?: string | null;
  package_name?: string | null;
  // Joined fields
  package?: Package & { funders?: Funder };
  accounts?: (Account & { units?: Unit | null }) | null;
  credentials?: Credential | null;
}

export type CreateFunderAccount = Omit<FunderAccount, "id" | "created_at" | "package" | "account" | "credential" | "unit">;
export type UpdateFunderAccount = Partial<CreateFunderAccount>;
