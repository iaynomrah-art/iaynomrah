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
  id: string;
  created_at: string;
  package_id: string | null;
  status: AccountStatus;
  user: string | null;

  // Joined fields
  // The Package is now the primary data carrier for a FunderAccount connection
  package?: Package;

  // Keep these for joined data from API if needed at top level
  accounts?: Account & { units?: Unit };
  credentials?: Credential;
}

export type CreateFunderAccount = Omit<
  FunderAccount,
  "id" | "created_at" | "package" | "accounts" | "credentials"
>;
export type UpdateFunderAccount = Partial<CreateFunderAccount>;
